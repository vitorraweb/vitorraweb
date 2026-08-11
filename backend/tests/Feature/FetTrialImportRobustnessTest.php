<?php

namespace Tests\Feature;

use App\Services\FetTrialImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

/**
 * Client exports are not tidy. These cover the ways a real file differs from
 * the one the importer was first written against — each of which produced a
 * silent "0 trips found" before it was fixed.
 */
class FetTrialImportRobustnessTest extends TestCase
{
    use RefreshDatabase;

    /** Build a workbook, optionally with formatted (rich-text) headings. */
    private function workbook(array $rows, bool $boldHeadings = false, array $titleRows = []): string
    {
        $book = new Spreadsheet;
        $sheet = $book->getActiveSheet();
        $r = 1;
        foreach ($titleRows as $t) {
            $sheet->setCellValue([1, $r++], $t);
        }
        foreach ($rows as $row) {
            $c = 1;
            foreach ($row as $v) {
                $sheet->setCellValue([$c++, $r], $v);
            }
            $r++;
        }
        if ($boldHeadings) {
            $sheet->getStyle('A'.(count($titleRows) + 1).':Z'.(count($titleRows) + 1))->getFont()->setBold(true);
        }

        $path = tempnam(sys_get_temp_dir(), 'imp').'.xlsx';
        (new Xlsx($book))->save($path);
        $book->disconnectWorksheets();
        unset($book);
        gc_collect_cycles();

        return $path;
    }

    private function preview(string $path): array
    {
        return app(FetTrialImportService::class)->preview($path);
    }

    public function test_a_file_with_formatted_headings_still_reads(): void
    {
        // Excel returns a RichText object rather than a string for any cell
        // carrying formatting. Unhandled, that made every heading unreadable
        // and the whole file imported as zero trips.
        $path = $this->workbook([
            ['Date', 'Destination', 'Distance', 'Fuel Issued'],
            ['2026-07-04', 'Apac', 828.24, 330],
        ], boldHeadings: true);

        $preview = $this->preview($path);

        $this->assertSame(1, $preview['row_count']);
        $this->assertSame('Destination', $preview['mapping']['route_label']);
        @unlink($path);
    }

    public function test_dates_are_read_day_first(): void
    {
        // 03/07/2026 is 3 July on every fleet document here. Read month-first
        // it lands in March — four months from where it belongs, and on the
        // wrong side of the installation date.
        $path = $this->workbook([
            ['Date', 'Destination', 'Distance', 'Fuel Issued'],
            ['03/07/2026', 'Mpondwe', 840, 400],
            ['28/07/2026', 'Masindi', 445, 220],
        ]);

        $sample = $this->preview($path)['sample'];

        $this->assertSame('2026-07-03', $sample[0]['trip_date']->toDateString());
        $this->assertSame('2026-07-28', $sample[1]['trip_date']->toDateString());
        @unlink($path);
    }

    public function test_numbers_written_with_units_or_separators_are_read(): void
    {
        $path = $this->workbook([
            ['Date', 'Destination', 'Distance', 'Fuel Issued', 'Payload'],
            ['2026-07-04', 'Apac', '828.24 km', '330 L', '29,600'],
        ]);

        $row = $this->preview($path)['sample'][0];

        $this->assertEqualsWithDelta(828.24, $row['distance_km'], 0.01);
        $this->assertEqualsWithDelta(330.0, $row['fuel_issued_l'], 0.01);
        $this->assertSame(29600, $row['load_out_kg']);
        @unlink($path);
    }

    public function test_title_rows_above_the_headings_are_skipped(): void
    {
        $path = $this->workbook(
            [['Date', 'Town', 'Kms Covered', 'Fuel Drawn'], ['2026-07-04', 'Apac', 828, 330]],
            titleRows: ['FLEET MOVEMENT LOG', '']
        );

        $preview = $this->preview($path);

        $this->assertSame(1, $preview['row_count']);
        $this->assertSame('Town', $preview['mapping']['route_label'], 'common destination wordings should map');
        @unlink($path);
    }

    public function test_a_short_synonym_does_not_latch_onto_an_unrelated_column(): void
    {
        // "to" must not match "Total", and "km" must not match "Remarks".
        $path = $this->workbook([
            ['Date', 'Destination', 'Distance', 'Total Cost', 'Remarks'],
            ['2026-07-04', 'Apac', 828, 500000, 'on time'],
        ]);

        $mapping = $this->preview($path)['mapping'];

        $this->assertSame('Destination', $mapping['route_label']);
        $this->assertNotSame('Total Cost', $mapping['route_label'] ?? null);
        $this->assertSame('Distance', $mapping['distance_km']);
        @unlink($path);
    }

    /* ── never a bare "0 trips" ───────────────────────────────────────────── */

    public function test_a_file_with_no_destination_column_explains_itself(): void
    {
        $path = $this->workbook([
            ['Date', 'Distance', 'Fuel Issued'],
            ['2026-07-04', 828, 330],
        ]);

        $preview = $this->preview($path);

        $this->assertSame(0, $preview['row_count']);
        $this->assertNotNull($preview['diagnosis'], 'zero trips must never be reported without a reason');
        $this->assertStringContainsString('destination', $preview['diagnosis']);
        // It names what it did find, so the person holding the file can act.
        $this->assertStringContainsString('Distance', $preview['diagnosis']);
        @unlink($path);
    }

    public function test_a_sheet_with_headings_but_no_rows_explains_itself(): void
    {
        $path = $this->workbook([['Date', 'Destination', 'Distance', 'Fuel Issued']]);

        $preview = $this->preview($path);

        $this->assertSame(0, $preview['row_count']);
        $this->assertNotNull($preview['diagnosis']);
        @unlink($path);
    }

    public function test_a_successful_read_carries_no_diagnosis(): void
    {
        $path = $this->workbook([
            ['Date', 'Destination', 'Distance', 'Fuel Issued'],
            ['2026-07-04', 'Apac', 828.24, 330],
        ]);

        $this->assertNull($this->preview($path)['diagnosis']);
        @unlink($path);
    }
}
