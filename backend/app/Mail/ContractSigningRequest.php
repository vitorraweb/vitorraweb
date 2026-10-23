<?php

namespace App\Mail;

use App\Models\Contract;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** The client's copy of the contract and their one-time signing link. */
class ContractSigningRequest extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Contract $contract,
        public readonly string $url,
        public readonly string $pdf,
        public readonly ?User $sender = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Please review and sign: contract '.$this->contract->number.' from Vitorra Holdings',
            replyTo: $this->sender?->email ? [new Address($this->sender->email, $this->sender->name)] : [],
        );
    }

    public function content(): Content
    {
        return new Content(text: 'emails.contract-signing-request', with: [
            'expires' => $this->contract->sign_expires_at->copy()->setTimezone(config('contracts.timezone'))->format('l j F Y, H:i'),
        ]);
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => $this->pdf, $this->contract->number.'.pdf')->withMime('application/pdf')];
    }
}
