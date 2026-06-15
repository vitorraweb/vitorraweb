<?php

namespace App\Console\Commands;

use App\Mail\StaffInvite;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InviteStaff extends Command
{
    protected $signature = 'staff:invite {emails*}';

    protected $description = 'Reset the password for existing staff accounts and email each a fresh login via the configured mail driver.';

    public function handle(): int
    {
        $sent = 0;
        $missing = 0;

        foreach ($this->argument('emails') as $email) {
            $user = User::where('email', $email)->first();

            if (! $user) {
                $this->error("No account found for {$email} — skipping.");
                $missing++;
                continue;
            }

            $password = Str::password(16);
            $user->password = $password; // hashed via model cast
            $user->save();

            Mail::to($user->email)->send(new StaffInvite($user, $password));

            $this->info("Sent invite to {$user->name} ({$user->email}).");
            $sent++;
        }

        $this->info("Done — {$sent} invite(s) sent, {$missing} email(s) not found.");

        return self::SUCCESS;
    }
}
