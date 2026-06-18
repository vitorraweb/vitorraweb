<?php

namespace App\Mail;

use App\Models\Supplier;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SupplierOnboarded extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Supplier $supplier,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New supplier to review: '.$this->supplier->company_name,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.supplier-onboarded');
    }
}
