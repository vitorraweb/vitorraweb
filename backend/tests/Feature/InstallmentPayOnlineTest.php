<?php

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Models\InstallmentPayment;
use App\Models\Order;
use App\Models\User;
use App\Services\DocumentService;
use App\Services\Payments\FlutterwaveGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InstallmentPayOnlineTest extends TestCase
{
    use RefreshDatabase;

    private array $config = [
        'public_key' => 'FLWPUBK_TEST-pk', 'secret_key' => 'FLWSECK_TEST-sk',
        'secret_hash' => 'test-secret-hash', 'frontend_url' => 'https://vitorra.org',
    ];

    private function gateway(): FlutterwaveGateway
    {
        return new FlutterwaveGateway($this->config);
    }

    private function webhookRequest(array $data): Request
    {
        $request = Request::create('/api/payments/webhook/flutterwave', 'POST', ['event' => 'charge.completed', 'data' => $data]);
        $request->headers->set('verif-hash', $this->config['secret_hash']);

        return $request;
    }

    /** @return array{0:Order, 1:InstallmentPayment[]} order with a 3×30,000 plan */
    private function scenario(string $email = 'biz@v.org'): array
    {
        $order = Order::create([
            'reference' => 'VIT-'.strtoupper(uniqid()), 'currency' => 'UGX',
            'subtotal' => 90000, 'total' => 90000, 'status' => 'pending', 'payment_status' => 'pending',
            'customer_email' => $email, 'customer_name' => 'Biz Co', 'shipping_address' => ['country' => 'Uganda'],
        ]);
        $plan = $order->installmentPlan()->create(['currency' => 'UGX', 'total' => 90000]);
        $payments = collect(['Deposit', 'Instalment 2', 'Instalment 3'])
            ->map(fn ($label) => $plan->payments()->create(['label' => $label, 'amount' => 30000]))
            ->all();

        return [$order, $payments];
    }

    public function test_webhook_settles_one_installment_and_marks_order_partial(): void
    {
        Http::fake([
            '*/transactions/verify_by_reference*' => Http::response([
                'status' => 'success',
                'data'   => ['status' => 'successful', 'amount' => 30000, 'currency' => 'UGX'],
            ]),
        ]);
        [$order, $payments] = $this->scenario();
        $payments[0]->update(['payment_reference' => 'TRK-1']);

        $request = $this->webhookRequest(['tx_ref' => 'TRK-1', 'meta' => ['payable_reference' => $payments[0]->payableReference()]]);
        $this->gateway()->handleWebhook($request);

        $this->assertNotNull($payments[0]->fresh()->paid_at);
        $this->assertSame('partial', $order->fresh()->payment_status);
    }

    public function test_paying_all_installments_marks_order_paid_and_receipts_once(): void
    {
        $receipts = $this->mock(DocumentService::class);
        $receipts->shouldReceive('generatePaymentReceipt')->once();

        [$order, $payments] = $this->scenario();
        foreach ($payments as $p) {
            $p->markPayablePaid();
        }

        $this->assertSame('paid', $order->fresh()->payment_status);
    }

    public function test_settlement_is_idempotent(): void
    {
        Http::fake([
            '*/transactions/verify_by_reference*' => Http::response([
                'status' => 'success',
                'data'   => ['status' => 'successful', 'amount' => 30000, 'currency' => 'UGX'],
            ]),
        ]);
        [$order, $payments] = $this->scenario();
        $payments[0]->update(['payment_reference' => 'TRK-1']);

        $request = $this->webhookRequest(['tx_ref' => 'TRK-1', 'meta' => ['payable_reference' => $payments[0]->payableReference()]]);
        $this->gateway()->handleWebhook($request);
        $paidAt = $payments[0]->fresh()->paid_at;
        $this->gateway()->handleWebhook($request); // duplicate

        $this->assertEquals($paidAt, $payments[0]->fresh()->paid_at);
        $this->assertSame('partial', $order->fresh()->payment_status);
    }

    public function test_customer_can_initiate_online_installment_payment(): void
    {
        config()->set('payments.driver', 'flutterwave');
        Http::fake([
            '*/v3/payments' => Http::response(['status' => 'success', 'data' => ['link' => 'https://checkout.flutterwave.com/pay/TRK-INST']]),
        ]);
        $this->app->singleton(PaymentGateway::class, fn () => $this->gateway());

        [, $payments] = $this->scenario('me@v.org');
        User::create(['name' => 'Me', 'email' => 'me@v.org', 'password' => 'changeme123changeme', 'role' => 'customer']);
        $token = User::where('email', 'me@v.org')->first()->createToken('t', ['customer'])->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/account/installments/{$payments[0]->id}/pay-online")
            ->assertOk()
            ->assertJsonPath('data.status', 'redirect');

        $this->assertStringStartsWith($payments[0]->payableReference().'-', $payments[0]->fresh()->payment_reference);
    }

    public function test_customer_cannot_pay_another_customers_installment(): void
    {
        config()->set('payments.driver', 'flutterwave');
        $this->app->singleton(PaymentGateway::class, fn () => $this->gateway());

        [, $payments] = $this->scenario('owner@v.org');
        User::create(['name' => 'Intruder', 'email' => 'intruder@v.org', 'password' => 'changeme123changeme', 'role' => 'customer']);
        $token = User::where('email', 'intruder@v.org')->first()->createToken('t', ['customer'])->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/account/installments/{$payments[0]->id}/pay-online")
            ->assertStatus(403);
    }

    public function test_online_payment_rejected_when_gateway_not_live(): void
    {
        config()->set('payments.driver', 'manual');
        [, $payments] = $this->scenario('me@v.org');
        User::create(['name' => 'Me', 'email' => 'me@v.org', 'password' => 'changeme123changeme', 'role' => 'customer']);
        $token = User::where('email', 'me@v.org')->first()->createToken('t', ['customer'])->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/account/installments/{$payments[0]->id}/pay-online")
            ->assertStatus(422);
    }
}
