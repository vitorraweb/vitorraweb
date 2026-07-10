<?php

namespace App\Mail;

use App\Models\Enquiry;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnquiryAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Enquiry $enquiry,
        public readonly User $assignee,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Enquiry assigned to you — '.$this->enquiry->name,
        );
    }

    public function content(): Content
    {
        $origin = rtrim((string) config('services.frontend.url'), '/');

        return new Content(
            view: 'emails.enquiry-assigned',
            with: [
                'firstName'    => trim(explode(' ', (string) $this->assignee->name)[0]) ?: $this->assignee->name,
                'enquiriesUrl' => $origin.'/admin/enquiries',
            ],
        );
    }
}
