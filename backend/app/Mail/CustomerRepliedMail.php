<?php

namespace App\Mail;

use App\Models\Communication;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class CustomerRepliedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Communication $communication,
        public readonly User $recipient,
    ) {}

    public function envelope(): Envelope
    {
        $name = $this->communication->email;

        return new Envelope(
            subject: 'New reply from '.$name,
        );
    }

    public function content(): Content
    {
        $origin = rtrim((string) config('services.frontend.url'), '/');

        return new Content(
            view: 'emails.customer-replied',
            with: [
                'firstName'      => trim(explode(' ', (string) $this->recipient->name)[0]) ?: $this->recipient->name,
                'contactEmail'   => $this->communication->email,
                'channel'        => $this->communication->channel,
                // A portal reply's body may now be rich HTML (see
                // SignatureHtml) — this notification snippet is plain text,
                // so strip tags rather than truncate mid-markup.
                'excerpt'        => Str::limit(trim(strip_tags($this->communication->body)), 280),
                'customersUrl'   => $origin.'/admin/customers?open='.urlencode($this->communication->email),
            ],
        );
    }
}
