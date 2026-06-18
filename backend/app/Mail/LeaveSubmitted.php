<?php

namespace App\Mail;

use App\Models\LeaveRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeaveSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly LeaveRequest $leave,
        public readonly string $recipientName,
    ) {
        $this->leave->loadMissing('user:id,name,department');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Leave request from '.$this->leave->user->name,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.leave-submitted');
    }
}
