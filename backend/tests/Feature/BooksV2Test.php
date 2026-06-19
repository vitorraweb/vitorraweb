<?php

namespace Tests\Feature;

use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Models\RecurringEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BooksV2Test extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'admin']);
    }

    private function h(User $u): array
    {
        return ['Authorization' => 'Bearer '.$u->createToken('t')->plainTextToken];
    }

    private function account(string $cur = 'UGX', int $opening = 0): FinanceAccount
    {
        return FinanceAccount::create(['name' => 'Acct '.uniqid(), 'type' => 'bank', 'currency' => $cur, 'opening_balance' => $opening]);
    }

    public function test_invoice_numbering_and_vat_totals(): void
    {
        $h = $this->h($this->admin());

        $res = $this->withHeaders($h)->postJson('/api/admin/accounting/invoices', [
            'customer_name' => 'Acme Ltd', 'currency' => 'UGX',
            'items' => [['description' => 'FET install', 'quantity' => 2, 'unit_price' => 1000, 'vat_rate' => 18]],
        ])->assertCreated();

        $res->assertJsonPath('data.number', 'INV-'.now()->year.'-0001');
        $res->assertJsonPath('data.subtotal', 2000);
        $res->assertJsonPath('data.vat_total', 360);
        $res->assertJsonPath('data.total', 2360);

        $second = $this->withHeaders($h)->postJson('/api/admin/accounting/invoices', [
            'customer_name' => 'Beta', 'currency' => 'UGX', 'items' => [['description' => 'x', 'quantity' => 1, 'unit_price' => 500, 'vat_rate' => 0]],
        ])->assertCreated();
        $second->assertJsonPath('data.number', 'INV-'.now()->year.'-0002');
    }

    public function test_invoice_payment_settles_on_approval(): void
    {
        $h = $this->h($this->admin());
        $account = $this->account('UGX', 0);
        $invoice = Invoice::create(['number' => 'INV-T-1', 'customer_name' => 'Acme', 'currency' => 'UGX', 'total' => 2360, 'status' => 'sent', 'issue_date' => now()]);

        $pay = $this->withHeaders($h)->postJson("/api/admin/accounting/invoices/{$invoice->id}/payment", ['finance_account_id' => $account->id])->assertOk();
        $this->assertSame('sent', $invoice->fresh()->status);   // still a draft transaction

        $this->withHeaders($h)->postJson("/api/admin/accounting/transactions/{$pay->json('transaction_id')}/approve")->assertOk();

        $this->assertSame('paid', $invoice->fresh()->status);
        $this->assertSame(2360, $invoice->fresh()->amount_paid);
        $this->assertSame(2360, FinanceAccount::find($account->id)->balance());
    }

    public function test_overdue_reminder_targets_only_unpaid_overdue(): void
    {
        Mail::fake();
        Invoice::create(['number' => 'INV-OD-1', 'customer_name' => 'Late', 'customer_email' => 'late@v.org', 'currency' => 'UGX', 'total' => 1000, 'status' => 'sent', 'issue_date' => now()->subMonth(), 'due_date' => now()->subWeek()]);
        Invoice::create(['number' => 'INV-OK-1', 'customer_name' => 'Paid', 'customer_email' => 'paid@v.org', 'currency' => 'UGX', 'total' => 1000, 'amount_paid' => 1000, 'status' => 'paid', 'issue_date' => now()->subMonth(), 'due_date' => now()->subWeek()]);

        $this->artisan('invoices:remind')->assertSuccessful();

        Mail::assertSent(\App\Mail\InvoiceMail::class, fn ($m) => $m->hasTo('late@v.org'));
        Mail::assertNotSent(\App\Mail\InvoiceMail::class, fn ($m) => $m->hasTo('paid@v.org'));
    }

    public function test_vat_report_nets_output_against_input(): void
    {
        $h = $this->h($this->admin());
        $account = $this->account();
        $cat = FinanceCategory::create(['name' => 'Rent', 'kind' => 'expense']);

        Invoice::create(['number' => 'INV-V-1', 'customer_name' => 'C', 'currency' => 'UGX', 'subtotal' => 2000, 'vat_total' => 360, 'total' => 2360, 'status' => 'sent', 'issue_date' => now()]);
        FinanceTransaction::create(['type' => 'expense', 'finance_account_id' => $account->id, 'finance_category_id' => $cat->id, 'currency' => 'UGX', 'amount' => 590, 'vat_rate' => 18, 'vat_amount' => 90, 'occurred_on' => now()->toDateString(), 'status' => 'approved']);

        $this->withHeaders($h)->getJson('/api/admin/accounting/vat-report?period=mtd')
            ->assertOk()
            ->assertJsonPath('data.by_currency.UGX.output', 360)
            ->assertJsonPath('data.by_currency.UGX.input', 90)
            ->assertJsonPath('data.by_currency.UGX.payable', 270);
    }

    public function test_receipt_extraction_is_graceful_without_a_key(): void
    {
        config(['services.anthropic.key' => null]);

        $this->withHeaders($this->h($this->admin()))
            ->post('/api/admin/accounting/extract-receipt', ['file' => UploadedFile::fake()->create('receipt.pdf', 10, 'application/pdf')])
            ->assertOk()
            ->assertJson(['data' => null]);
    }

    public function test_recurring_command_generates_a_draft(): void
    {
        $account = $this->account();
        $cat = FinanceCategory::create(['name' => 'Rent', 'kind' => 'expense']);
        $entry = RecurringEntry::create([
            'type' => 'expense', 'finance_account_id' => $account->id, 'finance_category_id' => $cat->id,
            'currency' => 'UGX', 'amount' => 100000, 'day_of_month' => 1, 'is_active' => true, 'description' => 'Office rent',
        ]);

        $this->artisan('finance:recurring')->assertSuccessful();

        $this->assertSame(1, FinanceTransaction::where('source', 'recurring')->where('source_id', $entry->id)->where('status', 'draft')->count());
        $this->assertSame(now()->format('Y-m'), $entry->fresh()->last_run_period);

        // Running again the same month doesn't duplicate.
        $this->artisan('finance:recurring')->assertSuccessful();
        $this->assertSame(1, FinanceTransaction::where('source', 'recurring')->count());
    }

    public function test_transactions_csv_export(): void
    {
        $account = $this->account();
        FinanceTransaction::create(['type' => 'income', 'finance_account_id' => $account->id, 'currency' => 'UGX', 'amount' => 5000, 'occurred_on' => now()->toDateString(), 'status' => 'approved']);

        $res = $this->withHeaders($this->h($this->admin()))->get('/api/admin/accounting/transactions/export')->assertOk();
        $this->assertStringContainsString('Date,Type,Status', $res->streamedContent());
    }
}
