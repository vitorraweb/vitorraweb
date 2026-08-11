<?php

namespace Tests\Feature;

use App\Models\FetTrial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * The trial API end to end, including importing the REAL client workbook —
 * tests/Fixtures/hariss-ua758am.xlsx is the file Hariss International actually
 * sent for truck UA 758AM. Parsing it here means the importer is tested against
 * the messy shape real client exports arrive in (title rows above the headings,
 * a column headed "tonnes" holding kilogrammes, near-duplicate "Consumed" and
 * "Consumed (IVMS)" headings, a trip with no distance at all).
 */
class FetTrialApiTest extends TestCase
{
    use RefreshDatabase;

    private function staff(string $role = 'ops', ?string $department = 'marketing'): User
    {
        return User::create([
            'name' => 'Marketer',
            'email' => $role.'-'.uniqid().'@vitorra.org',
            'password' => 'password123',
            'role' => $role,
            'department' => $department,
        ]);
    }

    private function trial(array $overrides = []): FetTrial
    {
        return FetTrial::create(array_merge([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'Hariss International',
            'registration' => 'UA 758AM',
            'rated_capacity_kg' => 30000,
            'installed_on' => '2026-07-27',
            'fleet_standard_km_per_l' => 2.2,
            'currency' => 'UGX',
            'fuel_price' => 5000,
        ], $overrides));
    }

    private function workbook(): UploadedFile
    {
        return new UploadedFile(
            base_path('tests/Fixtures/hariss-ua758am.xlsx'),
            'UA 758AM FET REPORT.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true // already a real file — do not re-validate as a fresh upload
        );
    }

    /* ── access ───────────────────────────────────────────────────────────── */

    public function test_marketing_can_reach_trials_but_not_the_post_sale_savings_module(): void
    {
        $marketing = $this->staff('ops', 'marketing');

        // Marketing runs the client trials …
        $this->actingAs($marketing, 'sanctum')->getJson('/api/admin/fet-trials')->assertOk();
        // … but has no business in operations' post-sale savings records.
        $this->actingAs($marketing, 'sanctum')->getJson('/api/admin/fet')->assertForbidden();
    }

    public function test_it_department_cannot_reach_trials(): void
    {
        $this->actingAs($this->staff('ops', 'it'), 'sanctum')
            ->getJson('/api/admin/fet-trials')->assertForbidden();
    }

    public function test_signed_out_visitors_cannot_reach_trials(): void
    {
        $this->getJson('/api/admin/fet-trials')->assertUnauthorized();
    }

    /* ── setup ────────────────────────────────────────────────────────────── */

    public function test_a_trial_can_be_created_and_gets_a_reference(): void
    {
        $response = $this->actingAs($this->staff(), 'sanctum')->postJson('/api/admin/fet-trials', [
            'client_company' => 'Hariss International',
            'registration' => 'UA 758AM',
            'rated_capacity_kg' => 30000,
            'installed_on' => '2026-07-27',
            'currency' => 'UGX',
        ])->assertCreated();

        $this->assertStringStartsWith('TRIAL-', $response->json('data.reference'));
        $this->assertSame('UA 758AM', $response->json('data.registration'));
        // A brand new trial states nothing.
        $this->assertNull($response->json('data.analysis.verdict'));
        $this->assertSame('insufficient', $response->json('data.analysis.confidence.level'));
    }

    /* ── importing the real client workbook ───────────────────────────────── */

    public function test_the_real_client_workbook_is_read_and_mapped(): void
    {
        $trial = $this->trial();

        $response = $this->actingAs($this->staff(), 'sanctum')
            ->post("/api/admin/fet-trials/{$trial->id}/imports/preview", ['file' => $this->workbook()])
            ->assertOk();

        // The trip sheet is picked ahead of the weighbridge and summary tabs.
        $this->assertSame('Data_Sheet', $response->json('preview.sheet'));

        $mapping = $response->json('preview.mapping');
        $this->assertSame('Destination', $mapping['route_label']);
        $this->assertSame('Mileage (Km)', $mapping['distance_km']);
        $this->assertSame('Initial fuel', $mapping['fuel_opening_l']);
        $this->assertSame('Fuel Given', $mapping['fuel_issued_l']);
        $this->assertSame('Final', $mapping['fuel_closing_l']);
        // The near-identical headings must not be confused with one another.
        $this->assertSame('Consumed (IVMS)', $mapping['fuel_used_ivms_l']);
        $this->assertSame('Consumed', $mapping['fuel_used_l']);

        $this->assertSame(11, $response->json('preview.row_count'));
        $this->assertNotEmpty($response->json('handle'));
    }

    public function test_a_load_column_headed_tonnes_but_holding_kilogrammes_is_queried_not_guessed(): void
    {
        $trial = $this->trial();

        $response = $this->actingAs($this->staff(), 'sanctum')
            ->post("/api/admin/fet-trials/{$trial->id}/imports/preview", ['file' => $this->workbook()])
            ->assertOk();

        $questions = collect($response->json('preview.unit_questions'));
        $load = $questions->firstWhere('field', 'load_out_kg');

        $this->assertNotNull($load, 'the ambiguous unit must be raised, never assumed');
        $this->assertSame('Actual Load(T)', $load['header']);
        $this->assertStringContainsString('headed as tonnes', $load['question']);
        $this->assertSame('kg', $load['suggested']);
    }

    public function test_committing_the_workbook_produces_the_hand_calculated_analysis(): void
    {
        $trial = $this->trial();
        $staff = $this->staff();

        $preview = $this->actingAs($staff, 'sanctum')
            ->post("/api/admin/fet-trials/{$trial->id}/imports/preview", ['file' => $this->workbook()])->assertOk();

        $response = $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/imports/commit", [
                'handle' => $preview->json('handle'),
                'filename' => 'UA 758AM FET REPORT.xlsx',
                'sheet' => 'Data_Sheet',
                'mapping' => $preview->json('preview.mapping'),
                'units' => ['load_out_kg' => 'kg', 'load_in_kg' => 'kg'],
            ])->assertOk();

        $this->assertSame(11, $response->json('import.rows_imported'));

        $analysis = $response->json('data.analysis');

        // Exactly what the hand analysis found (planning/11-…-trial-analysis.md).
        $this->assertSame(8, $analysis['counts']['baseline_measurable']);
        $this->assertSame(0, $analysis['counts']['trial_measurable']);
        $this->assertSame(3, $analysis['counts']['needs_review']);
        $this->assertNull($analysis['verdict']);
        $this->assertSame('insufficient', $analysis['confidence']['level']);

        // Mpondwe is the only route with a usable "before" figure.
        $this->assertCount(1, $analysis['routes_ready']);
        $this->assertSame('Mpondwe', $analysis['routes_ready'][0]['route_label']);
        $this->assertEqualsWithDelta(50.49, $analysis['routes_ready'][0]['l_per_100'], 0.01);

        // The three real problems are found by their own rules.
        $codes = collect($response->json('data.flags'))->pluck('code');
        $this->assertContains('trip_before_install', $codes);   // Kamwenge, dated April
        $this->assertContains('return_loaded', $codes);         // Masindi, came back with sugar
        $this->assertContains('no_distance', $codes);           // Kitgum, never finished
    }

    public function test_re_importing_an_updated_export_keeps_decisions_already_made(): void
    {
        $trial = $this->trial();
        $staff = $this->staff();

        $commit = function () use ($trial, $staff) {
            $preview = $this->actingAs($staff, 'sanctum')
                ->post("/api/admin/fet-trials/{$trial->id}/imports/preview", ['file' => $this->workbook()])->assertOk();

            return $this->actingAs($staff, 'sanctum')
                ->postJson("/api/admin/fet-trials/{$trial->id}/imports/commit", [
                    'handle' => $preview->json('handle'),
                    'sheet' => 'Data_Sheet',
                    'mapping' => $preview->json('preview.mapping'),
                    'units' => ['load_out_kg' => 'kg', 'load_in_kg' => 'kg'],
                ])->assertOk();
        };

        $commit();

        // Marketing settles the "came back loaded" question on the Masindi trip.
        $flag = $trial->fresh()->flags()->where('code', 'return_loaded')->first();
        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/flags/{$flag->id}/resolve", [
                'resolution' => 'accepted',
                'note' => 'Client confirmed the baseline runs also carried return loads.',
            ])->assertOk();

        $tripId = $flag->fet_trial_trip_id;

        // The client sends a fresh cumulative export the following week.
        $second = $commit();

        // The trip keeps its identity, so the decision survives.
        $this->assertSame(11, $second->json('import.rows_imported'));
        $this->assertNotNull($trial->fresh()->trips()->find($tripId), 'the trip must be updated in place, not replaced');
        $this->assertSame(
            'accepted',
            $trial->fresh()->flags()->where('code', 'return_loaded')->first()->resolution
        );
        // And it is back in the calculation rather than held for review.
        $this->assertSame('valid', $trial->fresh()->trips()->find($tripId)->status);
    }

    public function test_a_file_that_is_not_a_trip_log_is_refused_in_plain_language(): void
    {
        $trial = $this->trial();

        // A perfectly valid CSV that simply is not a trip export.
        $path = tempnam(sys_get_temp_dir(), 'notatrip').'.csv';
        file_put_contents($path, "shopping list\nbread,2\nmilk,1\n");

        $response = $this->actingAs($this->staff(), 'sanctum')
            ->post("/api/admin/fet-trials/{$trial->id}/imports/preview", [
                'file' => new UploadedFile($path, 'shopping.csv', 'text/csv', null, true),
            ])->assertStatus(422);

        $this->assertStringContainsString('No column headings', $response->json('message'));
        @unlink($path);
    }

    public function test_a_file_that_is_not_a_spreadsheet_at_all_is_refused(): void
    {
        $trial = $this->trial();

        $this->actingAs($this->staff(), 'sanctum')
            ->post("/api/admin/fet-trials/{$trial->id}/imports/preview", [
                'file' => UploadedFile::fake()->create('photo.png', 8, 'image/png'),
            ])->assertStatus(422);
    }

    public function test_an_upload_from_another_trial_cannot_be_committed(): void
    {
        $mine = $this->trial();
        $theirs = $this->trial(['client_company' => 'Someone Else']);
        $staff = $this->staff();

        $preview = $this->actingAs($staff, 'sanctum')
            ->post("/api/admin/fet-trials/{$mine->id}/imports/preview", ['file' => $this->workbook()])->assertOk();

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$theirs->id}/imports/commit", [
                'handle' => $preview->json('handle'),
                'sheet' => 'Data_Sheet',
                'mapping' => $preview->json('preview.mapping'),
            ])->assertForbidden();
    }

    /* ── trips and findings ───────────────────────────────────────────────── */

    public function test_excluding_a_trip_requires_a_reason(): void
    {
        $trial = $this->trial();
        $trip = $trial->trips()->create([
            'route_label' => 'Apac', 'trip_date' => '2026-07-04', 'distance_km' => 828.24, 'fuel_issued_l' => 296,
        ]);

        $this->actingAs($this->staff(), 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/trips/{$trip->id}/status", ['status' => 'excluded'])
            ->assertStatus(422);

        $this->actingAs($this->staff(), 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/trips/{$trip->id}/status", [
                'status' => 'excluded', 'reason' => 'Driver reported a fuel theft on this run.',
            ])->assertOk();

        $this->assertSame('excluded', $trip->fresh()->status);
        $this->assertStringContainsString('fuel theft', $trip->fresh()->exclusion_reason);
    }

    public function test_a_trip_from_another_trial_cannot_be_touched(): void
    {
        $mine = $this->trial();
        $theirs = $this->trial(['client_company' => 'Someone Else']);
        $trip = $theirs->trips()->create(['route_label' => 'Apac', 'trip_date' => '2026-07-04', 'distance_km' => 800, 'fuel_issued_l' => 300]);

        $this->actingAs($this->staff(), 'sanctum')
            ->patchJson("/api/admin/fet-trials/{$mine->id}/trips/{$trip->id}", ['route_label' => 'Hacked'])
            ->assertNotFound();
    }

    /* ── the shape the admin screens rely on ──────────────────────────────── */

    public function test_the_response_matches_what_the_admin_screens_expect(): void
    {
        // Guards against silent drift between this controller and the frontend
        // types in frontend/src/lib/fet-trials.ts. A renamed key here would
        // otherwise only surface as a blank panel in the admin panel.
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Mpondwe', 'trip_date' => '2026-07-12', 'distance_km' => 842.67,
            'fuel_issued_l' => 416.66, 'load_out_kg' => 29240, 'load_in_kg' => 19080,
        ]);
        // Give it something to flag, so the flags array is populated too.
        $trial->trips()->create(['route_label' => 'Kitgum', 'fuel_issued_l' => 320, 'phase' => 'trial']);

        // Reading a trial never mutates it, so the checks are run explicitly —
        // in normal use they run on every import, edit and decision.
        $this->actingAs($this->staff(), 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/revalidate")
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id', 'reference', 'client_company', 'contact_name', 'contact_email', 'contact_phone',
                    'registration', 'vehicle_make', 'vehicle_type', 'rated_capacity_kg', 'tare_kg',
                    'device_serial', 'device_model', 'installed_on', 'trial_start', 'trial_end',
                    'fuel_price', 'currency', 'baseline_method', 'declared_baseline_l_per_100',
                    'fleet_standard_km_per_l', 'required_matched_trips', 'min_baseline_trips_per_route',
                    'status', 'decided_on', 'outcome_note', 'units_sold', 'deal_value',
                    'enquiry_id', 'prospect_id', 'prospect_name', 'installation',
                    'notes', 'share_token', 'share_expires_at',
                    'trips' => [[
                        'id', 'sequence', 'trip_date', 'return_date', 'route_label', 'route_key', 'region',
                        'distance_km', 'distance_source', 'fuel_opening_l', 'fuel_issued_l', 'fuel_topup_l',
                        'fuel_closing_l', 'fuel_used_l', 'fuel_method', 'fuel_used_ivms_l', 'fuel_variance_l',
                        'load_out_kg', 'load_in_kg', 'utilisation_pct', 'avg_speed_kmh', 'driver_name',
                        'phase', 'phase_override', 'phase_override_reason', 'status', 'exclusion_reason',
                        'l_per_100', 'km_per_l', 'source', 'source_row_ref', 'notes',
                    ]],
                    'flags' => [[
                        'id', 'trip_id', 'code', 'severity', 'field', 'message',
                        'suggested_action', 'context', 'resolution', 'resolution_note', 'resolved_at',
                    ]],
                    'analysis' => [
                        'currency', 'fuel_price', 'verified_pct',
                        'counts' => ['trips_total', 'baseline_measurable', 'trial_measurable', 'needs_review', 'excluded'],
                        'routes' => [[
                            'route_key', 'route_label', 'baseline', 'trial', 'baseline_load_kg',
                            'trial_load_kg', 'load_gap_pct', 'matched', 'unmatched_reason', 'change_pct',
                        ]],
                        'routes_ready', 'headline',
                        'confidence' => ['level', 'score', 'states_verdict', 'shortfall'],
                        'verdict', 'unmatched_trial_trips', 'blocking_flags', 'open_questions',
                    ],
                ],
            ]);
    }

    public function test_the_list_response_matches_what_the_list_screen_expects(): void
    {
        $this->trial();

        $this->actingAs($this->staff(), 'sanctum')
            ->getJson('/api/admin/fet-trials')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [[
                    'id', 'reference', 'client_company', 'registration', 'status', 'installed_on',
                    'trips_count', 'confidence', 'saving_pct', 'open_findings', 'updated_at',
                ]],
            ]);
    }

    /* ── the client link ──────────────────────────────────────────────────── */

    public function test_the_client_link_shows_the_trial_without_internal_detail(): void
    {
        $trial = $this->trial(['contact_email' => 'fleet@hariss.example', 'notes' => 'Chase Solomon about pricing.']);
        $trial->trips()->create([
            'route_label' => 'Mpondwe', 'trip_date' => '2026-07-12', 'distance_km' => 842.67,
            'fuel_issued_l' => 416.66, 'driver_name' => 'Patrick',
        ]);

        $token = $this->actingAs($this->staff(), 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/share")->assertOk()->json('token');

        $response = $this->getJson("/api/trials/{$token}")->assertOk();

        $this->assertSame('Hariss International', $response->json('data.client_company'));
        $this->assertNull($response->json('data.contact_email'), 'contact records are internal');
        $this->assertNull($response->json('data.notes'), 'internal notes must never reach the client');
        $this->assertNull($response->json('data.device_serial'));
        $this->assertNull($response->json('data.trips.0.driver_name'), 'driver identity is off unless switched on');
        $this->assertEmpty($response->json('data.flags'));
        $this->assertArrayNotHasKey('open_questions', $response->json('data.analysis'));
    }

    public function test_a_revoked_or_expired_link_stops_working(): void
    {
        $trial = $this->trial();
        $staff = $this->staff();

        $token = $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/share")->json('token');
        $this->getJson("/api/trials/{$token}")->assertOk();

        $this->actingAs($staff, 'sanctum')->deleteJson("/api/admin/fet-trials/{$trial->id}/share")->assertOk();
        $this->getJson("/api/trials/{$token}")->assertNotFound();

        // And an expiry is honoured.
        $token = $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/share", ['expires_in_days' => 7])->json('token');
        $trial->fresh()->update(['share_expires_at' => now()->subDay()]);
        $this->getJson("/api/trials/{$token}")->assertStatus(410);
    }

    public function test_a_made_up_link_reveals_nothing(): void
    {
        $this->getJson('/api/trials/not-a-real-token')->assertNotFound();
    }
}
