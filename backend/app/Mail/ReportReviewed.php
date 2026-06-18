<?php

namespace App\Mail;

use App\Models\MonthlyReport;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReportReviewed extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly MonthlyReport $report,
    ) {
        $this->report->loadMissing('user:id,name', 'reviewer:id,name');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your '.$this->report->period.' report has been reviewed',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.report-reviewed');
    }
}
