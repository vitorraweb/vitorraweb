<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ProspectOutreach;
use App\Models\Enquiry;
use App\Models\Prospect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class ProspectController extends Controller
{
    /** Paginated, filterable prospect list. */
    public function index(Request $request): JsonResponse
    {
        $query = Prospect::query()->orderBy('name');

        if ($request->filled('category')) {
            $query->where('category', strtoupper($request->category));
        }
        if ($request->filled('status')) {
            $query->where('outreach_status', $request->status);
        }
        if ($request->filled('assigned')) {
            $query->where('assigned_to', $request->assigned);
        }
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%")
                  ->orWhere('location', 'like', "%{$q}%");
            });
        }

        return response()->json($query->paginate(25));
    }

    /** Update outreach status, feedback, follow-up, or assignment (partial). */
    public function update(Request $request, Prospect $prospect): JsonResponse
    {
        $data = $request->validate([
            'outreach_status' => ['sometimes', 'required', Rule::in(Prospect::STATUSES)],
            'feedback'        => ['sometimes', 'nullable', 'string', 'max:2000'],
            'follow_up'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'assigned_to'     => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $prospect->update($data);

        return response()->json(['data' => $prospect]);
    }

    /**
     * Convert a prospect into a formal enquiry and mark them as converted.
     * Creates a pre-filled enquiry from the prospect's data so it lands in
     * the enquiry pipeline immediately with full context.
     */
    public function convert(Request $request, Prospect $prospect): JsonResponse
    {
        $enquiry = Enquiry::create([
            'product_category' => 'FET',
            'name'             => $prospect->name,
            'email'            => $prospect->email ?? '',
            'phone'            => $prospect->phone,
            'message'          => trim(implode("\n", array_filter([
                "Converted from FET prospect database.",
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

    /**
     * Send a bulk outreach email to a set of selected prospects.
     * Skips any prospect with no email address and reports the count.
     * Marks not_contacted prospects as contacted after a successful send.
     */
    public function bulkEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids'     => ['required', 'array', 'min:1'],
            'ids.*'   => ['integer'],
            'subject' => ['required', 'string', 'max:255'],
            'body'    => ['required', 'string', 'max:10000'],
        ]);

        $prospects = Prospect::whereIn('id', $data['ids'])->get();
        $withEmail = $prospects->filter(fn ($p) => ! empty($p->email));
        $sent = 0;

        foreach ($withEmail as $prospect) {
            Mail::to($prospect->email)->send(
                new ProspectOutreach($prospect->name, $data['subject'], $data['body'], $request->user())
            );
            $sent++;

            if ($prospect->outreach_status === 'not_contacted') {
                $prospect->update(['outreach_status' => 'contacted']);
            }
        }

        $skipped = $prospects->count() - $sent;

        return response()->json([
            'sent'    => $sent,
            'skipped' => $skipped,
            'message' => "Sent to {$sent} prospect(s)" . ($skipped > 0 ? ", skipped {$skipped} with no email." : "."),
        ]);
    }

    /** Stream all prospects as a CSV download. */
    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $query = Prospect::query()->orderBy('category')->orderBy('name');
        if ($request->filled('category')) $query->where('category', strtoupper($request->category));
        if ($request->filled('status'))   $query->where('outreach_status', $request->status);

        $prospects = $query->get();

        return response()->stream(function () use ($prospects) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Name', 'Industry', 'Email', 'Phone', 'Location', 'Status', 'Assigned To', 'Feedback', 'Follow-up']);
            foreach ($prospects as $p) {
                fputcsv($out, [
                    $p->name, $p->category, $p->email ?? '', $p->phone ?? '',
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
     * Import a CSV of prospects under a chosen category. Robust to the marketing
     * workbook format: it locates the header row (skipping any title rows above
     * it) and then extracts each prospect's name / email / phone / location by
     * CONTENT, not by fixed column position — so inconsistent headers and column
     * drift (e.g. a phone landing in the email column) still parse correctly.
     * Idempotent (firstOrCreate by name+category) so re-uploads never overwrite
     * edits. Mirrors scripts/import_prospects.py.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file'     => ['required', 'file', 'mimes:csv,txt', 'max:4096'],
            'category' => ['required', Rule::in(Prospect::CATEGORIES)],
        ]);

        $category = $request->input('category');
        $lines = file($request->file('file')->getRealPath(), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (empty($lines)) {
            return response()->json(['imported' => 0, 'skipped' => 0, 'message' => 'The file was empty.']);
        }
        $lines[0] = preg_replace('/^\xEF\xBB\xBF/', '', $lines[0]); // strip UTF-8 BOM

        $rows = array_map('str_getcsv', $lines);

        // Find the header row (first near-top row mentioning location/email),
        // skipping any title rows above it. Everything below it is data.
        $headerIdx = -1;
        foreach ($rows as $i => $r) {
            if ($i > 4) {
                break;
            }
            $joined = strtolower(implode(' ', array_map(fn ($c) => (string) $c, $r)));
            if (str_contains($joined, 'location') || str_contains($joined, 'email') || str_contains($joined, 'e-mail')) {
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
        $iFb   = $colByName(['feedback', 'notes']);

        // A cell is "phone-like" if it has 7+ digits and no @ (handles 256.../0...
        // formats and multiple numbers). Locations like "Plot 535" (<7 digits) won't match.
        $isPhone = fn (string $v) => ! str_contains($v, '@') && strlen(preg_replace('/\D/', '', $v)) >= 7;

        $imported = 0;
        $skipped = 0;

        foreach ($dataRows as $r) {
            // Scan only the "contact block" (columns before any status column) so
            // status/feedback text can't be mistaken for a location.
            $contactPart = $iStat !== null ? array_slice($r, 0, $iStat) : $r;
            $cells = array_values(array_filter(
                array_map(fn ($c) => trim((string) $c), $contactPart),
                fn ($c) => $c !== ''
            ));
            if (empty($cells)) {
                continue;
            }

            $name = $cells[0];
            $rest = array_slice($cells, 1);

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

            $prospect = Prospect::firstOrCreate(
                ['name' => $name, 'category' => $category],
                [
                    'product'         => 'FET',
                    'location'        => $location,
                    'phone'           => $phone,
                    'email'           => $email,
                    'outreach_status' => $status,
                    'feedback'        => $feedback,
                    'flags'           => $flags ?: null,
                    'source'          => 'admin upload',
                ]
            );

            $prospect->wasRecentlyCreated ? $imported++ : $skipped++;
        }

        return response()->json([
            'imported' => $imported,
            'skipped'  => $skipped,
            'message'  => "Imported {$imported} new prospects, skipped {$skipped} existing.",
        ]);
    }
}
