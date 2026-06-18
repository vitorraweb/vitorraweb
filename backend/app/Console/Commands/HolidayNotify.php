<?php

namespace App\Console\Commands;

use App\Mail\HolidayReminder;
use App\Models\PublicHoliday;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class HolidayNotify extends Command
{
    protected $signature = 'holidays:notify {--days=3 : Days ahead of the holiday to notify}';

    protected $description = 'Email active staff ahead of an upcoming Uganda public holiday.';

    public function handle(): int
    {
        $days   = max(0, (int) $this->option('days'));
        $target = now()->startOfDay()->addDays($days);

        // Match exact-date holidays and recurring ones (by month/day).
        $holidays = PublicHoliday::get()->filter(function (PublicHoliday $h) use ($target) {
            return $h->recurring
                ? $h->date->format('m-d') === $target->format('m-d')
                : $h->date->format('Y-m-d') === $target->format('Y-m-d');
        });

        if ($holidays->isEmpty()) {
            $this->info('No public holiday in '.$days.' day(s); nothing to send.');
            return self::SUCCESS;
        }

        $staff = User::whereIn('role', ['admin', 'ops', 'employee'])
            ->where('staff_status', 'active')
            ->get(['name', 'email']);

        $sent = 0;
        foreach ($holidays as $holiday) {
            $date = $holiday->recurring ? $target->copy() : $holiday->date;
            foreach ($staff as $member) {
                Mail::to($member->email)->send(new HolidayReminder($member->name, $holiday->name, $date));
                $sent++;
            }
            $this->info("Notified {$staff->count()} staff about \"{$holiday->name}\".");
        }

        $this->info("Sent {$sent} reminder(s).");
        return self::SUCCESS;
    }
}
