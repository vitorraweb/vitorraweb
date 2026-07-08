<?php

namespace App\Console\Commands;

use App\Services\Payments\FlutterwaveGateway;
use Illuminate\Console\Command;

/**
 * Quick "are online payments live?" check from the command line — handy right
 * after activating Flutterwave over SSH (mirrors the admin Payments health page).
 *
 *   php artisan flutterwave:status
 */
class FlutterwaveStatus extends Command
{
    protected $signature = 'flutterwave:status';

    protected $description = 'Show whether online payments (Flutterwave) are live';

    public function handle(): int
    {
        $driver = config('payments.driver');
        $cfg    = config('services.flutterwave');
        $keys   = ! empty($cfg['secret_key']) && ! empty($cfg['public_key']);
        $hash   = ! empty($cfg['secret_hash']);
        $env    = str_starts_with((string) ($cfg['secret_key'] ?? ''), 'FLWSECK_TEST') ? 'sandbox' : 'live';

        $yn = fn (bool $b) => $b ? '<info>yes</info>' : '<comment>no</comment>';

        $this->newLine();
        $this->line('  Payment driver:      '.$driver.($driver === 'flutterwave' ? '  (online ON)' : '  (offline / manual)'));
        $this->line('  Environment:         '.$env.' (from key prefix)');
        $this->line('  API keys set:        '.$yn($keys));
        $this->line('  Webhook secret set:  '.$yn($hash).($hash ? '' : '  → generate one in the Flutterwave dashboard (Settings → Webhooks) and set FLUTTERWAVE_SECRET_HASH'));

        if ($keys) {
            $this->line('  Testing connection to Flutterwave…');
            $r = (new FlutterwaveGateway($cfg))->verifyConnection();
            $this->line('  Connection:          '.($r['ok'] ? '<info>OK</info>' : '<comment>FAILED</comment> — '.$r['message']));
        }

        $live = $driver === 'flutterwave' && $keys && $hash;
        $this->newLine();
        if ($live) {
            $this->info('  ✓ Online payments are LIVE.');
        } else {
            $this->warn('  ⚠ Online payments are NOT fully live yet (see above).');
        }
        $this->newLine();

        return self::SUCCESS;
    }
}
