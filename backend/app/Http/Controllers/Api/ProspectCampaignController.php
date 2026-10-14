<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ProspectOutreach;
use App\Models\Prospect;
use App\Models\ProspectCampaign;
use App\Models\User;
use App\Services\CampaignSender;
use App\Support\Audit;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

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
            // The ticked rows, or — with all_matching — every row the list
            // screen's filters match, across all pages.
            'ids'           => ['required_without:all_matching', 'array', 'min:1'],
            'ids.*'         => ['integer'],
            'all_matching'  => ['nullable', 'boolean'],
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

        $prospects = $request->boolean('all_matching')
            ? Prospect::query()->filtered(ProspectController::filtersFrom($request))->get()
            : Prospect::whereIn('id', $data['ids'])->get();

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

    /** People who may receive a test send: marketing's list, plus whoever is asking. */
    public function testRecipients(Request $request): JsonResponse
    {
        $emails = collect(config('campaigns.test_recipients', []))
            ->push($request->user()->email)
            ->map(fn ($e) => mb_strtolower($e))
            ->unique()
            ->values();

        $names = User::whereIn('email', $emails)->pluck('name', 'email');

        return response()->json(['data' => $emails->map(fn ($e) => [
            'email' => $e,
            'name'  => $names[$e] ?? $e,
            'me'    => $e === mb_strtolower($request->user()->email),
        ])->all()]);
    }

    /** The email exactly as a recipient will see it, for the composer's preview. */
    public function preview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject'            => ['nullable', 'string', 'max:255'],
            'body'               => ['nullable', 'string', 'max:20000'],
            'product'            => ['nullable', Rule::in(Prospect::PRODUCTS)],
            'sample_name'        => ['nullable', 'string', 'max:255'],
            'attachment_names'   => ['nullable', 'array', 'max:10'],
            'attachment_names.*' => ['string', 'max:255'],
        ]);

        $mail = $this->composed($data, array_map(fn ($n) => ['name' => $n, 'path' => ''], $data['attachment_names'] ?? []));

        return response()->json(['data' => [
            'subject' => $mail->subjectLine,
            'html'    => $mail->previewHtml(),
        ]]);
    }

    /**
     * Send the campaign as it stands to our own team first — attachments and
     * all, subject marked [TEST], not copied to support, and nothing recorded
     * against any prospect.
     */
    public function test(Request $request): JsonResponse
    {
        $maxKb = (int) config('campaigns.max_attachment_mb', 8) * 1024;

        $data = $request->validate([
            'subject'       => ['required', 'string', 'max:255'],
            'body'          => ['required', 'string', 'max:20000'],
            'product'       => ['nullable', Rule::in(Prospect::PRODUCTS)],
            'sample_name'   => ['nullable', 'string', 'max:255'],
            'recipients'    => ['required', 'array', 'min:1', 'max:10'],
            'recipients.*'  => ['email'],
            'attachments'   => ['nullable', 'array', 'max:'.(int) config('campaigns.max_attachment_count', 5)],
            'attachments.*' => ['file', 'max:'.$maxKb, 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,png,jpg,jpeg,csv,txt'],
        ]);

        // Tests only ever go to our own people — never a way to email outsiders.
        $allowed = collect(config('campaigns.test_recipients', []))
            ->push($request->user()->email)
            ->map(fn ($e) => mb_strtolower($e));
        $recipients = collect($data['recipients'])->map(fn ($e) => mb_strtolower($e))->unique();
        $refused = $recipients->diff($allowed);
        if ($refused->isNotEmpty()) {
            return response()->json(['message' => 'Test emails can only go to the marketing team or yourself.'], 422);
        }

        // Attach the files from memory: a test leaves nothing behind on disk.
        $files = [];
        foreach ($request->file('attachments') ?? [] as $file) {
            $files[] = [
                'path' => '',
                'data' => $file->get(),
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getClientMimeType(),
            ];
        }

        foreach ($recipients as $to) {
            Mail::to($to)->send($this->composed($data, $files, isTest: true));
        }

        return response()->json([
            'sent_to' => $recipients->values()->all(),
            'message' => 'Test sent to '.$recipients->implode(', ').'.',
        ]);
    }

    /** One campaign email built from the composer's fields, personalised with a sample name. */
    private function composed(array $data, array $files, bool $isTest = false): ProspectOutreach
    {
        $name = trim($data['sample_name'] ?? '') ?: 'Sample Company Ltd';

        return new ProspectOutreach(
            $name,
            ProspectOutreach::personalise($data['subject'] ?? '', $name),
            ProspectOutreach::personalise($data['body'] ?? '', $name),
            $files,
            $data['product'] ?? null,
            $isTest,
        );
    }
}
