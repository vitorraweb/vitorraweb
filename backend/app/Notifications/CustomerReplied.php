<?php

namespace App\Notifications;

use App\Mail\CustomerRepliedMail;
use App\Models\Communication;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

/**
 * Fires when a contact replies — from their account portal or (once Phase B
 * inbound-email capture is activated) from their own inbox — so the reply
 * lands with the right staff member both as an email and an in-portal
 * notification-bar entry. Not queued, matching every other mail in this app
 * (production has no queue worker, QUEUE_CONNECTION=sync).
 */
class CustomerReplied extends Notification
{
    use Queueable;

    public function __construct(private readonly Communication $communication) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(User $notifiable): CustomerRepliedMail
    {
        // A Mailable returned from toMail() is sent as-is — Laravel does NOT
        // auto-address it from routeNotificationFor(), so set the recipient here.
        return (new CustomerRepliedMail($this->communication, $notifiable))->to($notifiable->email);
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New reply from '.$this->communication->email,
            'body'  => Str::limit($this->communication->body, 120),
            'url'   => '/admin/customers?open='.urlencode($this->communication->email),
            'email' => $this->communication->email,
        ];
    }
}
