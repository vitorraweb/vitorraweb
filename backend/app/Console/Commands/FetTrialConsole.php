<?php

namespace App\Console\Commands;

use App\Models\FetTrial;
use App\Models\FetTrialFlag;
use App\Services\FetTrialAnalysisService;
use App\Services\FetTrialValidator;
use App\Support\Audit;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Inspect and settle a trial from the command line.
 *
 * The admin screens are the normal way to do this. This exists for when they
 * are not available — a browser problem, a deploy mid-flight, or simply
 * needing to see exactly what the system holds without a UI in the way. It
 * makes the same decisions through the same services, so the audit trail and
 * the recalculation are identical.
 */
class FetTrialConsole extends Command
{
    protected $signature = 'fet:trial
        {reference? : Trial reference or id (omit to list them all)}
        {--settle= : Finding id to settle}
        {--as=accepted : accepted | corrected | excluded}
        {--note= : Why — recorded against the trial and shown on the report}
        {--exclude= : Trip id to leave out of the calculation}
        {--include= : Trip id to put back in}
        {--reason= : Why the trip is being left out}';

    protected $description = 'Show a FET trial, settle its findings, or leave a trip out';

    public function handle(FetTrialValidator $validator, FetTrialAnalysisService $analysis): int
    {
        $reference = $this->argument('reference');

        if (! $reference) {
            $this->table(['id', 'reference', 'client', 'status', 'trips'],
                FetTrial::withCount('trips')->get()
                    ->map(fn ($t) => [$t->id, $t->reference, $t->client_company, $t->status, $t->trips_count])
            );

            return self::SUCCESS;
        }

        $trial = FetTrial::where('reference', $reference)->orWhere('id', $reference)->first();

        if (! $trial) {
            $this->error("No trial matching \"{$reference}\". Run without arguments to list them.");

            return self::FAILURE;
        }

        if ($id = $this->option('settle')) {
            if (! $this->settle($trial, (int) $id)) {
                return self::FAILURE;
            }
        }

        if ($id = $this->option('exclude')) {
            if (! $this->setTripStatus($trial, (int) $id, 'excluded')) {
                return self::FAILURE;
            }
        }

        if ($id = $this->option('include')) {
            if (! $this->setTripStatus($trial, (int) $id, 'valid')) {
                return self::FAILURE;
            }
        }

        $validator->validate($trial->fresh());
        $this->report($trial->fresh(), $analysis);

        return self::SUCCESS;
    }

    private function settle(FetTrial $trial, int $flagId): bool
    {
        $flag = $trial->flags()->find($flagId);
        $note = $this->option('note');
        $as = $this->option('as');

        if (! $flag) {
            $this->error("This trial has no finding with id {$flagId}.");

            return false;
        }
        if (! in_array($as, FetTrialFlag::RESOLUTIONS, true)) {
            $this->error('--as must be one of: '.implode(', ', FetTrialFlag::RESOLUTIONS));

            return false;
        }
        // The note is not optional anywhere else, and it is not optional here.
        if (! $note) {
            $this->error('--note is required: it goes on the record and on the client report.');

            return false;
        }

        $flag->update([
            'resolution' => $as,
            'resolution_note' => $note,
            'resolved_at' => now(),
        ]);

        if ($as === 'excluded' && $flag->fet_trial_trip_id) {
            $flag->trip?->update(['status' => 'excluded', 'exclusion_reason' => $note]);
        }

        Audit::log('fet_trial.flag_resolved', "{$trial->reference}: {$flag->code} — {$as} (console): {$note}", $trial);
        $this->info("Settled: {$flag->code} — {$as}.");

        return true;
    }

    private function setTripStatus(FetTrial $trial, int $tripId, string $status): bool
    {
        $trip = $trial->trips()->find($tripId);
        $reason = $this->option('reason');

        if (! $trip) {
            $this->error("This trial has no trip with id {$tripId}.");

            return false;
        }
        if ($status === 'excluded' && ! $reason) {
            $this->error('--reason is required when leaving a trip out.');

            return false;
        }

        $trip->update([
            'status' => $status,
            'exclusion_reason' => $status === 'excluded' ? $reason : null,
        ]);

        Audit::log('fet_trial.trip_'.($status === 'excluded' ? 'excluded' : 'included'),
            "{$trial->reference}: {$trip->route_label} (console)".($reason ? " — {$reason}" : ''), $trial);
        $this->info(($status === 'excluded' ? 'Left out: ' : 'Put back in: ').$trip->route_label);

        return true;
    }

    private function report(FetTrial $trial, FetTrialAnalysisService $analysis): void
    {
        $a = $analysis->analyse($trial);

        $this->newLine();
        $this->line("<options=bold>{$trial->reference} — {$trial->client_company}</>");

        $this->newLine();
        $this->line('<options=bold>TRIPS</>');
        $this->table(['id', 'route', 'date', 'when', 'status', 'L/100km'],
            $trial->trips->map(fn ($t) => [
                $t->id, $t->route_label, $t->trip_date?->toDateString() ?? '—',
                $t->effectivePhase() === 'trial' ? 'after' : 'before',
                $t->status, $t->litresPer100Km() ?? '—',
            ])
        );

        $outstanding = $trial->flags->whereNull('resolution');
        if ($outstanding->isNotEmpty()) {
            $this->line('<options=bold>OUTSTANDING FINDINGS</> — settle with --settle=<id> --as=... --note="..."');
            $this->table(['id', 'severity', 'trip', 'finding'],
                $outstanding->map(fn ($f) => [
                    $f->id, $f->severity,
                    $f->trip?->route_label ?? 'trial',
                    Str::limit($f->message, 70),
                ])
            );
        }

        $this->line('<options=bold>RESULT</>');
        $this->line('  '.($a['verdict']['statement'] ?? 'No result yet — the evidence does not carry one.'));
        foreach ($a['confidence']['shortfall'] as $line) {
            $this->line("    · {$line}");
        }
        $this->newLine();
    }
}
