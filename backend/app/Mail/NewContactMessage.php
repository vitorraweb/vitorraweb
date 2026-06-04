<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewContactMessage extends Mailable
{
    use Queueable, SerializesModels;

    // NB: the property is NOT named $message — that name is reserved by the
    // mail view for the Symfony Message instance and would shadow this model.
    public function __construct(public readonly ContactMessage $contact) {}

    public function envelope(): Envelope
    {
        $subject = $this->contact->subject
            ? "[Contact] {$this->contact->subject}"
            : "[Contact] Message from {$this->contact->name}";

        return new Envelope(
            subject: $subject,
            replyTo: [new Address($this->contact->email, $this->contact->name)],
        );
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
