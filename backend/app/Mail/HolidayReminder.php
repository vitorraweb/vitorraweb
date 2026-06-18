<?php

namespace App\Mail;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class HolidayReminder extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $recipientName,
        public readonly string $holidayName,
        public readonly Carbon $date,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Upcoming public holiday: '.$this->holidayName,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.holiday-reminder');
    }
}
