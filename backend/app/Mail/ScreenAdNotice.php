<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Every message in a street-screen booking: plain, short and in one template. */
class ScreenAdNotice extends Mailable
{
    /** @param string[] $lines */
    public function __construct(public string $heading, public array $lines, public ?string $link = null, public ?string $linkLabel = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->heading);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.screen-ad-notice');
    }
}
