<?php

namespace Tests\Feature;

use App\Models\FetTrial;
use App\Services\FetTrialAnalysisService;
use App\Services\FetTrialValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The secondary lenses, checked against an INDEPENDENT assessment.
 *
 * S-Line Motors Ltd reviewed the same UA 758AM workbook for Vitorra on
 * 11 August 2026 and published their figures. These tests assert our analysis
 * reproduces them, which is a far stronger check than agreeing with ourselves:
 * two parties, working separately from the same records, reaching the same
 * numbers.
 *
 * Small differences are expected and bounded. They derive the return payload
 * from the weighbridge NET_WEIGHT column; we derive it from the recorded return
 * weight less the vehicle's empty weight. That moves a tonne either way and no
 * more.
 */
class FetTrialSecondaryMeasuresTest extends TestCase
{
    use RefreshDatabase;

    private function harissTrial(): FetTrial
    {
        $trial = FetTrial::create([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'Hariss International',
            'rated_capacity_kg' => 30000,
            'installed_on' => '2026-07-27',
            'fleet_standard_km_per_l' => 2.2,
            'currency' => 'UGX',
        ]);

        foreach (json_decode(file_get_contents(base_path('tests/Fixtures/hariss-ua758am.json')), true) as $row) {
            $marked = $row['client_marked_trial'];
            unset($row['client_marked_trial'], $row['client_remark']);
            $trial->trips()->create($row + [
                'phase' => ($row['trip_date'] && $row['trip_date'] >= '2026-07-27') ? 'trial' : 'baseline',
                'phase_override' => $marked ? 'trial' : null,
                'source' => 'import',
            ]);
        }
        app(FetTrialValidator::class)->validate($trial->fresh());

        return $trial->fresh();
    }

    private function analysis(): array
    {
        return app(FetTrialAnalysisService::class)->analyse($this->harissTrial());
    }

    public function test_transport_work_matches_the_independent_assessment(): void
    {
        // S-Line: 34.09 t-km/L before, 39.57 after, +16.1%.
        $w = $this->analysis()['transport_work'];

        $this->assertEqualsWithDelta(34.09, $w['baseline']['tkm_per_l'], 0.15);
        $this->assertEqualsWithDelta(39.57, $w['trial']['tkm_per_l'], 0.15);
        $this->assertEqualsWithDelta(16.1, $w['change_pct'], 0.5);

        // The direction is the point: distance efficiency says worse, cargo
        // work says better, on the very same journeys.
        $this->assertGreaterThan(0, $w['change_pct'], 'cargo work per litre improved');
        $this->assertStringContainsString('cannot on its own show', $w['note']);
    }

    public function test_position_against_the_clients_own_planning_figure(): void
    {
        // S-Line: +5.2% before, -12.7% after, against Hariss's 2.20 km/L.
        $r = $this->analysis()['reference'];

        $this->assertEqualsWithDelta(2.2, $r['km_per_l'], 0.001);
        $this->assertEqualsWithDelta(5.2, $r['baseline_pct'], 0.2);
        $this->assertEqualsWithDelta(-12.7, $r['trial_pct'], 0.2);
    }

    public function test_the_load_sensitivity_band_matches_the_assessment(): void
    {
        // S-Line normalised the loaded-return Masindi trip to the earlier
        // trip's gross mass across five assumptions, and found the conclusion
        // flips at about 66.7%. Reproducing that band is the whole point: the
        // answer is a range, not a number.
        $s = $this->analysis()['load_sensitivity'];

        $this->assertSame('Masindi', $s['route_label']);
        $this->assertEqualsWithDelta(34.18, $s['baseline_mass_t'], 0.1);
        $this->assertEqualsWithDelta(48.67, $s['trial_mass_t'], 0.1);

        $byShare = collect($s['rows'])->keyBy('mass_dependent_pct');
        $this->assertEqualsWithDelta(220.12, $byShare[0]['litres'], 0.05);
        $this->assertEqualsWithDelta(187.35, $byShare[50]['litres'], 0.1);
        $this->assertEqualsWithDelta(154.59, $byShare[100]['litres'], 0.05);

        $this->assertEqualsWithDelta(-19.9, $byShare[0]['change_pct'], 0.3);
        $this->assertEqualsWithDelta(14.1, $byShare[100]['change_pct'], 0.3);

        // The finding itself: worse under weak assumptions, better under strong
        // ones, flipping around two-thirds.
        $this->assertEqualsWithDelta(66.7, $s['break_even_pct'], 1.0);
    }

    public function test_the_secondary_measure_is_omitted_when_the_client_has_no_tracker_data(): void
    {
        $trial = FetTrial::create([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'No Tracker Ltd',
            'installed_on' => '2026-03-01',
            'currency' => 'UGX',
        ]);
        $trial->trips()->create(['route_label' => 'A', 'trip_date' => '2026-01-05', 'distance_km' => 800, 'fuel_issued_l' => 400]);
        $trial->trips()->create(['route_label' => 'A', 'trip_date' => '2026-04-05', 'distance_km' => 800, 'fuel_issued_l' => 350]);

        $this->assertNull(app(FetTrialAnalysisService::class)->analyse($trial->fresh())['secondary']);
    }

    public function test_the_secondary_lenses_never_move_the_verdict(): void
    {
        // Cargo work improved 16%. The verdict must still be withheld — the
        // contractual measure is distance efficiency, and the evidence for it
        // does not exist yet. A favourable secondary reading is not a result.
        $analysis = $this->analysis();

        $this->assertGreaterThan(0, $analysis['transport_work']['change_pct']);
        $this->assertNull($analysis['verdict']);
        $this->assertSame('insufficient', $analysis['confidence']['level']);
    }
}
