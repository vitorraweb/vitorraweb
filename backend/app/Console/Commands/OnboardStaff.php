<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class OnboardStaff extends Command
{
    protected $signature = 'staff:onboard';

    protected $description = 'Create the core Vitorra staff accounts (idempotent — skips accounts that already exist).';

    /** @var array<int, array{name: string, email: string, department: string, job_title: string}> */
    private const STAFF = [
        ['name' => 'Solomon Okello',      'email' => 'solomon@vitorra.org',      'department' => 'leadership', 'job_title' => 'Chief Executive Officer'],
        ['name' => 'Victor Lojum',        'email' => 'victor@vitorra.org',       'department' => 'operations', 'job_title' => 'Head of Operations'],
        ['name' => 'Joseph Rwabu',        'email' => 'joseph.rwabu@vitorra.org', 'department' => 'finance',    'job_title' => 'Senior Finance Officer'],
        ['name' => 'Sarah Nuwamanya',     'email' => 'sarah@vitorra.org',        'department' => 'marketing',  'job_title' => 'Marketing Officer'],
        ['name' => 'Olivia Sandra Agata', 'email' => 'agataoli@vitorra.org',     'department' => 'marketing',  'job_title' => 'Brand Designer'],
        ['name' => 'Daniel Tuke',         'email' => 'daniel@vitorra.org',       'department' => 'finance',    'job_title' => 'Finance Officer'],
    ];

    public function handle(): int
    {
        $created = 0;
        $skipped = 0;

        foreach (self::STAFF as $staff) {
            if (User::where('email', $staff['email'])->exists()) {
                $this->line("Skipped {$staff['name']} ({$staff['email']}) — account already exists.");
                $skipped++;
                continue;
            }

            $password = Str::password(16);

            User::create([
                'name'         => $staff['name'],
                'email'        => $staff['email'],
                'password'     => $password, // hashed via model cast
                'role'         => 'ops',
                'department'   => $staff['department'],
                'job_title'    => $staff['job_title'],
                'staff_status' => 'active',
                'country'      => 'Uganda',
            ]);

            $this->info("Created {$staff['name']} ({$staff['email']}) — {$staff['job_title']}");
            $this->warn("  Temporary password: {$password}");
            $this->warn('  ↑ Record this now — it is not shown again. Ask them to change it via Staff > reset password after first login.');
            $created++;
        }

        $this->info("Onboarded {$created} new staff account(s), skipped {$skipped} already existing.");

        return self::SUCCESS;
    }
}
