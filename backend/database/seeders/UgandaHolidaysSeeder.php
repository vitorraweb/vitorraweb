<?php

namespace Database\Seeders;

use App\Models\PublicHoliday;
use Illuminate\Database\Seeder;

/**
 * Uganda public holidays. Fixed-date holidays are marked `recurring` (they
 * repeat every year on the same month/day). Movable holidays (Good Friday,
 * Easter Monday) and the lunar Islamic Eids are seeded per year — the 2026
 * Eid dates are best estimates and should be confirmed/adjusted each year.
 */
class UgandaHolidaysSeeder extends Seeder
{
    public function run(): void
    {
        $recurring = [
            ['New Year\'s Day',                   '2026-01-01'],
            ['NRM Liberation Day',                '2026-01-26'],
            ['Archbishop Janani Luwum Day',       '2026-02-16'],
            ['International Women\'s Day',         '2026-03-08'],
            ['Labour Day',                        '2026-05-01'],
            ['Uganda Martyrs\' Day',              '2026-06-03'],
            ['National Heroes\' Day',             '2026-06-09'],
            ['Independence Day',                  '2026-10-09'],
            ['Christmas Day',                     '2026-12-25'],
            ['Boxing Day',                        '2026-12-26'],
        ];

        // Movable / lunar — 2026 only (re-seed or set manually each year).
        $movable2026 = [
            ['Eid al-Fitr (estimated)',           '2026-03-20'],
            ['Good Friday',                       '2026-04-03'],
            ['Easter Monday',                     '2026-04-06'],
            ['Eid al-Adha (estimated)',           '2026-05-27'],
        ];

        foreach ($recurring as [$name, $date]) {
            PublicHoliday::firstOrCreate(['name' => $name, 'date' => $date], ['recurring' => true, 'source' => 'Uganda statutory']);
        }
        foreach ($movable2026 as [$name, $date]) {
            PublicHoliday::firstOrCreate(['name' => $name, 'date' => $date], ['recurring' => false, 'source' => 'Uganda statutory (movable)']);
        }
    }
}
