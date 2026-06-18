<?php

namespace App\Services;

use App\Models\FinanceAccount;
use App\Models\FinanceTransaction;
use App\Models\SupplierBill;
use Carbon\Carbon;

/**
 * Profit & loss, cash position, and payables — all per currency (never summed
 * across currencies, matching the executive report). Approved transactions
 * only. Feeds both the accounting reports screen and the CEO dashboard.
 */
class FinanceReportService
{
    private const CURRENCIES = ['UGX', 'USD', 'EUR'];

    /** Full report for a period: windowed P&L by category + sector, plus cash & payables snapshots. */
    public function report(string $period): array
    {
        [$start, $end, $label] = $this->window($period);

        $income  = $this->breakdown('income', $start, $end);
        $expense = $this->breakdown('expense', $start, $end);

        return [
            'period'       => $period,
            'period_label' => $label,
            'income'       => $income,
            'expense'      => $expense,
            'net'          => $this->netByCurrency($income['by_currency'], $expense['by_currency']),
            'by_sector'    => $this->bySector($start, $end),
            'cash'         => $this->cash(),
            'payables'     => $this->payables(),
        ];
    }

    /** Compact per-currency totals for the executive dashboard (windowed P&L + snapshots). */
    public function ledgerTotals(Carbon $start, Carbon $end): array
    {
        $income  = $this->totalsByCurrency('income', $start, $end);
        $expense = $this->totalsByCurrency('expense', $start, $end);
        $cash    = $this->cash();

        return [
            'income'   => $income,
            'expense'  => $expense,
            'net'      => $this->netByCurrency($income, $expense),
            'cash'     => $cash['by_currency'],
            'payables' => $this->payables(),
            'has_data' => FinanceTransaction::where('status', 'approved')->exists() || FinanceAccount::exists(),
        ];
    }

    /* ── windows ─────────────────────────────────────────────────────────── */

    /** @return array{0:Carbon,1:Carbon,2:string} */
    private function window(string $period): array
    {
        $now = now();

        return match ($period) {
            'last_month' => [
                $s = $now->copy()->subMonthNoOverflow()->startOfMonth(),
                $now->copy()->subMonthNoOverflow()->endOfMonth(),
                $s->copy()->format('F Y'),
            ],
            'week' => [$now->copy()->subDays(7), $now->copy(), 'Last 7 days'],
            default => [$now->copy()->startOfMonth(), $now->copy(), $now->copy()->format('F Y').' (so far)'],
        };
    }

    /* ── building blocks ─────────────────────────────────────────────────── */

    private function totalsByCurrency(string $type, Carbon $start, Carbon $end): array
    {
        $rows = FinanceTransaction::where('type', $type)->where('status', 'approved')
            ->whereBetween('occurred_on', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->selectRaw('currency, SUM(amount) s')->groupBy('currency')->pluck('s', 'currency');

        $out = [];
        foreach (self::CURRENCIES as $c) {
            $out[$c] = (int) ($rows[$c] ?? 0);
        }
        return $out;
    }

    private function breakdown(string $type, Carbon $start, Carbon $end): array
    {
        $byCategory = FinanceTransaction::where('finance_transactions.type', $type)->where('status', 'approved')
            ->whereBetween('occurred_on', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->leftJoin('finance_categories', 'finance_categories.id', '=', 'finance_transactions.finance_category_id')
            ->selectRaw("COALESCE(finance_categories.name, 'Uncategorised') name, finance_transactions.currency, SUM(finance_transactions.amount) s")
            ->groupBy('name', 'finance_transactions.currency')->orderByDesc('s')->get()
            ->map(fn ($r) => ['name' => $r->name, 'currency' => $r->currency, 'amount' => (int) $r->s])->all();

        return ['by_currency' => $this->totalsByCurrency($type, $start, $end), 'by_category' => $byCategory];
    }

    private function bySector(Carbon $start, Carbon $end): array
    {
        $rows = FinanceTransaction::where('status', 'approved')->whereIn('type', ['income', 'expense'])
            ->whereBetween('occurred_on', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->selectRaw("COALESCE(sector, 'GENERAL') sector, currency, type, SUM(amount) s")
            ->groupBy('sector', 'currency', 'type')->get();

        $map = [];
        foreach ($rows as $r) {
            $key = $r->sector.'|'.$r->currency;
            $map[$key] ??= ['sector' => $r->sector, 'currency' => $r->currency, 'income' => 0, 'expense' => 0];
            $map[$key][$r->type] = (int) $r->s;
        }
        return array_values(array_map(fn ($m) => $m + ['net' => $m['income'] - $m['expense']], $map));
    }

    private function netByCurrency(array $income, array $expense): array
    {
        $out = [];
        foreach (self::CURRENCIES as $c) {
            $out[$c] = (int) (($income[$c] ?? 0) - ($expense[$c] ?? 0));
        }
        return $out;
    }

    private function cash(): array
    {
        $accounts = FinanceAccount::where('is_active', true)->orderBy('name')->get();
        $byCurrency = array_fill_keys(self::CURRENCIES, 0);
        $list = [];
        foreach ($accounts as $a) {
            $bal = $a->balance();
            $byCurrency[$a->currency] = ($byCurrency[$a->currency] ?? 0) + $bal;
            $list[] = ['name' => $a->name, 'type' => $a->type, 'currency' => $a->currency, 'balance' => $bal];
        }
        return ['accounts' => $list, 'by_currency' => $byCurrency];
    }

    private function payables(): array
    {
        $rows = SupplierBill::where('status', 'unpaid')
            ->selectRaw('currency, SUM(amount) s')->groupBy('currency')->pluck('s', 'currency');

        $out = [];
        foreach (self::CURRENCIES as $c) {
            $out[$c] = (int) ($rows[$c] ?? 0);
        }
        return $out;
    }
}
