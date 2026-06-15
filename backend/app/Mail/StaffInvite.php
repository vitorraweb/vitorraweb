<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffInvite extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $staff,
        public readonly string $password,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Vitorra admin account is ready',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.staff-invite');
    }
}
