<?php

namespace App\Console\Commands;

use App\Models\JobApplication;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ApplicationsPurge extends Command
{
    protected $signature = 'applications:purge {--months=6 : Retain applications for this many months}';

    protected $description = 'Delete job applications + CVs past the candidate-data retention window, and orphaned pending uploads.';

    public function handle(): int
    {
        $cutoff = now()->subMonths(max(1, (int) $this->option('months')));

        // 1) Expired applications + their CV files.
        $expired = JobApplication::where('created_at', '<', $cutoff)->get();
        foreach ($expired as $app) {
            if ($app->cv_path) {
                Storage::disk('local')->deleteDirectory('applications/'.$app->id);
            }
            $app->delete();
        }
        $this->info("Purged {$expired->count()} application(s) older than {$cutoff->toDateString()}.");

        // 2) Orphaned pending uploads (someone uploaded a CV but never submitted) > 1 day old.
        $orphans = 0;
        foreach (Storage::disk('local')->files('applications/pending') as $file) {
            if (Carbon::createFromTimestamp(Storage::disk('local')->lastModified($file))->lt(now()->subDay())) {
                Storage::disk('local')->delete($file);
                $orphans++;
            }
        }
        $this->info("Removed {$orphans} stale pending upload(s).");

        return self::SUCCESS;
    }
}
