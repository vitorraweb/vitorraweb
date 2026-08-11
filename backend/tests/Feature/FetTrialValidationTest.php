<?php

namespace Tests\Feature;

use App\Models\FetTrial;
use App\Services\FetTrialAnalysisService;
use App\Services\FetTrialValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The data-quality checks. Every rule below fires on a real row from the first
 * client trial (Hariss, UA 758AM) or on the situation that row represents —
 * these are the mistakes real fleet data actually contains, not invented ones.
 */
class FetTrialValidationTest extends TestCase
{
    use RefreshDatabase;

    private function trial(array $attributes = []): FetTrial
    {
        return FetTrial::create(array_merge([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'Hariss International',
            'rated_capacity_kg' => 30000,
            'tare_kg' => 19100,
            'installed_on' => '2026-07-27',
            'fleet_standard_km_per_l' => 2.2,
            'currency' => 'UGX',
        ], $attributes));
    }

    private function validate(FetTrial $trial): array
    {
        return app(FetTrialValidator::class)->validate($trial->fresh());
    }

    private function codes(FetTrial $trial): array
    {
        return $trial->fresh()->flags()->pluck('code')->all();
    }

    /* ── the three real Hariss failures ───────────────────────────────────── */

    public function test_a_trial_trip_dated_before_the_installation_is_caught(): void
    {
        // The real Kamwenge row: the client marked it as a trial trip, but every
        // timestamp on it says 1 April — nearly four months before the unit went on.
        $trial = $this->trial();
        $trip = $trial->trips()->create([
            'route_label' => 'Kamwenge', 'trip_date' => '2026-04-01', 'return_date' => '2026-04-04',
            'distance_km' => 701.30, 'fuel_opening_l' => 92, 'fuel_issued_l' => 400, 'fuel_closing_l' => 115,
            'phase' => 'baseline', 'phase_override' => 'trial',
        ]);

        $this->validate($trial);

        $this->assertContains('trip_before_install', $this->codes($trial));
        $flag = $trial->flags()->where('code', 'trip_before_install')->first();
        $this->assertSame('error', $flag->severity);
        $this->assertStringContainsString('1 Apr 2026', $flag->message);
        $this->assertStringContainsString('27 Jul 2026', $flag->message);
        // An unresolved error keeps the trip out of the maths, visibly.
        $this->assertSame('review', $trip->fresh()->status);
    }

    public function test_a_truck_that_came_back_loaded_is_caught(): void
    {
        // The real Masindi row: return weight 49,120 kg against a 19,100 kg tare
        // — roughly 30 tonnes of sugar carried back as well as 30 tonnes out.
        $trial = $this->trial();
        $trip = $trial->trips()->create([
            'route_label' => 'Masindi', 'trip_date' => '2026-07-28',
            'distance_km' => 444.98, 'fuel_opening_l' => 142, 'fuel_issued_l' => 170, 'fuel_closing_l' => 91.88,
            'load_out_kg' => 29160, 'load_in_kg' => 49120, 'phase' => 'trial',
        ]);

        $this->validate($trial);

        $this->assertContains('return_loaded', $this->codes($trial));
        $flag = $trial->flags()->where('code', 'return_loaded')->first();
        $this->assertSame('error', $flag->severity);
        $this->assertStringContainsString('49,120', $flag->message);
        $this->assertStringContainsString('twice the work', $flag->message);
        $this->assertSame('review', $trip->fresh()->status);
    }

    public function test_a_trip_with_no_distance_is_caught(): void
    {
        // The real Kitgum row: dispatched, never completed, no mileage recorded.
        $trial = $this->trial();
        $trip = $trial->trips()->create([
            'route_label' => 'Kitgum', 'fuel_opening_l' => 115, 'fuel_issued_l' => 320, 'phase' => 'trial',
        ]);

        $this->validate($trial);

        $codes = $this->codes($trial);
        $this->assertContains('no_distance', $codes);
        $this->assertContains('missing_date', $codes);
        $this->assertSame('review', $trip->fresh()->status);
    }

    /* ── the rest of the catalogue ────────────────────────────────────────── */

    public function test_tonnes_entered_where_kilogrammes_are_expected_is_caught(): void
    {
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Apac', 'trip_date' => '2026-07-04', 'distance_km' => 828.24,
            'fuel_issued_l' => 296, 'load_out_kg' => 29,   // 29 tonnes typed into a kg field
        ]);

        $this->validate($trial);

        $this->assertContains('load_units_suspect', $this->codes($trial));
    }

    public function test_a_load_above_rated_capacity_is_caught(): void
    {
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Masindi', 'trip_date' => '2026-07-07', 'distance_km' => 414.19,
            'fuel_issued_l' => 164, 'load_out_kg' => 30160,   // the real 6 July load, over a 30,000 kg rating
        ]);

        $this->validate($trial);

        $this->assertContains('load_above_capacity', $this->codes($trial));
        $this->assertSame('warn', $trial->flags()->where('code', 'load_above_capacity')->first()->severity);
    }

    public function test_manual_and_tracker_fuel_figures_that_disagree_are_caught(): void
    {
        // The real Mpondwe row: 434.07 litres by hand, 444.97 by tracker.
        // Here the gap is widened past the threshold to prove the rule fires.
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Mpondwe', 'trip_date' => '2026-07-24', 'distance_km' => 842.14,
            'fuel_opening_l' => 286.87, 'fuel_issued_l' => 290, 'fuel_closing_l' => 142.80,
            'fuel_used_ivms_l' => 330,
        ]);

        $this->validate($trial);

        $this->assertContains('ivms_variance_high', $this->codes($trial));
        $flag = $trial->flags()->where('code', 'ivms_variance_high')->first();
        $this->assertStringContainsString('One of the two is wrong', $flag->message);
    }

    public function test_an_impossible_fuel_figure_is_caught(): void
    {
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Arua', 'trip_date' => '2026-07-18', 'distance_km' => 977.48,
            'fuel_opening_l' => 100, 'fuel_issued_l' => 50, 'fuel_closing_l' => 400,  // more in the tank than went in
        ]);

        $this->validate($trial);

        $this->assertContains('no_fuel', $this->codes($trial));
        $this->assertStringContainsString('closing tank reading is higher', $trial->flags()->where('code', 'no_fuel')->first()->message);
    }

    public function test_fuel_use_far_outside_the_plausible_band_is_caught(): void
    {
        $trial = $this->trial();   // fleet standard 2.2 km/L = 45.45 l/100km
        $trial->trips()->create([
            'route_label' => 'Bugiri', 'trip_date' => '2026-07-22', 'distance_km' => 316.33,
            'fuel_issued_l' => 1400,   // 442 l/100km — a mistyped digit
        ]);

        $this->validate($trial);

        $this->assertContains('efficiency_out_of_band', $this->codes($trial));
    }

    public function test_the_same_trip_imported_twice_is_caught(): void
    {
        $trial = $this->trial();
        foreach ([1, 2] as $_) {
            $trial->trips()->create([
                'route_label' => 'Moroto', 'trip_date' => '2026-07-09',
                'distance_km' => 928.42, 'fuel_issued_l' => 338,
            ]);
        }

        $this->validate($trial);

        $this->assertContains('duplicate_trip', $this->codes($trial));
    }

    public function test_planned_distance_is_flagged_as_weaker_than_measured(): void
    {
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Apac', 'trip_date' => '2026-07-04', 'distance_km' => 860,
            'distance_source' => 'planned', 'fuel_issued_l' => 296,
        ]);

        $this->validate($trial);

        $this->assertContains('planned_distance_used', $this->codes($trial));
    }

    public function test_a_frozen_baseline_prompts_asking_for_the_clients_history(): void
    {
        // Once the unit is fitted the "before" data can never be collected again.
        // The only remaining fix is the client's own records — worth raising early.
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Kabale', 'trip_date' => '2026-07-15', 'distance_km' => 805.16,
            'fuel_issued_l' => 368, 'phase' => 'baseline',
        ]);

        $this->validate($trial);

        $this->assertContains('baseline_frozen', $this->codes($trial));
        $flag = $trial->flags()->where('code', 'baseline_frozen')->first();
        $this->assertStringContainsString('earlier trip history', $flag->suggested_action);
    }

    /* ── living with flags ────────────────────────────────────────────────── */

    public function test_resolving_a_blocking_flag_returns_the_trip_to_the_maths(): void
    {
        $trial = $this->trial();
        $trip = $trial->trips()->create([
            'route_label' => 'Masindi', 'trip_date' => '2026-07-28', 'distance_km' => 444.98,
            'fuel_issued_l' => 220, 'load_out_kg' => 29160, 'load_in_kg' => 49120, 'phase' => 'trial',
        ]);

        $this->validate($trial);
        $this->assertSame('review', $trip->fresh()->status);

        // A human confirms the baseline trips also ran loaded both ways.
        $trial->flags()->where('code', 'return_loaded')->first()
            ->update(['resolution' => 'accepted', 'resolution_note' => 'Baseline trips also ran loaded both ways.', 'resolved_at' => now()]);

        $this->validate($trial);

        $this->assertSame('valid', $trip->fresh()->status);
        $this->assertEmpty(app(FetTrialAnalysisService::class)->analyse($trial->fresh())['blocking_flags']);
    }

    public function test_revalidating_keeps_human_decisions_and_drops_stale_findings(): void
    {
        $trial = $this->trial();
        $trip = $trial->trips()->create([
            'route_label' => 'Kitgum', 'trip_date' => '2026-08-04', 'fuel_issued_l' => 320, 'phase' => 'trial',
        ]);

        $this->validate($trial);
        $trial->flags()->where('code', 'no_distance')->first()
            ->update(['resolution' => 'accepted', 'resolution_note' => 'Client confirmed the trip was abandoned.']);

        // Re-running must not wipe that decision or duplicate the finding.
        $this->validate($trial);
        $this->assertCount(1, $trial->fresh()->flags()->where('code', 'no_distance')->get());
        $this->assertSame('accepted', $trial->fresh()->flags()->where('code', 'no_distance')->first()->resolution);

        // Once the distance arrives the finding disappears by itself.
        $trip->update(['distance_km' => 800]);
        $this->validate($trial);
        $this->assertNotContains('no_distance', $this->codes($trial));
    }

    public function test_a_trip_excluded_by_hand_stays_excluded(): void
    {
        $trial = $this->trial();
        $trip = $trial->trips()->create([
            'route_label' => 'Apac', 'trip_date' => '2026-07-04', 'distance_km' => 828.24,
            'fuel_issued_l' => 296, 'status' => 'excluded', 'exclusion_reason' => 'Driver reported a fuel theft.',
        ]);

        $this->validate($trial);

        $this->assertSame('excluded', $trip->fresh()->status);
    }

    public function test_clean_data_raises_nothing(): void
    {
        $trial = $this->trial(['installed_on' => null]);
        $trial->trips()->create([
            'route_label' => 'Mpondwe', 'trip_date' => '2026-07-12', 'return_date' => '2026-07-14',
            'distance_km' => 842.67, 'fuel_opening_l' => 306.66, 'fuel_issued_l' => 390, 'fuel_closing_l' => 280,
            'fuel_used_ivms_l' => 428.64, 'load_out_kg' => 29240, 'load_in_kg' => 19080,
        ]);

        $counts = $this->validate($trial);

        $this->assertSame(0, $counts['error']);
        $this->assertSame(0, $counts['warn']);
    }
}
