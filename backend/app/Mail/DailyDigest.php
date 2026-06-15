<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class DailyDigest extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly Collection $overdueTasks,
        public readonly Collection $dueTodayTasks,
        public readonly array $staleContacts,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Vitorra daily summary');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.daily-digest');
    }
}
