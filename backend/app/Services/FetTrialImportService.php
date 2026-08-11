<?php

namespace App\Services;

use App\Models\FetTrial;
use App\Models\FetTrialImport;
use App\Models\FetTrialTrip;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Reads a client's own export — whatever shape it arrives in — and turns it
 * into canonical trips.
 *
 * The design rule is that the CLIENT'S FORMAT IS THE INPUT. Asking a fleet to
 * restructure their export into our template is what broke the first trial:
 * our branded log wanted odometer readings and tank levels that Hariss simply
 * do not record, so two of the four columns could never be filled. Here the
 * mapping adapts to them instead.
 *
 * Nothing is guessed. Column mapping is suggested and shown for confirmation,
 * ambiguous units are asked about rather than assumed, and any row that cannot
 * be read is reported by name instead of being dropped.
 *
 * Re-importing is the normal case — clients send a cumulative export each time
 * — so trips are matched on route + date and updated in place. That keeps trip
 * identities stable, and with them every flag a human has already resolved.
 */
class FetTrialImportService
{
    /**
     * Canonical fields a column can be mapped to. `synonyms` drive the
     * suggestion; longer matches win, so "Consumed (IVMS)" maps to the tracker
     * figure while a plain "Consumed" maps to the manual one.
     */
    public const FIELDS = [
        'route_label' => [
            'label' => 'Destination / route', 'type' => 'string', 'required' => true,
            'synonyms' => ['destination', 'route', 'drop point', 'delivery point', 'to'],
        ],
        'region' => [
            'label' => 'Region', 'type' => 'string',
            'synonyms' => ['region', 'zone', 'area'],
        ],
        'trip_date' => [
            'label' => 'Departure date', 'type' => 'date',
            'synonyms' => ['departure time', 'departure date', 'day & date', 'trip date', 'departure', 'date'],
        ],
        'return_date' => [
            'label' => 'Return date', 'type' => 'date',
            'synonyms' => ['arrival at factory', 'return date', 'return time', 'arrival time', 'arrival'],
        ],
        'distance_km' => [
            'label' => 'Distance driven (km)', 'type' => 'number',
            'synonyms' => ['mileage', 'distance', 'km covered', 'kilometres', 'kms'],
        ],
        'avg_speed_kmh' => [
            'label' => 'Average speed', 'type' => 'number',
            'synonyms' => ['avg speed', 'average speed', 'speed'],
        ],
        'fuel_opening_l' => [
            'label' => 'Fuel at departure', 'type' => 'number',
            'synonyms' => ['initial fuel', 'opening fuel', 'opening stock', 'fuel at depart', 'fuel opening'],
        ],
        'fuel_issued_l' => [
            'label' => 'Fuel issued', 'type' => 'number',
            'synonyms' => ['fuel given', 'fuel issued', 'issued', 'fuel drawn'],
        ],
        'fuel_topup_l' => [
            'label' => 'En-route top-up', 'type' => 'number',
            'synonyms' => ['top up', 'top-up', 'en route', 'refuel'],
        ],
        'fuel_closing_l' => [
            'label' => 'Fuel on return', 'type' => 'number',
            'synonyms' => ['final fuel', 'closing fuel', 'closing stock', 'fuel at return', 'final'],
        ],
        'fuel_used_l' => [
            'label' => 'Fuel used (if stated)', 'type' => 'number',
            'synonyms' => ['fuel consumed', 'fuel used', 'consumed'],
        ],
        'fuel_used_ivms_l' => [
            'label' => 'Fuel used — tracker figure', 'type' => 'number',
            'synonyms' => ['consumed (ivms)', 'ivms fuel', 'system fuel', 'tracker fuel', 'ivms'],
        ],
        'load_out_kg' => [
            'label' => 'Load carried out', 'type' => 'weight',
            'synonyms' => ['actual load', 'net weight', 'load out', 'payload', 'load'],
        ],
        'load_in_kg' => [
            'label' => 'Weight on return', 'type' => 'weight',
            'synonyms' => ['in_weight', 'in weight', 'return weight', 'inbound weight'],
        ],
        'driver_name' => [
            'label' => 'Driver', 'type' => 'string',
            'synonyms' => ['driver', 'driver name'],
        ],
        'trial_marker' => [
            'label' => 'Marks a trial trip', 'type' => 'string',
            'synonyms' => ['info', 'fet', 'trial', 'device fitted'],
        ],
        'notes' => [
            'label' => 'Remarks', 'type' => 'string',
            'synonyms' => ['remarks', 'comment', 'notes'],
        ],
    ];

    /** Rows to scan for a header before giving up. */
    private const HEADER_SEARCH_DEPTH = 12;

    /** Hard ceiling on rows read from one sheet, so a huge file cannot exhaust memory. */
    private const MAX_ROWS = 5000;

    /**
     * Every open workbook is closed again.
     *
     * PhpSpreadsheet builds circular references between a spreadsheet, its
     * worksheets and their cells, so dropping the variable is not enough —
     * without disconnectWorksheets() the memory is held until the process
     * ends. Caching loaded books to save a re-read looks like an optimisation
     * and is actually a leak, which is why every read goes through here.
     */
    private function withBook(string $path, callable $callback): mixed
    {
        $reader = IOFactory::createReaderForFile($path);
        // Styles are needed: an Excel date is a plain number until you read its
        // format, and getting that wrong turns 4 July 2026 into 46,207.
        $reader->setReadDataOnly(false);
        $reader->setReadEmptyCells(false);

        $book = $reader->load($path);

        try {
            return $callback($book);
        } finally {
            $book->disconnectWorksheets();
            unset($book);
        }
    }

    /**
     * What is in this file: every sheet, with the header row and column mapping
     * we would suggest for each. Nothing is persisted.
     *
     * @return array<string, mixed>
     */
    public function inspect(string $path): array
    {
        return $this->withBook($path, function (Spreadsheet $book) {
            $sheets = [];

            foreach ($book->getWorksheetIterator() as $sheet) {
                $grid = $this->grid($sheet);
                $headerRow = $this->findHeaderRow($grid);

                $sheets[] = [
                    'name' => $sheet->getTitle(),
                    'rows' => count($grid),
                    'header_row' => $headerRow,
                    'data_rows' => $headerRow === null ? 0 : max(0, count($grid) - $headerRow - 1),
                    'confidence' => $headerRow === null ? 0 : count($this->suggestMapping($grid[$headerRow])),
                ];
            }

            // Rank sheets by how much of our schema they appear to satisfy, so
            // the right tab is preselected rather than whichever comes first.
            usort($sheets, fn ($a, $b) => $b['confidence'] <=> $a['confidence']);

            return ['sheets' => $sheets];
        });
    }

    /**
     * A full preview of one sheet: suggested mapping, sample rows as they would
     * be read, and any questions that must be answered before committing.
     *
     * @param  array<string, string>|null  $mapping  canonical field => column header
     * @return array<string, mixed>
     */
    public function preview(string $path, ?string $sheetName = null, ?array $mapping = null, array $units = []): array
    {
        return $this->withBook($path, fn (Spreadsheet $book) => $this->previewBook($book, $sheetName, $mapping, $units));
    }

    /** @return array<string, mixed> */
    private function previewBook(Spreadsheet $book, ?string $sheetName, ?array $mapping, array $units): array
    {
        $sheet = $sheetName ? $book->getSheetByName($sheetName) : $book->getSheet(0);

        if ($sheet === null) {
            return ['error' => "There is no sheet called \"{$sheetName}\" in this file."];
        }

        $grid = $this->grid($sheet);
        $headerRow = $this->findHeaderRow($grid);

        if ($headerRow === null) {
            return [
                'error' => 'No column headings could be found in this sheet. Pick a different sheet, or map the columns by hand.',
                'sheet' => $sheet->getTitle(),
            ];
        }

        $headers = $grid[$headerRow];
        $mapping ??= $this->suggestMapping($headers);
        $rows = array_slice($grid, $headerRow + 1);

        $parsed = [];
        $rejected = [];

        foreach ($rows as $i => $row) {
            $ref = $this->rowRef($sheet->getTitle(), $headerRow + $i + 2);
            $result = $this->readRow($row, $headers, $mapping, $units, $ref);

            if ($result['ok']) {
                $parsed[] = $result['data'] + ['_row' => $ref];
            } elseif ($result['reason'] !== null) {
                $rejected[$ref] = $result['reason'];
            }
        }

        return [
            'sheet' => $sheet->getTitle(),
            'header_row' => $headerRow,
            'headers' => array_values(array_filter($headers, fn ($h) => $h !== null && $h !== '')),
            'mapping' => $mapping,
            'unmapped' => $this->unmappedFields($mapping),
            'unit_questions' => $this->unitQuestions($headers, $mapping, $parsed, $units),
            'sample' => array_slice($parsed, 0, 10),
            'row_count' => count($parsed),
            'rejected' => $rejected,
        ];
    }

    /**
     * Write the mapped rows into the trial, then validate. Existing trips are
     * matched on route + date and updated, so identities — and the human
     * decisions attached to them — survive a re-import.
     *
     * @param  array<string, mixed>  $options  sheet, mapping, units, filename
     */
    public function commit(FetTrial $trial, string $path, array $options): FetTrialImport
    {
        $preview = $this->preview(
            $path,
            $options['sheet'] ?? null,
            $options['mapping'] ?? null,
            $options['units'] ?? []
        );

        if (isset($preview['error'])) {
            throw new \RuntimeException($preview['error']);
        }

        $import = $trial->imports()->create([
            'filename' => $options['filename'] ?? basename($path),
            'sheet' => $preview['sheet'],
            'mapping' => $preview['mapping'],
            'rows_total' => $preview['row_count'] + count($preview['rejected']),
            'rows_rejected' => count($preview['rejected']),
            'rejections' => $preview['rejected'] ?: null,
            'imported_by' => auth()->id(),
        ]);

        // Re-read in full (the preview only keeps a sample). The grid is taken
        // out of the workbook here so the book itself is closed before the
        // writes begin, rather than held open across them.
        $grid = $this->withBook($path, fn (Spreadsheet $book) => $this->grid($book->getSheetByName($preview['sheet'])));

        $headers = $grid[$preview['header_row']];
        $rows = array_slice($grid, $preview['header_row'] + 1);

        $existing = $trial->trips()->get();
        $touched = [];
        $imported = 0;
        $sequence = 0;

        foreach ($rows as $i => $row) {
            $ref = $this->rowRef($preview['sheet'], $preview['header_row'] + $i + 2);
            $result = $this->readRow($row, $headers, $preview['mapping'], $options['units'] ?? [], $ref);

            if (! $result['ok']) {
                continue;
            }

            $data = $result['data'];
            $sequence++;

            $attributes = $this->toTripAttributes($trial, $data, $sequence, $ref, $import->id);
            $match = $this->matchExisting($existing, $attributes, $ref);

            if ($match) {
                // Keep the trip's identity (and its resolved flags); refresh the
                // figures. A status a human set by hand is left alone.
                $keep = $match->status === 'excluded' ? ['status' => 'excluded'] : [];
                $match->fill(array_diff_key($attributes, ['status' => null]) + $keep)->save();
                $touched[] = $match->id;
            } else {
                $touched[] = $trial->trips()->create($attributes)->id;
            }

            $imported++;
        }

        /*
         * Trips that came from an earlier import but are absent from this one
         * were withdrawn by the client. Manually-entered trips are never
         * touched — only the system's own earlier work is reconciled.
         */
        $trial->trips()
            ->where('source', 'import')
            ->whereNotIn('id', $touched ?: [0])
            ->delete();

        $counts = app(FetTrialValidator::class)->validate($trial->fresh());

        $import->update([
            'rows_imported' => $imported,
            'rows_flagged' => $trial->fresh()->trips()->where('status', 'review')->count(),
        ]);

        return $import->fresh();
    }

    /* ── reading ──────────────────────────────────────────────────────────── */

    /**
     * The sheet as a plain array of rows, with dates already resolved.
     *
     * Bounded to the cells that actually hold data. Client workbooks routinely
     * carry formatting hundreds of rows past the last real entry — the first
     * one declared 879 rows for 13 trips — and walking that grid cell by cell
     * exhausts memory for nothing.
     *
     * @return array<int, array<int, mixed>>
     */
    private function grid(Worksheet $sheet): array
    {
        $maxRow = min($sheet->getHighestDataRow(), self::MAX_ROWS);
        $maxCol = Coordinate::columnIndexFromString($sheet->getHighestDataColumn());

        $out = [];

        for ($row = 1; $row <= $maxRow; $row++) {
            $cells = [];
            for ($col = 1; $col <= $maxCol; $col++) {
                // cellExists first: getCell() would create every blank it touches.
                $cells[] = $sheet->cellExists([$col, $row])
                    ? $this->cellValue($sheet->getCell([$col, $row]))
                    : null;
            }
            $out[] = $cells;
        }

        // Drop trailing blank rows left behind by stray formatting.
        while ($out !== [] && array_filter(end($out), fn ($v) => $v !== null) === []) {
            array_pop($out);
        }

        return array_values($out);
    }

    private function cellValue(?Cell $cell): mixed
    {
        if ($cell === null) {
            return null;
        }

        $value = $cell->getValue();

        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value) && ExcelDate::isDateTime($cell)) {
            return CarbonImmutable::instance(ExcelDate::excelToDateTimeObject((float) $value));
        }

        return is_string($value) ? trim($value) : $value;
    }

    /**
     * The header row is the one that mentions the most things we recognise.
     * Client exports routinely carry title rows and merged banners above it.
     *
     * @param  array<int, array<int, mixed>>  $grid
     */
    private function findHeaderRow(array $grid): ?int
    {
        $best = null;
        $bestScore = 0;

        foreach (array_slice($grid, 0, self::HEADER_SEARCH_DEPTH, true) as $i => $row) {
            $score = count($this->suggestMapping($row));
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $i;
            }
        }

        // One or two coincidental matches is not a header.
        return $bestScore >= 3 ? $best : null;
    }

    /**
     * Suggest canonical field => column heading. A longer synonym match wins,
     * so "Consumed (IVMS)" is not mistaken for "Consumed".
     *
     * @param  array<int, mixed>  $headers
     * @return array<string, string>
     */
    public function suggestMapping(array $headers): array
    {
        $scores = [];

        foreach ($headers as $header) {
            if (! is_string($header) || trim($header) === '') {
                continue;
            }

            $needle = Str::lower(preg_replace('/\s+/', ' ', trim($header)) ?? '');

            foreach (self::FIELDS as $field => $spec) {
                foreach ($spec['synonyms'] as $synonym) {
                    if (str_contains($needle, $synonym)) {
                        $score = strlen($synonym);
                        // Exact heading beats a substring match.
                        if ($needle === $synonym) {
                            $score += 50;
                        }
                        if (! isset($scores[$field]) || $score > $scores[$field]['score']) {
                            $scores[$field] = ['score' => $score, 'header' => trim($header)];
                        }
                    }
                }
            }
        }

        // One column can only serve one field — the better match keeps it.
        $mapping = [];
        $claimed = [];

        uasort($scores, fn ($a, $b) => $b['score'] <=> $a['score']);

        foreach ($scores as $field => $hit) {
            if (in_array($hit['header'], $claimed, true)) {
                continue;
            }
            $mapping[$field] = $hit['header'];
            $claimed[] = $hit['header'];
        }

        return $mapping;
    }

    /**
     * Read one spreadsheet row into canonical values.
     *
     * @return array{ok: bool, data?: array<string, mixed>, reason: ?string}
     */
    private function readRow(array $row, array $headers, array $mapping, array $units, string $ref): array
    {
        $get = function (string $field) use ($row, $headers, $mapping) {
            $header = $mapping[$field] ?? null;
            if ($header === null) {
                return null;
            }
            $index = array_search($header, array_map(fn ($h) => is_string($h) ? trim($h) : $h, $headers), true);

            return $index === false ? null : ($row[$index] ?? null);
        };

        $data = [];
        foreach (array_keys(self::FIELDS) as $field) {
            $data[$field] = $get($field);
        }

        // A row with nothing identifying on it is blank padding, not a failure.
        $identifying = array_filter([$data['route_label'], $data['trip_date'], $data['distance_km']]);
        if ($identifying === []) {
            return ['ok' => false, 'reason' => null];
        }

        if (! is_string($data['route_label']) || trim($data['route_label']) === '') {
            return ['ok' => false, 'reason' => 'No destination on this row, so the trip cannot be compared with any other.'];
        }

        foreach (self::FIELDS as $field => $spec) {
            $data[$field] = match ($spec['type']) {
                'number' => $this->number($data[$field]),
                'weight' => $this->weight($data[$field], $units[$field] ?? 'kg'),
                'date' => $this->date($data[$field]),
                default => is_string($data[$field]) ? trim($data[$field]) : $data[$field],
            };
        }

        return ['ok' => true, 'data' => $data, 'reason' => null];
    }

    private function number(mixed $value): ?float
    {
        if ($value instanceof CarbonImmutable || $value === null) {
            return null;
        }
        if (is_string($value)) {
            $value = str_replace([',', ' '], '', $value);
            if (! is_numeric($value)) {
                return null;
            }
        }

        return is_numeric($value) ? round((float) $value, 2) : null;
    }

    /** Weights are stored in kg; a column recorded in tonnes is converted here. */
    private function weight(mixed $value, string $unit): ?int
    {
        $n = $this->number($value);
        if ($n === null) {
            return null;
        }

        return (int) round($unit === 'tonnes' ? $n * 1000 : $n);
    }

    private function date(mixed $value): ?CarbonImmutable
    {
        if ($value instanceof CarbonImmutable) {
            return $value;
        }
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse(trim($value));
        } catch (\Throwable) {
            return null;
        }
    }

    /* ── shaping ──────────────────────────────────────────────────────────── */

    /** @return array<string, mixed> */
    private function toTripAttributes(FetTrial $trial, array $data, int $sequence, string $ref, int $importId): array
    {
        $tripDate = $data['trip_date'];

        // Phase follows the installation date. The client's own trial marking is
        // carried across separately so the validator can catch the two
        // disagreeing — which is exactly how a trip dated four months early was
        // spotted on the first trial.
        $phase = ($trial->installed_on && $tripDate && $tripDate->gte($trial->installed_on))
            ? 'trial'
            : 'baseline';

        $marked = $this->marksTrial($data['trial_marker']);

        return [
            'sequence' => $sequence,
            'route_label' => $data['route_label'],
            'region' => $data['region'],
            'trip_date' => $tripDate?->toDateString(),
            'return_date' => $data['return_date']?->toDateString(),
            'distance_km' => $data['distance_km'],
            'distance_source' => 'tracker',
            'avg_speed_kmh' => $data['avg_speed_kmh'],
            'fuel_opening_l' => $data['fuel_opening_l'],
            'fuel_issued_l' => $data['fuel_issued_l'],
            'fuel_topup_l' => $data['fuel_topup_l'],
            'fuel_closing_l' => $data['fuel_closing_l'],
            'fuel_used_l' => $data['fuel_used_l'],
            'fuel_used_ivms_l' => $data['fuel_used_ivms_l'],
            'load_out_kg' => $data['load_out_kg'],
            'load_in_kg' => $data['load_in_kg'],
            'driver_name' => $data['driver_name'],
            'notes' => $data['notes'],
            'phase' => $phase,
            'phase_override' => $marked ? 'trial' : null,
            'phase_override_reason' => $marked ? 'The client marked this row as a trial trip.' : null,
            'status' => 'valid',
            'source' => 'import',
            'fet_trial_import_id' => $importId,
            'source_row_ref' => $ref,
        ];
    }

    /** Does the client's marker column say "this one had the device on"? */
    private function marksTrial(mixed $value): bool
    {
        if (! is_string($value) || trim($value) === '') {
            return false;
        }

        $v = Str::lower($value);

        // "FET Trail trip" in the first client's file — their typo, not ours.
        return str_contains($v, 'fet') || str_contains($v, 'trial') || str_contains($v, 'trail');
    }

    /**
     * Find the trip this row already corresponds to. Route plus departure date
     * identifies a journey; where there is no date (an unfinished trip) the
     * source row is the fallback.
     *
     * @param  Collection<int, FetTrialTrip>  $existing
     */
    private function matchExisting($existing, array $attributes, string $ref): ?FetTrialTrip
    {
        $key = FetTrialTrip::normaliseRoute($attributes['route_label']);

        if ($attributes['trip_date'] !== null) {
            $match = $existing->first(fn (FetTrialTrip $t) => $t->route_key === $key
                && $t->trip_date?->toDateString() === $attributes['trip_date']);

            if ($match) {
                return $match;
            }
        }

        return $existing->first(fn (FetTrialTrip $t) => $t->source_row_ref === $ref);
    }

    /* ── questions for the human ──────────────────────────────────────────── */

    /**
     * Canonical fields nothing was mapped to, so the screen can say what is
     * missing rather than silently importing a thinner record.
     *
     * @return array<int, array<string, string>>
     */
    private function unmappedFields(array $mapping): array
    {
        $out = [];

        foreach (self::FIELDS as $field => $spec) {
            if (! isset($mapping[$field])) {
                $out[] = [
                    'field' => $field,
                    'label' => $spec['label'],
                    'required' => ! empty($spec['required']) ? 'yes' : 'no',
                ];
            }
        }

        return $out;
    }

    /**
     * Ambiguous units, asked about rather than assumed.
     *
     * The first client's file has a column headed "Actual Load(T)" containing
     * 29,600 — tonnes in the heading, kilogrammes in the cells. Guessing either
     * way silently corrupts every load figure and every comparison built on it.
     *
     * @return array<int, array<string, mixed>>
     */
    private function unitQuestions(array $headers, array $mapping, array $rows, array $units): array
    {
        $questions = [];

        foreach (['load_out_kg', 'load_in_kg'] as $field) {
            if (! isset($mapping[$field]) || isset($units[$field])) {
                continue;
            }

            $header = Str::lower($mapping[$field]);
            $saysTonnes = str_contains($header, '(t)') || str_contains($header, 'tonne') || str_contains($header, 'ton');

            $values = array_filter(array_column($rows, $field), fn ($v) => $v !== null && $v > 0);
            if ($values === []) {
                continue;
            }
            $median = $this->median($values);

            // Values in the thousands are kilogrammes whatever the heading says.
            $looksLikeKg = $median >= (float) config('fet_trials.thresholds.kg_in_tonnes_threshold', 1000);

            if ($saysTonnes && $looksLikeKg) {
                $questions[] = [
                    'field' => $field,
                    'header' => $mapping[$field],
                    'question' => sprintf(
                        'The column "%s" is headed as tonnes, but its values average about %s. Is it recorded in kilogrammes?',
                        $mapping[$field],
                        number_format($median)
                    ),
                    'suggested' => 'kg',
                    'options' => ['kg', 'tonnes'],
                ];
            } elseif (! $saysTonnes && ! $looksLikeKg) {
                $questions[] = [
                    'field' => $field,
                    'header' => $mapping[$field],
                    'question' => sprintf(
                        'The column "%s" holds values averaging about %s. That is too small for kilogrammes — is it tonnes?',
                        $mapping[$field],
                        number_format($median, 1)
                    ),
                    'suggested' => 'tonnes',
                    'options' => ['kg', 'tonnes'],
                ];
            }
        }

        return $questions;
    }

    /** @param  array<int, float|int>  $values */
    private function median(array $values): float
    {
        sort($values);
        $n = count($values);
        $mid = intdiv($n, 2);

        return $n % 2 === 0 ? ($values[$mid - 1] + $values[$mid]) / 2 : (float) $values[$mid];
    }

    private function rowRef(string $sheet, int $rowNumber): string
    {
        return "{$sheet}!{$rowNumber}";
    }
}
