<?php

namespace App\Console\Commands;

use App\Services\Marketing\LeadScorer;
use App\Services\Marketing\MarketBuilder;
use Illuminate\Console\Command;

/**
 * Sort every contact into markets (one per product × industry) and bring
 * website enquirers into the CRM, then rank everyone. Safe to re-run.
 *
 *   php artisan markets:build
 */
class BuildMarkets extends Command
{
    protected $signature = 'markets:build';

    protected $description = 'Build product × industry markets from the prospect lists and website enquiries, then rank every lead';

    public function handle(MarketBuilder $builder): int
    {
        $r = $builder->build();
        $changed = LeadScorer::forAll()->scoreAndStore();

        $this->info("Website enquirers: {$r['website_added']} added to the CRM, {$r['website_updated']} moved forward.");
        $this->info("Markets: {$r['markets_created']} created, {$r['contacts_placed']} contacts placed.");
        $this->info("Leads ranked ({$changed} changed priority).");

        return self::SUCCESS;
    }
}
