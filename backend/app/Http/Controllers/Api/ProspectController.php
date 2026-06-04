<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prospect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
     * Import a CSV of new prospects under a chosen category. Idempotent
     * (firstOrCreate by name+category) so re-uploads never overwrite edits.
     * Columns are matched loosely by header; the first column defaults to name.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file'     => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
            'category' => ['required', Rule::in(Prospect::CATEGORIES)],
        ]);

        $category = $request->input('category');
        $lines = file($request->file('file')->getRealPath(), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (empty($lines)) {
            return response()->json(['imported' => 0, 'skipped' => 0, 'message' => 'The file was empty.']);
        }

        $rows = array_map('str_getcsv', $lines);
        $header = array_map(fn ($h) => strtolower(trim((string) $h)), array_shift($rows));

        $col = function (array $needles) use ($header) {
            foreach ($header as $i => $h) {
                foreach ($needles as $n) {
                    if ($h !== '' && str_contains($h, $n)) {
                        return $i;
                    }
                }
            }
            return null;
        };

        $iName  = $col(['name', 'company', 'school', 'distributor']) ?? 0;
        $iLoc   = $col(['location', 'address']);
        $iPhone = $col(['phone', 'contact', 'tel', 'mobile']);
        $iEmail = $col(['email', 'e-mail', 'mail']);
        $iStat  = $col(['status']);
        $iFb    = $col(['feedback', 'notes']);

        $get = fn (array $r, $i) => $i !== null && isset($r[$i]) ? trim((string) $r[$i]) : '';

        $imported = 0;
        $skipped = 0;

        foreach ($rows as $r) {
            $name = $get($r, $iName);
            if ($name === '') {
                continue;
            }

            $flags = [];
            $emailRaw = $get($r, $iEmail);
            $email = null;
            if ($emailRaw !== '') {
                $clean = strtolower(str_replace(' ', '', $emailRaw));
                $email = filter_var($clean, FILTER_VALIDATE_EMAIL) ?: null;
                if (! $email) {
                    $flags[] = 'bad_email';
                }
            }
            $phone = $get($r, $iPhone) ?: null;
            if (! $email && ! $phone) {
                $flags[] = 'no_contact';
            }

            $statusRaw = strtolower($get($r, $iStat));
            $feedback = $get($r, $iFb) ?: null;
            $status = str_contains(strtolower($feedback ?? ''), 'not delivered') || str_contains($statusRaw, 'bounce')
                ? 'bounced'
                : (in_array($statusRaw, ['sent', 'delivered', 'contacted'], true) ? 'contacted' : 'not_contacted');

            $prospect = Prospect::firstOrCreate(
                ['name' => $name, 'category' => $category],
                [
                    'product'         => 'FET',
                    'location'        => $get($r, $iLoc) ?: null,
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
