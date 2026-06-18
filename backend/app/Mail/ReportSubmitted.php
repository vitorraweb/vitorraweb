<?php

namespace App\Mail;

use App\Models\MonthlyReport;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReportSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly MonthlyReport $report,
        public readonly string $recipientName,
    ) {
        $this->report->loadMissing('user:id,name');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->report->user->name.' submitted their '.$this->report->period.' report',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.report-submitted');
    }
}
