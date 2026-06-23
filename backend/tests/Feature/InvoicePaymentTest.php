<?php

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Services\Payments\PesapalGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InvoicePaymentTest extends TestCase
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
        Cache::flush();
    }

    private function gateway(): PesapalGateway
    {
        return new PesapalGateway($this->config);
    }

    private function invoice(string $currency = 'UGX', int $unitPrice = 500000, string $status = 'sent'): Invoice
    {
        $invoice = Invoice::create([
            'number'        => Invoice::nextNumber(),
            'customer_name' => 'Acme Distributors Ltd',
            'customer_email' => 'ap@acme.test',
            'currency'      => $currency,
            'sector'        => 'FET',
            'issue_date'    => now()->toDateString(),
            'status'        => $status,
        ]);
        $invoice->items()->create([
            'description'   => 'FET-PRO-FII installation',
            'quantity'      => 1,
            'unit_price'    => $unitPrice,
            'vat_rate'      => 0,
            'line_subtotal' => $unitPrice,
            'vat_amount'    => 0,
            'line_total'    => $unitPrice,
        ]);
        $invoice->recalcTotals();

        return $invoice->fresh();
    }

    private function seedBooks(string $currency = 'UGX'): void
    {
        FinanceAccount::create(['name' => 'Mobile Money', 'type' => 'mobile_money', 'currency' => $currency, 'opening_balance' => 0, 'is_active' => true]);
        FinanceCategory::create(['name' => 'Sales income', 'kind' => 'income', 'is_active' => true]);
    }

    public function test_show_returns_public_invoice_by_token(): void
    {
        $invoice = $this->invoice();

        $this->getJson("/api/invoices/pay/{$invoice->public_token}")
            ->assertOk()
            ->assertJsonPath('data.number', $invoice->number)
            ->assertJsonPath('data.online_payable', true)
            ->assertJsonPath('data.balance', 500000);
    }

    public function test_pay_initiates_pesapal_redirect(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/SubmitOrderRequest' => Http::response([
                'order_tracking_id' => 'TRK-INV', 'redirect_url' => 'https://cybqa.pesapal.com/pay/TRK-INV', 'status' => '200',
            ]),
        ]);
        $this->app->singleton(PaymentGateway::class, fn () => $this->gateway());
        $invoice = $this->invoice();

        $this->postJson("/api/invoices/pay/{$invoice->public_token}")
            ->assertOk()
            ->assertJsonPath('data.status', 'redirect');

        $this->assertSame('TRK-INV', $invoice->fresh()->payment_reference);
    }

    public function test_pay_rejects_eur_invoice(): void
    {
        $this->app->singleton(PaymentGateway::class, fn () => $this->gateway());
        $invoice = $this->invoice('EUR');

        $this->postJson("/api/invoices/pay/{$invoice->public_token}")->assertStatus(422);
    }

    public function test_pay_rejects_already_paid_invoice(): void
    {
        $this->app->singleton(PaymentGateway::class, fn () => $this->gateway());
        $invoice = $this->invoice();
        $invoice->update(['status' => 'paid', 'amount_paid' => $invoice->total]);

        $this->postJson("/api/invoices/pay/{$invoice->public_token}")
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');
    }

    public function test_webhook_auto_settles_and_approves_invoice(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/GetTransactionStatus*' => Http::response(['status_code' => 1, 'payment_status_description' => 'Completed']),
        ]);
        $this->seedBooks('UGX');
        $invoice = $this->invoice();
        $invoice->update(['payment_reference' => 'TRK-INV']);

        $request = Request::create('/api/payments/webhook/pesapal', 'GET', [
            'OrderTrackingId'        => 'TRK-INV',
            'OrderMerchantReference' => $invoice->number,
        ]);
        $this->gateway()->handleWebhook($request);

        $invoice->refresh();
        $this->assertSame('paid', $invoice->status);
        $this->assertSame($invoice->total, $invoice->amount_paid);

        // An APPROVED income entry posted to the books (auto-approve decision).
        $tx = FinanceTransaction::where('source', 'invoice')->where('source_id', $invoice->id)->first();
        $this->assertNotNull($tx);
        $this->assertSame('approved', $tx->status);
        $this->assertSame('income', $tx->type);
        $this->assertSame(500000, (int) $tx->amount);
        $this->assertNotNull($tx->approved_at);
    }

    public function test_settlement_is_idempotent(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/GetTransactionStatus*' => Http::response(['status_code' => 1]),
        ]);
        $this->seedBooks('UGX');
        $invoice = $this->invoice();
        $invoice->update(['payment_reference' => 'TRK-INV']);

        $request = Request::create('/api/payments/webhook/pesapal', 'GET', [
            'OrderTrackingId' => 'TRK-INV', 'OrderMerchantReference' => $invoice->number,
        ]);
        $this->gateway()->handleWebhook($request);
        $this->gateway()->handleWebhook($request); // duplicate IPN

        $this->assertSame(1, FinanceTransaction::where('source', 'invoice')->where('source_id', $invoice->id)->count());
        $this->assertSame('paid', $invoice->fresh()->status);
    }

    public function test_status_endpoint_reconciles_invoice(): void
    {
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/GetTransactionStatus*' => Http::response(['status_code' => 1]),
        ]);
        $this->seedBooks('UGX');
        $this->app->singleton(PaymentGateway::class, fn () => $this->gateway());
        $invoice = $this->invoice();
        $invoice->update(['payment_reference' => 'TRK-INV']);

        $this->getJson("/api/invoices/pay/{$invoice->public_token}/status")
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertSame('paid', $invoice->fresh()->status);
    }
}
