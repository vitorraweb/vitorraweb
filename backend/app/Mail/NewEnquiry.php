<?php

namespace App\Mail;

use App\Models\Enquiry;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewEnquiry extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Enquiry $enquiry) {}

    public function envelope(): Envelope
    {
        $subject = $this->enquiry->product_category
            ? "[Enquiry] {$this->enquiry->product_category} — {$this->enquiry->name}"
            : "[Enquiry] General — {$this->enquiry->name}";

        return new Envelope(
            subject: $subject,
            replyTo: [new Address($this->enquiry->email, $this->enquiry->name)],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.enquiry');
    }

    public function attachments(): array
    {
        return [];
    }
}
