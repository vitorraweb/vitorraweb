<?php

namespace App\Mail;

use App\Models\LeaveRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeaveDecided extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly LeaveRequest $leave,
    ) {
        $this->leave->loadMissing('reviewer:id,name');
    }

    public function envelope(): Envelope
    {
        $verb = $this->leave->status === 'approved' ? 'approved' : 'declined';

        return new Envelope(
            subject: 'Your leave request was '.$verb,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.leave-decided');
    }
}
