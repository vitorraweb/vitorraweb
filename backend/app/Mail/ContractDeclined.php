<?php

namespace App\Mail;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** Tells the staff member who sent it that the client declined to sign. */
class ContractDeclined extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Contract $contract) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Declined: contract '.$this->contract->number.' ('.$this->contract->buyer_name.')');
    }

    public function content(): Content
    {
        return new Content(text: 'emails.contract-declined');
    }
}
