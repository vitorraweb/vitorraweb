<?php

namespace Tests\Feature;

use App\Models\FinanceAccount;
use App\Models\FinanceBudget;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\SupplierBill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountingTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'admin']);
    }

    private function juniorFinance(): User
    {
        return User::create(['name' => 'Daniel', 'email' => 'd-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'ops', 'department' => 'finance']);
    }

    private function h(User $u): array
    {
        return ['Authorization' => 'Bearer '.$u->createToken('t')->plainTextToken];
    }

    private function account(int $opening = 0, string $cur = 'UGX'): FinanceAccount
    {
        return FinanceAccount::create(['name' => 'Acct '.uniqid(), 'type' => 'bank', 'currency' => $cur, 'opening_balance' => $opening]);
    }

    private function expenseCat(): FinanceCategory
    {
        return FinanceCategory::create(['name' => 'Rent', 'kind' => 'expense']);
    }

    public function test_junior_can_record_but_cannot_approve(): void
    {
        $junior = $this->juniorFinance();
        $acct = $this->account();
        $cat = FinanceCategory::create(['name' => 'Sales', 'kind' => 'income']);

        // Junior records a draft — allowed (perm:accounting).
        $this->withHeaders($this->h($junior))->postJson('/api/admin/accounting/transactions', [
            'type' => 'income', 'finance_account_id' => $acct->id, 'finance_category_id' => $cat->id,
            'amount' => 50000, 'occurred_on' => now()->toDateString(),
        ])->assertCreated();

        // Junior cannot approve — needs perm:accounting_approve.
        $draft = FinanceTransaction::first();
        $this->withHeaders($this->h($junior))
            ->postJson("/api/admin/accounting/transactions/{$draft->id}/approve")
            ->assertForbidden();
    }

    public function test_only_approved_transactions_move_the_balance(): void
    {
        $admin = $this->admin();
        $acct = $this->account(0);
        $cat = FinanceCategory::create(['name' => 'Sales', 'kind' => 'income']);
        $tx = FinanceTransaction::create([
            'type' => 'income', 'finance_account_id' => $acct->id, 'finance_category_id' => $cat->id,
            'currency' => 'UGX', 'amount' => 50000, 'occurred_on' => now()->toDateString(), 'status' => 'draft',
        ]);

        $this->assertSame(0, $acct->balance());           // draft doesn't count

        $this->withHeaders($this->h($admin))->postJson("/api/admin/accounting/transactions/{$tx->id}/approve")->assertOk();
        $this->assertSame(50000, FinanceAccount::find($acct->id)->balance());
    }

    public function test_transfer_moves_money_between_accounts(): void
    {
        $admin = $this->admin();
        $a = $this->account(100000);
        $b = $this->account(0);
        $tx = FinanceTransaction::create([
            'type' => 'transfer', 'finance_account_id' => $a->id, 'transfer_to_account_id' => $b->id,
            'currency' => 'UGX', 'amount' => 40000, 'occurred_on' => now()->toDateString(), 'status' => 'draft',
        ]);

        $this->withHeaders($this->h($admin))->postJson("/api/admin/accounting/transactions/{$tx->id}/approve")->assertOk();

        $this->assertSame(60000, FinanceAccount::find($a->id)->balance());
        $this->assertSame(40000, FinanceAccount::find($b->id)->balance());
    }

    public function test_paying_a_bill_then_approving_marks_it_paid(): void
    {
        $admin = $this->admin();
        $acct = $this->account(50000);
        $bill = SupplierBill::create(['vendor_name' => 'Acme', 'currency' => 'UGX', 'amount' => 30000, 'status' => 'unpaid']);

        $pay = $this->withHeaders($this->h($admin))->postJson("/api/admin/accounting/bills/{$bill->id}/pay", ['finance_account_id' => $acct->id])->assertOk();
        $this->assertSame('unpaid', $bill->fresh()->status);  // payment is still a draft

        $txId = $pay->json('transaction_id');
        $this->withHeaders($this->h($admin))->postJson("/api/admin/accounting/transactions/{$txId}/approve")->assertOk();

        $this->assertSame('paid', $bill->fresh()->status);
        $this->assertSame(20000, FinanceAccount::find($acct->id)->balance());
    }

    public function test_budget_reports_actual_vs_cap(): void
    {
        $admin = $this->admin();
        $acct = $this->account();
        $cat = $this->expenseCat();
        FinanceTransaction::create([
            'type' => 'expense', 'finance_account_id' => $acct->id, 'finance_category_id' => $cat->id,
            'currency' => 'UGX', 'amount' => 20000, 'occurred_on' => now()->toDateString(), 'status' => 'approved',
        ]);
        FinanceBudget::create(['finance_category_id' => $cat->id, 'period' => now()->format('Y-m'), 'currency' => 'UGX', 'amount' => 50000]);

        $res = $this->withHeaders($this->h($admin))->getJson('/api/admin/accounting/budgets?period='.now()->format('Y-m'))->assertOk();
        $row = collect($res->json('data'))->firstWhere('category_id', $cat->id);
        $this->assertSame(20000, $row['actual']);
        $this->assertSame(30000, $row['remaining']);
        $this->assertFalse($row['over']);
    }

    public function test_executive_summary_includes_the_books(): void
    {
        $admin = $this->admin();
        $acct = $this->account(0);
        $cat = FinanceCategory::create(['name' => 'Sales', 'kind' => 'income']);
        FinanceTransaction::create([
            'type' => 'income', 'finance_account_id' => $acct->id, 'finance_category_id' => $cat->id,
            'currency' => 'UGX', 'amount' => 75000, 'occurred_on' => now()->toDateString(), 'status' => 'approved',
        ]);

        $this->withHeaders($this->h($admin))->getJson('/api/admin/executive/summary')
            ->assertOk()
            ->assertJsonPath('data.books.income.UGX', 75000);
    }
}
