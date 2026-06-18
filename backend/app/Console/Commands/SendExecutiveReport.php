<?php

namespace App\Console\Commands;

use App\Mail\ExecutiveReport;
use App\Models\Setting;
use App\Services\ExecutiveReportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendExecutiveReport extends Command
{
    protected $signature = 'executive:report {--period=last_month : mtd | last_month | week}';

    protected $description = 'Email the CEO business summary to the configured executive recipients.';

    public function handle(ExecutiveReportService $service): int
    {
        $period = in_array($this->option('period'), ['mtd', 'last_month', 'week'], true)
            ? $this->option('period')
            : 'last_month';

        $to = Setting::get('exec_report_to') ?: Setting::get('notify_email');
        if (! $to) {
            $this->warn('No executive recipient configured (exec_report_to / notify_email). Skipping.');
            return self::SUCCESS;
        }

        $cc = collect(explode(',', (string) Setting::get('exec_report_cc')))
            ->map(fn ($e) => trim($e))->filter()->values()->all();

        $summary = $service->summary($period);

        $mail = Mail::to($to);
        if ($cc) {
            $mail->cc($cc);
        }
        $mail->send(new ExecutiveReport($summary));

        $this->info("Sent the {$period} executive report to {$to}".($cc ? ' (cc '.implode(', ', $cc).')' : '').'.');

        return self::SUCCESS;
    }
}
