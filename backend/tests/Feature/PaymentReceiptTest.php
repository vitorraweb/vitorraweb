<?php

namespace Tests\Feature;

use App\Mail\PaymentReceiptMail;
use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Models\PaymentReceipt;
use App\Models\Quotation;
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

    private function order(int $price = 2000000): Quotation
    {
        $q = Quotation::create([
            'number' => Quotation::nextNumber('fet'), 'business' => 'fet', 'heading' => 'order_confirmation', 'status' => 'sent',
            'customer_name' => 'Kampala Fleet Co', 'customer_email' => 'ops@fleet.test', 'currency' => 'UGX',
            'issue_date' => now()->toDateString(), 'tax_rate' => 0,
        ]);
        $q->items()->create(['position' => 0, 'name' => 'FET-PRO-FII', 'quantity' => 2, 'unit_price' => $price / 2, 'line_total' => $price]);
        $q->recalcTotals();

        return $q->fresh();
    }

    private function payOrder(Quotation $q, int $amount, string $method = 'mobile_money'): \Illuminate\Testing\TestResponse
    {
        $r = $this->withHeaders($this->h())->postJson("/api/admin/accounting/quotations/{$q->id}/payment", [
            'finance_account_id' => $this->account->id, 'amount' => $amount, 'payment_method' => $method, 'payment_reference' => 'MTN-77',
        ]);
        $this->app['auth']->forgetGuards();

        return $r;
    }

    public function test_order_deposit_gets_a_receipt_at_once_and_carries_to_the_invoice(): void
    {
        $order = $this->order(2000000);

        $this->payOrder($order, 1000000)->assertCreated()->assertJsonPath('data.number', 'VHL-RCT-'.now()->year.'-0001');

        $receipt = PaymentReceipt::firstOrFail();
        $this->assertSame([$order->id, null, 1000000, 0, 1000000], [$receipt->quotation_id, $receipt->invoice_id, $receipt->amount, $receipt->paid_before, $receipt->balance_after]);
        $this->assertSame('accepted', $order->fresh()->status);
        // The money waits for approval in the books; the receipt does not.
        $this->assertSame('draft', FinanceTransaction::where('source', 'quotation')->value('status'));

        $d = BrandedDocument::receiptData($receipt);
        $this->assertSame('DEPOSIT', $d['receipt']['status']);
        $this->assertSame('Order No.', $d['info'][2][0]);
        $this->assertSame('ORDER TOTAL', $d['totals'][0][0]);
        $this->assertStringContainsString('remains on this order', $d['receipt']['next']);

        // Overpaying the order is refused.
        $this->payOrder($order, 1500000)->assertStatus(422);

        // The final invoice starts with the deposit already paid.
        $id = $this->withHeaders($this->h())->postJson("/api/admin/accounting/quotations/{$order->id}/convert", ['kind' => 'final'])->assertCreated()->json('data.id');
        $this->app['auth']->forgetGuards();
        $invoice = Invoice::findOrFail($id);
        $this->assertSame(1000000, $invoice->amount_paid);
        $this->assertSame($invoice->id, $receipt->fresh()->invoice_id);

        $this->withHeaders($this->h())->postJson("/api/admin/accounting/invoices/{$invoice->id}/send", ['to' => ['ops@fleet.test']])->assertOk();
        $this->app['auth']->forgetGuards();
        $this->assertSame('partial', $invoice->fresh()->status);

        // The balance paid on the invoice: its receipt counts the deposit.
        $this->approve($this->pay($invoice->fresh(), 1000000));
        $last = PaymentReceipt::latest('id')->firstOrFail();
        $this->assertSame([1000000, 0], [$last->paid_before, $last->balance_after]);
        $this->assertSame('paid', $invoice->fresh()->status);
    }

    public function test_voiding_an_order_payment_voids_the_receipt_and_takes_it_off_the_invoice(): void
    {
        $order = $this->order(2000000);
        $this->payOrder($order, 500000)->assertCreated();
        $id = $this->withHeaders($this->h())->postJson("/api/admin/accounting/quotations/{$order->id}/convert", ['kind' => 'final'])->json('data.id');
        $this->app['auth']->forgetGuards();
        $this->assertSame(500000, Invoice::findOrFail($id)->amount_paid);

        $tx = FinanceTransaction::where('source', 'quotation')->firstOrFail();
        $this->withHeaders($this->h())->postJson("/api/admin/accounting/transactions/{$tx->id}/void")->assertOk();
        $this->app['auth']->forgetGuards();

        $this->assertSame('void', PaymentReceipt::firstOrFail()->status);
        $this->assertSame(0, Invoice::findOrFail($id)->amount_paid);
    }

    public function test_sales_staff_can_download_and_email_order_receipts_but_not_record_payments(): void
    {
        Mail::fake();
        $order = $this->order();
        $this->payOrder($order, 300000)->assertCreated();
        $receipt = PaymentReceipt::firstOrFail();

        $sales = User::create(['name' => 'Sales', 'email' => 'sales@vitorra.org', 'password' => 'changeme123', 'role' => 'ops', 'permissions' => ['quotations']]);
        $h = ['Authorization' => 'Bearer '.$sales->createToken('t')->plainTextToken];

        $this->withHeaders($h)->getJson("/api/admin/accounting/quotations/{$order->id}/receipts")->assertOk()->assertJsonPath('data.0.document_type', 'order');
        $this->app['auth']->forgetGuards();
        $this->withHeaders($h)->get("/api/admin/accounting/payment-receipts/{$receipt->id}/pdf")->assertOk();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($h)->postJson("/api/admin/accounting/payment-receipts/{$receipt->id}/send", ['to' => ['ops@fleet.test']])->assertOk();
        $this->app['auth']->forgetGuards();
        Mail::assertSent(PaymentReceiptMail::class, fn ($m) => $m->hasTo('ops@fleet.test') && str_contains($m->envelope()->subject, 'order confirmation'));

        $this->withHeaders($h)->postJson("/api/admin/accounting/quotations/{$order->id}/payment", [
            'finance_account_id' => $this->account->id, 'amount' => 1000, 'payment_method' => 'cash',
        ])->assertForbidden();
    }
}
