<?php

namespace App\Services\Payments;

use App\Contracts\Payable;
use App\Contracts\PaymentGateway;
use App\Models\Setting;
use App\Support\PayableResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Pesapal (API 3.0) — Uganda's local card + MTN/Airtel mobile-money gateway.
 *
 * Pesapal is a hosted/redirect provider (like PayPal, not a direct charge API):
 *   1. initiate()      submits the payable → we send the customer to a Pesapal page
 *   2. customer pays   (picks MTN / Airtel / card on Pesapal's hosted page)
 *   3. handleWebhook()  Pesapal pings our IPN URL → we confirm + settle the payable
 *   4. verify()         the browser-return page polls this until the state settles
 *
 * Works for any {@see Payable} (Order or Invoice) — each one supplies its amount,
 * billing and settlement, and is found again by {@see PayableResolver}.
 *
 * One-time setup: `php artisan pesapal:register-ipn` registers our webhook URL and
 * stores the resulting `ipn_id` in Settings. Credentials live in config/services.php.
 */
class PesapalGateway implements PaymentGateway
{
    /** Pesapal API base URLs (v3). */
    private const BASE = [
        'sandbox' => 'https://cybqa.pesapal.com/pesapalv3/api',
        'live'    => 'https://pay.pesapal.com/v3/api',
    ];

    /** @param array{consumer_key:?string, consumer_secret:?string, env:?string, frontend_url:?string, ipn_id:?string} $config */
    public function __construct(private readonly array $config) {}

    public function name(): string
    {
        return 'pesapal';
    }

    public function initiate(Payable $payable): array
    {
        $billing = $payable->payableBilling();

        $payload = [
            'id'              => $payable->payableReference(),
            'currency'        => $payable->payableCurrency(),
            'amount'          => $payable->payableAmountMajor(),
            'description'     => $payable->payableDescription(),
            'callback_url'    => $this->callbackUrl($payable),
            'notification_id' => $this->ipnId(),
            'billing_address' => $billing,
        ];

        $res = $this->request('POST', '/Transactions/SubmitOrderRequest', $payload);

        // Pesapal returns a top-level `error` object (not an HTTP error) on failure.
        if (! $res || ! empty($res['error']['code']) || empty($res['redirect_url'])) {
            Log::error('Pesapal SubmitOrderRequest failed', ['reference' => $payable->payableReference(), 'response' => $res]);

            return [
                'status'       => 'pending',
                'redirect_url' => null,
                'reference'    => $payable->payableReference(),
                'message'      => 'We could not start the payment just now. Please try again, or contact us to pay another way.',
            ];
        }

        // Store Pesapal's tracking id so verify()/webhook can find the payable.
        $payable->attachPaymentInitiation($res['order_tracking_id'], $this->name());

        return [
            'status'       => 'redirect',
            'redirect_url' => $res['redirect_url'],
            'reference'    => $payable->payableReference(),
            'message'      => 'Redirecting you to Pesapal to complete payment securely.',
        ];
    }

    /**
     * One-time setup: register our IPN (webhook) URL with Pesapal and persist the
     * returned ipn_id in Settings. Called by `php artisan pesapal:register-ipn`.
     *
     * @return array{ipn_id:string, url:string}|null
     */
    public function registerIpn(string $url): ?array
    {
        $res = $this->request('POST', '/URLSetup/RegisterIPN', [
            'url'                   => $url,
            'ipn_notification_type' => 'GET',
        ]);

        if (! $res || empty($res['ipn_id'])) {
            Log::error('Pesapal RegisterIPN failed', ['response' => $res]);

            return null;
        }

        Setting::put(['pesapal_ipn_id' => $res['ipn_id']]);

        return ['ipn_id' => $res['ipn_id'], 'url' => $res['url'] ?? $url];
    }

    /**
     * End-to-end diagnostic for the admin "Payments" health page — runs the exact
     * same steps a real payment does and reports precisely where it breaks:
     * return-URL set → keys valid → IPN registered → a test order is accepted by
     * Pesapal. The test order (tiny, never paid) just expires on Pesapal's side.
     *
     * @return array{ok:bool, message:string}
     */
    public function verifyConnection(): array
    {
        // 1. Return URL must be an absolute, public URL (Pesapal rejects relative
        //    or localhost callbacks — a common cause of "couldn't start payment").
        $origin = rtrim((string) ($this->config['frontend_url'] ?? ''), '/');
        if ($origin === '' || str_contains($origin, 'localhost') || ! str_starts_with($origin, 'http')) {
            return ['ok' => false, 'message' => "Return URL isn't set to your live site (currently “{$origin}”). Set PESAPAL_FRONTEND_URL=https://vitorra.org in the backend .env, then run config:cache."];
        }

        // 2. Keys present + valid (fresh auth).
        if (empty($this->config['consumer_key']) || empty($this->config['consumer_secret'])) {
            return ['ok' => false, 'message' => 'Pesapal API keys are not set.'];
        }
        try {
            $auth = Http::acceptJson()->asJson()->timeout(20)->post($this->baseUrl().'/Auth/RequestToken', [
                'consumer_key'    => $this->config['consumer_key'],
                'consumer_secret' => $this->config['consumer_secret'],
            ]);
            if (! $auth->successful() || ! $auth->json('token')) {
                $err = $auth->json('error.message') ?? $auth->json('message') ?? ('HTTP '.$auth->status());

                return ['ok' => false, 'message' => 'Pesapal rejected the API keys: '.$err.' (check the keys match the '.($this->config['env'] ?? 'sandbox').' environment).'];
            }
            $token = $auth->json('token');
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Could not reach Pesapal: '.$e->getMessage()];
        }

        // 3. IPN registered.
        if (empty($this->ipnId())) {
            return ['ok' => false, 'message' => 'Payment notifications (IPN) are not registered. Run: php artisan pesapal:register-ipn'];
        }

        // 4. A real SubmitOrderRequest — the definitive test (mirrors live payment).
        try {
            $res = Http::withToken($token)->acceptJson()->asJson()->timeout(30)
                ->post($this->baseUrl().'/Transactions/SubmitOrderRequest', [
                    'id'              => 'HEALTHCHECK-'.time(),
                    'currency'        => 'UGX',
                    'amount'          => 100,
                    'description'     => 'Vitorra payment health check',
                    'callback_url'    => $origin.'/order/healthcheck',
                    'notification_id' => $this->ipnId(),
                    'billing_address' => ['email_address' => 'health@vitorra.org', 'first_name' => 'Health', 'last_name' => 'Check'],
                ]);

            if ($res->successful() && ! empty($res->json('redirect_url')) && empty($res->json('error.code'))) {
                return ['ok' => true, 'message' => 'All good — keys valid, IPN registered, and a test payment was accepted. Online payments are working.'];
            }

            $err = $res->json('error.message') ?? $res->json('error.code') ?? $res->json('message') ?? ('HTTP '.$res->status());

            return ['ok' => false, 'message' => 'Pesapal rejected a test payment: '.$err];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message' => 'Test payment failed: '.$e->getMessage()];
        }
    }

    public function verify(string $reference): array
    {
        $payable = app(PayableResolver::class)->byReference($reference);

        if (! $payable || ! $payable->payableTrackingId()) {
            return ['payment_status' => $payable?->payableIsPaid() ? 'paid' : 'pending', 'reference' => $reference];
        }

        $this->applyStatus($payable, $this->fetchStatus($payable->payableTrackingId()));

        return ['payment_status' => $payable->payableIsPaid() ? 'paid' : 'pending', 'reference' => $reference];
    }

    public function handleWebhook(Request $request): array
    {
        // Pesapal sends OrderTrackingId + OrderMerchantReference (GET query or POST).
        $trackingId  = $request->input('OrderTrackingId', $request->query('OrderTrackingId'));
        $merchantRef = $request->input('OrderMerchantReference', $request->query('OrderMerchantReference'));
        $notifType   = $request->input('OrderNotificationType', $request->query('OrderNotificationType', 'IPNCHANGE'));

        if ($trackingId) {
            $resolver = app(PayableResolver::class);
            $payable  = $resolver->byTrackingId($trackingId)
                ?? ($merchantRef ? $resolver->byReference($merchantRef) : null);

            if ($payable) {
                $this->applyStatus($payable, $this->fetchStatus($trackingId));
            } else {
                Log::warning('Pesapal IPN for unknown payable', ['tracking_id' => $trackingId, 'merchant_ref' => $merchantRef]);
            }
        }

        // Pesapal expects this echo with status 200, else it keeps retrying the IPN.
        return [
            'orderNotificationType'  => $notifType,
            'orderTrackingId'        => $trackingId,
            'orderMerchantReference' => $merchantRef,
            'status'                 => 200,
        ];
    }

    /**
     * Look up a transaction's current state.
     *
     * @return array{state:string, raw:array} state: paid | failed | pending
     */
    private function fetchStatus(string $trackingId): array
    {
        $res = $this->request('GET', "/Transactions/GetTransactionStatus?orderTrackingId={$trackingId}");

        // status_code: 0 INVALID · 1 COMPLETED · 2 FAILED · 3 REVERSED
        $code = (int) ($res['status_code'] ?? -1);
        $state = match ($code) {
            1       => 'paid',
            2, 3    => 'failed',
            default => 'pending',
        };

        return ['state' => $state, 'raw' => $res ?? []];
    }

    /**
     * Settle the payable once Pesapal confirms. Idempotency lives in the payable's
     * markPayablePaid(), so a webhook firing twice settles exactly once.
     *
     * @param array{state:string, raw:array} $status
     */
    private function applyStatus(Payable $payable, array $status): void
    {
        if ($status['state'] === 'paid' && ! $payable->payableIsPaid()) {
            $payable->markPayablePaid();
        }
    }

    private function callbackUrl(Payable $payable): string
    {
        $origin = rtrim((string) ($this->config['frontend_url'] ?? ''), '/');

        return $origin.$payable->payableReturnPath();
    }

    /** The registered IPN id (Settings first — set by pesapal:register-ipn — then config). */
    private function ipnId(): ?string
    {
        return Setting::get('pesapal_ipn_id') ?: ($this->config['ipn_id'] ?? null);
    }

    private function baseUrl(): string
    {
        $env = ($this->config['env'] ?? 'sandbox') === 'live' ? 'live' : 'sandbox';

        return self::BASE[$env];
    }

    /**
     * Authenticate (cached ~4 min — Pesapal tokens live 5) and return a bearer token.
     */
    private function token(): ?string
    {
        return Cache::remember('pesapal_token', 240, function () {
            $res = Http::acceptJson()
                ->asJson()
                ->timeout(20)
                ->post($this->baseUrl().'/Auth/RequestToken', [
                    'consumer_key'    => $this->config['consumer_key'] ?? null,
                    'consumer_secret' => $this->config['consumer_secret'] ?? null,
                ]);

            if ($res->successful() && $res->json('token')) {
                return $res->json('token');
            }

            Log::error('Pesapal auth failed', ['response' => $res->json()]);

            return null;
        });
    }

    /**
     * Make an authenticated Pesapal API call. Returns the decoded body or null.
     */
    private function request(string $method, string $path, array $body = []): ?array
    {
        $token = $this->token();

        if (! $token) {
            return null;
        }

        $req = Http::withToken($token)->acceptJson()->asJson()->timeout(30);

        $res = $method === 'GET'
            ? $req->get($this->baseUrl().$path)
            : $req->post($this->baseUrl().$path, $body);

        if (! $res->successful()) {
            Log::error('Pesapal request failed', ['path' => $path, 'status' => $res->status(), 'body' => $res->json()]);
            // A 401 likely means a stale cached token — drop it so the next call re-auths.
            if ($res->status() === 401) {
                Cache::forget('pesapal_token');
            }

            return $res->json();
        }

        return $res->json();
    }
}
