<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Quick "is inbound-email capture live?" check from the command line — handy
 * right after wiring up the reply subdomain + Resend webhook over SSH
 * (mirrors `flutterwave:status`).
 *
 *   php artisan inbound-email:status
 */
class InboundEmailStatus extends Command
{
    protected $signature = 'inbound-email:status';

    protected $description = 'Show whether inbound-email capture (shared inbox, Phase B) is live';

    public function handle(): int
    {
        $enabled = (bool) config('mail.inbound_capture_enabled');
        $address = config('mail.inbound_address');
        $secret  = ! empty(config('services.resend.inbound_webhook_secret'));

        $yn = fn (bool $b) => $b ? '<info>yes</info>' : '<comment>no</comment>';

        $this->newLine();
        $this->line('  Capture enabled:     '.$yn($enabled).($enabled ? '' : '  → set MAIL_INBOUND_CAPTURE_ENABLED=true once the steps below are done'));
        $this->line('  Reply address:       '.$address);
        $this->line('  Webhook secret set:  '.$yn($secret).($secret ? '' : '  → generate one in the Resend dashboard and set RESEND_INBOUND_WEBHOOK_SECRET'));

        $live = $enabled && $secret;
        $this->newLine();
        if ($live) {
            $this->info('  ✓ Inbound-email capture is LIVE.');
        } else {
            $this->warn('  ⚠ Inbound-email capture is NOT live yet. Outstanding:');
            if (! $secret) {
                $this->line('    1. Add an MX record for the reply subdomain (e.g. reply.vitorra.org) pointed at Resend\'s inbound MX.');
                $this->line('    2. Verify that subdomain in the Resend dashboard.');
                $this->line('    3. Create an inbound webhook → https://api.vitorra.org/api/webhooks/email/inbound, copy its signing secret into RESEND_INBOUND_WEBHOOK_SECRET.');
            }
            if (! $enabled) {
                $this->line('    '.($secret ? '1' : '4').'. Set MAIL_INBOUND_CAPTURE_ENABLED=true and MAIL_INBOUND_ADDRESS to match the verified subdomain.');
            }
        }
        $this->newLine();

        return self::SUCCESS;
    }
}
