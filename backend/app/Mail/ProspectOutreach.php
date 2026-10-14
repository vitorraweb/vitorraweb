<?php

namespace App\Mail;

use App\Models\ProspectCampaign;
use App\Support\EmailBody;
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
         * @var array<int, array{path: string, name: string, mime?: string, data?: string}>
         */
        public readonly array $files = [],
        /** Product line the campaign is for (FET / SEAL / COFFEE), labels the masthead. */
        public readonly ?string $product = null,
        /** A test send to our own team — marked as such and not copied to support. */
        public readonly bool $isTest = false,
        /**
         * The sender's own email signature (HTML, already sanitised by
         * SignatureHtml when they saved it), so the customer can see which of
         * the team wrote to them. Support is still the sender and is copied.
         */
        public readonly ?string $signature = null,
    ) {}

    public const PRODUCT_LABELS = [
        'FET'    => 'Fuel Eco Tech',
        'SEAL'   => 'SEAL Wound Spray',
        'COFFEE' => 'Vitorra Coffee',
    ];

    /** Build for a campaign recipient — personalises the body's {name} tokens. */
    public static function forCampaign(ProspectCampaign $campaign, string $prospectName): self
    {
        return new self(
            $prospectName,
            self::personalise($campaign->subject, $prospectName),
            self::personalise($campaign->body, $prospectName),
            $campaign->attachments ?? [],
            $campaign->product,
            signature: $campaign->creator?->email_signature,
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

        $cc = config('mail.campaign_cc');

        return new Envelope(
            from: new Address($from, config('mail.from.name')),
            subject: ($this->isTest ? '[TEST] ' : '').$this->subjectLine,
            replyTo: [new Address($from, config('mail.from.name'))],
            // Support is copied on every real send; a test stays with the tester.
            cc: $cc && ! $this->isTest ? [new Address($cc, config('mail.from.name'))] : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.prospect-outreach',
            text: 'emails.prospect-outreach-text',
            with: $this->viewData(),
        );
    }

    /** Everything the template needs — also used to preview the email in the composer. */
    public function viewData(): array
    {
        $site = rtrim((string) config('services.frontend.url', 'https://vitorra.org'), '/');
        if (! str_starts_with($site, 'https://')) {
            $site = 'https://vitorra.org'; // a localhost link is no use in a customer's inbox
        }
        $sector = $this->product && isset(self::PRODUCT_LABELS[$this->product]) ? $this->product : null;

        return [
            'bodyHtml'        => EmailBody::toHtml($this->body),
            'bodyText'        => trim($this->body),
            // Writers who open with their own "Dear …" or close with their own
            // "Kind regards" don't get a second one stacked on top.
            'ownGreeting'     => EmailBody::hasGreeting($this->body),
            'ownSignOff'      => EmailBody::hasSignOff($this->body),
            'signatureHtml'   => filled($this->signature) ? $this->signature : null,
            'signatureText'   => filled($this->signature)
                ? trim(preg_replace("/\n{3,}/", "\n\n", html_entity_decode(strip_tags(preg_replace('/<br\s*\/?>|<\/(p|div|tr)>/i', "\n", $this->signature)))))
                : null,
            'productLabel'    => self::PRODUCT_LABELS[$this->product] ?? 'Vitorra Holdings',
            'preheader'       => mb_strimwidth(preg_replace('/\s+/', ' ', strip_tags($this->body)), 0, 110, '…'),
            'attachmentNames' => array_map(fn ($f) => $f['name'], $this->files),
            'siteUrl'         => $site,
            'logoUrl'         => $site.'/logo.png',
            'ctaUrl'          => $site.'/enquire'.($sector ? "?sector={$sector}" : ''),
            'replyAddress'    => config('mail.campaign_from') ?: config('mail.team_address'),
        ];
    }

    /** The rendered HTML, for the composer's preview. */
    public function previewHtml(): string
    {
        return view('emails.prospect-outreach', [
            'prospectName' => $this->prospectName,
            'subjectLine'  => $this->subjectLine,
        ] + $this->viewData())->render();
    }

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        return collect($this->files)
            ->map(function (array $file) {
                // Campaign files live encrypted on the private disk; decrypt in
                // memory at send time so nothing is written back out in the clear.
                // A test send carries its files in memory (`data`) — nothing stored.
                $contents = $file['data'] ?? SecureFile::read($file['path']);
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
