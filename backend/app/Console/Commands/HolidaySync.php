<?php

namespace App\Console\Commands;

use App\Models\PublicHoliday;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Pulls public holidays from Nager.Date (free, no API key) so the leave / HR
 * module's working-day maths stays correct each year without manual seeding.
 *
 * Idempotent and non-destructive: it only adds holidays it doesn't already have
 * (matched on name + date), so manually-added entries and company events are
 * never touched. Runs yearly via the scheduler; can be run by hand any time.
 *
 *   php artisan holidays:sync            # this year + next
 *   php artisan holidays:sync 2027
 */
class HolidaySync extends Command
{
    protected $signature = 'holidays:sync {year? : Year to sync (default: this year + next)} {--country=UG}';

    protected $description = 'Sync public holidays from Nager.Date (free, no key) into the holidays table';

    public function handle(): int
    {
        $country = strtoupper((string) $this->option('country'));
        $years = $this->argument('year') ? [(int) $this->argument('year')] : [now()->year, now()->year + 1];
        $totalNew = 0;

        foreach ($years as $year) {
            try {
                $res = Http::timeout(15)->get("https://date.nager.at/api/v3/PublicHolidays/{$year}/{$country}");
            } catch (\Throwable $e) {
                $this->error("Could not reach Nager.Date for {$year}: ".$e->getMessage());
                continue;
            }

            if (! $res->successful() || ! is_array($res->json())) {
                $this->warn("No holiday data for {$year} ({$country}).");
                continue;
            }

            $new = 0;
            foreach ($res->json() as $h) {
                if (empty($h['date']) || empty($h['name'])) {
                    continue;
                }
                // Match on the date part (the column stores midnight time too), so
                // re-runs and existing/manual entries are never duplicated.
                $exists = PublicHoliday::where('name', $h['name'])->whereDate('date', $h['date'])->exists();
                if ($exists) {
                    continue;
                }
                PublicHoliday::create([
                    'name'      => $h['name'],
                    'date'      => $h['date'],
                    'recurring' => (bool) ($h['fixed'] ?? false),
                    'source'    => 'Nager.Date',
                ]);
                $new++;
            }

            $this->info("{$year} ({$country}): {$new} new holiday(s) added.");
            $totalNew += $new;
        }

        $this->info("Done — {$totalNew} holiday(s) added in total.");

        return self::SUCCESS;
    }
}
