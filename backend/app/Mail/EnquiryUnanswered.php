<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

/**
 * "These enquiries have had no reply." Sent to the team that owns them, and —
 * once past the escalation threshold — to whoever is listed in
 * config('enquiries.sla.escalate_to').
 *
 * One email per inbox listing every overdue enquiry, rather than one email per
 * enquiry: a person who ignores five separate nags will also ignore the fifth,
 * whereas a single list of five is a to-do.
 */
class EnquiryUnanswered extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  Collection  $enquiries  The unanswered enquiries for this inbox.
     * @param  string  $stage  'chase' or 'escalate'.
     * @param  int  $hours  The threshold that was crossed.
     */
    public function __construct(
        public readonly Collection $enquiries,
        public readonly string $stage,
        public readonly int $hours,
    ) {}

    public function envelope(): Envelope
    {
        $n     = $this->enquiries->count();
        $noun  = $n === 1 ? 'enquiry has' : 'enquiries have';
        $label = $this->stage === 'escalate' ? 'Escalation' : 'Action needed';

        return new Envelope(
            subject: "[{$label}] {$n} {$noun} had no reply in {$this->hours}+ hours",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.enquiry-unanswered',
            with: [
                'adminUrl' => rtrim(
                    config('app.frontend_url', env('FRONTEND_URL', 'https://vitorra.org')),
                    '/'
                ) . '/admin/enquiries',
            ],
        );
    }
}
