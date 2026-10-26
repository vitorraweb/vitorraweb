<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A quotation or invoice shared with colleagues before (or alongside) the
 * customer — says in the subject and the first line whether the customer has
 * received it, so a review copy is never mistaken for the real send.
 */
class DocumentForReview extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Quotation|Invoice $document,
        public readonly string $pdf,
        public readonly ?User $sender,
        public readonly ?string $note,
        public readonly bool $customerSent,
    ) {}

    public function envelope(): Envelope
    {
        $label = $this->label();

        return new Envelope(
            subject: ($this->customerSent ? 'Copy: ' : 'For review: ')."{$label} {$this->document->number} — {$this->document->customer_name}",
            replyTo: $this->sender ? [$this->sender->email] : [],
        );
    }

    public function content(): Content
    {
        $isQuote = $this->document instanceof Quotation;
        $origin  = rtrim((string) config('services.flutterwave.frontend_url'), '/');

        return new Content(text: 'emails.document-review', with: [
            'label' => $this->label(),
            'link'  => $origin.($isQuote ? '/admin/quotations/' : '/admin/invoices/').$this->document->id,
        ]);
    }

    public function attachments(): array
    {
        return [Attachment::fromData(fn () => $this->pdf, $this->document->number.'.pdf')->withMime('application/pdf')];
    }

    private function label(): string
    {
        return $this->document instanceof Quotation ? $this->document->headingLabel() : 'Invoice';
    }
}
