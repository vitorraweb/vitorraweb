<?php

namespace Tests\Feature;

use App\Mail\PaymentReceiptMail;
use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Models\PaymentReceipt;
use App\Models\User;
use App\Services\Payments\OnlineInvoiceSettlement;
use App\Support\BrandedDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PaymentReceiptTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private FinanceAccount $account;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create(['name' => 'Finance', 'email' => 'fin@vitorra.org', 'password' => 'changeme123', 'role' => 'admin']);
        $this->account = FinanceAccount::create(['name' => 'Stanbic UGX', 'type' => 'bank', 'currency' => 'UGX', 'opening_balance' => 0, 'is_active' => true]);
        FinanceCategory::create(['name' => 'Sales', 'kind' => 'income', 'is_active' => true]);
    }

    private function h(): array
    {
        return ['Authorization' => 'Bearer '.$this->admin->createToken('t')->plainTextToken];
    }

    private function invoice(int $price = 1000000, ?string $business = 'fet'): Invoice
    {
        $invoice = Invoice::create([
            'number' => Invoice::nextNumberFor($business), 'business' => $business,
            'customer_name' => 'Acme Transport Ltd', 'customer_email' => 'ap@acme.test',
            'currency' => 'UGX', 'sector' => 'FET', 'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(), 'status' => 'sent',
        ]);
        $invoice->items()->create([
            'description' => 'FET-PRO-FII', 'quantity' => 1, 'unit_price' => $price, 'vat_rate' => 0,
            'line_subtotal' => $price, 'vat_amount' => 0, 'line_total' => $price,
        ]);
        $invoice->recalcTotals();

        return $invoice->fresh();
    }

    private function pay(Invoice $invoice, int $amount, string $method = 'bank_transfer', string $ref = 'STB-123'): FinanceTransaction
    {
        $id = $this->withHeaders($this->h())->postJson("/api/admin/accounting/invoices/{$invoice->id}/payment", [
            'finance_account_id' => $this->account->id, 'amount' => $amount,
            'payment_method' => $method, 'payment_reference' => $ref,
        ])->assertOk()->json('transaction_id');
        $this->app['auth']->forgetGuards();

        return FinanceTransaction::findOrFail($id);
    }

    private function approve(FinanceTransaction $tx): void
    {
        $this->withHeaders($this->h())->postJson("/api/admin/accounting/transactions/{$tx->id}/approve")->assertOk();
        $this->app['auth']->forgetGuards();
    }

    public function test_no_receipt_until_the_payment_is_approved(): void
    {
        $this->pay($this->invoice(), 400000);

        $this->assertSame(0, PaymentReceipt::count());
    }

    public function test_part_then_final_payment_each_get_a_receipt_that_adds_up(): void
    {
        $invoice = $this->invoice(1000000);

        $this->approve($this->pay($invoice, 400000, 'mobile_money', 'MTN-1'));
        $this->approve($this->pay($invoice, 600000, 'cash', ''));

        [$first, $second] = PaymentReceipt::orderBy('id')->get()->all();
        $this->assertSame('VHL-RCT-'.now()->year.'-0001', $first->number);
        $this->assertSame([400000, 0, 600000, 'mobile_money', 'MTN-1'], [$first->amount, $first->paid_before, $first->balance_after, $first->payment_method, $first->payment_reference]);
        $this->assertFalse($first->isFullySettled());
        $this->assertSame([600000, 400000, 0], [$second->amount, $second->paid_before, $second->balance_after]);
        $this->assertTrue($second->isFullySettled());
        $this->assertSame('paid', $invoice->fresh()->status);

        $d = BrandedDocument::receiptData($first);
        $this->assertSame('receipt', $d['kind']);
        $this->assertSame('PART PAYMENT', $d['receipt']['status']);
        $this->assertStringContainsString('UGX 600,000.00 remains', $d['receipt']['next']);
        $this->assertSame('PAID IN FULL', BrandedDocument::receiptData($second)['receipt']['status']);
        $this->assertFileExists($d['header']);
    }

    public function test_voiding_the_payment_voids_its_receipt(): void
    {
        $invoice = $this->invoice();
        $tx = $this->pay($invoice, 500000);
        $this->approve($tx);

        $this->withHeaders($this->h())->postJson("/api/admin/accounting/transactions/{$tx->id}/void")->assertOk();
        $this->app['auth']->forgetGuards();

        $receipt = PaymentReceipt::firstOrFail();
        $this->assertSame('void', $receipt->status);
        $this->assertSame('VOID', BrandedDocument::receiptData($receipt)['receipt']['status']);

        // A later payment is not counted against the voided one.
        $this->approve($this->pay($invoice, 300000));
        $this->assertSame(0, PaymentReceipt::where('status', 'issued')->firstOrFail()->paid_before);

        $this->withHeaders($this->h())->postJson("/api/admin/accounting/payment-receipts/{$receipt->id}/send", ['to' => ['ap@acme.test']])->assertStatus(422);
    }

    public function test_online_settlement_issues_a_receipt(): void
    {
        $invoice = $this->invoice(700000);
        $invoice->update(['payment_reference' => 'TRK-9']);

        app(OnlineInvoiceSettlement::class)->settle($invoice->fresh());
        app(OnlineInvoiceSettlement::class)->settle($invoice->fresh()); // repeat webhook

        $this->assertSame(1, PaymentReceipt::count());
        $r = PaymentReceipt::firstOrFail();
        $this->assertSame(['online', 'TRK-9', 700000, 0], [$r->payment_method, $r->payment_reference, $r->amount, $r->balance_after]);
    }

    public function test_pdf_email_list_and_csv(): void
    {
        Mail::fake();
        $invoice = $this->invoice();
        $this->approve($this->pay($invoice, 250000));
        $receipt = PaymentReceipt::firstOrFail();

        $pdf = $this->withHeaders($this->h())->get("/api/admin/accounting/payment-receipts/{$receipt->id}/pdf");
        $pdf->assertOk();
        $this->assertStringStartsWith('%PDF', $pdf->getContent());
        $this->app['auth']->forgetGuards();

        $this->withHeaders($this->h())->postJson("/api/admin/accounting/payment-receipts/{$receipt->id}/send", ['to' => ['ap@acme.test', 'fin@vitorra.org']])->assertOk();
        $this->app['auth']->forgetGuards();
        Mail::assertSent(PaymentReceiptMail::class, fn ($m) => ! $m->team && $m->hasTo('ap@acme.test'));
        Mail::assertSent(PaymentReceiptMail::class, fn ($m) => $m->team && $m->customerSent && $m->hasTo('fin@vitorra.org'));
        $this->assertNotNull($receipt->fresh()->emailed_at);

        // Strangers are refused, as for invoices.
        $this->withHeaders($this->h())->postJson("/api/admin/accounting/payment-receipts/{$receipt->id}/send", ['to' => ['someone@else.test']])->assertStatus(422);
        $this->app['auth']->forgetGuards();

        $this->withHeaders($this->h())->getJson("/api/admin/accounting/invoices/{$invoice->id}/receipts")
            ->assertOk()->assertJsonPath('data.0.number', $receipt->number)->assertJsonPath('data.0.balance_after', 750000);
        $this->app['auth']->forgetGuards();

        $this->withHeaders($this->h())->getJson('/api/admin/accounting/payment-receipts?q=Acme')->assertOk()->assertJsonCount(1, 'data');
        $this->app['auth']->forgetGuards();

        $csv = $this->withHeaders($this->h())->get('/api/admin/accounting/payment-receipts/export')->assertOk()->streamedContent();
        $this->assertStringContainsString($receipt->number, $csv);
        $this->assertStringContainsString('Part payment', $csv);
    }

    public function test_plain_invoice_receipt_uses_its_business_line(): void
    {
        $invoice = $this->invoice(100000, null);
        $invoice->update(['sector' => 'COFFEE']);
        $this->approve($this->pay($invoice, 100000));

        $d = BrandedDocument::receiptData(PaymentReceipt::firstOrFail());
        $this->assertSame('coffee', $d['business']);
        $this->assertStringEndsWith('head-coffee-receipt.jpg', $d['header']);
    }
}
