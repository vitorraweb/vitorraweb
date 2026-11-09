<?php

namespace App\Mail;

use App\Models\Announcement;
use App\Support\EmailBody;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** A People → Announcements notice, emailed to a member of staff. */
class StaffAnnouncement extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Announcement $announcement,
        public readonly string $recipientName,
        public readonly string $portalUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->announcement->title);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.staff-announcement',
            text: 'emails.staff-announcement-text',
            with: [
                'firstName' => trim(explode(' ', $this->recipientName)[0]) ?: $this->recipientName,
                'bodyHtml'  => EmailBody::toHtml($this->announcement->body),
                'author'    => $this->announcement->creator?->name,
            ],
        );
    }
}
