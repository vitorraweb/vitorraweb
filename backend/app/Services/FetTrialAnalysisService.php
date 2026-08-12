<?php

namespace App\Services;

use App\Models\FetTrial;
use App\Models\FetTrialTrip;
use Illuminate\Support\Collection;

/**
 * Turns a trial's trips into a defensible result — or into a clear statement of
 * why there isn't one yet.
 *
 * Two rules drive everything here, both learned from the first real trial
 * (Hariss, UA 758AM — planning/11-hariss-ua758am-trial-analysis.md):
 *
 * 1. COMPARE LIKE ROUTE WITH LIKE ROUTE. That truck's fuel use varied 41%
 *    between destinations but only 4.2% between two runs of the *same*
 *    destination. Route variance is ~3x the 13.9% effect FET is certified to
 *    deliver, so a single blended "before" figure measures the road, not the
 *    product. Expected fuel is therefore predicted per route and summed —
 *    never taken from one pooled average.
 *
 * 2. WEIGHT BY DISTANCE, NEVER AVERAGE THE AVERAGES. Averaging each trip's
 *    l/100km lets a 300 km run count as much as a 1,000 km one. On the Hariss
 *    baseline that alone shifts the figure by 1.7%.
 *
 * Everything is presented as the client's own measured data. We never state a
 * result the evidence does not carry — see confidence() and verdict().
 */
class FetTrialAnalysisService
{
    /**
     * Distance-weighted fuel use across a set of trips: total litres over total
     * kilometres. Returns null when nothing in the set is measurable.
     *
     * @param  Collection<int, FetTrialTrip>  $trips
     * @return array<string, float|int>|null
     */
    public function weighted(Collection $trips): ?array
    {
        $km = 0.0;
        $litres = 0.0;
        $count = 0;

        foreach ($trips as $trip) {
            $d = (float) ($trip->distance_km ?? 0);
            $f = (float) ($trip->fuel_used_l ?? 0);
            if ($d <= 0 || $f <= 0) {
                continue;
            }
            $km += $d;
            $litres += $f;
            $count++;
        }

        if ($count === 0 || $km <= 0 || $litres <= 0) {
            return null;
        }

        return [
            'trips' => $count,
            'km' => round($km, 2),
            'litres' => round($litres, 2),
            'l_per_100' => round($litres / $km * 100, 2),
            'km_per_l' => round($km / $litres, 3),
        ];
    }

    /**
     * Full analysis of a trial.
     *
     * @return array<string, mixed>
     */
    public function analyse(FetTrial $trial): array
    {
        $all = $trial->trips()->get();

        /*
         * Two different questions, and conflating them was a mistake.
         *
         *   COUNTED  — valid trips, which are what the headline is built from.
         *   SHOWN    — every trip with a usable distance and fuel figure,
         *              including ones held for review.
         *
         * A trip held over an open question is still a real journey that really
         * happened. Hiding it entirely made a trial with three post-installation
         * trips look as though nothing had been driven since the device went on,
         * which is both wrong and alarming. It is reported throughout, always
         * marked as not counted, and never allowed into the maths.
         */
        $withFigures = $all->filter(fn (FetTrialTrip $t) => $t->litresPer100Km() !== null);
        $measurable = $withFigures->filter(fn (FetTrialTrip $t) => $t->status === 'valid');
        $held = $withFigures->filter(fn (FetTrialTrip $t) => $t->status !== 'valid');

        $baseline = $measurable->filter(fn (FetTrialTrip $t) => $t->effectivePhase() === 'baseline');
        $trialTrips = $measurable->filter(fn (FetTrialTrip $t) => $t->effectivePhase() === 'trial');
        $heldBaseline = $held->filter(fn (FetTrialTrip $t) => $t->effectivePhase() === 'baseline');
        $heldTrial = $held->filter(fn (FetTrialTrip $t) => $t->effectivePhase() === 'trial');

        $routes = $this->routeBreakdown($trial, $baseline, $trialTrips, $heldBaseline, $heldTrial);
        $matched = array_values(array_filter($routes, fn ($r) => $r['matched']));

        $headline = $this->headline($trial, $matched);
        $blocking = $this->blockingFlags($trial);

        /*
         * Routes that already hold enough "before" trips to anchor a comparison,
         * whether or not a trial trip has run there yet. This is the single most
         * actionable thing the module produces: "send the next load down one of
         * these and we can measure it."
         */
        $ready = array_values(array_filter(
            $routes,
            fn ($r) => $r['baseline'] !== null && $r['baseline']['trips'] >= $trial->minBaselineTripsPerRoute()
        ));

        // Unresolved questions hanging over the very trips being counted. These
        // do not invalidate the result, but they do mean it should be settled
        // before it is put in front of a client.
        $countedTripIds = $trialTrips
            ->whereIn('route_key', array_column($matched, 'route_key'))
            ->pluck('id')->all();
        $warnings = $this->outstandingWarnings($trial, $countedTripIds);

        $confidence = $this->confidence($trial, $matched, $ready, $headline, $blocking, $warnings, $heldTrial->count(), $routes);

        return [
            'currency' => $trial->currency,
            'fuel_price' => $trial->fuel_price !== null ? (float) $trial->fuel_price : null,
            'verified_pct' => (float) config('fet.verified_pct', 13.9),

            'counts' => [
                'trips_total' => $all->count(),
                'baseline_measurable' => $baseline->count(),
                'trial_measurable' => $trialTrips->count(),
                // Post-installation trips that happened and have figures,
                // whether or not they can be counted yet.
                'trial_recorded' => $trialTrips->count() + $heldTrial->count(),
                'trial_held' => $heldTrial->count(),
                'needs_review' => $all->where('status', 'review')->count(),
                'excluded' => $all->where('status', 'excluded')->count(),
            ],

            'routes' => $routes,
            'routes_ready' => array_map(fn ($r) => [
                'route_label' => $r['route_label'],
                'baseline_trips' => $r['baseline']['trips'],
                'l_per_100' => $r['baseline']['l_per_100'],
            ], $ready),
            'headline' => $headline,
            'confidence' => $confidence,
            // Strict by design: a headline is only *stated* once the evidence
            // carries it. Below that the caller gets the shortfall instead.
            'verdict' => $confidence['states_verdict'] ? $this->verdict($trial, $headline) : null,
            'unmatched_trial_trips' => $this->unmatchedTrialTrips($routes),
            'blocking_flags' => $blocking,
            'open_questions' => $warnings,

            /*
             * Secondary lenses, added after S-Line Motors' independent
             * assessment of the first trial (11 August 2026). They do not move
             * the verdict — that stays anchored to distance efficiency, as
             * their protocol recommends — but they explain a figure that looks
             * like a plain failure until you see what the truck was carrying.
             */
            'transport_work' => $this->transportWork($withFigures, $trial->effectiveTareKg()),
            'reference' => $this->referencePosition($trial, $withFigures),
            'secondary' => $this->secondaryMeasure($withFigures),
            'load_sensitivity' => $this->loadSensitivity($trial, $withFigures),
        ];
    }

    /**
     * Per-route comparison. A route can only anchor the headline once it has
     * enough pre-installation trips AND a comparable load profile — otherwise
     * it is reported with the reason it cannot be used.
     *
     * @param  Collection<int, FetTrialTrip>  $baseline
     * @param  Collection<int, FetTrialTrip>  $trialTrips
     * @return array<int, array<string, mixed>>
     */
    private function routeBreakdown(
        FetTrial $trial,
        Collection $baseline,
        Collection $trialTrips,
        Collection $heldBaseline,
        Collection $heldTrial,
    ): array {
        $minBaseline = $trial->minBaselineTripsPerRoute();
        $tolerance = (float) config('fet_trials.thresholds.load_tolerance_pct', 15.0);

        // Held trips get a row too, so a destination driven only since the
        // device was fitted still appears rather than vanishing.
        $keys = $baseline->concat($trialTrips)->concat($heldBaseline)->concat($heldTrial)
            ->pluck('route_key')->filter()->unique()->sort()->values();

        $routes = [];

        foreach ($keys as $key) {
            $b = $baseline->where('route_key', $key)->values();
            $t = $trialTrips->where('route_key', $key)->values();

            $bw = $this->weighted($b);
            $tw = $this->weighted($t);
            $bHeld = $this->weighted($heldBaseline->where('route_key', $key)->values());
            $tHeld = $this->weighted($heldTrial->where('route_key', $key)->values());

            $bLoad = $this->meanLoadKg($b);
            $tLoad = $this->meanLoadKg($t);

            $loadGapPct = ($bLoad !== null && $tLoad !== null && $bLoad > 0)
                ? round(abs($tLoad - $bLoad) / $bLoad * 100, 1)
                : null;

            // Why this route can or cannot carry the comparison.
            $reason = null;
            if ($tw === null) {
                $reason = 'no_trial_trip';
            } elseif ($bw === null) {
                $reason = 'no_baseline';
            } elseif ($bw['trips'] < $minBaseline) {
                $reason = 'sparse_baseline';
            } elseif ($loadGapPct !== null && $loadGapPct > $tolerance) {
                $reason = 'load_mismatch';
            }

            $matched = $reason === null;

            $routes[] = [
                'route_key' => $key,
                'route_label' => ($b->first() ?? $t->first()
                    ?? $heldBaseline->where('route_key', $key)->first()
                    ?? $heldTrial->where('route_key', $key)->first())?->route_label ?? $key,
                'baseline' => $bw,
                'trial' => $tw,
                // Recorded but not counted — shown in grey, never in the maths.
                'baseline_held' => $bHeld,
                'trial_held' => $tHeld,
                'baseline_load_kg' => $bLoad,
                'trial_load_kg' => $tLoad,
                'load_gap_pct' => $loadGapPct,
                'matched' => $matched,
                'unmatched_reason' => $reason,
                // Only meaningful where both sides exist; shown as context even
                // when the route is unmatched, clearly labelled as such.
                'change_pct' => ($bw && $tw)
                    ? round(($bw['l_per_100'] - $tw['l_per_100']) / $bw['l_per_100'] * 100, 1)
                    : null,
            ];
        }

        return $routes;
    }

    /**
     * The headline saving — route-stratified expected fuel.
     *
     * For each matched route we predict what the trial trips *would* have burned
     * at that route's own measured baseline, then compare with what they did
     * burn. Summing those predictions is what makes the total honest when the
     * trial trips are spread unevenly across easy and hard routes.
     *
     * @param  array<int, array<string, mixed>>  $matched
     * @return array<string, mixed>|null
     */
    private function headline(FetTrial $trial, array $matched): ?array
    {
        if ($matched === []) {
            return null;
        }

        $expected = 0.0;
        $actual = 0.0;
        $distance = 0.0;
        $trips = 0;

        foreach ($matched as $r) {
            $expected += $r['trial']['km'] * $r['baseline']['l_per_100'] / 100;
            $actual += $r['trial']['litres'];
            $distance += $r['trial']['km'];
            $trips += $r['trial']['trips'];
        }

        if ($expected <= 0) {
            return null;
        }

        $saved = $expected - $actual;
        $price = $trial->fuel_price !== null ? (float) $trial->fuel_price : null;

        return [
            'matched_routes' => count($matched),
            'matched_trial_trips' => $trips,
            'distance_km' => round($distance, 2),
            'expected_litres' => round($expected, 2),
            'actual_litres' => round($actual, 2),
            'litres_saved' => round($saved, 2),
            'saving_pct' => round($saved / $expected * 100, 1),
            // Money stays in the trial's own currency — never summed across trials.
            'cost_saved' => $price !== null ? round($saved * $price, 2) : null,
            'co2_saved_kg' => round($saved * (float) config('fet_trials.co2_kg_per_litre', 2.64), 1),
            // What the trial trips actually averaged, for the comparison chart.
            'trial_l_per_100' => round($actual / $distance * 100, 2),
            'baseline_l_per_100' => round($expected / $distance * 100, 2),
        ];
    }

    /**
     * How much weight the result can bear, and precisely what is missing.
     *
     * `states_verdict` is the gate the rest of the system honours: below
     * "moderate" no saving figure is published anywhere — not to the client,
     * not on the staff dashboard. A number that cannot survive a client's
     * questioning is worse for the deal than an honest "still running".
     *
     * @param  array<int, array<string, mixed>>  $matched
     * @param  array<int, array<string, mixed>>  $ready  routes with a usable baseline
     * @param  array<string, mixed>|null  $headline
     * @param  array<int, array<string, mixed>>  $blocking
     * @param  array<int, array<string, mixed>>  $warnings  open questions on the counted trips
     * @return array<string, mixed>
     */
    private function confidence(FetTrial $trial, array $matched, array $ready, ?array $headline, array $blocking, array $warnings, int $heldTrialTrips = 0, array $routes = []): array
    {
        $required = $trial->requiredMatchedTrips();
        $minBase = $trial->minBaselineTripsPerRoute();
        $trips = $headline['matched_trial_trips'] ?? 0;

        $shortfall = [];

        if ($blocking !== []) {
            // Count the TRIPS affected, not the findings — one trip can raise
            // several (a journey with no date and no distance raises both), and
            // saying "4 trips" when three are involved overstates the work.
            $affected = collect($blocking)->pluck('trip_id')->filter()->unique()->count();
            $n = $affected ?: count($blocking);

            $shortfall[] = $n === 1
                ? 'One trip has an unresolved problem that has to be settled first.'
                : "{$n} trips have unresolved problems that have to be settled first.";
        }

        if ($matched === []) {
            /*
             * Say which of the two is actually missing. "No trip after
             * installation" in front of somebody looking at three of them on
             * the same screen reads as the system being broken, when the real
             * situation is that those trips have questions against them.
             */
            /*
             * Name what each route is actually short of. "No route has both"
             * is not true of a route with one trip on each side — it has both,
             * and is one baseline trip away from being usable. Telling the
             * account team that is the difference between a dead end and a
             * clear next step.
             */
            $before = $shortfall;
            foreach ($routes as $r) {
                if ($r['trial'] === null && $r['trial_held'] === null) {
                    continue;
                }
                $shortfall[] = match ($r['unmatched_reason']) {
                    'sparse_baseline' => sprintf(
                        '%s has trips on both sides, but only %d from before the device was fitted — %d are needed before it can anchor a comparison.',
                        $r['route_label'], $r['baseline']['trips'] ?? 0, $trial->minBaselineTripsPerRoute()
                    ),
                    'no_baseline' => "{$r['route_label']} was never driven before the device was fitted, so there is nothing on that route to compare against.",
                    'load_mismatch' => sprintf(
                        '%s carried a load %s%% different from its baseline trips, so the two are not doing the same work.',
                        $r['route_label'], number_format((float) ($r['load_gap_pct'] ?? 0), 1)
                    ),
                    default => null,
                } ?? '';
            }
            $named = count(array_filter($shortfall)) > count(array_filter($before ?? []));
            $shortfall = array_values(array_filter($shortfall));

            if ($heldTrialTrips > 0) {
                $shortfall[] = $heldTrialTrips === 1
                    ? 'One trip has run since the device was fitted, but it cannot be counted yet — see the questions above. Its figures are still shown, marked as not counted.'
                    : $heldTrialTrips.' trips have run since the device was fitted, but none can be counted yet — see the questions above. Their figures are still shown, marked as not counted.';
            } elseif (! $named) {
                // Only when there was nothing route-specific to say; otherwise
                // this generic line contradicts the lines above it.
                $shortfall[] = 'No route yet has both a usable "before" figure and a trip since the device was fitted.';
            }
        }

        if ($trips < $required) {
            $need = $required - $trips;
            $shortfall[] = "{$need} more trip".($need === 1 ? '' : 's')
                .' needed on a route that already has a "before" figure'
                ." (currently {$trips} of {$required} countable"
                .($heldTrialTrips > 0 ? ", with {$heldTrialTrips} recorded but not countable" : '').').';
        }

        // Name the routes that could carry a trial trip today — the single most
        // actionable thing marketing can put in front of the client.
        if ($trips < $required) {
            if ($ready !== []) {
                $shortfall[] = 'Send the next trial trips down '
                    .$this->list(array_map(fn ($r) => $r['route_label'], $ready))
                    .' — '.(count($ready) === 1 ? 'that route already has' : 'those routes already have')
                    .' a usable "before" figure.';
            } else {
                $shortfall[] = 'No route yet has '.$minBase.' trips from before the unit was fitted, '
                    .'so there is nothing to measure against. Ask the client for this vehicle\'s '
                    .'earlier trip history — once the unit is fitted the baseline can no longer be collected.';
            }
        }

        if ($blocking !== [] || $matched === [] || $trips < $required) {
            return [
                'level' => 'insufficient',
                'score' => 0,
                'states_verdict' => false,
                'shortfall' => $shortfall,
            ];
        }

        /*
         * Past the gate the trial has met the standard it was set up with, so a
         * result exists — EXCEPT where questions are still open on the very
         * trips being counted. A figure resting on a reading somebody has
         * queried will not survive a client asking about that reading, so it
         * waits until the question is settled.
         */
        if ($warnings !== []) {
            $n = count($warnings);

            return [
                'level' => 'low',
                'score' => 1,
                'states_verdict' => false,
                'shortfall' => [
                    $n === 1
                        ? 'One question is still open on the trips being counted. Settle it and the result stands.'
                        : "{$n} questions are still open on the trips being counted. Settle them and the result stands.",
                ],
            ];
        }

        // Grade how much weight it bears beyond the minimum.
        $score = 1;
        if ($trips >= $required * 2) {
            $score++;
        }
        if (count($matched) >= 2) {
            $score++;
        }
        if (count(array_filter($matched, fn ($r) => $r['baseline']['trips'] > $minBase)) === count($matched)) {
            $score++;
        }

        return [
            'level' => $score >= 3 ? 'high' : 'moderate',
            'score' => $score,
            'states_verdict' => true,
            'shortfall' => [],
        ];
    }

    /**
     * Unresolved warnings attached to the trips feeding the headline.
     *
     * @param  array<int, int>  $tripIds
     * @return array<int, array<string, mixed>>
     */
    private function outstandingWarnings(FetTrial $trial, array $tripIds): array
    {
        if ($tripIds === []) {
            return [];
        }

        return $trial->flags()
            ->where('severity', 'warn')
            ->whereNull('resolution')
            ->whereIn('fet_trial_trip_id', $tripIds)
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'trip_id' => $f->fet_trial_trip_id,
                'code' => $f->code,
                'message' => $f->message,
                'action' => $f->suggested_action,
            ])
            ->all();
    }

    /**
     * The result in a sentence a marketer can read aloud to a client without
     * translating it first.
     *
     * @param  array<string, mixed>|null  $headline
     * @return array<string, mixed>|null
     */
    private function verdict(FetTrial $trial, ?array $headline): ?array
    {
        if ($headline === null) {
            return null;
        }

        $pct = $headline['saving_pct'];
        $trips = $headline['matched_trial_trips'];
        $km = number_format($headline['distance_km'], 0);
        $litres = number_format(abs($headline['litres_saved']), 0);
        $better = $pct >= 0;

        $statement = sprintf(
            'The vehicle used %s%% %s fuel than its matched baseline across %d comparable trip%s and %s km — %s litres %s.',
            number_format(abs($pct), 1),
            $better ? 'less' : 'more',
            $trips,
            $trips === 1 ? '' : 's',
            $km,
            $litres,
            $better ? 'saved' : 'extra'
        );

        return [
            'direction' => $better ? 'saving' : 'increase',
            'saving_pct' => $pct,
            'statement' => $statement,
        ];
    }

    /**
     * Trial trips sitting on routes that cannot anchor a comparison. They are
     * real journeys and are reported — they simply prove nothing on their own.
     *
     * @param  array<int, array<string, mixed>>  $routes
     * @return array<int, array<string, mixed>>
     */
    private function unmatchedTrialTrips(array $routes): array
    {
        $out = [];

        foreach ($routes as $r) {
            if ($r['matched'] || $r['trial'] === null) {
                continue;
            }
            $out[] = [
                'route_label' => $r['route_label'],
                'trips' => $r['trial']['trips'],
                'km' => $r['trial']['km'],
                'l_per_100' => $r['trial']['l_per_100'],
                'reason' => $r['unmatched_reason'],
                'explanation' => $this->unmatchedExplanation($r),
            ];
        }

        return $out;
    }

    /** @param  array<string, mixed>  $route */
    private function unmatchedExplanation(array $route): string
    {
        return match ($route['unmatched_reason']) {
            'no_baseline' => "This vehicle never ran {$route['route_label']} before the unit was fitted, so there is nothing to compare against.",
            'sparse_baseline' => "{$route['route_label']} was only run once before the unit was fitted. A single journey is one observation, not a baseline — it says nothing about how much that route naturally varies.",
            'load_mismatch' => sprintf(
                'The load on this route differs from the baseline trips by %s%%, so the two are not doing the same work.',
                number_format((float) ($route['load_gap_pct'] ?? 0), 1)
            ),
            default => 'This route cannot currently anchor a comparison.',
        };
    }

    /**
     * Unresolved errors — a verdict cannot be stated while any of these stand.
     *
     * @return array<int, array<string, mixed>>
     */
    private function blockingFlags(FetTrial $trial): array
    {
        /*
         * A question about a trip that has been deliberately left out no longer
         * blocks anything — the decision has been made, and the trip is out of
         * the maths by that decision rather than by the question. Without this,
         * excluding an unusable journey still required answering every question
         * about it one by one, which is busywork that changes nothing.
         */
        $excludedTripIds = $trial->trips()->where('status', 'excluded')->pluck('id');

        return $trial->flags()
            ->where('severity', 'error')
            ->whereNull('resolution')
            ->where(fn ($q) => $q->whereNull('fet_trial_trip_id')
                ->orWhereNotIn('fet_trial_trip_id', $excludedTripIds))
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'trip_id' => $f->fet_trial_trip_id,
                'code' => $f->code,
                'message' => $f->message,
                'action' => $f->suggested_action,
            ])
            ->all();
    }

    /* ── secondary lenses ─────────────────────────────────────────────────── */

    /**
     * Cargo moved per litre, before and after.
     *
     * Distance efficiency penalises a truck that carried freight home instead
     * of returning empty — the extra tonnes burn fuel over the same road. This
     * asks the haulier's question instead. On the first trial the two measures
     * disagree by 77 percentage points on the same journey, which is precisely
     * why both are reported.
     *
     * @param  Collection<int, FetTrialTrip>  $trips
     * @return array<string, mixed>|null
     */
    private function transportWork(Collection $trips, ?int $tare): ?array
    {
        $side = function (Collection $set) use ($tare): ?array {
            $work = 0.0;
            $litres = 0.0;
            $count = 0;
            foreach ($set as $t) {
                $w = $t->cargoTonneKm($tare);
                $f = (float) ($t->fuel_used_l ?? 0);
                if ($w === null || $f <= 0) {
                    continue;
                }
                $work += $w;
                $litres += $f;
                $count++;
            }

            return $count > 0 && $litres > 0
                ? ['trips' => $count, 'tonne_km' => round($work, 1), 'litres' => round($litres, 2), 'tkm_per_l' => round($work / $litres, 2)]
                : null;
        };

        $before = $side($trips->filter(fn ($t) => $t->effectivePhase() === 'baseline'));
        $after = $side($trips->filter(fn ($t) => $t->effectivePhase() === 'trial'));

        if ($before === null || $after === null) {
            return null;
        }

        return [
            'baseline' => $before,
            'trial' => $after,
            'change_pct' => round(($after['tkm_per_l'] - $before['tkm_per_l']) / $before['tkm_per_l'] * 100, 1),
            'note' => 'Cargo moved per litre. This rises when the vehicle carries freight on the return leg instead of '
                .'running back empty, so it measures how well the truck was used as well as how efficiently it ran. '
                .'It cannot on its own show what the device did.',
        ];
    }

    /**
     * Where each period sits against the client's own planning figure — the
     * number their operation already budgets against, so the one they judge by.
     *
     * @param  Collection<int, FetTrialTrip>  $trips
     * @return array<string, mixed>|null
     */
    private function referencePosition(FetTrial $trial, Collection $trips): ?array
    {
        $reference = (float) ($trial->fleet_standard_km_per_l ?? 0);
        if ($reference <= 0) {
            return null;
        }

        $side = fn (string $phase) => $this->weighted($trips->filter(fn ($t) => $t->effectivePhase() === $phase)->values());
        $before = $side('baseline');
        $after = $side('trial');

        return [
            'km_per_l' => round($reference, 3),
            'baseline_pct' => $before ? round(($before['km_per_l'] - $reference) / $reference * 100, 1) : null,
            'trial_pct' => $after ? round(($after['km_per_l'] - $reference) / $reference * 100, 1) : null,
        ];
    }

    /**
     * The same comparison from the client's tracker rather than their tank
     * readings. Two independent measures agreeing is worth far more than one;
     * two disagreeing is worth knowing before a client points it out.
     *
     * @param  Collection<int, FetTrialTrip>  $trips
     * @return array<string, mixed>|null
     */
    private function secondaryMeasure(Collection $trips): ?array
    {
        $side = function (string $phase) use ($trips): ?array {
            $km = 0.0;
            $litres = 0.0;
            foreach ($trips->filter(fn ($t) => $t->effectivePhase() === $phase) as $t) {
                $d = (float) ($t->distance_km ?? 0);
                $f = (float) ($t->fuel_used_ivms_l ?? 0);
                if ($d > 0 && $f > 0) {
                    $km += $d;
                    $litres += $f;
                }
            }

            return $km > 0 && $litres > 0 ? ['km_per_l' => round($km / $litres, 3), 'l_per_100' => round($litres / $km * 100, 2)] : null;
        };

        $before = $side('baseline');
        $after = $side('trial');

        if ($before === null || $after === null) {
            return null;
        }

        return [
            'baseline' => $before,
            'trial' => $after,
            'change_pct' => round(($after['km_per_l'] - $before['km_per_l']) / $before['km_per_l'] * 100, 1),
        ];
    }

    /**
     * How much of the result is explained by the trial trip simply hauling more.
     *
     * Where a route's trial trip carried materially more than its baseline, the
     * honest answer depends on an unknown: how much of fuel use scales with the
     * weight being moved. Rather than pick a figure and present a single number,
     * this reports the whole range and the point at which the conclusion flips —
     * which is itself the finding. Settling it needs leg-by-leg fuel records,
     * not a better estimate.
     *
     * @param  Collection<int, FetTrialTrip>  $trips
     * @return array<string, mixed>|null
     */
    private function loadSensitivity(FetTrial $trial, Collection $trips): ?array
    {
        $tare = $trial->effectiveTareKg();
        if ($tare === null) {
            return null;
        }

        $best = null;
        foreach ($trips->pluck('route_key')->filter()->unique() as $key) {
            $before = $trips->filter(fn ($t) => $t->route_key === $key && $t->effectivePhase() === 'baseline')->values();
            $after = $trips->filter(fn ($t) => $t->route_key === $key && $t->effectivePhase() === 'trial')->values();
            if ($before->isEmpty() || $after->isEmpty()) {
                continue;
            }

            $bMass = $before->avg(fn ($t) => $t->averageGrossMassT($tare));
            $aMass = $after->avg(fn ($t) => $t->averageGrossMassT($tare));
            if (! $bMass || ! $aMass) {
                continue;
            }

            $gap = abs($aMass - $bMass) / $bMass * 100;
            if ($gap < 5 || ($best !== null && $gap <= $best['gap'])) {
                continue;
            }

            $bw = $this->weighted($before);
            $aw = $this->weighted($after);
            if (! $bw || ! $aw) {
                continue;
            }

            $best = ['gap' => $gap, 'key' => $key, 'label' => $after->first()->route_label,
                'b_mass' => round($bMass, 2), 'a_mass' => round($aMass, 2), 'bw' => $bw, 'aw' => $aw];
        }

        if ($best === null) {
            return null;
        }

        $ratio = $best['b_mass'] / $best['a_mass'];
        $rows = [];
        foreach ([0, 25, 50, 75, 100] as $share) {
            $factor = (1 - $share / 100) + ($share / 100) * $ratio;
            $litres = $best['aw']['litres'] * $factor;
            $kmPerL = $best['aw']['km'] / $litres;
            $rows[] = [
                'mass_dependent_pct' => $share,
                'litres' => round($litres, 2),
                'km_per_l' => round($kmPerL, 3),
                'change_pct' => round(($kmPerL - $best['bw']['km_per_l']) / $best['bw']['km_per_l'] * 100, 1),
            ];
        }

        // The share at which the adjusted result exactly matches the baseline.
        $needed = $best['aw']['litres'] / ($best['aw']['km'] / $best['bw']['km_per_l']);
        $breakEven = (1 - $ratio) != 0.0 ? round((1 - 1 / $needed) / (1 - $ratio) * 100, 1) : null;

        return [
            'route_label' => $best['label'],
            'baseline_mass_t' => $best['b_mass'],
            'trial_mass_t' => $best['a_mass'],
            'mass_gap_pct' => round($best['gap'], 1),
            'rows' => $rows,
            'break_even_pct' => ($breakEven !== null && $breakEven >= 0 && $breakEven <= 100) ? $breakEven : null,
        ];
    }

    /**
     * "Apac", "Apac and Moroto", "Apac, Moroto and Mpondwe" — these strings are
     * read by marketing and forwarded to clients, so they read as English.
     *
     * @param  array<int, string>  $items
     */
    private function list(array $items): string
    {
        if (count($items) <= 1) {
            return $items[0] ?? '';
        }

        $last = array_pop($items);

        return implode(', ', $items).' and '.$last;
    }

    /**
     * Mean load carried out, in kg, across the trips that recorded one.
     *
     * @param  Collection<int, FetTrialTrip>  $trips
     */
    private function meanLoadKg(Collection $trips): ?float
    {
        $loads = $trips->whereNotNull('load_out_kg')->map(fn ($t) => (int) $t->load_out_kg);

        return $loads->isEmpty() ? null : round($loads->avg(), 0);
    }
}
