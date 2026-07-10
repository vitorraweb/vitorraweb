<?php

namespace App\Notifications;

use App\Mail\PipelineContactAssignedMail;
use App\Models\CustomerNote;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Fires when a pipeline contact (the Customers/Pipeline board) is assigned
 * to a specific owner — mirrors App\Notifications\EnquiryAssigned exactly:
 * email + in-portal notification bar, not queued (production has no worker).
 */
class PipelineContactAssigned extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $contactName,
        private readonly string $contactEmail,
        private readonly ?string $stage,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(User $notifiable): PipelineContactAssignedMail
    {
        $stageLabel = $this->stage ? (CustomerNote::STAGE_LABELS[$this->stage] ?? $this->stage) : 'Unstaged';

        // See App\Notifications\EnquiryAssigned — a Mailable returned from
        // toMail() must be addressed explicitly; it isn't done automatically.
        return (new PipelineContactAssignedMail($this->contactName, $this->contactEmail, $stageLabel, $notifiable))
            ->to($notifiable->email);
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Pipeline contact assigned to you',
            'body'  => ($this->contactName ?: $this->contactEmail).' — '.($this->stage ? (CustomerNote::STAGE_LABELS[$this->stage] ?? $this->stage) : 'Unstaged'),
            'url'   => '/admin/pipeline',
        ];
    }
}
