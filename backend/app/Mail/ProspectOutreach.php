<?php

namespace App\Mail;

use App\Models\ProspectCampaign;
use App\Support\SecureFile;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * One outreach email in a prospect campaign.
 *
 * Sent *from the shared support address*, not the staff member who wrote it, so
 * the company owns the conversation: replies land in the shared inbox where any
 * of the marketing team can pick them up, and a prospect answering six months
 * later still reaches someone even if that staff member has moved on.
 */
class ProspectOutreach extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $prospectName,
        public readonly string $subjectLine,
        public readonly string $body,
        /**
         * Campaign files to attach. Named $files, not $attachments — the parent
         * Mailable already owns a mutable $attachments property.
         *
         * @var array<int, array{path: string, name: string, mime?: string}>
         */
        public readonly array $files = [],
    ) {}

    /** Build for a campaign recipient — personalises the body's {name} tokens. */
    public static function forCampaign(ProspectCampaign $campaign, string $prospectName): self
    {
        return new self(
            $prospectName,
            self::personalise($campaign->subject, $prospectName),
            self::personalise($campaign->body, $prospectName),
            $campaign->attachments ?? [],
        );
    }

    /** Swap the tokens staff can type in the composer. */
    public static function personalise(string $text, string $prospectName): string
    {
        return str_replace(['{name}', '{company}'], $prospectName, $text);
    }

    public function envelope(): Envelope
    {
        $from = config('mail.campaign_from') ?: config('mail.team_address');

        return new Envelope(
            from: new Address($from, config('mail.from.name')),
            subject: $this->subjectLine,
            replyTo: [new Address($from, config('mail.from.name'))],
        );
    }

    public function content(): Content
    {
        // The body is plain text typed into a textarea. If the writer supplied
        // their own opening line, don't stack a second greeting on top of it.
        $ownGreeting = (bool) preg_match('/^\s*(hi|hello|dear|good\s+(morning|afternoon|day))\b/i', $this->body);

        return new Content(
            view: 'emails.prospect-outreach',
            with: ['ownGreeting' => $ownGreeting],
        );
    }

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        return collect($this->files)
            ->map(function (array $file) {
                // Campaign files live encrypted on the private disk; decrypt in
                // memory at send time so nothing is written back out in the clear.
                $contents = SecureFile::read($file['path']);
                if ($contents === null) {
                    return null;
                }

                return Attachment::fromData(fn () => $contents, $file['name'])
                    ->withMime($file['mime'] ?? 'application/octet-stream');
            })
            ->filter()
            ->values()
            ->all();
    }
}
