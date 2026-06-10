<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SetUserPassword extends Command
{
    protected $signature = 'vitorra:set-password
        {email : The account email to update}
        {--password= : The new password (omit to be prompted, or use --generate)}
        {--generate : Generate a strong random password and print it once}';

    protected $description = 'Rotate a staff/admin account password (use this to retire the seeded changeme123).';

    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error("No account found for {$email}.");

            return self::FAILURE;
        }

        $password = $this->option('password');

        if ($this->option('generate')) {
            $password = Str::password(20);
        } elseif (blank($password)) {
            $password = $this->secret('New password (input hidden)');
            $confirm = $this->secret('Confirm new password');
            if ($password !== $confirm) {
                $this->error('Passwords did not match.');

                return self::FAILURE;
            }
        }

        if (blank($password) || strlen($password) < 8) {
            $this->error('Password must be at least 8 characters.');

            return self::FAILURE;
        }

        $user->forceFill(['password' => Hash::make($password)])->save();

        $this->info("Password updated for {$email} ({$user->role}).");
        if ($this->option('generate')) {
            $this->warn("Generated password: {$password}");
            $this->warn('  ↑ Record this now — it is not shown again.');
        }

        return self::SUCCESS;
    }
}
