<?php

namespace Tests\Feature;

use App\Models\FetTrial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * The client's FINAL report — tests/Fixtures/hariss-final-report.xlsx is the
 * paired before/after summary Hariss International produced at the end of the
 * UA 758AM trial (August 2026): five destinations, one "Before FET" and one
 * "FET Trail trip" each.
 *
 * It differs from their running export in one way that broke the importer:
 * every departure and return is an Excel date serial in a cell formatted
 * "General", so nothing marks it as a date. These tests pin the fix, and the
 * CSV download of the same trip log.
 */
class FetTrialFinalReportTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::create([
            'name' => 'Marketer', 'email' => 'm-'.uniqid().'@vitorra.org',
            'password' => 'password123', 'role' => 'ops', 'department' => 'marketing',
        ]);
    }

    private function trial(): FetTrial
    {
        return FetTrial::create([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'Hariss International',
            'registration' => 'UA 758AM',
            'rated_capacity_kg' => 30000,
            'installed_on' => '2026-07-27',
            'fleet_standard_km_per_l' => 2.2,
            'currency' => 'UGX',
            'fuel_price' => 5000,
        ]);
    }

    private function workbook(): UploadedFile
    {
        return new UploadedFile(
            base_path('tests/Fixtures/hariss-final-report.xlsx'),
            'Hariss International Final Report.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );
    }

    /** Upload and commit the final report into a trial; returns the commit response. */
    private function import(FetTrial $trial, User $staff)
    {
        $preview = $this->actingAs($staff, 'sanctum')
            ->post("/api/admin/fet-trials/{$trial->id}/imports/preview", ['file' => $this->workbook()])
            ->assertOk();

        return $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/imports/commit", [
                'handle' => $preview->json('handle'),
                'filename' => 'Hariss International Final Report.xlsx',
                'sheet' => $preview->json('preview.sheet'),
                'mapping' => $preview->json('preview.mapping'),
                'units' => ['load_out_kg' => 'kg', 'load_in_kg' => 'kg'],
            ])->assertOk();
    }

    /* ── reading the file ─────────────────────────────────────────────────── */

    public function test_dates_stored_as_bare_serials_are_read_as_dates(): void
    {
        // The cells hold 46210.17… formatted "General" — before the fix every
        // trip imported with no date and was flagged as unplaceable.
        $trial = $this->trial();
        $this->import($trial, $this->staff());

        $trips = $trial->fresh()->trips;
        $this->assertCount(10, $trips);
        $this->assertSame(0, $trips->whereNull('trip_date')->count(), 'every trip must carry its date');

        $masindiBefore = $trips->first(fn ($t) => $t->route_key === 'MASINDI' && $t->effectivePhase() === 'baseline');
        $this->assertSame('2026-07-07', $masindiBefore->trip_date->toDateString());
        $this->assertSame('2026-07-08', $masindiBefore->return_date->toDateString());

        $paidhaAfter = $trips->first(fn ($t) => $t->route_key === 'PAIDHA' && $t->effectivePhase() === 'trial');
        $this->assertSame('2026-08-14', $paidhaAfter->trip_date->toDateString());
    }

    public function test_non_breaking_spaces_in_the_clients_labels_are_cleaned(): void
    {
        // Every heading and label in the file ends in U+00A0. Left alone it
        // rides into route labels and onto the client-facing report.
        $trial = $this->trial();
        $this->import($trial, $this->staff());

        foreach ($trial->fresh()->trips as $trip) {
            $this->assertStringNotContainsString("\u{00A0}", $trip->route_label);
        }

        $this->assertSame(
            ['Kamwenge', 'Kitgum', 'Masindi', 'Paidha', 'Yumbe'],
            $trial->fresh()->trips->pluck('route_label')->unique()->sort()->values()->all()
        );
    }

    public function test_the_paired_report_imports_with_the_known_findings_raised(): void
    {
        $trial = $this->trial();
        $response = $this->import($trial, $this->staff());

        $this->assertSame(10, $response->json('import.rows_imported'));

        $trips = $trial->fresh()->trips;
        $this->assertSame(5, $trips->filter(fn ($t) => $t->effectivePhase() === 'baseline')->count());
        $this->assertSame(5, $trips->filter(fn ($t) => $t->effectivePhase() === 'trial')->count());

        // The checks still catch what the client's own file cannot explain.
        $codes = collect($response->json('data.flags'))->pluck('code');
        $this->assertContains('trip_before_install', $codes); // Kamwenge trial trip, dated 1 April
        $this->assertContains('return_loaded', $codes);       // Masindi + Yumbe came back with Kinyara sugar

        // One "before" trip per route is not a baseline under the default
        // rules, so no verdict — the strictness rule holds on this file too.
        $this->assertNull($response->json('data.analysis.verdict'));
    }

    public function test_a_route_whose_trip_ran_but_was_left_out_is_named_as_such(): void
    {
        // Masindi and Yumbe DID run after fitting; their loaded-return trips
        // are held out of the maths. Reporting that as "no trip since fitting"
        // reads as a lost record on a route the client can see was driven.
        $trial = $this->trial();
        $response = $this->import($trial, $this->staff());

        $routes = collect($response->json('data.analysis.routes'))->keyBy('route_key');

        $this->assertSame('trial_excluded', $routes['MASINDI']['unmatched_reason']);
        $this->assertSame('trial_excluded', $routes['YUMBE']['unmatched_reason']);
        $this->assertNotNull($routes['MASINDI']['trial_held'], 'the held figures stay visible');
    }

    /* ── the CSV download ─────────────────────────────────────────────────── */

    public function test_the_trip_log_downloads_as_csv_with_the_checked_figures(): void
    {
        $trial = $this->trial();
        $staff = $this->staff();
        $this->import($trial, $staff);

        $response = $this->actingAs($staff, 'sanctum')
            ->get("/api/admin/fet-trials/{$trial->id}/csv")
            ->assertOk();

        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
        $this->assertStringContainsString("fet-trial-{$trial->reference}.csv", $response->headers->get('content-disposition'));

        $content = $response->getContent();
        $this->assertStringStartsWith("\u{FEFF}", $content, 'BOM, so Excel opens it as UTF-8');

        $rows = array_map('str_getcsv', explode("\n", trim(substr($content, 3))));
        $this->assertCount(11, $rows, 'one header row plus ten trips');

        $header = $rows[0];
        // Tank-stock client: their columns, no odometer columns they cannot fill.
        $this->assertContains('Fuel at departure (L)', $header);
        $this->assertContains('Fuel used — tracker (L)', $header);
        $this->assertContains('Region', $header);
        $this->assertNotContains('Odometer out (km)', $header);

        // The figures are the derived ones the analysis runs on: Masindi
        // before-trip burned 259 + 170 − 265 = 164 L over 414 km.
        $byColumn = fn (array $row) => array_combine($header, $row);
        $masindi = collect(array_slice($rows, 1))->map($byColumn)
            ->first(fn ($r) => $r['Destination'] === 'Masindi' && $r['Before / after'] === 'Before');

        $this->assertNotNull($masindi);
        $this->assertSame('2026-07-07', $masindi['Date']);
        $this->assertEqualsWithDelta(164.0, (float) $masindi['Fuel used (L)'], 0.01);
        $this->assertEqualsWithDelta(2.524, (float) $masindi['km/L'], 0.001);
    }

    public function test_the_csv_and_the_spreadsheet_show_the_same_trip_log(): void
    {
        // Both downloads come from one table builder; this pins that a change
        // to one cannot quietly leave the other behind.
        $trial = $this->trial();
        $staff = $this->staff();
        $this->import($trial, $staff);

        $csv = $this->actingAs($staff, 'sanctum')
            ->get("/api/admin/fet-trials/{$trial->id}/csv")->assertOk()->getContent();
        $csvRows = array_map('str_getcsv', explode("\n", trim(substr($csv, 3))));

        $xlsx = $this->actingAs($staff, 'sanctum')
            ->get("/api/admin/fet-trials/{$trial->id}/spreadsheet")->assertOk()->getContent();

        $path = tempnam(sys_get_temp_dir(), 'xlsx').'.xlsx';
        file_put_contents($path, $xlsx);
        try {
            $book = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($path)->load($path);
            $sheetRows = array_values(array_filter(
                $book->getSheetByName('Trips')->toArray(),
                fn ($r) => array_filter($r, fn ($v) => $v !== null) !== []
            ));
            $book->disconnectWorksheets();
        } finally {
            @unlink($path);
        }

        $this->assertSame($sheetRows[0], $csvRows[0], 'same columns');
        $this->assertCount(count($sheetRows), $csvRows, 'same trips');
    }

    public function test_an_excluded_trip_appears_in_the_csv_with_its_reason(): void
    {
        $trial = $this->trial();
        $staff = $this->staff();
        $this->import($trial, $staff);

        $trip = $trial->fresh()->trips->first(fn ($t) => $t->route_key === 'KITGUM' && $t->effectivePhase() === 'trial');
        $trip->update(['status' => 'excluded', 'exclusion_reason' => 'Client asked for this run to be set aside.']);

        $csv = $this->actingAs($staff, 'sanctum')
            ->get("/api/admin/fet-trials/{$trial->id}/csv")->assertOk()->getContent();

        $this->assertStringContainsString('Left out', $csv);
        $this->assertStringContainsString('Client asked for this run to be set aside.', $csv);
    }

    /* ── the internal review link ─────────────────────────────────────────── */

    public function test_the_internal_review_link_serves_the_full_staff_view(): void
    {
        $trial = $this->trial();
        $staff = $this->staff();
        $this->import($trial, $staff);
        $trial->fresh()->update(['notes' => 'Why the loaded trips are left out.']);

        $issued = $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/review-link")
            ->assertOk();

        $response = $this->getJson('/api/trials/review/'.$issued->json('token'))->assertOk();

        // The internal extras the client link deliberately strips.
        $this->assertNotEmpty($response->json('data.flags'));
        $this->assertSame('Why the loaded trips are left out.', $response->json('data.notes'));
        // But neither live token rides along with the payload.
        $this->assertNull($response->json('data.share_token'));
        $this->assertNull($response->json('data.review_token'));
    }

    public function test_the_client_token_does_not_open_the_review_view_nor_the_reverse(): void
    {
        $trial = $this->trial();
        $staff = $this->staff();
        $this->import($trial, $staff);

        $clientToken = $trial->fresh()->issueShareToken();
        $reviewToken = $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/review-link")->json('token');

        // The two tokens are separate credentials for separate views.
        $this->getJson("/api/trials/review/{$clientToken}")->assertNotFound();
        $this->getJson("/api/trials/{$reviewToken}")->assertNotFound();

        // The client view still strips the internal side entirely.
        $client = $this->getJson("/api/trials/{$clientToken}")->assertOk();
        $this->assertNull($client->json('data.flags'));
        $this->assertNull($client->json('data.notes'));
    }

    public function test_a_revoked_review_link_stops_working(): void
    {
        $trial = $this->trial();
        $staff = $this->staff();
        $this->import($trial, $staff);

        $token = $this->actingAs($staff, 'sanctum')
            ->postJson("/api/admin/fet-trials/{$trial->id}/review-link")->json('token');
        $this->getJson("/api/trials/review/{$token}")->assertOk();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/admin/fet-trials/{$trial->id}/review-link")->assertOk();

        $this->getJson("/api/trials/review/{$token}")->assertNotFound();
    }
}
