<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\CustomerController;
use App\Mail\DailyDigest;
use App\Models\Task;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendDailyDigest extends Command
{
    protected $signature = 'digest:send';

    protected $description = 'Email each staff member a summary of overdue tasks, tasks due today, and pipeline contacts going cold.';

    public function handle(): int
    {
        $sent = 0;

        foreach (User::whereIn('role', ['admin', 'ops'])->get() as $user) {
            $overdue = Task::with('assignee')
                ->where('assigned_to', $user->id)
                ->whereNotNull('due_date')
                ->where('due_date', '<', now()->startOfDay())
                ->where('status', '!=', 'done')
                ->get();

            $dueToday = Task::where('assigned_to', $user->id)
                ->whereDate('due_date', now())
                ->where('status', '!=', 'done')
                ->get();

            $stale = app(CustomerController::class)->staleContacts($user->id, 10)['items'];

            if ($overdue->isEmpty() && $dueToday->isEmpty() && empty($stale)) {
                continue;
            }

            Mail::to($user->email)->send(new DailyDigest($user, $overdue, $dueToday, $stale));
            $sent++;
        }

        $this->info("Sent {$sent} digest(s).");

        return self::SUCCESS;
    }
}
