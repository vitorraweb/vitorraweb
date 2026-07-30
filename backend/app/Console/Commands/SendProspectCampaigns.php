<?php

namespace App\Console\Commands;

use App\Models\ProspectCampaign;
use App\Services\CampaignSender;
use Illuminate\Console\Command;

class SendProspectCampaigns extends Command
{
    protected $signature = 'campaigns:send
        {--campaign= : Only drain this campaign id}
        {--limit= : Override how many emails go out this run}';

    protected $description = 'Send the next batch of any in-progress prospect outreach campaign.';

    public function handle(CampaignSender $sender): int
    {
        $query = ProspectCampaign::sending()->orderBy('id');

        if ($id = $this->option('campaign')) {
            $query->whereKey($id);
        }

        $campaigns = $query->get();

        if ($campaigns->isEmpty()) {
            $this->info('No campaigns waiting to send.');
            return self::SUCCESS;
        }

        foreach ($campaigns as $campaign) {
            $result = $sender->drain($campaign, $this->option('limit') ? (int) $this->option('limit') : null);

            if ($result['locked']) {
                $this->line("Campaign #{$campaign->id} is already sending elsewhere — skipped.");
                continue;
            }

            $this->info(
                "Campaign #{$campaign->id} ({$campaign->subject}): "
                ."sent {$result['sent']}, failed {$result['failed']}, {$result['remaining']} to go."
            );
        }

        return self::SUCCESS;
    }
}
