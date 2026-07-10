<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Console\Command;

/**
 * Emergency override for someone locked out of their authenticator (lost
 * device, broken app, no recovery codes to hand) — there's no self-service
 * path for this, since 2FA blocks login before a token is issued, so the
 * normal /auth/2fa/disable endpoint is unreachable for them.
 *
 *   php artisan staff:disable-2fa <email>
 */
class DisableUserTwoFactor extends Command
{
    protected $signature = 'staff:disable-2fa {email : The account email to unlock}';

    protected $description = "Turn off a staff member's two-factor authentication so they can sign in with just their password";

    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error("No account found for {$email}.");

            return self::FAILURE;
        }

        if (! $user->hasTwoFactorEnabled()) {
            $this->info("Two-factor is already off for {$email} — no change.");

            return self::SUCCESS;
        }

        $user->forceFill([
            'two_factor_secret'         => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at'   => null,
        ])->save();

        Audit::log('user.2fa_disabled', $user->name.'\'s two-factor was turned off by an admin (locked out of authenticator)', $user);

        $this->info("Two-factor is now off for {$email}. They can sign in with just their password.");
        $this->line('They can turn it back on any time once their authenticator app is working again — under Profile & security.');

        return self::SUCCESS;
    }
}
