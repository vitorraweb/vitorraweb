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
            subject: 'Welcome to Vitorra — your account is ready',
        );
    }

    public function content(): Content
    {
        // Employees use the staff self-service portal; admin/ops use the admin panel.
        $isEmployee = $this->staff->role === 'employee';

        return new Content(
            view: 'emails.staff-invite',
            with: [
                'firstName'   => trim(explode(' ', (string) $this->staff->name)[0]) ?: $this->staff->name,
                'roleLabel'   => $this->staff->job_title ?: ucfirst((string) $this->staff->role),
                'loginUrl'    => $isEmployee ? 'https://vitorra.org/staff/login' : 'https://vitorra.org/admin/login',
                'portalLabel' => $isEmployee ? 'staff portal' : 'admin dashboard',
            ],
        );
    }
}
