<?php

namespace App\Console\Commands;

use App\Services\Payments\PesapalGateway;
use Illuminate\Console\Command;

/**
 * Registers our payment webhook (IPN) URL with Pesapal — a one-time step per
 * environment. Pesapal returns an `ipn_id` that every payment request must carry;
 * we store it in Settings so the live gateway picks it up automatically.
 *
 *   php artisan pesapal:register-ipn
 *   php artisan pesapal:register-ipn --url=https://api.vitorra.org/api/payments/webhook/pesapal
 */
class PesapalRegisterIpn extends Command
{
    protected $signature = 'pesapal:register-ipn {--url= : Override the IPN URL (defaults to APP_URL + /api/payments/webhook/pesapal)}';

    protected $description = 'Register the Pesapal IPN (payment webhook) URL and store the returned ipn_id';

    public function handle(): int
    {
        $config = config('services.pesapal');

        if (empty($config['consumer_key']) || empty($config['consumer_secret'])) {
            $this->error('Pesapal credentials are not set. Add PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET to .env first.');

            return self::FAILURE;
        }

        $url = $this->option('url')
            ?: rtrim((string) config('app.url'), '/') . '/api/payments/webhook/pesapal';

        $this->info("Registering IPN URL with Pesapal ({$config['env']}):");
        $this->line("  {$url}");

        $result = (new PesapalGateway($config))->registerIpn($url);

        if (! $result) {
            $this->error('Registration failed — check the logs for the Pesapal response (credentials / environment).');

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('✓ IPN registered and saved to Settings.');
        $this->line("  ipn_id: {$result['ipn_id']}");
        $this->newLine();
        $this->line('The live gateway will use this automatically. No further config needed.');

        return self::SUCCESS;
    }
}
