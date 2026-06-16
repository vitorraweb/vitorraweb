<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeSubscriber extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $unsubscribeUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'You\'re subscribed — Vitorra Holdings');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.welcome-subscriber');
    }
}
