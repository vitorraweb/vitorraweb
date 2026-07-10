<?php

namespace App\Notifications;

use App\Mail\EnquiryAssignedMail;
use App\Models\Enquiry;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Fires when an enquiry is assigned to a specific staff member (as opposed to
 * just a team) — both an email and an in-portal notification-bar entry, so
 * it's hard to miss either way. Not queued: production has no queue worker
 * (QUEUE_CONNECTION=sync), so this runs inline like every other mail here.
 */
class EnquiryAssigned extends Notification
{
    use Queueable;

    public function __construct(private readonly Enquiry $enquiry) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(User $notifiable): EnquiryAssignedMail
    {
        // A Mailable returned from toMail() is sent as-is — unlike MailMessage,
        // Laravel does NOT auto-address it from routeNotificationFor(), so the
        // recipient must be set explicitly here.
        return (new EnquiryAssignedMail($this->enquiry, $notifiable))->to($notifiable->email);
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title'       => 'Enquiry assigned to you',
            'body'        => $this->enquiry->name.' — '.($this->enquiry->product_category ?: 'General enquiry'),
            'url'         => '/admin/enquiries',
            'enquiry_id'  => $this->enquiry->id,
        ];
    }
}
