<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Invoice $invoice,
        public readonly string $pdf,
        public readonly bool $reminder = false,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: ($this->reminder ? 'Reminder: invoice ' : 'Invoice ').$this->invoice->number.' from Vitorra Holdings',
        );
    }

    public function content(): Content
    {
        // Offer a pay-online link only when a live gateway is configured and the
        // invoice can actually be paid online (UGX/USD, still owing).
        $payUrl = null;
        if (config('payments.driver') === 'flutterwave' && $this->invoice->isOnlinePayable()) {
            $origin = rtrim((string) config('services.flutterwave.frontend_url'), '/');
            $payUrl = $origin.'/invoice/'.$this->invoice->ensurePublicToken();
        }

        return new Content(view: 'emails.invoice', with: [
            'reminder' => $this->reminder,
            'payUrl'   => $payUrl,
        ]);
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => $this->pdf, $this->invoice->number.'.pdf')->withMime('application/pdf')];
    }
}
