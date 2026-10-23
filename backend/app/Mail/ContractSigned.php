<?php

namespace App\Mail;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** The signed copy, to the client (staff member who sent it copied). */
class ContractSigned extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Contract $contract,
        public readonly string $pdf,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Signed: contract '.$this->contract->number.' with Vitorra Holdings');
    }

    public function content(): Content
    {
        return new Content(text: 'emails.contract-signed', with: [
            'signedAt' => $this->contract->signed_at->copy()->setTimezone(config('contracts.timezone'))->format('j F Y, H:i'),
        ]);
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => $this->pdf, $this->contract->number.'-signed.pdf')->withMime('application/pdf')];
    }
}
