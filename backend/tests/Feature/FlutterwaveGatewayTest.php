<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Services\DocumentService;
use App\Services\Payments\FlutterwaveGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FlutterwaveGatewayTest extends TestCase
{
    use RefreshDatabase;

    private array $config = [
        'public_key'   => 'FLWPUBK_TEST-pk',
        'secret_key'   => 'FLWSECK_TEST-sk',
        'secret_hash'  => 'test-secret-hash',
        'frontend_url' => 'https://vitorra.org',
    ];

    private function gateway(): FlutterwaveGateway
    {
        return new FlutterwaveGateway($this->config);
    }

    private function order(string $currency = 'UGX', int $total = 2650000): Order
    {
        return Order::create([
            'reference'        => 'VIT-'.strtoupper(uniqid()),
            'currency'         => $currency,
            'subtotal'         => $total,
            'total'            => $total,
            'status'           => 'pending',
            'payment_status'   => 'pending',
            'customer_name'    => 'Solomon Okello',
            'customer_email'   => 'buyer@vitorra.org',
            'customer_phone'   => '+256700000000',
            'shipping_address' => ['country' => 'Uganda'],
        ]);
    }

    /** Stub a successful payment-link creation. */
    private function fakeInitiateOk(string $link = 'https://checkout.flutterwave.com/v3/hosted/pay/xyz'): void
    {
        Http::fake([
            '*/v3/payments' => Http::response(['status' => 'success', 'message' => 'Hosted Link', 'data' => ['link' => $link]]),
        ]);
    }

    /** Build a signed webhook request the way Flutterwave sends it. */
    private function webhookRequest(array $data, ?string $hash = null): Request
    {
        $request = Request::create('/api/payments/webhook/flutterwave', 'POST', ['event' => 'charge.completed', 'data' => $data]);
        $request->headers->set('verif-hash', $hash ?? $this->config['secret_hash']);

        return $request;
    }

    public function test_initiate_returns_redirect_and_stores_tracking_id(): void
    {
        $this->fakeInitiateOk('https://checkout.flutterwave.com/v3/hosted/pay/TRK-ABC');
        $order = $this->order();

        $result = $this->gateway()->initiate($order);

        $this->assertSame('redirect', $result['status']);
        $this->assertStringContainsString('TRK-ABC', $result['redirect_url']);

        $order->refresh();
        $this->assertSame('flutterwave', $order->payment_method);
        $this->assertStringStartsWith($order->reference.'-', $order->payment_reference);
        $this->assertSame('pending', $order->payment_status);
    }

    public function test_initiate_sends_major_units_not_cents(): void
    {
        $this->fakeInitiateOk();
        $order = $this->order('USD', 69000); // 69000 cents = $690.00

        $this->gateway()->initiate($order);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/v3/payments')
                && $request['amount'] === 690.0
                && $request['currency'] === 'USD';
        });
    }

    public function test_initiate_offers_card_and_mobile_money_for_ugx(): void
    {
        // Regression: without an explicit payment_options list, Flutterwave can
        // default straight to a single method (e.g. a mobile-money-number prompt)
        // with no way for the customer to choose card instead.
        $this->fakeInitiateOk();
        $order = $this->order('UGX');

        $this->gateway()->initiate($order);

        Http::assertSent(fn ($request) => str_contains($request['payment_options'] ?? '', 'card')
            && str_contains($request['payment_options'] ?? '', 'mobilemoneyuganda'));
    }

    public function test_initiate_offers_card_only_for_usd(): void
    {
        $this->fakeInitiateOk();
        $order = $this->order('USD', 69000);

        $this->gateway()->initiate($order);

        Http::assertSent(fn ($request) => $request['payment_options'] === 'card');
    }

    public function test_initiate_handles_provider_error_gracefully(): void
    {
        Http::fake(['*/v3/payments' => Http::response(['status' => 'error', 'message' => 'Invalid amount'], 400)]);
        $order = $this->order();

        $result = $this->gateway()->initiate($order);

        $this->assertSame('pending', $result['status']);
        $this->assertNull($result['redirect_url']);
        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_verify_marks_order_paid_and_generates_receipt_once(): void
    {
        $order = $this->order();
        $order->update(['payment_reference' => 'TRK-PAID']);

        Http::fake([
            '*/transactions/verify_by_reference*' => Http::response([
                'status' => 'success',
                'data'   => ['status' => 'successful', 'amount' => 2650000, 'currency' => 'UGX', 'tx_ref' => 'TRK-PAID'],
            ]),
        ]);

        $receipts = $this->mock(DocumentService::class);
        $receipts->shouldReceive('generatePaymentReceipt')->once();

        $out = $this->gateway()->verify($order->reference);

        $this->assertSame('paid', $out['payment_status']);
        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_failed_status_leaves_order_unpaid(): void
    {
        $order = $this->order();
        $order->update(['payment_reference' => 'TRK-FAIL']);

        Http::fake([
            '*/transactions/verify_by_reference*' => Http::response([
                'status' => 'success',
                'data'   => ['status' => 'failed', 'amount' => 2650000, 'currency' => 'UGX'],
            ]),
        ]);

        $out = $this->gateway()->verify($order->reference);

        $this->assertSame('pending', $out['payment_status']);
        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_verify_does_not_settle_on_amount_mismatch(): void
    {
        $order = $this->order('UGX', 2650000);
        $order->update(['payment_reference' => 'TRK-SHORT']);

        // Provider says "successful" but for far less than owed — must not settle.
        Http::fake([
            '*/transactions/verify_by_reference*' => Http::response([
                'status' => 'success',
                'data'   => ['status' => 'successful', 'amount' => 1000, 'currency' => 'UGX'],
            ]),
        ]);

        $this->gateway()->verify($order->reference);

        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_webhook_confirms_payment_idempotently_and_acks(): void
    {
        $order = $this->order();
        $order->update(['payment_reference' => 'TRK-IPN']);

        Http::fake([
            '*/transactions/verify_by_reference*' => Http::response([
                'status' => 'success',
                'data'   => ['status' => 'successful', 'amount' => 2650000, 'currency' => 'UGX'],
            ]),
        ]);

        $receipts = $this->mock(DocumentService::class);
        $receipts->shouldReceive('generatePaymentReceipt')->once();

        $request = $this->webhookRequest(['tx_ref' => 'TRK-IPN', 'meta' => ['payable_reference' => $order->reference]]);

        $ack = $this->gateway()->handleWebhook($request);
        $this->gateway()->handleWebhook($request); // duplicate delivery

        $this->assertSame('success', $ack['status']);
        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_webhook_rejects_bad_signature(): void
    {
        $order = $this->order();
        $order->update(['payment_reference' => 'TRK-SPOOF']);

        $request = $this->webhookRequest(['tx_ref' => 'TRK-SPOOF'], 'wrong-hash');

        $ack = $this->gateway()->handleWebhook($request);

        $this->assertSame('error', $ack['status']);
        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_webhook_for_unknown_payable_still_acks(): void
    {
        $request = $this->webhookRequest(['tx_ref' => 'TRK-GHOST']);

        $ack = $this->gateway()->handleWebhook($request);

        $this->assertSame('success', $ack['status']);
    }

    public function test_pay_route_returns_redirect_url(): void
    {
        $this->fakeInitiateOk('https://checkout.flutterwave.com/v3/hosted/pay/TRK-ROUTE');
        $this->app->singleton(\App\Contracts\PaymentGateway::class, fn () => $this->gateway());

        $order = $this->order();

        $this->postJson("/api/orders/{$order->reference}/pay")
            ->assertOk()
            ->assertJsonPath('data.status', 'redirect')
            ->assertJsonPath('data.reference', $order->reference);

        $this->assertStringContainsString($order->reference, $order->fresh()->payment_reference);
    }

    public function test_payment_status_route_reconciles_with_provider(): void
    {
        $this->app->singleton(\App\Contracts\PaymentGateway::class, fn () => $this->gateway());
        $order = $this->order();
        $order->update(['payment_reference' => 'TRK-RECON']);

        Http::fake([
            '*/transactions/verify_by_reference*' => Http::response([
                'status' => 'success',
                'data'   => ['status' => 'successful', 'amount' => 2650000, 'currency' => 'UGX'],
            ]),
        ]);
        $this->mock(DocumentService::class)->shouldReceive('generatePaymentReceipt')->once();

        $this->getJson("/api/orders/{$order->reference}/payment-status")
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');
    }
}
