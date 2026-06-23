<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReservationConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Order $order,
        public readonly bool $online = false,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Vitorra reservation {$this->order->reference}",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.reservation-confirmation', with: ['online' => $this->online]);
    }

    public function attachments(): array
    {
        return [];
    }
}
