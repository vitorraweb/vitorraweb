<?php

namespace App\Mail;

use App\Models\User;
use App\Support\SecureFile;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffReply extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int, string>  $ccList
     * @param  array<int, array{name:string,path:string,mime:string}>  $fileAttachments
     */
    public function __construct(
        public readonly string $toName,
        public readonly string $subjectLine,
        public readonly string $body,
        public readonly User $sender,
        public readonly array $ccList = [],
        public readonly array $fileAttachments = [],
    ) {}

    public function envelope(): Envelope
    {
        // Once inbound-email capture is activated, replies route back into the
        // system instead of the staff member's personal mailbox — see
        // MAIL_INBOUND_CAPTURE_ENABLED. Off by default: nothing changes here
        // until that's switched on.
        $replyTo = config('mail.inbound_capture_enabled')
            ? new Address(config('mail.inbound_address'), $this->sender->name)
            : new Address($this->sender->email, $this->sender->name);

        return new Envelope(
            subject: $this->subjectLine,
            replyTo: [$replyTo],
            cc: array_map(fn (string $email) => new Address($email), $this->ccList),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.staff-reply',
            with: ['signature' => $this->sender->email_signature],
        );
    }

    public function attachments(): array
    {
        $attachments = [];

        foreach ($this->fileAttachments as $attachment) {
            $data = SecureFile::read($attachment['path']);
            if ($data === null) {
                continue;
            }
            // Files are encrypted at rest — must attachData() the decrypted
            // bytes, never attach() the raw stored path.
            $attachments[] = Attachment::fromData(fn () => $data, $attachment['name'])
                ->withMime($attachment['mime'] ?? 'application/octet-stream');
        }

        return $attachments;
    }
}
