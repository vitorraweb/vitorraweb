<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** The FET Buyer's Pack, emailed to a visitor who asked for it on the website. */
class FetBuyersPack extends Mailable
{
    use Queueable, SerializesModels;

    /** @param list<array{label: string, fits: string, price_ugx: int}> $prices from the product catalogue; empty hides the table */
    public function __construct(public readonly string $name, public readonly array $prices = []) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your FET Buyer's Pack — prices, device guide and datasheet");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.fet-buyers-pack');
    }
}
