<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Symfony\Component\Mime\Email;

class NewsletterBroadcast extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $subjectLine,
        public readonly string $bodyMarkdown,
        public readonly string $unsubscribeToken,
        public readonly string $unsubscribeUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
            // List-Unsubscribe is required by Gmail for bulk senders and
            // dramatically improves inbox placement even for small lists.
            using: [
                function (Email $message) {
                    $message->getHeaders()
                        ->addTextHeader('List-Unsubscribe', '<' . $this->unsubscribeUrl . '>')
                        ->addTextHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click')
                        ->addTextHeader('Precedence', 'bulk');
                },
            ],
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.newsletter-broadcast');
    }
}
