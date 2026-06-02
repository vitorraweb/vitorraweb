<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewContactMessage extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly ContactMessage $message) {}

    public function envelope(): Envelope
    {
        $subject = $this->message->subject
            ? "[Contact] {$this->message->subject}"
            : "[Contact] Message from {$this->message->name}";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.contact');
    }

    public function attachments(): array
    {
        return [];
    }
}
