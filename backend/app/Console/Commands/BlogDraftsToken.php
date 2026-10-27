<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Issues the key scripts/push_blog_draft.py uses to put Claude-written drafts
 * straight into the blog. The key belongs to a system account that cannot log
 * in (staff_status = left keeps it out of sign-in and staff lists) and carries
 * only the "blog-drafts" ability: create/refresh drafts, nothing else.
 */
class BlogDraftsToken extends Command
{
    public const ABILITY = 'blog-drafts';

    public const ACCOUNT = 'blog-drafts@vitorra.org';

    protected $signature = 'blog:drafts-token {--revoke : Remove the key without issuing a new one}';

    protected $description = 'Issue (or revoke) the key that lets Claude-written drafts be uploaded to the blog.';

    public function handle(): int
    {
        $user = User::firstOrNew(['email' => self::ACCOUNT]);
        if (! $user->exists) {
            $user->forceFill([
                'name'         => 'Claude (blog drafts)',
                'password'     => Str::random(64),
                'role'         => 'employee',
                'staff_status' => 'left',
                'job_title'    => 'System account — uploads blog drafts only',
            ])->save();
        }

        // One live key at a time.
        $user->tokens()->delete();

        if ($this->option('revoke')) {
            $this->info('Blog drafts key revoked.');
            return self::SUCCESS;
        }

        $token = $user->createToken('blog-drafts', [self::ABILITY])->plainTextToken;

        $this->info('New blog drafts key (shown once — any older key has stopped working):');
        $this->line('');
        $this->line($token);
        $this->line('');
        $this->line('It can only create drafts. Revoke it any time with: php artisan blog:drafts-token --revoke');

        return self::SUCCESS;
    }
}
