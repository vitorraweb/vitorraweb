<?php

namespace App\Services;

use App\Models\FetTrial;
use App\Models\FetTrialTrip;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\Response;

/**
 * Client-facing output for a trial: a branded PDF, and a spreadsheet.
 *
 * The spreadsheet is the interesting one. The original branded trial log asked
 * clients for odometer readings at departure and return, and for fuel levels in
 * the tank — figures the first client's systems simply do not hold, so two of
 * the four columns could never be filled. That mismatch is what broke the
 * process the module replaces.
 *
 * So the export SHAPES ITSELF TO HOW THE CLIENT ACTUALLY MEASURES: a fleet
 * working from tank stock gets opening/issued/closing columns, one working from
 * odometers gets odometer columns. Either way it is generated from data already
 * checked, never retyped.
 */
class FetTrialReportService
{
    /** Plain-English reasons a route could not anchor a comparison. */
    private const REASONS = [
        'no_trial_trip' => 'No trip since fitting',
        'trial_excluded' => 'Ran since fitting, left out (reason on the trip)',
        'no_baseline' => 'No earlier trip',
        'baseline_excluded' => 'Earlier trip left out (reason on the trip)',
        'sparse_baseline' => 'Only one earlier trip',
        'load_mismatch' => 'Different load',
    ];

    public function __construct(private readonly FetTrialAnalysisService $analysis) {}

    /** The branded report a client is sent. */
    public function pdf(FetTrial $trial): Response
    {
        $pdf = Pdf::loadView('documents.fet-trial-report', [
            'trial' => $trial,
            'analysis' => $this->analysis->analyse($trial),
            'excluded' => $trial->trips()->where('status', 'excluded')->get(),
            'reasons' => self::REASONS,
        ]);

        return $pdf->download("fet-trial-{$trial->reference}.pdf");
    }

    /**
     * The trip log as a spreadsheet, in the client's own measurement model.
     *
     * @return array{content: string, filename: string}
     */
    public function spreadsheet(FetTrial $trial): array
    {
        $book = new Spreadsheet;

        try {
            $this->writeTrips($book->getActiveSheet(), $trial);
            $this->writeSummary($book->createSheet(), $trial);
            $book->setActiveSheetIndex(0);

            $writer = new Xlsx($book);
            ob_start();
            $writer->save('php://output');
            $content = (string) ob_get_clean();
        } finally {
            $book->disconnectWorksheets();
        }

        return [
            'content' => $content,
            'filename' => "fet-trial-{$trial->reference}.xlsx",
        ];
    }

    /**
     * The trip log as CSV — the same table as the spreadsheet's Trips sheet,
     * from the same builder, so the two can never quietly disagree. For the
     * fleet analyst who wants the checked figures in the plainest possible
     * form rather than a formatted workbook.
     *
     * @return array{content: string, filename: string}
     */
    public function csv(FetTrial $trial): array
    {
        $table = $this->tripTable($trial);

        $out = fopen('php://temp', 'r+');
        // BOM, so Excel opens it as UTF-8 rather than mangling every "é".
        fwrite($out, "\u{FEFF}");
        fputcsv($out, $table['columns']);
        foreach ($table['rows'] as $row) {
            fputcsv($out, array_map(fn ($v) => $v ?? '', $row));
        }
        rewind($out);
        $content = (string) stream_get_contents($out);
        fclose($out);

        return [
            'content' => $content,
            'filename' => "fet-trial-{$trial->reference}.csv",
        ];
    }

    /**
     * Which fuel columns this client can actually fill. Decided from what their
     * own trips already contain, not from what our template would prefer.
     */
    private function measurementModel(FetTrial $trial): string
    {
        $trips = $trial->trips;

        if ($trips->contains(fn (FetTrialTrip $t) => $t->odo_out_km !== null && $t->odo_in_km !== null)) {
            return 'odometer';
        }

        if ($trips->contains(fn (FetTrialTrip $t) => $t->fuel_opening_l !== null && $t->fuel_closing_l !== null)) {
            return 'tank_dip';
        }

        return 'issued_only';
    }

    /**
     * The trip log as one table — columns shaped to how this client measures,
     * every figure the derived one the analysis runs on. Both the Excel sheet
     * and the CSV are written from here, so a figure can never differ between
     * the two downloads.
     *
     * @return array{columns: array<int, string>, rows: array<int, array<int, mixed>>}
     */
    private function tripTable(FetTrial $trial): array
    {
        $model = $this->measurementModel($trial);
        $trips = $trial->trips;

        // Columns the client's own data never fills are left out entirely.
        $hasRegion = $trips->contains(fn (FetTrialTrip $t) => $t->region !== null && $t->region !== '');
        $hasTracker = $trips->contains(fn (FetTrialTrip $t) => $t->fuel_used_ivms_l !== null);

        $columns = array_merge(
            ['Date', 'Return date', 'Destination'],
            $hasRegion ? ['Region'] : [],
            $model === 'odometer'
                ? ['Odometer out (km)', 'Odometer in (km)', 'Distance (km)']
                : ['Distance (km)'],
            match ($model) {
                'tank_dip' => ['Fuel at departure (L)', 'Fuel issued (L)', 'Top-up en route (L)', 'Fuel on return (L)'],
                'odometer' => ['Fuel added (L)'],
                default => ['Fuel issued (L)'],
            },
            ['Fuel used (L)'],
            $hasTracker ? ['Fuel used — tracker (L)'] : [],
            ['L/100km', 'km/L', 'Load out (kg)', 'Weight back (kg)', 'Before / after', 'Counted?', 'Notes'],
        );

        $rows = [];
        foreach ($trips as $trip) {
            $rows[] = array_merge(
                [$trip->trip_date?->format('Y-m-d'), $trip->return_date?->format('Y-m-d'), $trip->route_label],
                $hasRegion ? [$trip->region] : [],
                $model === 'odometer'
                    ? [$trip->odo_out_km, $trip->odo_in_km, $trip->distance_km]
                    : [$trip->distance_km],
                match ($model) {
                    'tank_dip' => [$trip->fuel_opening_l, $trip->fuel_issued_l, $trip->fuel_topup_l, $trip->fuel_closing_l],
                    default => [$trip->fuel_issued_l],
                },
                [$trip->fuel_used_l],
                $hasTracker ? [$trip->fuel_used_ivms_l] : [],
                [
                    $trip->litresPer100Km(),
                    $trip->kmPerLitre(),
                    $trip->load_out_kg,
                    $trip->load_in_kg,
                    $trip->effectivePhase() === 'trial' ? 'After' : 'Before',
                    // An excluded trip is listed with its reason, never dropped.
                    match ($trip->status) {
                        'valid' => 'Yes',
                        'review' => 'Needs review',
                        default => 'Left out',
                    },
                    $trip->status === 'excluded' ? $trip->exclusion_reason : $trip->notes,
                ],
            );
        }

        return ['columns' => $columns, 'rows' => $rows];
    }

    private function writeTrips(Worksheet $sheet, FetTrial $trial): void
    {
        $sheet->setTitle('Trips');
        $table = $this->tripTable($trial);

        $sheet->fromArray([$table['columns']], null, 'A1');

        $row = 2;
        foreach ($table['rows'] as $values) {
            $sheet->fromArray([$values], null, "A{$row}");
            $row++;
        }

        $this->styleHeader($sheet, count($table['columns']));
        $sheet->freezePane('A2');
        foreach (range(1, count($table['columns'])) as $i) {
            $sheet->getColumnDimensionByColumn($i)->setAutoSize(true);
        }
    }

    private function writeSummary(Worksheet $sheet, FetTrial $trial): void
    {
        $sheet->setTitle('Summary');
        $a = $this->analysis->analyse($trial);

        $rows = [
            ['Client', $trial->client_company],
            ['Reference', $trial->reference],
            ['Vehicle', collect([$trial->registration, $trial->vehicle_make])->filter()->implode(' · ') ?: '—'],
            ['Device fitted', $trial->installed_on?->format('Y-m-d') ?? '—'],
            [],
            ['Trips before fitting', $a['counts']['baseline_measurable']],
            ['Trips after fitting', $a['counts']['trial_measurable']],
            ['Trips needing review', $a['counts']['needs_review']],
            ['Trips left out', $a['counts']['excluded']],
            [],
        ];

        // Same rule as everywhere else: no figure unless the evidence carries it.
        if ($a['verdict']) {
            $rows[] = ['Result', $a['verdict']['statement']];
            $rows[] = ['Distance compared (km)', $a['headline']['distance_km']];
            $rows[] = ['Fuel expected (L)', $a['headline']['expected_litres']];
            $rows[] = ['Fuel used (L)', $a['headline']['actual_litres']];
            $rows[] = ['Difference (L)', $a['headline']['litres_saved']];
            $rows[] = ['Change (%)', $a['headline']['saving_pct']];
            if ($a['headline']['cost_saved'] !== null) {
                $rows[] = ["Value ({$trial->currency})", $a['headline']['cost_saved']];
            }
        } else {
            $rows[] = ['Result', 'No conclusion available yet — the trial does not yet carry a result in either direction.'];
            foreach ($a['confidence']['shortfall'] as $i => $line) {
                $rows[] = [$i === 0 ? 'Still needed' : '', $line];
            }
        }

        $rows[] = [];
        $rows[] = ['Route', 'Before (L/100km)', 'After (L/100km)', 'Change (%)', 'Counted?'];
        foreach ($a['routes'] as $r) {
            $rows[] = [
                $r['route_label'],
                $r['baseline']['l_per_100'] ?? null,
                $r['trial']['l_per_100'] ?? null,
                $r['matched'] ? $r['change_pct'] : null,
                $r['matched'] ? 'Yes' : (self::REASONS[$r['unmatched_reason']] ?? 'Not comparable'),
            ];
        }

        $sheet->fromArray($rows, null, 'A1');
        $sheet->getStyle('A1:A'.count($rows))->getFont()->setBold(true);
        $sheet->getColumnDimension('A')->setWidth(30);
        foreach (range(2, 5) as $i) {
            $sheet->getColumnDimensionByColumn($i)->setAutoSize(true);
        }
    }

    private function styleHeader(Worksheet $sheet, int $columns): void
    {
        $last = $sheet->getCell([$columns, 1])->getCoordinate();
        $style = $sheet->getStyle("A1:{$last}");

        $style->getFont()->setBold(true)->getColor()->setRGB('7A6020');
        $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F2F2F2');
        $style->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $style->getBorders()->getBottom()->setBorderStyle(Border::BORDER_THIN);
    }
}
