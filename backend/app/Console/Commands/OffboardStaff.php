<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Close a staff account when someone leaves.
 *
 * Deliberately NOT a delete. A user row is the anchor for that person's leave
 * history, monthly reports, HR documents and every audit-trail entry naming
 * them; several of those relations cascade, so deleting the row would erase
 * employment records the company has to keep. This shuts the account instead:
 * access is gone, the record remains.
 */
class OffboardStaff extends Command
{
    protected $signature = 'staff:offboard
        {email : The account email of the person leaving}
        {--force : Skip the confirmation prompt}';

    protected $description = 'Close a departing staff member\'s account — revokes access and marks them as left, keeping their HR and audit records intact.';

    public function handle(): int
    {
        $email = (string) $this->argument('email');

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error("No account found for {$email}.");

            return self::FAILURE;
        }

        // Never lock the company out of its own admin panel.
        if ($user->role === 'admin' && User::where('role', 'admin')->where('staff_status', '!=', 'left')->count() <= 1) {
            $this->error("{$email} is the only active admin — make someone else an admin first (php artisan staff:set-role).");

            return self::FAILURE;
        }

        if ($user->staff_status === 'left') {
            $this->warn("{$user->name} is already marked as left. Re-running to make sure access is fully revoked.");
        }

        $reports = User::where('supervisor_id', $user->id)->get();

        $this->line('');
        $this->line("  Account : {$user->name} <{$user->email}>");
        $this->line('  Role    : '.$user->role.' · '.($user->job_title ?? 'no job title'));
        $this->line('  Reports : '.($reports->isEmpty() ? 'none' : $reports->pluck('name')->implode(', ')));
        $this->line('');
        $this->line('  Will revoke: sign-in, all active sessions/tokens, two-factor, module permissions.');
        $this->line('  Will keep  : leave history, monthly reports, HR documents, audit trail, finance records.');
        $this->line('');

        if (! $this->option('force') && ! $this->confirm("Close this account?", false)) {
            $this->line('Cancelled — nothing changed.');

            return self::SUCCESS;
        }

        // Sign them out everywhere and make the old password useless. The
        // password is randomised rather than blanked so the column stays a
        // valid hash and nothing downstream has to special-case an empty one.
        $user->tokens()->delete();

        $user->forceFill([
            'password'                  => Str::password(32),
            'staff_status'              => 'left',
            'permissions'               => [],
            'two_factor_secret'         => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at'   => null,
        ])->save();

        // Their reports would otherwise point at a closed account.
        if ($reports->isNotEmpty()) {
            User::where('supervisor_id', $user->id)->update(['supervisor_id' => null]);
            $this->warn('  Detached '.$reports->count().' report(s) — reassign a supervisor in /admin/staff: '.$reports->pluck('name')->implode(', '));
        }

        Audit::log(
            'staff.offboard',
            "Closed the account for {$user->name} ({$user->email}) — access revoked, records retained",
            $user,
        );

        $this->info("Closed {$user->name}'s account. They can no longer sign in; their records are intact.");
        $this->line('  Remember to remove any shared-mailbox or Microsoft 365 access separately — that lives outside this system.');

        return self::SUCCESS;
    }
}
