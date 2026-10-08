<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Console\Command;

/**
 * Give named staff one more admin module, keeping everything they already
 * have. Someone on their department's default list is first copied to an
 * explicit list (so nobody loses access), then the module is added.
 *
 *   php artisan staff:grant-module quotations thurayya@vitorra.org sarah@vitorra.org
 *   php artisan staff:grant-module quotations someone@vitorra.org --revoke
 */
class GrantModule extends Command
{
    protected $signature = 'staff:grant-module
        {module : Module key from config/admin_modules.php}
        {emails* : One or more staff account emails}
        {--revoke : Remove the module instead}';

    protected $description = 'Grant (or revoke) one admin module for named staff, keeping their other access.';

    public function handle(): int
    {
        $module = (string) $this->argument('module');
        if (! array_key_exists($module, config('admin_modules.modules', []))) {
            $this->error("Unknown module: {$module}");

            return self::FAILURE;
        }

        $failed = false;
        foreach ((array) $this->argument('emails') as $email) {
            $user = User::where('email', $email)->first();
            if (! $user) {
                $this->error("No account for {$email}");
                $failed = true;

                continue;
            }
            if ($user->isAdmin()) {
                $this->line("{$email}: admin — already has every module.");

                continue;
            }

            $current = is_array($user->permissions)
                ? $user->permissions
                : (config('admin_modules.departments.'.$user->department) ?? []);
            $next = $this->option('revoke')
                ? array_values(array_diff($current, [$module]))
                : array_values(array_unique([...$current, $module]));

            $user->update(['permissions' => $next]);
            Audit::log(
                $this->option('revoke') ? 'staff.module_revoked' : 'staff.module_granted',
                ($this->option('revoke') ? 'Removed ' : 'Granted ').$module.' for '.$user->name.' (console)',
                $user,
                ['module' => $module],
            );
            $this->info(($this->option('revoke') ? 'Revoked ' : 'Granted ')."{$module} → {$user->name} <{$email}>");
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
