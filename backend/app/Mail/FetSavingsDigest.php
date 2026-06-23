<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A customer's periodic Fuel Eco Tech savings summary — their measured fuel
 * reduction across one or more vehicles, with a nudge to keep logging fill-ups
 * when readings are overdue.
 */
class FetSavingsDigest extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>        $fleet     fleet rollup (see FetSavingsService::fleetFromSummaries)
     * @param  array<int, array<string, mixed>>  $vehicles  per-vehicle lines
     */
    public function __construct(
        public readonly string $customerName,
        public readonly array $fleet,
        public readonly array $vehicles,
        public readonly bool $reminder,
        public readonly bool $hasData,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->hasData
                ? 'Your Vitorra fuel savings'
                : 'Keep your Vitorra fuel savings up to date',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.fet-savings-digest');
    }
}
