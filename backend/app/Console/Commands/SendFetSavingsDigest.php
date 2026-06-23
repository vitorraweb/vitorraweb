<?php

namespace App\Console\Commands;

use App\Mail\FetSavingsDigest;
use App\Models\FetInstallation;
use App\Services\FetSavingsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Emails each FET customer their measured fuel savings (across all their
 * vehicles) and nudges anyone whose readings are overdue to log a fill-up.
 * Rides the existing schedule:run cron — see routes/console.php.
 */
class SendFetSavingsDigest extends Command
{
    protected $signature = 'fet:digest {--reminder-days=45 : A vehicle with no reading newer than this gets a nudge}';

    protected $description = 'Email FET customers their measured savings and remind anyone overdue to log a fill-up.';

    public function handle(FetSavingsService $savings): int
    {
        $reminderDays = max(7, (int) $this->option('reminder-days'));
        $cutoff = now()->subDays($reminderDays)->startOfDay();

        // Group a customer's active installations together so a fleet gets one email.
        $groups = FetInstallation::where('status', 'active')
            ->whereNotNull('customer_email')
            ->with('fuelLogs')
            ->get()
            ->groupBy(fn (FetInstallation $i) => mb_strtolower(trim($i->customer_email)));

        $sent = 0;
        foreach ($groups as $installs) {
            $summaries = $installs->map(fn (FetInstallation $i) => $savings->summary($i));
            $fleet = $savings->fleetFromSummaries($summaries->values()->all());
            $hasData = $fleet['vehicles_with_data'] > 0;

            $vehicles = $installs->values()->map(function (FetInstallation $i) use ($savings, $cutoff) {
                $s = $savings->summary($i);
                $last = $i->fuelLogs->pluck('logged_on')->filter()->max();

                return [
                    'reference'     => $i->reference,
                    'label'         => $i->vehicle ?: config("fet.tiers.{$i->tier}.label", $i->tier),
                    'currency'      => $i->currency,
                    'reduction_pct' => $s['reduction_pct'],
                    'money_saved'   => $s['money_saved'],
                    'litres_saved'  => $s['litres_saved'],
                    'has_data'      => $s['has_enough_data'],
                    'stale'         => $last === null || $last->lt($cutoff),
                    'last_reading'  => optional($last)->toDateString(),
                ];
            })->all();

            $needsReminder = collect($vehicles)->contains(fn ($v) => $v['stale']);

            // Nothing worth saying — no measured savings and nothing overdue.
            if (! $hasData && ! $needsReminder) {
                continue;
            }

            Mail::to($installs->first()->customer_email)->send(new FetSavingsDigest(
                customerName: $installs->first()->customer_name,
                fleet: $fleet,
                vehicles: $vehicles,
                reminder: $needsReminder,
                hasData: $hasData,
            ));
            $sent++;
        }

        $this->info("Sent {$sent} FET savings digest(s).");

        return self::SUCCESS;
    }
}
