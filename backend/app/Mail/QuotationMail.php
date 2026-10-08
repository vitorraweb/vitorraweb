<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuotationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Quotation $quotation,
        public readonly string $pdf,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Quotation '.$this->quotation->number.' from Vitorra Holdings');
    }

    public function content(): Content
    {
        return new Content(text: 'emails.quotation');
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => $this->pdf, $this->quotation->number.'.pdf')->withMime('application/pdf')];
    }
}
