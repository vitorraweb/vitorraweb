<?php

namespace Tests\Feature;

use App\Models\FetTrial;
use App\Models\User;
use App\Services\FetTrialAnalysisService;
use App\Services\FetTrialReportService;
use App\Services\FetTrialValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

/** The branded PDF and the spreadsheet a client is sent. */
class FetTrialReportTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::create([
            'name' => 'Marketer', 'email' => 'm-'.uniqid().'@vitorra.org',
            'password' => 'password123', 'role' => 'ops', 'department' => 'marketing',
        ]);
    }

    private function trial(array $overrides = []): FetTrial
    {
        return FetTrial::create(array_merge([
            'reference' => FetTrial::nextReference(),
            'client_company' => 'Hariss International',
            'registration' => 'UA 758AM',
            'installed_on' => '2026-07-27',
            'currency' => 'UGX',
            'fuel_price' => 5000,
            'rated_capacity_kg' => 30000,
        ], $overrides));
    }

    /** A trial with enough matched evidence to carry a result. */
    private function provenTrial(): FetTrial
    {
        $trial = $this->trial();
        foreach (['2026-07-05', '2026-07-12', '2026-07-19'] as $d) {
            $trial->trips()->create([
                'route_label' => 'Mpondwe', 'trip_date' => $d, 'distance_km' => 840,
                'fuel_opening_l' => 500, 'fuel_issued_l' => 420, 'fuel_closing_l' => 500,
                'load_out_kg' => 29500, 'phase' => 'baseline',
            ]);
        }
        foreach (['2026-08-01', '2026-08-06', '2026-08-11'] as $d) {
            $trial->trips()->create([
                'route_label' => 'Mpondwe', 'trip_date' => $d, 'distance_km' => 840,
                'fuel_opening_l' => 500, 'fuel_issued_l' => 370, 'fuel_closing_l' => 500,
                'load_out_kg' => 29500, 'phase' => 'trial',
            ]);
        }
        app(FetTrialValidator::class)->validate($trial->fresh());

        return $trial->fresh();
    }

    /* ── the PDF ──────────────────────────────────────────────────────────── */

    public function test_the_report_downloads_as_a_pdf(): void
    {
        $trial = $this->provenTrial();

        $response = $this->actingAs($this->staff(), 'sanctum')
            ->get("/api/admin/fet-trials/{$trial->id}/report")
            ->assertOk();

        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString("fet-trial-{$trial->reference}.pdf", $response->headers->get('content-disposition'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_a_report_on_thin_evidence_states_no_conclusion(): void
    {
        // The real shape of the first trial: plenty of baseline, nothing
        // comparable after fitting. The report must not invent a figure.
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Apac', 'trip_date' => '2026-07-04', 'distance_km' => 828.24,
            'fuel_opening_l' => 225.15, 'fuel_issued_l' => 330, 'fuel_closing_l' => 258.90, 'phase' => 'baseline',
        ]);
        app(FetTrialValidator::class)->validate($trial->fresh());

        $html = view('documents.fet-trial-report', [
            'trial' => $trial->fresh(),
            'analysis' => app(FetTrialAnalysisService::class)->analyse($trial->fresh()),
            'excluded' => collect(),
            'reasons' => [],
        ])->render();

        $this->assertStringContainsString('No conclusion available yet', $html);
        $this->assertStringNotContainsString('% )', $html);
        $this->assertStringNotContainsString('Fuel Eco Tech is independently certified', $html);
    }

    public function test_a_proven_report_states_the_result_and_names_the_excluded_trips(): void
    {
        $trial = $this->provenTrial();
        $trip = $trial->trips()->where('phase', 'trial')->first();
        $trip->update(['status' => 'excluded', 'exclusion_reason' => 'Driver reported a fuel theft on this run.']);

        $html = view('documents.fet-trial-report', [
            'trial' => $trial->fresh(),
            'analysis' => app(FetTrialAnalysisService::class)->analyse($trial->fresh()),
            'excluded' => $trial->fresh()->trips()->where('status', 'excluded')->get(),
            'reasons' => [],
        ])->render();

        // A dropped trip is always named with its reason — a report that
        // quietly removed an inconvenient journey would not survive scrutiny.
        $this->assertStringContainsString('Trips left out, and why', $html);
        $this->assertStringContainsString('fuel theft', $html);
        $this->assertStringContainsString('Route by route', $html);
    }

    /* ── the spreadsheet ──────────────────────────────────────────────────── */

    public function test_the_spreadsheet_uses_the_columns_the_client_can_actually_fill(): void
    {
        // A tank-stock client (the first one) must not be handed odometer
        // columns they have no way of completing — that mismatch is what broke
        // the process this replaces.
        $trial = $this->provenTrial();

        $file = app(FetTrialReportService::class)->spreadsheet($trial);
        $headers = $this->headersOf($file['content']);

        $this->assertContains('Fuel at departure (L)', $headers);
        $this->assertContains('Fuel issued (L)', $headers);
        $this->assertContains('Fuel on return (L)', $headers);
        $this->assertNotContains('Odometer out (km)', $headers);
    }

    public function test_an_odometer_client_gets_odometer_columns_instead(): void
    {
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Kampala', 'trip_date' => '2026-07-05',
            'odo_out_km' => 85192, 'odo_in_km' => 85654, 'fuel_issued_l' => 100, 'phase' => 'baseline',
        ]);

        $headers = $this->headersOf(app(FetTrialReportService::class)->spreadsheet($trial->fresh())['content']);

        $this->assertContains('Odometer out (km)', $headers);
        $this->assertContains('Odometer in (km)', $headers);
        $this->assertNotContains('Fuel at departure (L)', $headers);
    }

    public function test_the_spreadsheet_downloads_with_every_trip(): void
    {
        $trial = $this->provenTrial();

        $response = $this->actingAs($this->staff(), 'sanctum')
            ->get("/api/admin/fet-trials/{$trial->id}/spreadsheet")
            ->assertOk();

        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));

        $rows = $this->rowsOf($response->getContent());
        $this->assertCount(7, $rows, 'one header row plus six trips');
    }

    public function test_the_summary_sheet_withholds_a_figure_the_evidence_cannot_carry(): void
    {
        $trial = $this->trial();
        $trial->trips()->create([
            'route_label' => 'Apac', 'trip_date' => '2026-07-04', 'distance_km' => 828.24,
            'fuel_opening_l' => 225.15, 'fuel_issued_l' => 330, 'fuel_closing_l' => 258.90, 'phase' => 'baseline',
        ]);
        app(FetTrialValidator::class)->validate($trial->fresh());

        $summary = $this->sheetText(app(FetTrialReportService::class)->spreadsheet($trial->fresh())['content'], 'Summary');

        $this->assertStringContainsString('No conclusion available yet', $summary);
        $this->assertStringNotContainsString('Change (%)', explode('Route', $summary)[0]);
    }

    /* ── the client's own link ────────────────────────────────────────────── */

    public function test_the_client_link_serves_the_same_report(): void
    {
        $trial = $this->provenTrial();
        $token = $trial->issueShareToken();

        $response = $this->get("/api/trials/{$token}/pdf")->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_a_revoked_link_cannot_download_the_report(): void
    {
        $trial = $this->provenTrial();
        $token = $trial->issueShareToken();
        $trial->forceFill(['share_token' => null])->save();

        $this->get("/api/trials/{$token}/pdf")->assertNotFound();
    }

    /* ── helpers ──────────────────────────────────────────────────────────── */

    /** @return array<int, string> */
    private function headersOf(string $xlsx): array
    {
        return array_values(array_filter($this->rowsOf($xlsx)[0] ?? [], fn ($v) => $v !== null));
    }

    /** @return array<int, array<int, mixed>> */
    private function rowsOf(string $xlsx, string $sheet = 'Trips'): array
    {
        $path = tempnam(sys_get_temp_dir(), 'xlsx').'.xlsx';
        file_put_contents($path, $xlsx);

        try {
            $book = IOFactory::createReaderForFile($path)->load($path);
            $rows = $book->getSheetByName($sheet)->toArray();
            $book->disconnectWorksheets();

            return array_values(array_filter($rows, fn ($r) => array_filter($r, fn ($v) => $v !== null) !== []));
        } finally {
            @unlink($path);
        }
    }

    private function sheetText(string $xlsx, string $sheet): string
    {
        return collect($this->rowsOf($xlsx, $sheet))
            ->map(fn ($r) => implode(' | ', array_map(fn ($v) => (string) $v, $r)))
            ->implode("\n");
    }
}
