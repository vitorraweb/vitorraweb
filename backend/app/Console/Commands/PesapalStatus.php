<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Services\Payments\PesapalGateway;
use Illuminate\Console\Command;

/**
 * Quick "are online payments live?" check from the command line — handy right
 * after activating Pesapal over SSH (mirrors the admin Payments health page).
 *
 *   php artisan pesapal:status
 */
class PesapalStatus extends Command
{
    protected $signature = 'pesapal:status';

    protected $description = 'Show whether online payments (Pesapal) are live';

    public function handle(): int
    {
        $driver = config('payments.driver');
        $cfg    = config('services.pesapal');
        $keys   = ! empty($cfg['consumer_key']) && ! empty($cfg['consumer_secret']);
        $ipn    = ! empty(Setting::get('pesapal_ipn_id') ?: ($cfg['ipn_id'] ?? null));

        $yn = fn (bool $b) => $b ? '<info>yes</info>' : '<comment>no</comment>';

        $this->newLine();
        $this->line('  Payment driver:   '.$driver.($driver === 'pesapal' ? '  (online ON)' : '  (offline / manual)'));
        $this->line('  Environment:      '.($cfg['env'] ?? 'sandbox'));
        $this->line('  API keys set:     '.$yn($keys));
        $this->line('  IPN registered:   '.$yn($ipn).($ipn ? '' : '  → run php artisan pesapal:register-ipn'));

        if ($keys) {
            $this->line('  Testing connection to Pesapal…');
            $r = (new PesapalGateway($cfg))->verifyConnection();
            $this->line('  Connection:       '.($r['ok'] ? '<info>OK</info>' : '<comment>FAILED</comment> — '.$r['message']));
        }

        $live = $driver === 'pesapal' && $keys && $ipn;
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
