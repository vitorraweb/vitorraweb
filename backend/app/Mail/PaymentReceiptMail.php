<?php

namespace App\Mail;

use App\Models\PaymentReceipt;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A payment receipt — to the customer, or (team = true) a copy for a
 * colleague that says plainly whether the customer has received it.
 */
class PaymentReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly PaymentReceipt $receipt,
        public readonly string $pdf,
        public readonly bool $team = false,
        public readonly ?User $sender = null,
        public readonly ?string $note = null,
        public readonly bool $customerSent = false,
    ) {}

    public function envelope(): Envelope
    {
        $r = $this->receipt;
        $subject = $this->team
            ? ($this->customerSent ? 'Copy: ' : 'For review: ')."receipt {$r->number} — {$r->document()->customer_name}"
            : "Receipt {$r->number} for ".mb_strtolower($r->documentLabel())." {$r->document()->number} — Vitorra Holdings";

        return new Envelope(subject: $subject, replyTo: $this->sender ? [$this->sender->email] : []);
    }

    public function content(): Content
    {
        $origin = rtrim((string) config('services.flutterwave.frontend_url'), '/');

        return new Content(text: 'emails.payment-receipt', with: [
            'r'    => $this->receipt,
            'doc'   => $this->receipt->document(),
            'label' => $this->receipt->documentLabel(),
            'link'  => $origin.($this->receipt->isForOrder() ? '/admin/quotations/'.$this->receipt->quotation_id : '/admin/invoices/'.$this->receipt->invoice_id),
        ]);
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => $this->pdf, $this->receipt->number.'.pdf')->withMime('application/pdf')];
    }
}
