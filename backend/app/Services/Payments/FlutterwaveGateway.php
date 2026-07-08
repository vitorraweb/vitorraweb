<?php

namespace App\Services\Payments;

use App\Contracts\Payable;
use App\Contracts\PaymentGateway;
use App\Support\PayableResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Flutterwave (v3) — Uganda cards + MTN/Airtel mobile money, and USD cards.
 *
 * Flutterwave is a hosted/redirect provider (like PayPal, not a direct-charge API):
 *   1. initiate()      creates a payment link → we send the customer there
 *   2. customer pays   (picks card / mobile money on Flutterwave's hosted page)
 *   3. handleWebhook()  Flutterwave pings our webhook URL → we confirm + settle
 *   4. verify()         the browser-return page polls this until the state settles
 *
 * Works for any {@see Payable} (Order, Invoice, InstallmentPayment) — each one
 * supplies its amount, billing and settlement, and is found again by
 * {@see PayableResolver}.
 *
 * The secret key itself is the bearer token (no separate auth exchange), and
 * sandbox vs live is determined by which key you were issued (test keys are
 * prefixed FLWSECK_TEST-/FLWPUBK_TEST-) rather than a separate env setting.
 *
 * One-time setup: the webhook URL + a secret verification hash are configured in
 * the Flutterwave dashboard (Settings → Webhooks) — there is no registration API
 * call to make. Set FLUTTERWAVE_SECRET_HASH to the same value.
 */
class FlutterwaveGateway implements PaymentGateway
{
    private const BASE = 'https://api.flutterwave.com/v3';

    /** @param array{public_key:?string, secret_key:?string, encryption_key:?string, secret_hash:?string, frontend_url:?string} $config */
    public function __construct(private readonly array $config) {}

    public function name(): string
    {
        return 'flutterwave';
    }

    public function initiate(Payable $payable): array
    {
        $billing = $payable->payableBilling();
        // Flutterwave requires a unique tx_ref per attempt (a retry can't reuse one),
        // so we suffix the payable's own reference rather than using it bare.
        $txRef = $payable->payableReference().'-'.time();

        $payload = [
            'tx_ref'        => $txRef,
            'amount'        => $payable->payableAmountMajor(),
            'currency'      => $payable->payableCurrency(),
            'redirect_url'  => $this->callbackUrl($payable),
            'customer'      => [
                'email'       => $billing['email_address'],
                'phonenumber' => $billing['phone_number'],
                'name'        => trim($billing['first_name'].' '.$billing['last_name']),
            ],
            'customizations' => [
                'title'       => 'Vitorra Holdings',
                'description' => $payable->payableDescription(),
            ],
            // Carried through to the webhook so we can find the payable even if
            // the tx_ref suffix makes a direct reference match impossible.
            'meta' => ['payable_reference' => $payable->payableReference()],
        ];

        $res = $this->request('POST', '/payments', $payload);

        if (! $res || ($res['status'] ?? null) !== 'success' || empty($res['data']['link'])) {
            Log::error('Flutterwave payment link creation failed', ['reference' => $payable->payableReference(), 'response' => $res]);

            return [
                'status'       => 'pending',
                'redirect_url' => null,
                'reference'    => $payable->payableReference(),
                'message'      => 'We could not start the payment just now. Please try again, or contact us to pay another way.',
            ];
        }

        // Store our tx_ref so verify()/webhook can find the payable again.
        $payable->attachPaymentInitiation($txRef, $this->name());

        return [
            'status'       => 'redirect',
            'redirect_url' => $res['data']['link'],
            'reference'    => $payable->payableReference(),
            'message'      => 'Redirecting you to Flutterwave to complete payment securely.',
        ];
    }

    /**
     * End-to-end diagnostic for the admin "Payments" health page — reports
     * precisely where activation breaks: return URL set → keys valid → webhook
     * secret configured → a real test payment link is accepted. The test link
     * (tiny, never paid) just expires unused on Flutterwave's side.
     *
     * @return array{ok:bool, message:string}
     */
    public function verifyConnection(): array
    {
        $origin = rtrim((string) ($this->config['frontend_url'] ?? ''), '/');
        if ($origin === '' || str_contains($origin, 'localhost') || ! str_starts_with($origin, 'http')) {
            return ['ok' => false, 'message' => "Return URL isn't set to your live site (currently “{$origin}”). Set FLUTTERWAVE_FRONTEND_URL=https://vitorra.org in the backend .env, then run config:cache."];
        }

        if (empty($this->config['secret_key'])) {
            return ['ok' => false, 'message' => 'Flutterwave API keys are not set.'];
        }

        if (empty($this->config['secret_hash'])) {
            return ['ok' => false, 'message' => 'Webhook secret hash is not set. Generate one in the Flutterwave dashboard (Settings → Webhooks) and set FLUTTERWAVE_SECRET_HASH — without it, completed payments won\'t be confirmed automatically.'];
        }

        try {
            $res = Http::withToken($this->config['secret_key'])->acceptJson()->asJson()->timeout(30)
                ->post(self::BASE.'/payments', [
                    'tx_ref'         => 'HEALTHCHECK-'.time(),
                    'amount'         => 100,
                    'currency'       => 'UGX',
                    'redirect_url'   => $origin.'/order/healthcheck',
                    'customer'       => ['email' => 'health@vitorra.org', 'phonenumber' => '+256700000000', 'name' => 'Health Check'],
                    'customizations' => ['title' => 'Vitorra payment health check'],
                ]);

            if ($res->successful() && $res->json('status') === 'success' && ! empty($res->json('data.link'))) {
                $env = $this->isTestMode() ? 'sandbox' : 'live';

                return ['ok' => true, 'message' => "All good — keys valid ({$env} mode), webhook secret configured, and a test payment link was accepted. Online payments are working."];
            }

            $err = $res->json('message') ?? ('HTTP '.$res->status());

            return ['ok' => false, 'message' => 'Flutterwave rejected a test payment: '.$err];
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
        // Flutterwave signs every webhook with a static secret hash in this
        // header (not HMAC — a direct comparison against the dashboard-configured
        // value). Skip processing (but still ack) if it doesn't match, so a
        // spoofed request can't fabricate a payment.
        $expected = $this->config['secret_hash'] ?? null;
        $received = $request->header('verif-hash');

        if (! $expected || ! $received || ! hash_equals($expected, $received)) {
            Log::warning('Flutterwave webhook with missing/invalid verif-hash', ['ip' => $request->ip()]);

            return ['status' => 'error', 'message' => 'invalid signature'];
        }

        $data       = $request->input('data', []);
        $trackingId = $data['tx_ref'] ?? null;
        $merchantRef = $data['meta']['payable_reference'] ?? null;

        if ($trackingId) {
            $resolver = app(PayableResolver::class);
            $payable  = $resolver->byTrackingId($trackingId)
                ?? ($merchantRef ? $resolver->byReference($merchantRef) : null);

            if ($payable) {
                $this->applyStatus($payable, $this->fetchStatus($trackingId));
            } else {
                Log::warning('Flutterwave webhook for unknown payable', ['tx_ref' => $trackingId, 'merchant_ref' => $merchantRef]);
            }
        }

        return ['status' => 'success'];
    }

    /**
     * Look up a transaction's current state directly with Flutterwave — never
     * trust the webhook body alone, always re-verify (and check amount/currency
     * match, guarding against a tampered or replayed notification).
     *
     * @return array{state:string, raw:array}
     */
    private function fetchStatus(string $trackingId): array
    {
        $res = $this->request('GET', '/transactions/verify_by_reference?tx_ref='.urlencode($trackingId));

        $tx = $res['data'] ?? null;
        if (! $tx || ($res['status'] ?? null) !== 'success') {
            return ['state' => 'pending', 'raw' => $res ?? []];
        }

        $state = match ($tx['status'] ?? null) {
            'successful' => 'paid',
            'failed', 'cancelled' => 'failed',
            default => 'pending',
        };

        return ['state' => $state, 'raw' => $tx];
    }

    /**
     * Settle the payable once Flutterwave confirms — idempotency lives in the
     * payable's markPayablePaid(), so a webhook firing twice settles exactly once.
     * Amount/currency are checked so a manipulated notification can't under-pay.
     *
     * @param array{state:string, raw:array} $status
     */
    private function applyStatus(Payable $payable, array $status): void
    {
        if ($status['state'] !== 'paid' || $payable->payableIsPaid()) {
            return;
        }

        $tx = $status['raw'];
        $amountOk   = (float) ($tx['amount'] ?? 0) >= $payable->payableAmountMajor();
        $currencyOk = ($tx['currency'] ?? null) === $payable->payableCurrency();

        if (! $amountOk || ! $currencyOk) {
            Log::warning('Flutterwave transaction paid but amount/currency mismatch — not settling', [
                'reference' => $payable->payableReference(),
                'expected'  => [$payable->payableAmountMajor(), $payable->payableCurrency()],
                'received'  => [$tx['amount'] ?? null, $tx['currency'] ?? null],
            ]);

            return;
        }

        $payable->markPayablePaid();
    }

    private function callbackUrl(Payable $payable): string
    {
        $origin = rtrim((string) ($this->config['frontend_url'] ?? ''), '/');

        return $origin.$payable->payableReturnPath();
    }

    /** Test keys are prefixed FLWSECK_TEST- / FLWPUBK_TEST- — no separate env config needed. */
    private function isTestMode(): bool
    {
        return str_starts_with((string) ($this->config['secret_key'] ?? ''), 'FLWSECK_TEST');
    }

    /** Make an authenticated Flutterwave API call. The secret key IS the bearer token. */
    private function request(string $method, string $path, array $body = []): ?array
    {
        $req = Http::withToken($this->config['secret_key'] ?? '')->acceptJson()->asJson()->timeout(30);

        $res = $method === 'GET'
            ? $req->get(self::BASE.$path)
            : $req->post(self::BASE.$path, $body);

        if (! $res->successful()) {
            Log::error('Flutterwave request failed', ['path' => $path, 'status' => $res->status(), 'body' => $res->json()]);
        }

        return $res->json();
    }
}
