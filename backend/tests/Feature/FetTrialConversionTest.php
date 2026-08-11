<?php

namespace Tests\Feature;

use App\Models\FetInstallation;
use App\Models\FetTrial;
use App\Models\Prospect;
use App\Models\User;
use App\Services\FetTrialConversionService;
use App\Services\FetTrialValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Closing a trial, and handing a won one to the post-sale savings loop.
 *
 * The point of the handover is the baseline. A trial that reached a verdict has
 * measured what that exact vehicle used on those exact routes — far better than
 * the class-average figure a new installation would otherwise be measured
 * against. Carrying it across means the proof that won the sale is the same
 * proof that keeps running afterwards.
 */
class FetTrialConversionTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::create([
            'name' => 'Marketer', 'email' => 'm-'.uniqid().'@vitorra.org',
            'password' => 'password123', 'role' => 'ops', 'department' => 'marketing',
        ]);
    }

    /** A trial with enough matched evidence to carry a verdict. */
    private function provenTrial(array $overrides = []): FetTrial
    {
        $trial = FetTrial::create(array_merge([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'Hariss International',
            'contact_name' => 'Fleet Manager',
            'contact_email' => 'fleet@hariss.example',
            'registration' => 'UA 758AM',
            'vehicle_make' => 'Faw',
            'vehicle_type' => 'Trailer',
            'rated_capacity_kg' => 30000,
            'installed_on' => '2026-07-27',
            'currency' => 'UGX',
            'fuel_price' => 5000,
            'status' => 'report_ready',
        ], $overrides));

        foreach (['2026-07-05', '2026-07-12', '2026-07-19'] as $d) {
            $trial->trips()->create([
                'route_label' => 'Mpondwe', 'trip_date' => $d, 'distance_km' => 800,
                'fuel_opening_l' => 500, 'fuel_issued_l' => 400, 'fuel_closing_l' => 500,
                'load_out_kg' => 29500, 'phase' => 'baseline',
            ]);
        }
        foreach (['2026-08-01', '2026-08-06', '2026-08-11'] as $d) {
            $trial->trips()->create([
                'route_label' => 'Mpondwe', 'trip_date' => $d, 'distance_km' => 800,
                'fuel_opening_l' => 500, 'fuel_issued_l' => 344, 'fuel_closing_l' => 500,
                'load_out_kg' => 29500, 'phase' => 'trial',
            ]);
        }
        app(FetTrialValidator::class)->validate($trial->fresh());

        return $trial->fresh();
    }

    /* ── winning ──────────────────────────────────────────────────────────── */

    public function test_winning_a_trial_creates_the_installation_that_continues_it(): void
    {
        $trial = $this->provenTrial();

        $response = $this->actingAs($this->staff(), 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/outcome", [
                'outcome' => 'won',
                'units_sold' => 12,
                'deal_value' => 23484000,
                'outcome_note' => 'Fleet-wide rollout agreed for 12 trucks.',
            ])->assertOk();

        $trial = $trial->fresh();
        $this->assertSame('won', $trial->status);
        $this->assertSame(12, $trial->units_sold);
        $this->assertNotNull($trial->decided_on);

        $installation = FetInstallation::find($trial->fet_installation_id);
        $this->assertNotNull($installation, 'a won trial must produce an installation');
        $this->assertStringStartsWith('FET-INST-', $installation->reference);
        $this->assertSame($installation->reference, $response->json('installation.reference'));

        // Customer details and the vehicle carry across.
        $this->assertSame('Hariss International', $installation->company);
        $this->assertSame('fleet@hariss.example', $installation->customer_email);
        $this->assertSame('UA 758AM', $installation->registration);
        $this->assertSame('heavytruck', $installation->tier);
        $this->assertSame('2026-07-27', $installation->installed_on->toDateString());
    }

    public function test_the_measured_baseline_carries_into_the_installation(): void
    {
        // 800 km on 400 L = 50 l/100km before the device. Without the trial the
        // installation would have used the 32 l/100km class default and
        // understated this customer's savings from day one.
        $trial = $this->provenTrial();

        app(FetTrialConversionService::class)->recordOutcome($trial, 'won');

        $installation = FetInstallation::find($trial->fresh()->fet_installation_id);

        $this->assertEqualsWithDelta(50.0, (float) $installation->baseline_l_per_100, 0.1);
        $this->assertSame('measured', $installation->baseline_source);
        $this->assertNotEquals(
            config('fet.tiers.heavytruck.baseline_l_per_100'),
            (float) $installation->baseline_l_per_100,
            'the class default must not override a real measurement'
        );
        $this->assertStringContainsString('measured during the trial', $installation->notes);
    }

    public function test_a_trial_without_a_verdict_does_not_hand_over_an_undefendable_baseline(): void
    {
        // Sold on the strength of the pitch rather than the trial. The
        // installation is still created, but it inherits no measured figure —
        // the same strict gate that governs everything else.
        $trial = FetTrial::create([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'Thin Evidence Ltd',
            'rated_capacity_kg' => 30000,
            'installed_on' => '2026-07-27',
            'currency' => 'UGX',
            'fleet_standard_km_per_l' => 2.2,
        ]);
        $trial->trips()->create([
            'route_label' => 'Apac', 'trip_date' => '2026-07-04', 'distance_km' => 828.24,
            'fuel_opening_l' => 225.15, 'fuel_issued_l' => 330, 'fuel_closing_l' => 258.90, 'phase' => 'baseline',
        ]);
        app(FetTrialValidator::class)->validate($trial->fresh());

        app(FetTrialConversionService::class)->recordOutcome($trial->fresh(), 'won');

        $installation = FetInstallation::find($trial->fresh()->fet_installation_id);

        $this->assertNotNull($installation);
        $this->assertSame('declared', $installation->baseline_source);
        // 2.2 km/L stated by the client = 45.45 l/100km, not a measurement.
        $this->assertEqualsWithDelta(45.45, (float) $installation->baseline_l_per_100, 0.1);
        $this->assertStringNotContainsString('measured during the trial', $installation->notes ?? '');
    }

    public function test_recording_the_outcome_twice_does_not_duplicate_the_installation(): void
    {
        $trial = $this->provenTrial();
        $service = app(FetTrialConversionService::class);

        $service->recordOutcome($trial, 'won', ['units_sold' => 12]);
        $first = $trial->fresh()->fet_installation_id;

        $service->recordOutcome($trial->fresh(), 'won', ['units_sold' => 14]);

        $this->assertSame($first, $trial->fresh()->fet_installation_id);
        $this->assertSame(1, FetInstallation::count());
        $this->assertSame(14, $trial->fresh()->units_sold, 'the details still update');
    }

    /* ── losing ───────────────────────────────────────────────────────────── */

    public function test_losing_a_trial_records_why_and_creates_nothing(): void
    {
        $trial = $this->provenTrial();

        $this->actingAs($this->staff(), 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/outcome", [
                'outcome' => 'lost',
                'outcome_note' => 'Went with a competitor on price.',
            ])->assertOk();

        $trial = $trial->fresh();
        $this->assertSame('lost', $trial->status);
        $this->assertStringContainsString('competitor', $trial->outcome_note);
        $this->assertNull($trial->fet_installation_id);
        $this->assertSame(0, FetInstallation::count());
        // Commercial detail is meaningless on a loss and is not kept.
        $this->assertNull($trial->units_sold);
    }

    public function test_a_closed_trial_can_be_reopened(): void
    {
        $trial = $this->provenTrial();
        $staff = $this->staff();

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/outcome", ['outcome' => 'lost'])->assertOk();

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/reopen")->assertOk();

        $this->assertSame('review', $trial->fresh()->status);
        $this->assertNull($trial->fresh()->decided_on);
    }

    /* ── the CRM ──────────────────────────────────────────────────────────── */

    public function test_closing_a_trial_moves_its_prospect_out_of_the_outreach_list(): void
    {
        $prospect = Prospect::create([
            'name' => 'Hariss International', 'category' => 'MANUFACTURING',
            'product' => 'FET', 'outreach_status' => 'qualified',
        ]);
        $trial = $this->provenTrial(['prospect_id' => $prospect->id]);

        app(FetTrialConversionService::class)->recordOutcome($trial, 'won');
        $this->assertSame('converted', $prospect->fresh()->outreach_status);

        $lost = $this->provenTrial(['prospect_id' => $prospect->id]);
        app(FetTrialConversionService::class)->recordOutcome($lost, 'lost');
        $this->assertSame('not_interested', $prospect->fresh()->outreach_status);
    }

    public function test_the_outcome_is_internal_and_never_reaches_the_client_link(): void
    {
        $trial = $this->provenTrial();
        app(FetTrialConversionService::class)
            ->recordOutcome($trial, 'won', ['deal_value' => 23484000, 'units_sold' => 12]);

        $token = $trial->fresh()->issueShareToken();
        $data = $this->getJson("/api/trials/{$token}")->assertOk()->json('data');

        $this->assertNull($data['deal_value'], 'a client must never see what we sold it for');
        $this->assertNull($data['units_sold']);
        $this->assertNull($data['outcome_note']);
        $this->assertNull($data['installation']);
    }

    public function test_an_invalid_outcome_is_refused(): void
    {
        $trial = $this->provenTrial();

        $this->actingAs($this->staff(), 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/outcome", ['outcome' => 'maybe'])
            ->assertStatus(422);
    }
}
