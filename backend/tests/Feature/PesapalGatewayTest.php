<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Services\DocumentService;
use App\Services\Payments\PesapalGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PesapalGatewayTest extends TestCase
{
    use RefreshDatabase;

    private array $config = [
        'consumer_key'    => 'ck',
        'consumer_secret' => 'cs',
        'env'             => 'sandbox',
        'ipn_id'          => 'IPN-EXISTING',
        'frontend_url'    => 'https://vitorra.org',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush(); // drop any cached Pesapal token between tests
    }

    private function gateway(): PesapalGateway
    {
        return new PesapalGateway($this->config);
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

    /** Stub auth + a successful SubmitOrderRequest. */
    private function fakeSubmitOk(string $trackingId = 'TRK-123'): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok', 'expiryDate' => '2030-01-01T00:00:00']),
            '*/Transactions/SubmitOrderRequest' => Http::response([
                'order_tracking_id'  => $trackingId,
                'merchant_reference' => 'VIT-X',
                'redirect_url'       => "https://cybqa.pesapal.com/pesapaliframe/PesapalIframe3/Index?OrderTrackingId={$trackingId}",
                'status'             => '200',
            ]),
        ]);
    }

    public function test_initiate_returns_redirect_and_stores_tracking_id(): void
    {
        $this->fakeSubmitOk('TRK-ABC');
        $order = $this->order();

        $result = $this->gateway()->initiate($order);

        $this->assertSame('redirect', $result['status']);
        $this->assertStringContainsString('TRK-ABC', $result['redirect_url']);

        $order->refresh();
        $this->assertSame('pesapal', $order->payment_method);
        $this->assertSame('TRK-ABC', $order->payment_reference);
        $this->assertSame('pending', $order->payment_status);
    }

    public function test_initiate_charges_usd_orders_in_dollars_not_cents(): void
    {
        $this->fakeSubmitOk();
        $order = $this->order('USD', 69000); // 69000 cents = $690.00

        $this->gateway()->initiate($order);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'SubmitOrderRequest')
                && $request['amount'] === 690.0
                && $request['currency'] === 'USD';
        });
    }

    public function test_initiate_handles_provider_error_gracefully(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/SubmitOrderRequest' => Http::response([
                'error' => ['code' => 'invalid_request', 'message' => 'bad'],
                'status' => '500',
            ]),
        ]);
        $order = $this->order();

        $result = $this->gateway()->initiate($order);

        $this->assertSame('pending', $result['status']);
        $this->assertNull($result['redirect_url']);
        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_verify_marks_order_paid_and_generates_receipt_once(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/GetTransactionStatus*' => Http::response([
                'status_code' => 1, 'payment_status_description' => 'Completed', 'amount' => 2650000,
            ]),
        ]);

        $receipts = $this->mock(DocumentService::class);
        $receipts->shouldReceive('generatePaymentReceipt')->once();

        $order = $this->order();
        $order->update(['payment_reference' => 'TRK-PAID']);

        $out = $this->gateway()->verify($order->reference);

        $this->assertSame('paid', $out['payment_status']);
        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_failed_status_leaves_order_unpaid(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/GetTransactionStatus*' => Http::response([
                'status_code' => 2, 'payment_status_description' => 'Failed',
            ]),
        ]);

        $order = $this->order();
        $order->update(['payment_reference' => 'TRK-FAIL']);

        $out = $this->gateway()->verify($order->reference);

        $this->assertSame('pending', $out['payment_status']);
        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_webhook_confirms_payment_idempotently_and_echoes_ack(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/GetTransactionStatus*' => Http::response([
                'status_code' => 1, 'payment_status_description' => 'Completed',
            ]),
        ]);

        // Receipt must be generated exactly once even though the IPN fires twice.
        $receipts = $this->mock(DocumentService::class);
        $receipts->shouldReceive('generatePaymentReceipt')->once();

        $order = $this->order();
        $order->update(['payment_reference' => 'TRK-IPN']);

        $request = Request::create('/api/payments/webhook/pesapal', 'GET', [
            'OrderTrackingId'        => 'TRK-IPN',
            'OrderMerchantReference' => $order->reference,
            'OrderNotificationType'  => 'IPNCHANGE',
        ]);

        $ack = $this->gateway()->handleWebhook($request);
        $this->gateway()->handleWebhook($request); // duplicate IPN

        $this->assertSame(200, $ack['status']);
        $this->assertSame('TRK-IPN', $ack['orderTrackingId']);
        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_webhook_for_unknown_order_still_acks(): void
    {
        Http::fake(['*' => Http::response(['token' => 'tok'])]);

        $request = Request::create('/api/payments/webhook/pesapal', 'GET', [
            'OrderTrackingId'        => 'TRK-GHOST',
            'OrderMerchantReference' => 'VIT-NOPE',
        ]);

        $ack = $this->gateway()->handleWebhook($request);

        $this->assertSame(200, $ack['status']);
    }

    public function test_pay_route_returns_redirect_url(): void
    {
        $this->fakeSubmitOk('TRK-ROUTE');
        $this->app->singleton(\App\Contracts\PaymentGateway::class, fn () => $this->gateway());

        $order = $this->order();

        $this->postJson("/api/orders/{$order->reference}/pay")
            ->assertOk()
            ->assertJsonPath('data.status', 'redirect')
            ->assertJsonPath('data.reference', $order->reference);

        $this->assertStringContainsString('TRK-ROUTE', $order->fresh()->payment_reference);
    }

    public function test_payment_status_route_reconciles_with_provider(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/GetTransactionStatus*' => Http::response([
                'status_code' => 1, 'payment_status_description' => 'Completed',
            ]),
        ]);
        $this->mock(DocumentService::class)->shouldReceive('generatePaymentReceipt')->once();
        $this->app->singleton(\App\Contracts\PaymentGateway::class, fn () => $this->gateway());

        $order = $this->order();
        $order->update(['payment_reference' => 'TRK-RECON']);

        $this->getJson("/api/orders/{$order->reference}/payment-status")
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');
    }

    public function test_register_ipn_stores_id_in_settings(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/URLSetup/RegisterIPN' => Http::response([
                'ipn_id' => 'IPN-NEW-123', 'url' => 'https://api.vitorra.org/api/payments/webhook/pesapal',
            ]),
        ]);

        $result = $this->gateway()->registerIpn('https://api.vitorra.org/api/payments/webhook/pesapal');

        $this->assertSame('IPN-NEW-123', $result['ipn_id']);
        $this->assertSame('IPN-NEW-123', \App\Models\Setting::get('pesapal_ipn_id'));
    }
}
