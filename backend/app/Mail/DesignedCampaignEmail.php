<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

/**
 * A campaign built in the designer, already rendered and personalised for one
 * recipient (see App\Services\Marketing\CampaignTracking).
 *
 * Like ProspectOutreach it is sent from the shared support address so replies
 * reach the whole team, and real sends copy support. It also carries the
 * List-Unsubscribe headers mail providers now expect from bulk senders.
 */
class DesignedCampaignEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $subjectLine,
        public readonly string $bodyHtml,
        public readonly string $bodyText,
        public readonly ?string $unsubscribeUrl = null,
        public readonly bool $isTest = false,
    ) {}

    public function envelope(): Envelope
    {
        $from = config('mail.campaign_from') ?: config('mail.team_address');
        $cc = config('mail.campaign_cc');

        return new Envelope(
            from: new Address($from, config('mail.from.name')),
            subject: ($this->isTest ? '[TEST] ' : '').$this->subjectLine,
            replyTo: [new Address($from, config('mail.from.name'))],
            cc: $cc && ! $this->isTest ? [new Address($cc, config('mail.from.name'))] : [],
        );
    }

    public function headers(): Headers
    {
        return new Headers(text: $this->unsubscribeUrl ? [
            'List-Unsubscribe'      => "<{$this->unsubscribeUrl}>",
            'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
        ] : []);
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->bodyHtml, text: 'emails.plain-text', with: ['text' => $this->bodyText]);
    }
}
