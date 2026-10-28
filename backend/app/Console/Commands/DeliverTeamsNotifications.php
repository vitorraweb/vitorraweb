<?php

namespace App\Console\Commands;

use App\Services\Teams\TeamsNotifier;
use Illuminate\Console\Command;

/** Retry Teams messages that failed or were never delivered (every minute; bounded). */
class DeliverTeamsNotifications extends Command
{
    protected $signature = 'teams:deliver';

    protected $description = 'Deliver due Teams channel notifications (bounded retries)';

    public function handle(TeamsNotifier $notifier): int
    {
        $n = $notifier->deliverDue();
        if ($n) {
            $this->info("Delivered {$n} Teams notification(s).");
        }

        return self::SUCCESS;
    }
}
