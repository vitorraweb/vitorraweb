<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewOrder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Order $order) {}

    public function envelope(): Envelope
    {
        // Reply goes back to the customer (set on the mailable, not PendingMail).
        return new Envelope(
            subject: "[Order] {$this->order->reference} — {$this->order->customer_name}",
            replyTo: [new Address($this->order->customer_email, $this->order->customer_name)],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-team');
    }

    public function attachments(): array
    {
        return [];
    }
}
