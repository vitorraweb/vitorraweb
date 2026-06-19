<?php

namespace App\Console\Commands;

use App\Models\FinanceTransaction;
use App\Models\RecurringEntry;
use Illuminate\Console\Command;

class GenerateRecurringEntries extends Command
{
    protected $signature = 'finance:recurring';

    protected $description = 'Create this month\'s draft transactions from active recurring entries (rent, salaries, subscriptions).';

    public function handle(): int
    {
        $period = now()->format('Y-m');
        $today = now()->day;
        $created = 0;

        $due = RecurringEntry::where('is_active', true)
            ->where('day_of_month', '<=', $today)
            ->where(fn ($q) => $q->whereNull('last_run_period')->orWhere('last_run_period', '!=', $period))
            ->get();

        foreach ($due as $entry) {
            $vatAmount = $entry->vat_rate > 0 ? (int) round($entry->amount * $entry->vat_rate / (100 + $entry->vat_rate)) : 0;

            FinanceTransaction::create([
                'type'                => $entry->type,
                'finance_account_id'  => $entry->finance_account_id,
                'finance_category_id' => $entry->finance_category_id,
                'sector'              => $entry->sector,
                'currency'            => $entry->currency,
                'amount'              => $entry->amount,
                'vat_rate'            => $entry->vat_rate,
                'vat_amount'          => $vatAmount,
                'occurred_on'         => now()->toDateString(),
                'description'         => $entry->description ?: 'Recurring entry',
                'status'              => 'draft',
                'source'              => 'recurring',
                'source_id'           => $entry->id,
            ]);

            $entry->update(['last_run_period' => $period]);
            $created++;
        }

        $this->info("Generated {$created} recurring draft transaction(s) for {$period}.");

        return self::SUCCESS;
    }
}
