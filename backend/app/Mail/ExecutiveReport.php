<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExecutiveReport extends Mailable
{
    use Queueable, SerializesModels;

    /** @param array<string,mixed> $summary  Output of ExecutiveReportService::summary() */
    public function __construct(
        public readonly array $summary,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Vitorra business summary — '.$this->summary['period_label'],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.executive-report',
            with: ['s' => $this->summary, 'money' => fn (string $c, int $a) => $this->money($c, $a)],
        );
    }

    /** Format an amount in its native unit (UGX shillings / USD cents). */
    public function money(string $currency, int $amount): string
    {
        return $currency === 'USD'
            ? '$'.number_format($amount / 100, 2)
            : 'UGX '.number_format($amount);
    }
}
