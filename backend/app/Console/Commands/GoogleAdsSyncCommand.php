<?php

namespace App\Console\Commands;

use App\Models\GoogleAdsAccount;
use App\Services\GoogleAds\GoogleAdsClient;
use App\Services\GoogleAds\GoogleAdsSync;
use Illuminate\Console\Command;

/**
 * Pull Google Ads numbers into the console and report won deals back.
 *
 *   php artisan google-ads:sync            # last 3 days (hourly schedule)
 *   php artisan google-ads:sync --days=30  # nightly: catch late conversions
 *   php artisan google-ads:sync --retry-failed  # re-send rejected conversions
 *
 * Silent no-op until Google Ads is connected, so the schedule can carry it
 * from day one.
 */
class GoogleAdsSyncCommand extends Command
{
    protected $signature = 'google-ads:sync {--days=3 : How many days back to refresh (Google restates recent days)} {--retry-failed : Clear earlier conversion-upload errors and try those again}';

    protected $description = 'Sync Google Ads spend, campaigns and search terms; upload won enquiries as conversions';

    public function handle(): int
    {
        $account = GoogleAdsAccount::current();
        if (! GoogleAdsClient::clientConfigured() || ! $account?->isReady()) {
            $this->line('Google Ads is not connected — nothing to sync. See php artisan google-ads:status.');

            return self::SUCCESS;
        }

        if ($this->option('retry-failed')) {
            $n = \App\Models\Enquiry::whereNotNull('ads_conversion_error')->update(['ads_conversion_error' => null]);
            $this->line("Cleared {$n} earlier upload error(s).");
        }

        $days = max(1, min(90, (int) $this->option('days')));

        try {
            $r = (new GoogleAdsSync($account))->run($days);
        } catch (\Throwable $e) {
            $this->error('Google Ads sync failed: '.$e->getMessage());
            report($e);

            return self::FAILURE;
        }

        $this->info(sprintf(
            'Synced %d day(s): %d campaign-day rows, %d search terms, %d click(s) matched to campaigns, %d conversion(s) uploaded%s.',
            $days, $r['campaign_days'], $r['search_terms'], $r['clicks_resolved'], $r['conversions_uploaded'],
            $r['conversion_errors'] ? ", {$r['conversion_errors']} rejected (see the enquiry)" : ''
        ));

        return self::SUCCESS;
    }
}
