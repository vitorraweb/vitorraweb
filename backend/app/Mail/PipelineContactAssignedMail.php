<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PipelineContactAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $contactName,
        public readonly string $contactEmail,
        public readonly string $stageLabel,
        public readonly User $assignee,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pipeline contact assigned to you — '.$this->contactName,
        );
    }

    public function content(): Content
    {
        $origin = rtrim((string) config('services.frontend.url'), '/');

        return new Content(
            view: 'emails.pipeline-contact-assigned',
            with: [
                'firstName'    => trim(explode(' ', (string) $this->assignee->name)[0]) ?: $this->assignee->name,
                'pipelineUrl'  => $origin.'/admin/pipeline',
            ],
        );
    }
}
