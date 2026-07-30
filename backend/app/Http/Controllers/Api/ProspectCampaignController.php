<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prospect;
use App\Models\ProspectCampaign;
use App\Services\CampaignSender;
use App\Support\Audit;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Bulk outreach campaigns to the prospect database.
 *
 * A campaign is written once, its recipient list frozen at creation, and then
 * sent in batches by `campaigns:send` (scheduler) or the run endpoint below.
 * Nothing is emailed inside the create request, so a 160-recipient send can't
 * time out or half-finish with no record of where it stopped.
 */
class ProspectCampaignController extends Controller
{
    /** Recent campaigns, newest first. */
    public function index(Request $request): JsonResponse
    {
        $query = ProspectCampaign::with('creator:id,name')->latest();

        if ($request->filled('product')) {
            $query->where('product', strtoupper($request->product));
        }

        return response()->json($query->paginate(20));
    }

    /** A campaign's live progress, plus anything that failed. */
    public function show(ProspectCampaign $campaign): JsonResponse
    {
        return response()->json([
            'data' => $this->summarise($campaign),
            'failures' => $campaign->recipients()
                ->where('status', 'failed')
                ->get(['email', 'name', 'error']),
        ]);
    }

    /**
     * Create a campaign from the selected prospects and start it sending.
     * Attachments are encrypted at rest on the private disk (SecureFile) and
     * decrypted only in memory when each email goes out.
     */
    public function store(Request $request, CampaignSender $sender): JsonResponse
    {
        $maxKb = (int) config('campaigns.max_attachment_mb', 8) * 1024;
        $maxFiles = (int) config('campaigns.max_attachment_count', 5);

        $data = $request->validate([
            'ids'           => ['required', 'array', 'min:1'],
            'ids.*'         => ['integer'],
            'subject'       => ['required', 'string', 'max:255'],
            'body'          => ['required', 'string', 'max:20000'],
            'name'          => ['nullable', 'string', 'max:120'],
            'attachments'   => ['nullable', 'array', 'max:'.$maxFiles],
            'attachments.*' => [
                'file',
                'max:'.$maxKb,
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,png,jpg,jpeg,csv,txt',
            ],
        ]);

        $prospects = Prospect::whereIn('id', $data['ids'])->get();

        if ($prospects->isEmpty()) {
            return response()->json(['message' => 'None of those prospects could be found.'], 422);
        }

        // Store attachments before the campaign row so a rejected upload never
        // leaves a half-built campaign behind.
        $attachments = [];
        foreach ($request->file('attachments') ?? [] as $file) {
            $attachments[] = [
                'path' => SecureFile::storeUpload($file, 'campaigns'),
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ];
        }

        $products = $prospects->pluck('product')->unique();

        $campaign = DB::transaction(function () use ($data, $prospects, $attachments, $products, $request) {
            $campaign = ProspectCampaign::create([
                'name'        => $data['name'] ?? null,
                'subject'     => $data['subject'],
                'body'        => $data['body'],
                'product'     => $products->count() === 1 ? $products->first() : null,
                'attachments' => $attachments ?: null,
                'status'      => 'sending',
                'created_by'  => $request->user()->id,
            ]);

            // Freeze the recipient list. Prospects with no email are recorded as
            // skipped, and a repeated address is recorded once as sendable and
            // once as a duplicate — so the team can see the real reach of a
            // campaign instead of assuming every selected row was emailed.
            $seen = [];
            $sendable = 0;

            foreach ($prospects as $prospect) {
                $email = trim((string) $prospect->email);

                if ($email === '') {
                    $status = 'skipped';
                } elseif (isset($seen[strtolower($email)])) {
                    $status = 'duplicate';
                } else {
                    $seen[strtolower($email)] = true;
                    $status = 'pending';
                    $sendable++;
                }

                $campaign->recipients()->create([
                    'prospect_id' => $prospect->id,
                    'email'       => $email ?: '—',
                    'name'        => $prospect->name,
                    'status'      => $status,
                ]);
            }

            $campaign->update(['total' => $sendable]);

            if ($sendable === 0) {
                $campaign->update(['status' => 'sent', 'completed_at' => now()]);
            }

            return $campaign;
        });

        Audit::log(
            'campaign.created',
            "Outreach campaign \"{$campaign->subject}\" to {$campaign->total} prospect(s)",
            $campaign,
            ['product' => $campaign->product, 'attachments' => count($attachments)]
        );

        // Send a couple straight away so the composer shows real movement; the
        // admin screen and the scheduler drain whatever is left.
        if ($campaign->total > 0) {
            $sender->drain($campaign, min($campaign->total, 3));
        }

        return response()->json(['data' => $this->summarise($campaign->fresh())], 201);
    }

    /**
     * Send the next batch now — the admin screen drives this in a loop while a
     * campaign is on screen, so a send still finishes on a box where the cron
     * isn't running. Deliberately a smaller batch than the scheduler uses: each
     * call has to return well inside the request timeout.
     */
    public function run(Request $request, ProspectCampaign $campaign, CampaignSender $sender): JsonResponse
    {
        $request->validate(['limit' => ['nullable', 'integer', 'min:1', 'max:25']]);

        if ($campaign->status !== 'sending') {
            return response()->json(['data' => $this->summarise($campaign)]);
        }

        $sender->drain($campaign, (int) $request->input('limit', 8));

        return response()->json(['data' => $this->summarise($campaign->fresh())]);
    }

    /** Stop a campaign part-way; everything not yet sent stays unsent. */
    public function cancel(ProspectCampaign $campaign): JsonResponse
    {
        if ($campaign->status === 'sending') {
            $campaign->update(['status' => 'cancelled', 'completed_at' => now()]);
            Audit::log('campaign.cancelled', "Cancelled campaign \"{$campaign->subject}\"", $campaign);
        }

        return response()->json(['data' => $this->summarise($campaign->fresh())]);
    }

    private function summarise(ProspectCampaign $campaign): array
    {
        $counts = $campaign->recipients()
            ->selectRaw('status, count(*) c')
            ->groupBy('status')
            ->pluck('c', 'status');

        return [
            ...$campaign->only([
                'id', 'name', 'subject', 'body', 'product', 'status',
                'total', 'sent_count', 'failed_count', 'completed_at', 'created_at',
            ]),
            'attachments' => collect($campaign->attachments ?? [])
                ->map(fn ($a) => ['name' => $a['name'], 'size' => $a['size'] ?? null])
                ->all(),
            'pending'   => (int) ($counts['pending'] ?? 0),
            'skipped'   => (int) ($counts['skipped'] ?? 0),
            'duplicate' => (int) ($counts['duplicate'] ?? 0),
        ];
    }
}
