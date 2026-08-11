<?php

namespace Tests\Feature;

use App\Models\FetTrial;
use App\Models\FetTrialTrip;
use App\Services\FetTrialAnalysisService;
use App\Services\FetTrialValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The maths and the evidence gate.
 *
 * Several tests run against the REAL first trial — Hariss International's truck
 * UA 758AM, exported from their tracking system in August 2026 and fixed in
 * tests/Fixtures/hariss-ua758am.json. That data is messy in exactly the ways
 * real client data is messy (a trip dated before the installation, a truck that
 * came back loaded, a journey that never finished), so it regression-tests the
 * module against reality rather than against a tidy invention.
 *
 * The expected figures below were calculated by hand from the source workbook
 * and are written up in planning/11-hariss-ua758am-trial-analysis.md.
 */
class FetTrialAnalysisTest extends TestCase
{
    use RefreshDatabase;

    private function analysis(FetTrial $trial): array
    {
        return app(FetTrialAnalysisService::class)->analyse($trial->fresh());
    }

    /** The real Hariss trial, loaded exactly as the importer will build it. */
    private function harissTrial(): FetTrial
    {
        $trial = FetTrial::create([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'Hariss International',
            'registration' => 'UA 758AM',
            'vehicle_make' => 'Faw',
            'vehicle_type' => 'Trailer',
            'rated_capacity_kg' => 30000,
            'device_serial' => 'CN2503F01S00071',
            'installed_on' => '2026-07-27',
            'trial_start' => '2026-07-27',
            'baseline_method' => 'measured',
            'fleet_standard_km_per_l' => 2.2,   // Hariss's own planning figure for a Faw
            'currency' => 'UGX',
            'fuel_price' => 5000,
            'status' => 'active',
        ]);

        $rows = json_decode(file_get_contents(base_path('tests/Fixtures/hariss-ua758am.json')), true);

        foreach ($rows as $row) {
            $markedTrial = $row['client_marked_trial'];
            unset($row['client_marked_trial'], $row['client_remark']);

            $trial->trips()->create($row + [
                // Derived from the installation date …
                'phase' => ($row['trip_date'] && $row['trip_date'] >= '2026-07-27') ? 'trial' : 'baseline',
                // … while the client's own marking is carried across separately,
                // so the two can be checked against each other.
                'phase_override' => $markedTrial ? 'trial' : null,
                'phase_override_reason' => $markedTrial ? 'Client marked this as a FET trial trip.' : null,
                'source' => 'import',
            ]);
        }

        app(FetTrialValidator::class)->validate($trial->fresh());

        return $trial->fresh();
    }

    /** A clean synthetic trial, for testing the maths without the mess. */
    private function cleanTrial(array $attributes = []): FetTrial
    {
        return FetTrial::create(array_merge([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'Test Fleet',
            'installed_on' => '2026-03-01',
            'currency' => 'UGX',
            'fuel_price' => 5000,
            'baseline_method' => 'measured',
        ], $attributes));
    }

    private function addTrip(FetTrial $trial, string $route, string $date, float $km, float $litres, array $extra = []): FetTrialTrip
    {
        return $trial->trips()->create(array_merge([
            'route_label' => $route,
            'trip_date' => $date,
            'distance_km' => $km,
            'fuel_issued_l' => $litres,
            'fuel_opening_l' => 500,
            'fuel_closing_l' => 500,           // opening == closing → fuel used == issued
            'phase' => $date >= '2026-03-01' ? 'trial' : 'baseline',
        ], $extra));
    }

    /* ── the two arithmetic rules ─────────────────────────────────────────── */

    public function test_consumption_is_weighted_by_distance_not_averaged_across_trips(): void
    {
        $trial = $this->cleanTrial();
        // A short thirsty trip and a long economical one. Averaging the two
        // trip figures gives 15.0 l/100km; the truth, weighted, is 11.0.
        $this->addTrip($trial, 'Short', '2026-01-05', 100, 20);    // 20 l/100km
        $this->addTrip($trial, 'Long', '2026-01-12', 900, 90);     // 10 l/100km

        $weighted = app(FetTrialAnalysisService::class)->weighted($trial->fresh()->trips()->get());

        $this->assertSame(1000.0, $weighted['km']);
        $this->assertSame(110.0, $weighted['litres']);
        $this->assertEqualsWithDelta(11.0, $weighted['l_per_100'], 0.01);
        $this->assertNotEqualsWithDelta(15.0, $weighted['l_per_100'], 0.01, 'must not average the per-trip averages');
    }

    public function test_hariss_baseline_matches_the_hand_calculation(): void
    {
        $analysis = $this->analysis($this->harissTrial());

        // Eight pre-installation trips: 5,954.63 km on 2,571.91 litres.
        $this->assertSame(8, $analysis['counts']['baseline_measurable']);

        $baselineKm = collect($analysis['routes'])->sum(fn ($r) => $r['baseline']['km'] ?? 0);
        $baselineL = collect($analysis['routes'])->sum(fn ($r) => $r['baseline']['litres'] ?? 0);

        $this->assertEqualsWithDelta(5954.63, $baselineKm, 0.01);
        $this->assertEqualsWithDelta(2571.91, $baselineL, 0.01);
        // 43.19 l/100km = 2.315 km/L. Averaging the trips instead gives 2.354.
        $this->assertEqualsWithDelta(43.19, $baselineL / $baselineKm * 100, 0.01);
    }

    public function test_expected_fuel_is_predicted_per_route_not_from_one_blended_baseline(): void
    {
        // An easy route (10 l/100km) and a hard one (20 l/100km), with the trial
        // trips falling mostly on the hard route. A blended baseline of
        // 15 l/100km would understate performance badly.
        $trial = $this->cleanTrial();
        foreach (['2026-01-05', '2026-01-15'] as $d) {
            $this->addTrip($trial, 'Easy', $d, 1000, 100);   // 10 l/100km
            $this->addTrip($trial, 'Hard', $d, 1000, 200);   // 20 l/100km
        }
        // After install: one easy trip and three hard ones, each 10% better.
        $this->addTrip($trial, 'Easy', '2026-03-05', 1000, 90);
        foreach (['2026-03-10', '2026-03-15', '2026-03-20'] as $d) {
            $this->addTrip($trial, 'Hard', $d, 1000, 180);
        }

        $h = $this->analysis($trial)['headline'];

        // Route-stratified: 1,000 km at 10 l/100km (100 L) + 3,000 km at
        // 20 l/100km (600 L) = 700 litres expected; 90 + 540 = 630 burned.
        $this->assertEqualsWithDelta(700.0, $h['expected_litres'], 0.01);
        $this->assertEqualsWithDelta(630.0, $h['actual_litres'], 0.01);
        $this->assertEqualsWithDelta(10.0, $h['saving_pct'], 0.01);

        // The point of the design: a single blended baseline (4,000 km on
        // 600 L = 15 l/100km, predicting 600 L over the 4,000 trial km) would
        // have reported this genuine 10% IMPROVEMENT as a 5% deterioration,
        // purely because the trial trips ran mostly on the harder route.
        $blended = (600.0 - 630.0) / 600.0 * 100;
        $this->assertEqualsWithDelta(-5.0, $blended, 0.01);
        $this->assertGreaterThan(0, $h['saving_pct'], 'route matching must not lose a real saving');
    }

    /* ── the evidence gate ────────────────────────────────────────────────── */

    public function test_hariss_trial_refuses_to_state_a_verdict(): void
    {
        $analysis = $this->analysis($this->harissTrial());

        $this->assertNull($analysis['verdict'], 'no verdict may be stated on this evidence');
        $this->assertNull($analysis['headline']);
        $this->assertSame('insufficient', $analysis['confidence']['level']);
        $this->assertFalse($analysis['confidence']['states_verdict']);

        // All three post-installation trips are held back for review, so none
        // of them reaches the maths.
        $this->assertSame(0, $analysis['counts']['trial_measurable']);
        $this->assertSame(3, $analysis['counts']['needs_review']);
    }

    public function test_only_mpondwe_holds_a_usable_baseline(): void
    {
        $analysis = $this->analysis($this->harissTrial());

        $byRoute = collect($analysis['routes'])->keyBy('route_key');

        // Mpondwe was the only destination run twice before installation.
        $this->assertSame(2, $byRoute['MPONDWE']['baseline']['trips']);
        foreach (['APAC', 'MOROTO', 'MASINDI', 'ARUA', 'BUGIRI', 'KABALE'] as $route) {
            $this->assertSame(1, $byRoute[$route]['baseline']['trips'], "{$route} should have a single baseline trip");
        }

        $this->assertCount(1, $analysis['routes_ready']);
        $this->assertSame('Mpondwe', $analysis['routes_ready'][0]['route_label']);
        $this->assertEqualsWithDelta(50.49, $analysis['routes_ready'][0]['l_per_100'], 0.01);
    }

    public function test_the_shortfall_names_the_route_to_send_the_next_trip_down(): void
    {
        $analysis = $this->analysis($this->harissTrial());
        $shortfall = implode(' ', $analysis['confidence']['shortfall']);

        $this->assertStringContainsString('Mpondwe', $shortfall);
        $this->assertStringContainsString('3', $shortfall, 'should say how many more trips are needed');
    }

    public function test_route_variance_dwarfs_the_effect_being_measured(): void
    {
        // The empirical justification for route-stratification. If this ever
        // stops holding on real data the design assumption needs revisiting.
        $routes = collect($this->analysis($this->harissTrial())['routes'])
            ->filter(fn ($r) => $r['baseline'] !== null)
            ->pluck('baseline.l_per_100');

        $spread = ($routes->max() - $routes->min()) / $routes->min() * 100;

        $this->assertEqualsWithDelta(41.1, $spread, 0.5);
        $this->assertGreaterThan(config('fet.verified_pct') * 2, $spread);
    }

    public function test_a_verdict_is_stated_once_the_evidence_supports_it(): void
    {
        $trial = $this->cleanTrial();
        foreach (['2026-01-05', '2026-01-15', '2026-01-25'] as $d) {
            $this->addTrip($trial, 'Mpondwe', $d, 800, 400);      // 50 l/100km
        }
        foreach (['2026-03-05', '2026-03-15', '2026-03-25'] as $d) {
            $this->addTrip($trial, 'Mpondwe', $d, 800, 344);      // 43 l/100km — 14% better
        }

        $analysis = $this->analysis($trial);

        $this->assertTrue($analysis['confidence']['states_verdict']);
        $this->assertNotNull($analysis['verdict']);
        $this->assertSame('saving', $analysis['verdict']['direction']);
        $this->assertEqualsWithDelta(14.0, $analysis['headline']['saving_pct'], 0.1);
        $this->assertStringContainsString('14.0% less fuel', $analysis['verdict']['statement']);

        // Money stays in the trial's own currency; CO2 follows the litres.
        $this->assertEqualsWithDelta(168.0, $analysis['headline']['litres_saved'], 0.1);
        $this->assertEqualsWithDelta(840000.0, $analysis['headline']['cost_saved'], 1.0);
    }

    public function test_an_open_question_on_a_counted_trip_holds_the_verdict_back(): void
    {
        $trial = $this->cleanTrial(['rated_capacity_kg' => 30000, 'fleet_standard_km_per_l' => 2.2]);
        foreach (['2026-01-05', '2026-01-15', '2026-01-25'] as $d) {
            $this->addTrip($trial, 'Mpondwe', $d, 800, 400, ['load_out_kg' => 29000]);
        }
        foreach (['2026-03-05', '2026-03-15', '2026-03-25'] as $d) {
            $this->addTrip($trial, 'Mpondwe', $d, 800, 344, ['load_out_kg' => 29000]);
        }
        // One counted trip carries an unresolved query — here, the manual and
        // tracker fuel figures disagreeing.
        $trial->trips()->where('trip_date', '2026-03-15')->update(['fuel_used_ivms_l' => 420]);
        app(FetTrialValidator::class)->validate($trial->fresh());

        $analysis = $this->analysis($trial);

        $this->assertSame('low', $analysis['confidence']['level']);
        $this->assertFalse($analysis['confidence']['states_verdict']);
        $this->assertNull($analysis['verdict'], 'a queried reading must be settled before the figure is shown');
        // The headline is still computed — staff can see what is at stake.
        $this->assertNotNull($analysis['headline']);
        $this->assertCount(1, $analysis['open_questions']);
        $this->assertStringContainsString('One question is still open', $analysis['confidence']['shortfall'][0]);

        // Settling it releases the verdict.
        $trial->flags()->where('code', 'ivms_variance_high')->first()
            ->update(['resolution' => 'accepted', 'resolution_note' => 'Client confirmed the manual figure.']);

        $after = $this->analysis($trial);
        $this->assertTrue($after['confidence']['states_verdict']);
        $this->assertNotNull($after['verdict']);
    }

    public function test_a_result_in_the_wrong_direction_is_reported_honestly(): void
    {
        $trial = $this->cleanTrial();
        foreach (['2026-01-05', '2026-01-15', '2026-01-25'] as $d) {
            $this->addTrip($trial, 'Mpondwe', $d, 800, 400);
        }
        foreach (['2026-03-05', '2026-03-15', '2026-03-25'] as $d) {
            $this->addTrip($trial, 'Mpondwe', $d, 800, 440);      // 10% worse
        }

        $analysis = $this->analysis($trial);

        $this->assertSame('increase', $analysis['verdict']['direction']);
        $this->assertEqualsWithDelta(-10.0, $analysis['headline']['saving_pct'], 0.1);
        $this->assertStringContainsString('more fuel', $analysis['verdict']['statement']);
    }

    public function test_a_single_baseline_trip_cannot_anchor_a_comparison(): void
    {
        $trial = $this->cleanTrial();
        $this->addTrip($trial, 'Kamwenge', '2026-01-05', 700, 350);   // one trip only
        foreach (['2026-03-05', '2026-03-15', '2026-03-25'] as $d) {
            $this->addTrip($trial, 'Kamwenge', $d, 700, 300);
        }

        $analysis = $this->analysis($trial);

        $this->assertNull($analysis['headline']);
        $this->assertSame('insufficient', $analysis['confidence']['level']);
        $this->assertSame('sparse_baseline', $analysis['routes'][0]['unmatched_reason']);
        $this->assertStringContainsString('one observation, not a baseline', $analysis['unmatched_trial_trips'][0]['explanation']);
    }

    public function test_a_route_with_a_different_load_profile_is_left_out_of_the_headline(): void
    {
        $trial = $this->cleanTrial(['rated_capacity_kg' => 30000]);
        foreach (['2026-01-05', '2026-01-15', '2026-01-25'] as $d) {
            $this->addTrip($trial, 'Mpondwe', $d, 800, 400, ['load_out_kg' => 30000]);
        }
        // Trial trips run near-empty — cheaper fuel, but not the same work.
        foreach (['2026-03-05', '2026-03-15', '2026-03-25'] as $d) {
            $this->addTrip($trial, 'Mpondwe', $d, 800, 300, ['load_out_kg' => 12000]);
        }

        $analysis = $this->analysis($trial);

        $this->assertNull($analysis['headline'], 'a 60% lighter load is not a like-for-like comparison');
        $this->assertSame('load_mismatch', $analysis['routes'][0]['unmatched_reason']);
        $this->assertStringContainsString('not doing the same work', $analysis['unmatched_trial_trips'][0]['explanation']);
    }

    /* ── route grouping ───────────────────────────────────────────────────── */

    public function test_route_spellings_group_together(): void
    {
        // If these ever stop grouping, route matching silently fails and the
        // headline quietly reverts to comparing unlike journeys.
        $this->assertSame('MPONDWE', FetTrialTrip::normaliseRoute('Mpondwe'));
        $this->assertSame('MPONDWE', FetTrialTrip::normaliseRoute('  mpondwe '));
        $this->assertSame('MPONDWE', FetTrialTrip::normaliseRoute('MPONDWE'));
        $this->assertSame('FORT PORTAL', FetTrialTrip::normaliseRoute('Fort-Portal'));
        $this->assertNull(FetTrialTrip::normaliseRoute('   '));
    }

    public function test_fuel_used_is_derived_from_whichever_readings_exist(): void
    {
        $trial = $this->cleanTrial();

        // Tank-dip: opening + issued + top-up - closing.
        $dip = $trial->trips()->create([
            'route_label' => 'A', 'trip_date' => '2026-01-05', 'distance_km' => 500,
            'fuel_opening_l' => 225.15, 'fuel_issued_l' => 330, 'fuel_closing_l' => 258.90,
        ]);
        $this->assertEqualsWithDelta(296.25, (float) $dip->fresh()->fuel_used_l, 0.01);
        $this->assertSame('tank_dip', $dip->fresh()->fuel_method);

        // Issued-only, where the client keeps no tank readings.
        $issued = $trial->trips()->create([
            'route_label' => 'B', 'trip_date' => '2026-01-06', 'distance_km' => 500, 'fuel_issued_l' => 200,
        ]);
        $this->assertEqualsWithDelta(200.0, (float) $issued->fresh()->fuel_used_l, 0.01);
        $this->assertSame('issued_only', $issued->fresh()->fuel_method);

        // Odometer readings win over a stated distance.
        $odo = $trial->trips()->create([
            'route_label' => 'C', 'trip_date' => '2026-01-07',
            'odo_out_km' => 85192, 'odo_in_km' => 85654, 'fuel_issued_l' => 100,
        ]);
        $this->assertEqualsWithDelta(462.0, (float) $odo->fresh()->distance_km, 0.01);
    }
}
