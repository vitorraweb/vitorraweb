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

        $confidence = $this->confidence($trial, $matched, $ready, $headline, $blocking, $warnings, $heldTrial->count());

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
    private function confidence(FetTrial $trial, array $matched, array $ready, ?array $headline, array $blocking, array $warnings, int $heldTrialTrips = 0): array
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
            $shortfall[] = $heldTrialTrips > 0
                ? ($heldTrialTrips === 1
                    ? 'One trip has run since the device was fitted, but it cannot be counted yet — see the questions above. Its figures are still shown, marked as not counted.'
                    : $heldTrialTrips.' trips have run since the device was fitted, but none can be counted yet — see the questions above. Their figures are still shown, marked as not counted.')
                : 'No route yet has both a usable "before" figure and a trip since the device was fitted.';
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
        return $trial->flags()
            ->where('severity', 'error')
            ->whereNull('resolution')
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
