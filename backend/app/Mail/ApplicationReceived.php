<?php

namespace App\Mail;

use App\Models\JobApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly JobApplication $application,
    ) {}

    public function envelope(): Envelope
    {
        $role = $this->application->opening?->title ?? 'a general application';

        return new Envelope(
            subject: 'New job application: '.$role,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.application-received');
    }
}
