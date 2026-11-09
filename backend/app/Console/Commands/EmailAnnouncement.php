<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\PeopleController;
use App\Models\Announcement;
use App\Support\Audit;
use Illuminate\Console\Command;

/**
 * Email an existing People → Announcements notice to staff.
 *
 *   announcements:email 12 --to=john@vitorra.org   test to one address first
 *   announcements:email 12                         everyone it is meant for
 *
 * Lists the recipients and asks before a full send.
 */
class EmailAnnouncement extends Command
{
    protected $signature = 'announcements:email {id : The announcement id} {--to=* : Send only to these addresses (a test)} {--force : Skip the confirmation}';

    protected $description = 'Email a staff announcement to everyone it is addressed to (or to --to for a test)';

    public function handle(): int
    {
        $a = Announcement::find($this->argument('id'));
        if (! $a) {
            $this->error('No announcement with that id.');

            return self::FAILURE;
        }

        $only = $this->option('to') ?: null;
        if (! $only) {
            $people = PeopleController::activeStaff()->when($a->department, fn ($q) => $q->where('department', $a->department))
                ->whereNotNull('email')->orderBy('name')->get(['name', 'email']);
            $this->info("\"{$a->title}\" will go to {$people->count()} staff:");
            $this->table(['Name', 'Email'], $people->map(fn ($p) => [$p->name, $p->email])->all());
            if (! $this->option('force') && ! $this->confirm('Send it now?')) {
                return self::SUCCESS;
            }
        }

        $sent = PeopleController::emailAnnouncement($a, $only);
        if (! $only) {
            Audit::log('announcement.emailed', "Emailed \"{$a->title}\" to {$sent} staff", $a);
        }
        $this->info("Sent {$sent}.");

        return self::SUCCESS;
    }
}
