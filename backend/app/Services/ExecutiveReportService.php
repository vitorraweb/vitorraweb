<?php

namespace App\Services;

use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Prospect;
use Carbon\Carbon;

/**
 * Builds the CEO-facing business summary — money in, money owed, new sales,
 * new leads, conversion, and what customers are asking about — with a fair
 * period-over-period comparison. Used by both the executive dashboard and the
 * scheduled email report. Deliberately framed in business outcomes.
 */
class ExecutiveReportService
{
    /** @param 'mtd'|'last_month'|'week' $period */
    public function summary(string $period = 'mtd'): array
    {
        [$start, $end, $pStart, $pEnd, $label] = $this->windows($period);

        return [
            'period'             => $period,
            'period_label'       => $label,
            'generated_at'       => now()->toIso8601String(),
            'revenue'            => $this->revenueByCurrency($start, $end, $pStart, $pEnd),
            'orders'             => $this->delta(
                Order::whereBetween('created_at', [$start, $end])->count(),
                Order::whereBetween('created_at', [$pStart, $pEnd])->count(),
            ),
            'outstanding'        => $this->outstanding(),  // snapshot — money owed right now
            'enquiries'          => $this->delta(
                Enquiry::whereBetween('created_at', [$start, $end])->count(),
                Enquiry::whereBetween('created_at', [$pStart, $pEnd])->count(),
            ),
            'enquiries_converted' => $this->delta(
                Enquiry::where('status', 'converted')->whereBetween('created_at', [$start, $end])->count(),
                Enquiry::where('status', 'converted')->whereBetween('created_at', [$pStart, $pEnd])->count(),
            ),
            'conversion_rate'    => $this->conversionRate(),
            'avg_response_hours' => $this->avgResponseHours(),
            'top_interest'       => $this->topInterest($start, $end),
            'prospects'          => $this->prospectPipeline(),
            // From the accounting ledger — recorded income/expenses/profit + cash on hand.
            'books'              => app(FinanceReportService::class)->ledgerTotals($start, $end),
        ];
    }

    /* ── windows ─────────────────────────────────────────────────────────── */

    /** @return array{0:Carbon,1:Carbon,2:Carbon,3:Carbon,4:string} [start,end,priorStart,priorEnd,label] */
    private function windows(string $period): array
    {
        $now = now();

        return match ($period) {
            // Full previous calendar month vs the month before it.
            'last_month' => [
                $s = $now->copy()->subMonthNoOverflow()->startOfMonth(),
                $now->copy()->subMonthNoOverflow()->endOfMonth(),
                $s->copy()->subMonthNoOverflow(),
                $s->copy()->subMonthNoOverflow()->endOfMonth(),
                $s->copy()->format('F Y'),
            ],
            // Last 7 days vs the 7 days before that.
            'week' => [
                $now->copy()->subDays(7),
                $now->copy(),
                $now->copy()->subDays(14),
                $now->copy()->subDays(7),
                'Last 7 days',
            ],
            // Month to date vs the same number of days into last month (default).
            default => [
                $mStart = $now->copy()->startOfMonth(),
                $now->copy(),
                $mStart->copy()->subMonthNoOverflow(),
                $mStart->copy()->subMonthNoOverflow()->addDays($mStart->diffInDays($now)),
                $now->copy()->format('F Y').' (so far)',
            ],
        };
    }

    /* ── metrics ─────────────────────────────────────────────────────────── */

    /**
     * Paid revenue per currency, each with its own delta. Amounts stay in their
     * native unit (UGX shillings / USD cents) — never summed across currencies.
     */
    private function revenueByCurrency(Carbon $start, Carbon $end, Carbon $pStart, Carbon $pEnd): array
    {
        $paid = fn (Carbon $a, Carbon $b) => Order::where('payment_status', 'paid')
            ->whereBetween('created_at', [$a, $b])
            ->selectRaw('currency, SUM(total) s')->groupBy('currency')->pluck('s', 'currency');

        $cur = $paid($start, $end);
        $prev = $paid($pStart, $pEnd);

        $out = [];
        foreach (['UGX', 'USD'] as $c) {
            $out[$c] = $this->delta((int) ($cur[$c] ?? 0), (int) ($prev[$c] ?? 0));
        }
        return $out;
    }

    /** Money owed to the business right now (placed but unpaid / part-paid). */
    private function outstanding(): array
    {
        $owed = Order::whereIn('payment_status', ['pending', 'partial'])
            ->selectRaw('currency, SUM(total) s')->groupBy('currency')->pluck('s', 'currency');

        return ['UGX' => (int) ($owed['UGX'] ?? 0), 'USD' => (int) ($owed['USD'] ?? 0)];
    }

    private function conversionRate(): float
    {
        $total = Enquiry::count();
        return $total > 0 ? round(Enquiry::where('status', 'converted')->count() / $total * 100, 1) : 0.0;
    }

    private function avgResponseHours(): ?float
    {
        $replied = Enquiry::whereNotNull('replied_at')->get(['created_at', 'replied_at']);
        return $replied->count() > 0
            ? round($replied->avg(fn ($e) => abs($e->created_at->diffInMinutes($e->replied_at))) / 60, 1)
            : null;
    }

    /** What customers are asking about in the window (enquiries by product). */
    private function topInterest(Carbon $start, Carbon $end): array
    {
        return Enquiry::whereBetween('created_at', [$start, $end])
            ->selectRaw("CASE WHEN product_category IS NULL OR product_category = '' THEN 'GENERAL' ELSE product_category END p, COUNT(*) c")
            ->groupBy('p')->orderByDesc('c')->get()
            ->map(fn ($r) => ['product' => $r->p, 'count' => (int) $r->c])
            ->all();
    }

    private function prospectPipeline(): array
    {
        $byStatus = Prospect::selectRaw('outreach_status, COUNT(*) c')->groupBy('outreach_status')->pluck('c', 'outreach_status');
        $total = Prospect::count();

        return [
            'total'     => $total,
            'reached'   => $total - (int) ($byStatus['not_contacted'] ?? 0) - (int) ($byStatus['bounced'] ?? 0),
            'converted' => (int) ($byStatus['converted'] ?? 0),
        ];
    }

    /** {current, previous, delta_pct} — delta_pct null when there's no prior baseline. */
    private function delta(int $current, int $previous): array
    {
        return [
            'current'   => $current,
            'previous'  => $previous,
            'delta_pct' => $previous > 0 ? (int) round(($current - $previous) / $previous * 100) : null,
        ];
    }
}
