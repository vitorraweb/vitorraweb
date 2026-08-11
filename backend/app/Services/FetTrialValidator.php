<?php

namespace App\Services;

use App\Models\FetTrial;
use App\Models\FetTrialFlag;
use App\Models\FetTrialTrip;
use Illuminate\Support\Collection;

/**
 * Checks a trial's trips and raises data-quality findings.
 *
 * Two principles:
 *
 *   NEVER GUESS. Where a reading is ambiguous the trip is flagged for a human,
 *   not quietly corrected and not quietly used. Every message is written for a
 *   marketer, names the actual numbers, and says what to do about it.
 *
 *   ERRORS TAKE A TRIP OUT OF THE MATHS, VISIBLY. A trip carrying an
 *   unresolved error is moved to `review` so it cannot reach the headline —
 *   but it stays on screen with the reason attached, rather than disappearing.
 *
 * Re-running is safe: findings are reconciled, existing human resolutions are
 * preserved, and findings that no longer apply are removed.
 */
class FetTrialValidator
{
    /**
     * Validate every trip in a trial and reconcile its flags.
     *
     * @return array<string, int> counts by severity, plus how many trips changed state
     */
    public function validate(FetTrial $trial): array
    {
        $trips = $trial->trips()->get();
        $existing = $trial->flags()->get();
        $findings = [];

        foreach ($trips as $trip) {
            foreach ($this->checkTrip($trial, $trip, $trips) as $finding) {
                $findings[] = $finding + ['fet_trial_trip_id' => $trip->id];
            }
        }

        foreach ($this->checkTrial($trial, $trips) as $finding) {
            $findings[] = $finding + ['fet_trial_trip_id' => null];
        }

        $this->reconcile($trial, $existing, $findings);
        $changed = $this->applyTripStatuses($trial, $trips);

        $fresh = $trial->flags()->get();

        return [
            'error' => $fresh->where('severity', 'error')->whereNull('resolution')->count(),
            'warn' => $fresh->where('severity', 'warn')->whereNull('resolution')->count(),
            'info' => $fresh->where('severity', 'info')->whereNull('resolution')->count(),
            'trips_changed' => $changed,
        ];
    }

    /**
     * @param  Collection<int, FetTrialTrip>  $all
     * @return array<int, array<string, mixed>>
     */
    private function checkTrip(FetTrial $trial, FetTrialTrip $trip, Collection $all): array
    {
        $t = config('fet_trials.thresholds');
        $f = [];
        $label = $trip->route_label ?: 'this trip';

        /* ── the trip has to be a trip ───────────────────────────────────── */

        if ($trip->trip_date === null) {
            $f[] = [
                'code' => 'missing_date', 'severity' => 'error', 'field' => 'trip_date',
                'message' => "{$label} has no date, so it cannot be placed before or after the installation.",
                'suggested_action' => 'Ask the client for the departure date, or enter it here.',
            ];
        }

        $distance = (float) ($trip->distance_km ?? 0);
        if ($distance <= 0) {
            $f[] = [
                'code' => 'no_distance', 'severity' => 'error', 'field' => 'distance_km',
                'message' => "No distance was recorded for {$label}, so nothing can be calculated from it.",
                'suggested_action' => 'Ask the client whether this trip completed, and for the distance covered.',
            ];
        }

        $fuel = (float) ($trip->fuel_used_l ?? 0);
        if ($fuel <= 0) {
            $reason = $trip->fuel_opening_l !== null && $trip->fuel_closing_l !== null
                ? 'the closing tank reading is higher than the opening reading plus everything issued'
                : 'no fuel figures were recorded';
            $f[] = [
                'code' => 'no_fuel', 'severity' => 'error', 'field' => 'fuel_used_l',
                'message' => "Fuel used on {$label} works out as {$fuel} litres, because {$reason}.",
                'suggested_action' => 'Check the opening stock, fuel issued and closing stock figures with the client.',
                'context' => [
                    'opening' => $trip->fuel_opening_l, 'issued' => $trip->fuel_issued_l,
                    'topup' => $trip->fuel_topup_l, 'closing' => $trip->fuel_closing_l,
                ],
            ];
        }

        /* ── dates that contradict the installation ──────────────────────── */

        if ($trial->installed_on && $trip->trip_date
            && $trip->phase_override === 'trial'
            && $trip->trip_date->lt($trial->installed_on)) {
            $f[] = [
                'code' => 'trip_before_install', 'severity' => 'error', 'field' => 'trip_date',
                'message' => sprintf(
                    'The client marked %s as a trial trip, but it is dated %s — before the unit was fitted on %s. The dates and the marking cannot both be right.',
                    $label,
                    $trip->trip_date->format('j M Y'),
                    $trial->installed_on->format('j M Y')
                ),
                'suggested_action' => 'Ask the client to confirm the real dates. Their dispatch paperwork usually settles it.',
                'context' => [
                    'trip_date' => $trip->trip_date->toDateString(),
                    'installed_on' => $trial->installed_on->toDateString(),
                ],
            ];
        }

        if ($trip->trip_date && $trip->return_date && $trip->return_date->lt($trip->trip_date)) {
            $f[] = [
                'code' => 'return_before_departure', 'severity' => 'error', 'field' => 'return_date',
                'message' => "{$label} is recorded as returning before it departed.",
                'suggested_action' => 'Check the two dates with the client — usually one is mistyped.',
            ];
        }

        /* ── the trip did different work from its comparators ────────────── */

        $tare = $trial->effectiveTareKg();
        if ($tare && $trip->load_in_kg !== null
            && (int) $trip->load_in_kg > $tare * (float) $t['return_load_multiple']) {
            $f[] = [
                'code' => 'return_loaded', 'severity' => 'error', 'field' => 'load_in_kg',
                'message' => sprintf(
                    '%s came back loaded — its return weight was %s kg against a normal empty weight of about %s kg. It carried freight both ways, which is close to twice the work of a one-way trip, so it cannot fairly be compared with one.',
                    $label,
                    number_format((int) $trip->load_in_kg),
                    number_format($tare)
                ),
                'suggested_action' => 'Confirm the return load with the client. If the baseline trips also ran loaded both ways, mark this as accepted; otherwise leave it out.',
                'context' => ['load_in_kg' => (int) $trip->load_in_kg, 'tare_kg' => $tare],
            ];
        }

        if ($trial->rated_capacity_kg && $trip->load_out_kg !== null) {
            $limit = $trial->rated_capacity_kg * (1 + (float) $t['capacity_tolerance_pct'] / 100);
            if ((int) $trip->load_out_kg > $limit) {
                $f[] = [
                    'code' => 'load_above_capacity', 'severity' => 'warn', 'field' => 'load_out_kg',
                    'message' => sprintf(
                        '%s carried %s kg against a rated capacity of %s kg.',
                        $label,
                        number_format((int) $trip->load_out_kg),
                        number_format($trial->rated_capacity_kg)
                    ),
                    'suggested_action' => 'Confirm the weighbridge figure. An over-capacity load also burns more fuel than a normal one.',
                ];
            }
        }

        // A tonne-sized number in a kilogramme field: clients label the column
        // "tonnes" and then enter 29,600, so the reverse mistake happens too.
        if ($trial->rated_capacity_kg > 5000 && $trip->load_out_kg !== null
            && (int) $trip->load_out_kg > 0
            && (int) $trip->load_out_kg < (int) $t['kg_in_tonnes_threshold']) {
            $f[] = [
                'code' => 'load_units_suspect', 'severity' => 'warn', 'field' => 'load_out_kg',
                'message' => sprintf(
                    '%s records a load of %s kg on a vehicle rated for %s kg. That looks like tonnes entered where kilogrammes were expected.',
                    $label,
                    number_format((int) $trip->load_out_kg),
                    number_format($trial->rated_capacity_kg)
                ),
                'suggested_action' => 'Check the unit. If it is tonnes, re-import with the load column set to tonnes.',
            ];
        }

        /* ── measurements that disagree with each other ──────────────────── */

        $variance = $trip->fuelVarianceL();
        if ($variance !== null && $fuel > 0) {
            $pct = abs($variance) / $fuel * 100;
            if ($pct > (float) $t['ivms_variance_pct']) {
                $f[] = [
                    'code' => 'ivms_variance_high', 'severity' => 'warn', 'field' => 'fuel_used_ivms_l',
                    'message' => sprintf(
                        'On %s the manual fuel figure and the tracker figure differ by %s litres (%s%%). One of the two is wrong.',
                        $label,
                        number_format(abs($variance), 1),
                        number_format($pct, 1)
                    ),
                    'suggested_action' => 'Ask the client which measurement they trust for this trip, and use that one consistently.',
                    'context' => ['manual' => $fuel, 'tracker' => (float) $trip->fuel_used_ivms_l, 'gap_pct' => round($pct, 1)],
                ];
            }
        }

        $reference = $trial->fallbackBaseline();
        $actual = $trip->litresPer100Km();
        if ($reference && $actual) {
            $band = $t['efficiency_band'];
            if ($actual < $reference * (float) $band['min'] || $actual > $reference * (float) $band['max']) {
                $f[] = [
                    'code' => 'efficiency_out_of_band', 'severity' => 'warn', 'field' => 'fuel_used_l',
                    'message' => sprintf(
                        '%s works out at %s litres per 100 km, against about %s expected for this vehicle. That is too far out to be a real difference in driving.',
                        $label,
                        number_format($actual, 2),
                        number_format($reference, 2)
                    ),
                    'suggested_action' => 'Check the distance and fuel figures for this trip — a mistyped digit is the usual cause.',
                ];
            }
        }

        /* ── weaker evidence, worth knowing about ────────────────────────── */

        if ($trip->fuel_method === 'issued_only' && $fuel > 0) {
            $f[] = [
                'code' => 'issued_only_fuel', 'severity' => 'info', 'field' => 'fuel_method',
                'message' => "Fuel for {$label} is taken from what was issued, with no opening and closing tank readings. That assumes everything drawn was burned on this trip.",
                'suggested_action' => 'Ask whether the client records tank stock at departure and return — it makes the figure materially firmer.',
            ];
        }

        if ($trip->distance_source === 'planned' && $distance > 0) {
            $f[] = [
                'code' => 'planned_distance_used', 'severity' => 'warn', 'field' => 'distance_km',
                'message' => "{$label} uses the planned distance rather than the distance actually driven.",
                'suggested_action' => 'Ask for the tracker mileage. Planned and actual routinely differ by several percent, which is a large share of the effect being measured.',
            ];
        }

        $duplicate = $all->first(fn (FetTrialTrip $o) => $o->id !== $trip->id
            && $o->route_key === $trip->route_key
            && $o->route_key !== null
            && $o->trip_date?->toDateString() === $trip->trip_date?->toDateString()
            && $trip->trip_date !== null);
        if ($duplicate) {
            $f[] = [
                'code' => 'duplicate_trip', 'severity' => 'warn', 'field' => null,
                'message' => "Another trip to {$label} is recorded on the same date. One of them may have been imported twice.",
                'suggested_action' => 'Compare the two and exclude the duplicate if it is one.',
            ];
        }

        return $f;
    }

    /**
     * Findings about the trial as a whole.
     *
     * @param  Collection<int, FetTrialTrip>  $trips
     * @return array<int, array<string, mixed>>
     */
    private function checkTrial(FetTrial $trial, Collection $trips): array
    {
        $f = [];

        if (! $trial->installed_on) {
            return $f;
        }

        /*
         * The lesson from the first trial: once the unit is fitted, no further
         * "before" trips can ever be recorded on that vehicle. If routes are
         * still short of a baseline at that point, the only remaining fix is
         * the client's own trip history — and it is worth asking early, while
         * the account conversation is live.
         */
        $baselineByRoute = $trips
            ->filter(fn (FetTrialTrip $t) => $t->effectivePhase() === 'baseline' && $t->route_key)
            ->groupBy('route_key');

        $thin = $baselineByRoute->filter(fn ($g) => $g->count() < $trial->minBaselineTripsPerRoute());

        if ($trial->installed_on->isPast() && $thin->isNotEmpty()) {
            $names = $thin->keys()->map(fn ($k) => $baselineByRoute[$k]->first()->route_label ?? $k)->all();
            $f[] = [
                'code' => 'baseline_frozen', 'severity' => 'warn', 'field' => null,
                'message' => sprintf(
                    'The unit is already fitted, so no further "before" trips can be recorded on this vehicle. %s %s only one journey before installation, which is not enough to compare against.',
                    implode(', ', $names),
                    count($names) === 1 ? 'has' : 'have'
                ),
                'suggested_action' => 'Ask the client for this vehicle\'s earlier trip history in the same export format. It rebuilds the baseline retrospectively at no cost and is usually already in their tracking system.',
                'context' => ['routes' => $names],
            ];
        }

        return $f;
    }

    /**
     * Bring stored flags in line with the current findings, without destroying
     * decisions a human has already made about them.
     *
     * @param  Collection<int, FetTrialFlag>  $existing
     * @param  array<int, array<string, mixed>>  $findings
     */
    private function reconcile(FetTrial $trial, Collection $existing, array $findings): void
    {
        $key = fn ($tripId, $code, $field) => ($tripId ?? 'trial').'|'.$code.'|'.($field ?? '');

        $byKey = $existing->keyBy(fn (FetTrialFlag $f) => $key($f->fet_trial_trip_id, $f->code, $f->field));
        $seen = [];

        foreach ($findings as $finding) {
            $k = $key($finding['fet_trial_trip_id'], $finding['code'], $finding['field'] ?? null);
            $seen[$k] = true;

            $payload = [
                'severity' => $finding['severity'],
                'message' => $finding['message'],
                'suggested_action' => $finding['suggested_action'] ?? null,
                'context' => $finding['context'] ?? null,
            ];

            if ($flag = $byKey->get($k)) {
                // Keep the human's resolution; refresh the wording and numbers.
                $flag->fill($payload)->save();

                continue;
            }

            FetTrialFlag::create($payload + [
                'fet_trial_id' => $trial->id,
                'fet_trial_trip_id' => $finding['fet_trial_trip_id'],
                'code' => $finding['code'],
                'field' => $finding['field'] ?? null,
            ]);
        }

        // A finding that no longer applies (the data was corrected) goes away.
        foreach ($byKey as $k => $flag) {
            if (! isset($seen[$k])) {
                $flag->delete();
            }
        }
    }

    /**
     * Move trips carrying an unresolved error out of the maths, and bring them
     * back once it is settled. A trip a human excluded by hand stays excluded.
     *
     * @param  Collection<int, FetTrialTrip>  $trips
     */
    private function applyTripStatuses(FetTrial $trial, Collection $trips): int
    {
        $blocking = $trial->flags()
            ->where('severity', 'error')
            ->whereNull('resolution')
            ->whereNotNull('fet_trial_trip_id')
            ->pluck('fet_trial_trip_id')
            ->flip();

        $changed = 0;

        foreach ($trips as $trip) {
            if ($trip->status === 'excluded') {
                continue; // a deliberate human decision
            }

            $target = $blocking->has($trip->id) ? 'review' : 'valid';

            if ($trip->status !== $target) {
                $trip->status = $target;
                $trip->save();
                $changed++;
            }
        }

        return $changed;
    }
}
