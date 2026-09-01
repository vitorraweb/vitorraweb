<?php

namespace App\Console\Commands;

use App\Mail\EnquiryUnanswered;
use App\Models\Enquiry;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;

/**
 * Chases enquiries nobody has answered, then escalates the ones still sitting
 * there. Runs hourly; see the schedule in routes/console.php.
 *
 * The rule it enforces is deliberately narrow: an enquiry counts as unanswered
 * only while its status is still "new" AND replied_at is null. Moving it to
 * "in_progress" sets replied_at and clears it from this list, so the way to
 * stop the emails is to action the enquiry — which is the point.
 */
class ChaseUnansweredEnquiries extends Command
{
    protected $signature = 'enquiries:chase
                            {--force : Send outside the configured working-hours window}
                            {--dry-run : List what would be sent, send nothing}';

    protected $description = 'Email the owning team about enquiries with no reply, and escalate the worst.';

    public function handle(): int
    {
        $sla     = config('enquiries.sla');
        $dryRun  = (bool) $this->option('dry-run');

        if (! $this->option('force') && ! $this->inWindow($sla)) {
            $this->info('Outside the sending window — nothing sent.');

            return self::SUCCESS;
        }

        // Escalations are resolved first so that an enquiry old enough for both
        // stages is escalated rather than merely chased. Marking it handles
        // both timestamps, so it cannot then also appear in the chase list.
        $escalated = $this->runStage('escalate', (int) $sla['escalate_hours'], $sla, $dryRun);
        $chased    = $this->runStage('chase', (int) $sla['chase_hours'], $sla, $dryRun);

        $this->info(($dryRun ? '[dry run] ' : '')."Chased {$chased}, escalated {$escalated}.");

        return self::SUCCESS;
    }

    /** @return int Number of enquiries covered at this stage. */
    private function runStage(string $stage, int $hours, array $sla, bool $dryRun): int
    {
        $column = $stage === 'escalate' ? 'sla_escalated_at' : 'sla_notified_at';

        $due = Enquiry::where('status', 'new')
            ->whereNull('replied_at')
            ->whereNull($column)
            ->where('created_at', '<', now()->subHours($hours))
            ->orderBy('created_at')
            ->get();

        if ($due->isEmpty()) {
            return 0;
        }

        // One email per destination inbox, so a team is not sent other teams'
        // enquiries and nobody receives five separate nags.
        foreach ($due->groupBy(fn (Enquiry $e) => $this->inboxFor($e)) as $inbox => $group) {
            /** @var Collection $group */
            $this->line(sprintf(
                '%s → %s: %d enquiry(ies)',
                str_pad(strtoupper($stage), 8),
                $inbox,
                $group->count()
            ));

            if ($dryRun) {
                continue;
            }

            $mail = Mail::to($inbox);

            // Escalation adds the people who need to know the team did not act.
            if ($stage === 'escalate' && ! empty($sla['escalate_to'])) {
                $mail->cc($sla['escalate_to']);
            }

            $mail->send(new EnquiryUnanswered($group, $stage, $hours));
        }

        if (! $dryRun) {
            $stamp = [$column => now()];

            // An escalation implies the chase stage is spent, whether or not it
            // ever fired — otherwise an enquiry that sat unnoticed over a long
            // weekend would be escalated and then chased an hour later.
            if ($stage === 'escalate') {
                $stamp['sla_notified_at'] = now();
            }

            Enquiry::whereIn('id', $due->pluck('id'))->update($stamp);
        }

        return $due->count();
    }

    /** The team inbox that owns this enquiry, mirroring EnquiryController. */
    private function inboxFor(Enquiry $enquiry): string
    {
        $route = config('enquiries.routing')[$enquiry->product_category ?? ''] ?? null;

        return ($route['email'] ?? null) ?: config('mail.team_address');
    }

    /** Weekday, and inside the configured local-time window. */
    private function inWindow(array $sla): bool
    {
        $now = now();

        return in_array((int) $now->isoWeekday(), $sla['weekdays'], true)
            && $now->hour >= (int) $sla['window_start']
            && $now->hour < (int) $sla['window_end'];
    }
}
