<?php

namespace App\Services;

use App\Models\FetInstallation;
use App\Models\FetTrial;
use App\Support\Audit;

/**
 * Closing a trial, and handing a won one over to the post-sale savings loop.
 *
 * The valuable part is the baseline. `fet_installations` normally measures a
 * customer's savings against a representative figure for the vehicle class —
 * a reasonable guess. A trial that reached a verdict has something far better:
 * a MEASURED baseline from that exact vehicle on those exact routes. Carrying
 * it across means the customer's ongoing savings are measured against their own
 * history rather than a table lookup, and the proof they were sold on is the
 * same proof that keeps running afterwards.
 */
class FetTrialConversionService
{
    public function __construct(private readonly FetTrialAnalysisService $analysis) {}

    /**
     * Record how a trial ended. Winning one creates the installation that
     * continues measuring it; losing one records why, and nothing else happens.
     *
     * @param  array<string, mixed>  $details
     */
    public function recordOutcome(FetTrial $trial, string $outcome, array $details = []): FetTrial
    {
        $trial->update([
            'status' => $outcome,
            'decided_on' => $details['decided_on'] ?? now()->toDateString(),
            'outcome_note' => $details['outcome_note'] ?? null,
            'units_sold' => $outcome === 'won' ? ($details['units_sold'] ?? null) : null,
            'deal_value' => $outcome === 'won' ? ($details['deal_value'] ?? null) : null,
        ]);

        Audit::log(
            "fet_trial.{$outcome}",
            "{$trial->reference} ({$trial->client_company}) marked {$outcome}"
                .($details['outcome_note'] ?? '' ? ': '.$details['outcome_note'] : ''),
            $trial
        );

        $this->syncProspect($trial, $outcome);

        if ($outcome === 'won') {
            $this->createInstallation($trial->fresh());
        }

        return $trial->fresh();
    }

    /**
     * Create the post-sale installation record for a won trial, carrying the
     * measured baseline across. Idempotent — a trial already linked to an
     * installation is left alone, so re-saving an outcome cannot duplicate it.
     */
    public function createInstallation(FetTrial $trial): ?FetInstallation
    {
        if ($trial->fet_installation_id !== null) {
            return $trial->installation;
        }

        $analysis = $this->analysis->analyse($trial);

        /*
         * Prefer the baseline the trial actually measured. It only exists where
         * the evidence carried a verdict — the same strict gate as everywhere
         * else — so a thin trial hands over a declared figure or nothing, and
         * the installation falls back to the class default rather than
         * inheriting a number nobody could defend.
         */
        $measured = $analysis['verdict'] ? ($analysis['headline']['baseline_l_per_100'] ?? null) : null;
        $baseline = $measured ?? $trial->fallbackBaseline();

        $installation = FetInstallation::create([
            'reference' => $this->nextInstallationReference(),
            'enquiry_id' => $trial->enquiry_id,
            'customer_name' => $trial->contact_name ?: $trial->client_company,
            'customer_email' => $trial->contact_email,
            'customer_phone' => $trial->contact_phone,
            'company' => $trial->client_company,
            'tier' => $this->tierFor($trial),
            'device_model' => $trial->device_model ?: config('fet.tiers.'.$this->tierFor($trial).'.model'),
            'vehicle' => collect([$trial->vehicle_make, $trial->vehicle_type])->filter()->implode(' '),
            'registration' => $trial->registration,
            'currency' => $trial->currency,
            'baseline_l_per_100' => $baseline,
            'baseline_source' => $measured !== null ? 'measured' : ($trial->fallbackBaseline() !== null ? 'declared' : 'segment'),
            'installed_on' => $trial->installed_on,
            'installed_by' => $trial->installed_by,
            'status' => 'active',
            'notes' => "Converted from trial {$trial->reference}."
                .($measured !== null ? " Baseline of {$measured} l/100km measured during the trial." : ''),
        ]);

        $trial->update(['fet_installation_id' => $installation->id]);

        Audit::log(
            'fet_trial.converted',
            "{$trial->reference} became installation {$installation->reference}"
                .($measured !== null ? " with a measured baseline of {$measured} l/100km" : ''),
            $trial
        );

        return $installation;
    }

    /**
     * Keep the CRM honest: a prospect whose trial closed should not still be
     * sitting in the outreach list as though nobody had spoken to them.
     */
    private function syncProspect(FetTrial $trial, string $outcome): void
    {
        $prospect = $trial->prospect;

        if (! $prospect) {
            return;
        }

        $prospect->update([
            'outreach_status' => $outcome === 'won' ? 'converted' : 'not_interested',
        ]);
    }

    /**
     * The tier a vehicle falls into. Derived from rated capacity where it is
     * known — the trial vehicles are trucks, and getting this wrong only
     * affects the fallback baseline, never a measured one.
     */
    private function tierFor(FetTrial $trial): string
    {
        $kg = $trial->rated_capacity_kg;

        return match (true) {
            $kg === null => 'heavytruck',
            $kg >= 10000 => 'heavytruck',
            $kg >= 3000 => 'lighttruck',
            $kg >= 1200 => 'suv',
            default => 'car',
        };
    }

    private function nextInstallationReference(): string
    {
        $prefix = sprintf('FET-INST-%d-', now()->year);
        $last = FetInstallation::where('reference', 'like', $prefix.'%')->orderByDesc('reference')->value('reference');
        $n = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
    }
}
