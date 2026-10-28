<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Models\Market;
use App\Models\Prospect;
use App\Services\Marketing\MarketBuilder;
use App\Support\ProspectMatchIndex;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProspectController extends Controller
{
    /** The list filters a request carries (see Prospect::scopeFiltered). */
    public static function filtersFrom(Request $request): array
    {
        return $request->only(['product', 'category', 'status', 'assigned', 'q', 'due']);
    }

    /** Paginated, filterable prospect list. */
    public function index(Request $request): JsonResponse
    {
        // Lists are segmented per product line (FET, SEAL, COFFEE) — the team
        // works one at a time, so an unscoped view mixes unrelated sales motions.
        $query = Prospect::query()->filtered(self::filtersFrom($request))->orderBy('name');

        return response()->json($query->paginate(25));
    }

    /** Update outreach status, feedback, follow-up, or assignment (partial). */
    public function update(Request $request, Prospect $prospect): JsonResponse
    {
        $data = $request->validate([
            'outreach_status' => ['sometimes', 'required', Rule::in(Prospect::STATUSES)],
            'feedback'        => ['sometimes', 'nullable', 'string', 'max:2000'],
            'follow_up'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'follow_up_on'    => ['sometimes', 'nullable', 'date'],
            'assigned_to'     => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $prospect->update($data);

        return response()->json(['data' => $prospect]);
    }

    /**
     * One change applied to many rows: the ticked rows (`ids`), or every row
     * matching the screen's filters (`all_matching`) — so "set a follow-up for
     * the whole coffee list" is one action, not one per page of 25.
     */
    public function bulk(Request $request): JsonResponse
    {
        $request->validate([
            'ids'             => ['required_without:all_matching', 'array'],
            'ids.*'           => ['integer'],
            'all_matching'    => ['nullable', 'boolean'],
            'outreach_status' => ['sometimes', 'required', Rule::in(Prospect::STATUSES)],
            'assigned_to'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'follow_up_on'    => ['sometimes', 'nullable', 'date'],
            'follow_up'       => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $changes = $request->only(['outreach_status', 'assigned_to', 'follow_up_on', 'follow_up']);
        if ($changes === []) {
            return response()->json(['message' => 'Nothing to change.'], 422);
        }

        $query = $request->boolean('all_matching')
            ? Prospect::query()->filtered(self::filtersFrom($request))
            : Prospect::whereIn('id', $request->input('ids', []));

        $updated = $query->update($changes + ['updated_at' => now()]);

        return response()->json(['updated' => $updated, 'message' => "Updated {$updated}."]);
    }

    /** Add one contact by hand — someone met at an event, a referral, a call. */
    public function store(Request $request): JsonResponse
    {
        $product = strtoupper((string) $request->input('product', 'FET'));
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'product'         => ['required', Rule::in(Prospect::PRODUCTS)],
            'category'        => ['required', Rule::in(Prospect::categoriesFor($product))],
            'email'           => ['nullable', 'email', 'max:255', 'required_without:phone'],
            'phone'           => ['nullable', 'string', 'max:60'],
            'location'        => ['nullable', 'string', 'max:255'],
            'outreach_status' => ['nullable', Rule::in(Prospect::STATUSES)],
            'feedback'        => ['nullable', 'string', 'max:2000'],
            'assigned_to'     => ['nullable', 'string', 'max:120'],
            'market_id'       => ['nullable', 'integer', 'exists:markets,id'],
        ]);

        $index = new ProspectMatchIndex(Prospect::where('product', $data['product'])->get());
        [$existing] = $index->find($data['name'], $data['email'] ?? null, $data['phone'] ?? null);
        if ($existing) {
            return response()->json(['message' => "Already on the {$data['product']} list as \"{$existing->name}\".", 'data' => $existing], 409);
        }

        $prospect = Prospect::create([
            ...collect($data)->except('market_id')->all(),
            'email'           => isset($data['email']) ? mb_strtolower($data['email']) : null,
            'phone'           => isset($data['phone']) ? (\App\Support\Phone::e164($data['phone']) ?? $data['phone']) : null,
            'outreach_status' => $data['outreach_status'] ?? 'not_contacted',
            'source'          => 'added by '.$request->user()->name,
        ]);
        $market = isset($data['market_id']) ? Market::find($data['market_id']) : MarketBuilder::autoMarketFor($prospect->product, $prospect->category);
        $market?->prospects()->syncWithoutDetaching([$prospect->id => ['added_by' => $request->user()->id]]);
        \App\Services\Marketing\LeadScorer::forAll()->scoreAndStore(collect([$prospect]));

        return response()->json(['data' => $prospect->fresh(), 'message' => "{$prospect->name} added".($market ? " to {$market->name}" : '').'.'], 201);
    }

    /** A blank spreadsheet with the columns the importer understands. */
    public function importTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Name', 'Email', 'Phone', 'Location', 'Industry', 'Status', 'Notes']);
            fputcsv($out, ['Kampala Haulage Ltd', 'ops@kampalahaulage.ug', '+256700000000', 'Nakawa, Kampala', 'Cargo', 'Not contacted', 'Met at the trade fair']);
            fclose($out);
        }, 'vitorra-contacts-template.csv', ['Content-Type' => 'text/csv']);
    }

    /**
     * Convert a prospect into a formal enquiry and mark them as converted.
     * Creates a pre-filled enquiry from the prospect's data so it lands in
     * the enquiry pipeline immediately with full context.
     */
    public function convert(Request $request, Prospect $prospect): JsonResponse
    {
        $product = $prospect->product ?: 'FET';

        $enquiry = Enquiry::create([
            'product_category' => $product,
            'name'             => $prospect->name,
            'email'            => $prospect->email ?? '',
            'phone'            => $prospect->phone,
            'message'          => trim(implode("\n", array_filter([
                "Converted from the {$product} prospect database.",
                "Industry: {$prospect->category}",
                $prospect->feedback ? "Notes: {$prospect->feedback}" : null,
                $prospect->follow_up ? "Follow-up: {$prospect->follow_up}" : null,
            ]))),
            'status'           => 'new',
            'assigned_to'      => $prospect->assigned_to,
        ]);

        $prospect->update(['outreach_status' => 'converted']);

        return response()->json([
            'message'  => "Prospect converted to enquiry #{$enquiry->id}.",
            'enquiry'  => $enquiry,
        ]);
    }

    /** Stream all prospects as a CSV download. */
    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $query = Prospect::query()->orderBy('product')->orderBy('category')->orderBy('name');
        if ($request->filled('product'))  $query->where('product', strtoupper($request->product));
        if ($request->filled('category')) $query->where('category', strtoupper($request->category));
        if ($request->filled('status'))   $query->where('outreach_status', $request->status);

        $prospects = $query->get();

        return response()->stream(function () use ($prospects) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Product', 'Name', 'Industry', 'Email', 'Phone', 'Location', 'Status', 'Assigned To', 'Feedback', 'Follow-up']);
            foreach ($prospects as $p) {
                fputcsv($out, [
                    $p->product, $p->name, $p->category, $p->email ?? '', $p->phone ?? '',
                    $p->location ?? '', $p->outreach_status, $p->assigned_to ?? '',
                    $p->feedback ?? '', $p->follow_up ?? '',
                ]);
            }
            fclose($out);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="prospects-' . now()->format('Y-m-d') . '.csv"',
            'Cache-Control'       => 'no-cache, no-store',
        ]);
    }

    /**
     * Import a prospect list (CSV or Excel) under a chosen category. Robust to
     * the marketing workbook format: it locates the header row (skipping any
     * title rows above it) and then extracts each prospect's name / email /
     * phone / location by CONTENT, not by fixed column position — so
     * inconsistent headers and column drift (e.g. a phone landing in the email
     * column) still parse correctly. A name-like header ("name", "company",
     * "customer"…) is used for the name when present, and a leading row-number
     * column is ignored. Idempotent (firstOrCreate by name+category+product) so
     * re-uploads never overwrite edits. Mirrors scripts/import_prospects.py.
     *
     * `existing_customers` files the rows as already converted — for a list of
     * people who already buy from us (the coffee customer book), as opposed to
     * cold leads.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file'               => ['required', 'file', 'extensions:csv,txt,xlsx,xls', 'max:8192'],
            'product'            => ['required', Rule::in(Prospect::PRODUCTS)],
            'category'           => ['required', Rule::in(Prospect::CATEGORIES)],
            'existing_customers' => ['nullable', 'boolean'],
            // File the rows (new and already-known) into this market too.
            'market_id'          => ['nullable', 'integer', 'exists:markets,id'],
        ]);

        $product   = $request->input('product');
        $category  = $request->input('category');
        $customers = $request->boolean('existing_customers');

        // Guard against a list being filed under another product's vertical
        // (e.g. a SEAL hospital list under an FET industry).
        if (! in_array($category, Prospect::categoriesFor($product), true)) {
            return response()->json([
                'message' => "{$category} is not an industry on the {$product} list.",
            ], 422);
        }

        try {
            $rows = $this->readRows($request->file('file'));
        } catch (\Throwable) {
            return response()->json([
                'message' => 'That file could not be read. Upload a CSV or an Excel workbook (.xlsx).',
            ], 422);
        }
        if (empty($rows)) {
            return response()->json(['imported' => 0, 'skipped' => 0, 'message' => 'The file was empty.']);
        }

        // Find the header row (first near-top row mentioning location/email),
        // skipping any title rows above it. Everything below it is data.
        $headerIdx = -1;
        foreach ($rows as $i => $r) {
            if ($i > 4) {
                break;
            }
            $joined = strtolower(implode(' ', array_map(fn ($c) => (string) $c, $r)));
            if (str_contains($joined, 'location') || str_contains($joined, 'email') || str_contains($joined, 'e-mail')
                || str_contains($joined, 'phone')) {
                $headerIdx = $i;
                break;
            }
        }
        $header   = $headerIdx >= 0 ? array_map(fn ($h) => strtolower(trim((string) $h)), $rows[$headerIdx]) : [];
        $dataRows = array_slice($rows, $headerIdx + 1);

        // Optional outreach status / feedback columns (read by header position).
        $colByName = function (array $needles) use ($header) {
            foreach ($header as $i => $h) {
                foreach ($needles as $n) {
                    if ($h !== '' && str_contains($h, $n)) {
                        return $i;
                    }
                }
            }
            return null;
        };
        $iStat = $colByName(['status']);
        // The name column: a name-like header that is not really the email,
        // phone or status column ("customer email" must not become the name).
        $iName = null;
        foreach ($header as $i => $h) {
            if (preg_match('/e-?mail|phone|tel|mobile|status|location|address|industry|sector|category|type/', $h)) {
                continue;
            }
            if (preg_match('/name|company|organi[sz]ation|customer|business|client/', $h)) {
                $iName = $i;
                break;
            }
        }
        $iFb   = $colByName(['feedback', 'notes']);
        // An optional industry column ("Industry", "Sector", "Category", "Type")
        // files each row under its own industry; unrecognised values fall
        // back to the industry chosen on screen.
        $iInd  = $colByName(['industry', 'sector', 'category', 'type of business', 'business type']);
        $industryFor = function (?string $v) use ($product, $category): string {
            $v = strtolower(trim((string) $v));
            if ($v === '') {
                return $category;
            }
            foreach (Prospect::categoriesFor($product) as $code) {
                $label = strtolower(Prospect::CATEGORY_LABELS[$code] ?? $code);
                if ($v === strtolower($code) || $v === $label || str_replace(' ', '_', $v) === strtolower($code)
                    || rtrim($label, 's') === rtrim($v, 's')) {
                    return $code;
                }
            }

            return $category;
        };
        $touched = []; // every prospect id this file names, new or existing (for the market)

        // A cell is "phone-like" if it has 7+ digits and no @ (handles 256.../0...
        // formats and multiple numbers). Locations like "Plot 535" (<7 digits) won't match.
        $isPhone = fn (string $v) => ! str_contains($v, '@') && strlen(preg_replace('/\D/', '', $v)) >= 7;

        $imported = 0;
        $skipped = 0;
        $filled = 0;
        $matchedDifferently = []; // matched on email/phone under another name — worth a look

        // Everyone already on this product's list, indexed the three ways a
        // re-uploaded sheet can name the same customer. Marketing keep one
        // workbook and re-upload it as it grows: only genuinely new rows may be
        // added, even if a name was retyped, a number reformatted or the row
        // filed under another buyer type this time.
        $index = new ProspectMatchIndex(Prospect::where('product', $product)->get());

        foreach ($dataRows as $r) {
            // Scan only the "contact block" (columns before any status column) so
            // status/feedback text can't be mistaken for a location.
            $rowIndustry = $iInd !== null ? (string) ($r[$iInd] ?? '') : '';
            if ($iInd !== null) {
                $r[$iInd] = ''; // never mistake the industry for a location
            }
            $contactPart = $iStat !== null ? array_slice($r, 0, $iStat) : $r;
            $cells = array_values(array_filter(
                array_map(fn ($c) => trim((string) $c), $contactPart),
                fn ($c) => $c !== ''
            ));
            if (empty($cells)) {
                continue;
            }

            // Prefer the name column when the header names one; otherwise the
            // first cell, skipping a leading row number ("1", "2." …).
            if (count($cells) > 1 && preg_match('/^\d{1,4}\.?$/', $cells[0])) {
                array_shift($cells);
            }
            $named = $iName !== null ? trim((string) ($r[$iName] ?? '')) : '';
            if ($named !== '') {
                $name = $named;
                $rest = array_values(array_filter($cells, fn ($c) => $c !== $named));
            } else {
                $name = $cells[0];
                $rest = array_slice($cells, 1);
            }

            $emails = array_values(array_filter($rest, fn ($c) => str_contains($c, '@')));
            $phones = array_values(array_filter($rest, $isPhone));
            $texts  = array_values(array_filter($rest, fn ($c) => ! str_contains($c, '@') && ! $isPhone($c)));

            $flags = [];
            $email = null;
            if (! empty($emails)) {
                $clean = strtolower(str_replace(' ', '', $emails[0]));
                if (str_contains($clean, 'example.com')) {
                    $flags[] = 'bad_email';
                } else {
                    $email = filter_var($clean, FILTER_VALIDATE_EMAIL) ?: null;
                    if (! $email) {
                        $flags[] = 'bad_email';
                    }
                }
            }
            $phone    = ! empty($phones) ? implode(' / ', array_values(array_unique($phones))) : null;
            $location = $texts[0] ?? null;
            if (! $email && ! $phone) {
                $flags[] = 'no_contact';
            }

            $statusRaw = $iStat !== null && isset($r[$iStat]) ? strtolower(trim((string) $r[$iStat])) : '';
            $feedback  = $iFb !== null && isset($r[$iFb]) ? (trim((string) $r[$iFb]) ?: null) : null;
            $status = str_contains(strtolower($feedback ?? ''), 'not delivered') || str_contains($statusRaw, 'bounce')
                ? 'bounced'
                : (in_array($statusRaw, ['sent', 'delivered', 'contacted'], true) ? 'contacted' : 'not_contacted');
            if ($customers && $status !== 'bounced') {
                $status = 'converted';
            }

            [$existing, $how] = $index->find($name, $email, $phone);

            if ($existing) {
                $touched[] = $existing->id;
                $skipped++;
                // Never overwrite what the team has edited — only fill blanks.
                $fill = array_filter([
                    'email'    => $existing->email ? null : $email,
                    'phone'    => $existing->phone ? null : $phone,
                    'location' => $existing->location ? null : $location,
                ]);
                if ($fill) {
                    if (isset($fill['email']) || isset($fill['phone'])) {
                        $fill['flags'] = array_values(array_diff($existing->flags ?? [], ['no_contact'])) ?: null;
                    }
                    $existing->update($fill);
                    $index->add($existing);
                    $filled++;
                }
                if ($how !== 'name' && count($matchedDifferently) < 20) {
                    $matchedDifferently[] = ['row' => $name, 'existing' => $existing->name, 'by' => $how];
                }

                continue;
            }

            $prospect = Prospect::create([
                'name'            => $name,
                'category'        => $industryFor($rowIndustry),
                'product'         => $product,
                'location'        => $location,
                'phone'           => $phone,
                'email'           => $email,
                'outreach_status' => $status,
                'feedback'        => $feedback,
                'flags'           => $flags ?: null,
                'source'          => $customers ? 'customer list upload' : 'admin upload',
            ]);
            $index->add($prospect); // a row repeated within the same file is caught too
            $touched[] = $prospect->id;
            $imported++;

            // Straight into its product × industry market when one exists.
            if (! $request->filled('market_id') && ($auto = MarketBuilder::autoMarketFor($product, $prospect->category))) {
                $auto->prospects()->syncWithoutDetaching([$prospect->id => ['added_by' => $request->user()?->id]]);
            }
        }

        if ($request->filled('market_id') && $touched) {
            $market = Market::find($request->integer('market_id'));
            $market->prospects()->syncWithoutDetaching(collect($touched)->unique()->mapWithKeys(fn ($id) => [$id => ['added_by' => $request->user()?->id]])->all());
        }

        $noun = $customers ? 'customers' : 'prospects';
        $message = "Added {$imported} new {$noun}. {$skipped} already on the list were left as they are";
        $message .= $filled ? " ({$filled} had missing contact details filled in)." : '.';
        if (isset($market)) {
            $message .= ' All '.count(array_unique($touched))." rows are in the market \"{$market->name}\".";
        }

        return response()->json([
            'imported'            => $imported,
            'skipped'             => $skipped,
            'filled'              => $filled,
            'matched_differently' => $matchedDifferently,
            'message'             => $message,
        ]);
    }

    /**
     * Every row of the upload as an array of cell strings. CSV is read as-is;
     * a workbook is read from its first sheet that has data, with cells as
     * displayed in Excel so a phone number is not turned into 2.56772E+11.
     *
     * @return array<int, array<int, string>>
     */
    private function readRows(\Illuminate\Http\UploadedFile $file): array
    {
        $ext = strtolower($file->getClientOriginalExtension());

        if (in_array($ext, ['csv', 'txt'], true)) {
            $lines = file($file->getRealPath(), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            if ($lines) {
                $lines[0] = preg_replace('/^\xEF\xBB\xBF/', '', $lines[0]); // strip UTF-8 BOM
            }

            return array_map('str_getcsv', $lines);
        }

        $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($file->getRealPath());
        $reader->setReadEmptyCells(false);
        $book = $reader->load($file->getRealPath());

        try {
            foreach ($book->getWorksheetIterator() as $sheet) {
                $rows = array_values(array_filter(
                    $sheet->toArray(null, true, true, false),
                    fn ($r) => implode('', array_map(fn ($c) => trim((string) $c), $r)) !== ''
                ));
                if ($rows) {
                    return array_map(fn ($r) => array_map(fn ($c) => (string) $c, $r), $rows);
                }
            }

            return [];
        } finally {
            // PhpSpreadsheet holds circular references; free them explicitly.
            $book->disconnectWorksheets();
            unset($book);
        }
    }
}
