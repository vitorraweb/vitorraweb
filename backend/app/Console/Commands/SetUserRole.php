<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class SetUserRole extends Command
{
    protected $signature = 'staff:set-role
        {email : The account email to update}
        {role : New role — admin | ops | employee}';

    protected $description = "Change a staff account's role (login/password unchanged). Refuses to remove the last admin.";

    private const ROLES = ['admin', 'ops', 'employee'];

    public function handle(): int
    {
        $email = $this->argument('email');
        $role  = strtolower((string) $this->argument('role'));

        if (! in_array($role, self::ROLES, true)) {
            $this->error('Role must be one of: '.implode(', ', self::ROLES).'.');

            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error("No account found for {$email}.");

            return self::FAILURE;
        }

        // Never leave the system without an admin.
        if ($user->role === 'admin' && $role !== 'admin' && User::where('role', 'admin')->count() <= 1) {
            $this->error("{$email} is the only admin — promote someone else to admin first.");

            return self::FAILURE;
        }

        $was = $user->role;
        if ($was === $role) {
            $this->info("{$email} is already {$role} — no change.");

            return self::SUCCESS;
        }

        $user->forceFill(['role' => $role])->save();

        $this->info("Role for {$email} changed: {$was} → {$role}. Login is unchanged; they should sign out and back in.");

        return self::SUCCESS;
    }
}
