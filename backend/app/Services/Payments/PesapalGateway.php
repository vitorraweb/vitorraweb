<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Models\Order;
use App\Models\Setting;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Pesapal (API 3.0) — Uganda's local card + MTN/Airtel mobile-money gateway.
 *
 * Pesapal is a hosted/redirect provider (like PayPal, not a direct charge API):
 *   1. initiate()      submits the order → we send the customer to a Pesapal page
 *   2. customer pays   (picks MTN / Airtel / card on Pesapal's hosted page)
 *   3. handleWebhook()  Pesapal pings our IPN URL → we confirm + mark the order paid
 *   4. verify()         the browser-return page polls this until the state settles
 *
 * One-time setup: `php artisan pesapal:register-ipn` registers our webhook URL and
 * stores the resulting `ipn_id` in Settings. Credentials live in config/services.php.
 *
 * The charge is currency-agnostic: Pesapal is given `order->total` in `order->currency`
 * (UGX as whole shillings, USD as cents → major units). FET's EUR list prices are a
 * display concern only — orders are already stored in UGX/USD.
 */
class PesapalGateway implements PaymentGateway
{
    /** Pesapal API base URLs (v3). */
    private const BASE = [
        'sandbox' => 'https://cybqa.pesapal.com/pesapalv3/api',
        'live'    => 'https://pay.pesapal.com/v3/api',
    ];

    /** @param array{consumer_key:?string, consumer_secret:?string, env:?string, callback_url:?string, ipn_id:?string} $config */
    public function __construct(private readonly array $config) {}

    public function name(): string
    {
        return 'pesapal';
    }

    public function initiate(Order $order): array
    {
        $payload = [
            'id'              => $order->reference,
            'currency'        => $order->currency,
            'amount'          => $this->majorUnits($order),
            'description'     => "Vitorra order {$order->reference}",
            'callback_url'    => $this->callbackUrl($order),
            'notification_id' => $this->ipnId(),
            'billing_address' => [
                'email_address' => $order->customer_email,
                'phone_number'  => $order->customer_phone ?? '',
                'first_name'    => Str::before($order->customer_name, ' ') ?: $order->customer_name,
                'last_name'     => Str::contains($order->customer_name, ' ') ? Str::after($order->customer_name, ' ') : '',
            ],
        ];

        $res = $this->request('POST', '/Transactions/SubmitOrderRequest', $payload);

        // Pesapal returns a top-level `error` object (not an HTTP error) on failure.
        if (! $res || ! empty($res['error']['code']) || empty($res['redirect_url'])) {
            Log::error('Pesapal SubmitOrderRequest failed', ['reference' => $order->reference, 'response' => $res]);

            return [
                'status'       => 'pending',
                'redirect_url' => null,
                'reference'    => $order->reference,
                'message'      => 'We could not start the payment just now. Please try again, or contact us to pay another way.',
            ];
        }

        // Store Pesapal's tracking id so verify()/webhook can look the order up.
        $order->update([
            'payment_method'    => 'pesapal',
            'payment_reference' => $res['order_tracking_id'],
        ]);

        return [
            'status'       => 'redirect',
            'redirect_url' => $res['redirect_url'],
            'reference'    => $order->reference,
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

    public function verify(string $reference): array
    {
        $order = Order::where('reference', $reference)->first();

        if (! $order || ! $order->payment_reference) {
            return ['payment_status' => $order?->payment_status ?? 'pending', 'reference' => $reference];
        }

        $status = $this->fetchStatus($order->payment_reference);
        $this->applyStatus($order, $status);

        return ['payment_status' => $order->fresh()->payment_status, 'reference' => $reference];
    }

    public function handleWebhook(Request $request): array
    {
        // Pesapal sends OrderTrackingId + OrderMerchantReference (GET query or POST).
        $trackingId = $request->input('OrderTrackingId', $request->query('OrderTrackingId'));
        $merchantRef = $request->input('OrderMerchantReference', $request->query('OrderMerchantReference'));
        $notifType  = $request->input('OrderNotificationType', $request->query('OrderNotificationType', 'IPNCHANGE'));

        if ($trackingId) {
            $order = Order::where('payment_reference', $trackingId)
                ->orWhere('reference', $merchantRef)
                ->first();

            if ($order) {
                $status = $this->fetchStatus($trackingId);
                $this->applyStatus($order, $status);
            } else {
                Log::warning('Pesapal IPN for unknown order', ['tracking_id' => $trackingId, 'merchant_ref' => $merchantRef]);
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
     * Move the order to the confirmed payment state. Idempotent: the paid
     * transition (and its receipt) fires once even if Pesapal calls us twice.
     *
     * @param array{state:string, raw:array} $status
     */
    private function applyStatus(Order $order, array $status): void
    {
        if ($status['state'] === 'paid' && $order->payment_status !== 'paid') {
            $order->update(['payment_status' => 'paid']);

            try {
                app(DocumentService::class)->generatePaymentReceipt($order->fresh());
            } catch (\Throwable $e) {
                Log::warning('Failed to generate payment receipt after Pesapal payment', [
                    'order_id' => $order->id,
                    'error'    => $e->getMessage(),
                ]);
            }
        }
    }

    /** Amount in the currency's major unit (UGX whole shillings; USD cents → dollars). */
    private function majorUnits(Order $order): float
    {
        return $order->currency === 'USD' ? round($order->total / 100, 2) : (float) $order->total;
    }

    private function callbackUrl(Order $order): string
    {
        $base = (string) ($this->config['callback_url'] ?? '');

        return $base . (Str::contains($base, '?') ? '&' : '?') . 'reference=' . $order->reference;
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
                ->post($this->baseUrl() . '/Auth/RequestToken', [
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
            ? $req->get($this->baseUrl() . $path)
            : $req->post($this->baseUrl() . $path, $body);

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
