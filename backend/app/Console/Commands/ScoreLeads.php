<?php

namespace App\Console\Commands;

use App\Services\Marketing\LeadScorer;
use Illuminate\Console\Command;

/** Re-score every prospect with the decision engine (hourly). */
class ScoreLeads extends Command
{
    protected $signature = 'leads:score';

    protected $description = 'Re-score every prospect: who to focus on and who to leave alone';

    public function handle(): int
    {
        $changed = LeadScorer::forAll()->scoreAndStore();
        $this->info("Leads scored. {$changed} changed priority.");

        return self::SUCCESS;
    }
}
