<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * "Your pipeline contacts are going cold" — the notification-bar half of what
 * digest:send already emails daily (see SendDailyDigest + DailyDigest mail).
 * Database-only on purpose: the email for this already exists and fires in
 * the same run, so a second "mail" channel here would double-send the same
 * information. This just gives it a home in the bar too, so it's not only
 * visible in an inbox that might not get opened until tomorrow.
 *
 * @param array<int, array{email:string,name:string,stage:string,days_idle:int}> $items
 */
class PipelineContactsGoingCold extends Notification
{
    use Queueable;

    public function __construct(private readonly array $items) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $count = count($this->items);
        $names = collect($this->items)->pluck('name')->filter()->take(3)->implode(', ');

        return [
            'title' => $count === 1 ? '1 pipeline contact is going cold' : "{$count} pipeline contacts are going cold",
            'body'  => $names !== '' ? $names.($count > 3 ? ', …' : '') : 'Check your pipeline for contacts needing follow-up.',
            'url'   => '/admin/pipeline',
        ];
    }
}
