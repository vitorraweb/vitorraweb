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
        // For online reservations, link straight to the order's payment page.
        $payUrl = null;
        if ($this->online) {
            $origin = rtrim((string) config('services.pesapal.frontend_url'), '/');
            $payUrl = $origin.'/order/'.$this->order->reference;
        }

        return new Content(view: 'emails.reservation-confirmation', with: [
            'online' => $this->online,
            'payUrl' => $payUrl,
        ]);
    }

    public function attachments(): array
    {
        return [];
    }
}
