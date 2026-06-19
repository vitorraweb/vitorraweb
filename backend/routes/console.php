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

// Personalised "what needs attention today" email for each staff member.
Schedule::command('digest:send')->dailyAt('07:00')
    ->onFailure(fn () => logger()->error('Scheduled digest:send failed'));

// Remind active staff ~3 days before each Uganda public holiday.
Schedule::command('holidays:notify --days=3')->dailyAt('08:00')
    ->onFailure(fn () => logger()->error('Scheduled holidays:notify failed'));

// Enforce the 6-month candidate-data retention policy for job applications.
Schedule::command('applications:purge')->dailyAt('02:30')
    ->onFailure(fn () => logger()->error('Scheduled applications:purge failed'));

// Chase overdue, unpaid customer invoices (at most once every 3 days each).
Schedule::command('invoices:remind')->dailyAt('09:00')
    ->onFailure(fn () => logger()->error('Scheduled invoices:remind failed'));

// Generate this month's recurring draft transactions (rent, salaries, subscriptions).
Schedule::command('finance:recurring')->dailyAt('06:00')
    ->onFailure(fn () => logger()->error('Scheduled finance:recurring failed'));

// CEO business summary — full previous month on the 1st, plus a weekly snapshot.
Schedule::command('executive:report --period=last_month')->monthlyOn(1, '07:30')
    ->onFailure(fn () => logger()->error('Scheduled monthly executive:report failed'));
Schedule::command('executive:report --period=week')->weeklyOn(1, '07:30')
    ->onFailure(fn () => logger()->error('Scheduled weekly executive:report failed'));
