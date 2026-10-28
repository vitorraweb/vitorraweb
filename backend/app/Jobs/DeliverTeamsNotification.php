<?php

namespace App\Jobs;

use App\Models\TeamsNotification;
use App\Services\Teams\TeamsNotifier;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Deliver one Teams outbox message. Retries are owned by the outbox
 * (`teams:deliver`, bounded by teams.max_attempts) rather than the queue, so
 * they behave the same on the sync driver (our cPanel host) as on a worker.
 */
class DeliverTeamsNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 30;

    public function __construct(public int $notificationId) {}

    public function handle(TeamsNotifier $notifier): void
    {
        $n = TeamsNotification::find($this->notificationId);
        if ($n && $n->status === 'pending') {
            $notifier->deliver($n);
        }
    }
}
