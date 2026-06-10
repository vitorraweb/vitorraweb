<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Automated database + media backups (spatie/laravel-backup) ─────────────
// Requires the host scheduler to call `php artisan schedule:run` every minute
// (one cPanel cron line — see the ops runbook). Times are server local time.
Schedule::command('backup:clean')->daily()->at('01:00')
    ->onFailure(fn () => logger()->error('Scheduled backup:clean failed'));

Schedule::command('backup:run')->daily()->at('01:30')
    ->onFailure(fn () => logger()->error('Scheduled backup:run failed'));

// Emails the team if the most recent backup is missing or too old/large.
Schedule::command('backup:monitor')->daily()->at('02:00');
