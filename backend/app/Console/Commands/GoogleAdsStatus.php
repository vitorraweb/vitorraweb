<?php

namespace App\Console\Commands;

use App\Models\GoogleAdsAccount;
use App\Services\GoogleAds\GoogleAdsClient;
use Illuminate\Console\Command;

/**
 * "Is Google Ads reporting live?" — what is connected and what is still
 * outstanding, in order (mirrors `flutterwave:status`, `inbound-email:status`).
 *
 *   php artisan google-ads:status
 */
class GoogleAdsStatus extends Command
{
    protected $signature = 'google-ads:status';

    protected $description = 'Show whether Google Ads reporting is connected and syncing';

    public function handle(): int
    {
        $client = GoogleAdsClient::clientConfigured();
        $account = GoogleAdsAccount::current();
        $yn = fn (bool $b) => $b ? '<info>yes</info>' : '<comment>no</comment>';

        $this->newLine();
        $this->line('  OAuth client set:     '.$yn($client));
        $this->line('  Redirect URI:         '.config('services.google_ads.redirect_uri'));
        $this->line('  Google login:         '.($account?->connected_email ?? '<comment>not connected</comment>'));
        $this->line('  Ad account:           '.($account?->customer_id ? "{$account->descriptive_name} ({$account->customer_id})" : '<comment>not chosen</comment>'));
        $this->line('  Won-deal uploads:     '.($account?->conversion_action_id ? "on → {$account->conversion_action_name}" : '<comment>off (no conversion action chosen)</comment>'));
        $this->line('  Last sync:            '.($account?->last_synced_at?->diffForHumans() ?? '—'));
        if ($account?->last_error) {
            $this->line('  Last error:           <error>'.$account->last_error.'</error> ('.$account->last_error_at?->diffForHumans().')');
        }

        $this->newLine();
        if ($client && $account?->isReady()) {
            $this->info('  ✓ Google Ads reporting is connected.');
        } else {
            $this->warn('  ⚠ Not live yet. Outstanding:');
            $step = 1;
            if (! $client) {
                $this->line("    {$step}. Google Cloud Console: enable the Google Ads API, apply for Explorer access, create an OAuth client (Web application)");
                $this->line('       with the redirect URI above, then set GOOGLE_ADS_CLIENT_ID + GOOGLE_ADS_CLIENT_SECRET and run config:cache.');
                $step++;
            }
            if (! $account) {
                $this->line("    {$step}. An admin opens /admin/google-ads → Connect Google Ads, signing in with a Google login that can see the ad account.");
                $step++;
            }
            if (! $account?->customer_id) {
                $this->line("    {$step}. Choose the ad account on that screen.");
            }
        }
        $this->newLine();

        return self::SUCCESS;
    }
}
