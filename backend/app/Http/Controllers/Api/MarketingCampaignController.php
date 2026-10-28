<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\DesignedCampaignEmail;
use App\Models\CampaignClick;
use App\Models\Market;
use App\Models\Prospect;
use App\Models\ProspectCampaign;
use App\Services\CampaignSender;
use App\Services\Marketing\CampaignTracking;
use App\Services\Marketing\EmailDesigner;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

/**
 * Designed campaigns, start to finish:
 *
 *   draft  → edit subject, design and markets freely
 *   test   → a [TEST] copy goes to support (and any of the team ticked);
 *            the content is fingerprinted at that moment
 *   send   → only allowed while the tested content is unchanged — edit after
 *            testing and the campaign has to be tested again
 *   report → the scorer: delivered, opened, clicked, per link and per market
 */
class MarketingCampaignController extends Controller
{
    public function index(): JsonResponse
    {
        $campaigns = ProspectCampaign::query()->whereNotNull('design')->latest()->limit(100)->get();
        $stats = $this->statsFor($campaigns->pluck('id'));

        return response()->json(['data' => $campaigns->map(fn ($c) => $this->summary($c, $stats[$c->id] ?? null))]);
    }

    public function show(ProspectCampaign $campaign): JsonResponse
    {
        abort_unless($campaign->isDesigned(), 404);

        return response()->json(['data' => [
            ...$this->summary($campaign, $this->statsFor(collect([$campaign->id]))[$campaign->id] ?? null),
            'design' => $campaign->design,
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $campaign = ProspectCampaign::create([
            ...$data,
            'body'       => '',
            'design'     => EmailDesigner::normalise($data['design'], 'u'.$request->user()->id),
            'skip_avoid' => $data['skip_avoid'] ?? true,
            'status'     => 'draft',
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $this->summary($campaign, null)], 201);
    }

    public function update(Request $request, ProspectCampaign $campaign): JsonResponse
    {
        abort_unless($campaign->isDesigned(), 404);
        if ($campaign->status !== 'draft') {
            return response()->json(['message' => 'A campaign that has started sending can no longer be edited.'], 422);
        }
        $data = $this->validated($request, partial: true);
        if (array_key_exists('skip_avoid', $data) && $data['skip_avoid'] === null) {
            unset($data['skip_avoid']);
        }
        if (isset($data['design'])) {
            $data['design'] = EmailDesigner::normalise($data['design'], 'u'.$request->user()->id);
        }
        $campaign->update($data);

        return response()->json(['data' => $this->summary($campaign->fresh(), null)]);
    }

    public function destroy(ProspectCampaign $campaign): JsonResponse
    {
        abort_unless($campaign->isDesigned() && $campaign->status === 'draft', 422, 'Only drafts can be deleted.');
        $campaign->delete();

        return response()->json(['message' => 'Draft deleted.']);
    }

    /** Who the send would reach right now, and who it would skip (and why). */
    public function audience(ProspectCampaign $campaign): JsonResponse
    {
        abort_unless($campaign->isDesigned(), 404);

        return response()->json(['data' => $this->buildAudience($campaign)['summary']]);
    }

    /**
     * Send a test to support (always) plus any of the team ticked. Records the
     * content fingerprint: this exact content may now go to the markets.
     */
    public function test(Request $request, ProspectCampaign $campaign): JsonResponse
    {
        abort_unless($campaign->isDesigned(), 404);
        $data = $request->validate(['also' => ['nullable', 'array', 'max:10'], 'also.*' => ['email']]);

        $support = config('mail.campaign_from') ?: config('mail.team_address');
        $allowed = collect(config('campaigns.test_recipients', []))->push($request->user()->email)->push($support)->map(fn ($e) => mb_strtolower($e));
        $to = collect([$support])->merge($data['also'] ?? [])->map(fn ($e) => mb_strtolower($e))->unique();
        if ($to->diff($allowed)->isNotEmpty()) {
            return response()->json(['message' => 'Tests only go to support and the marketing team.'], 422);
        }

        $html = EmailDesigner::render($campaign->design, $campaign->subject, $campaign->preheader);
        $sample = 'Kampala Haulage Ltd';
        $html = str_replace(['{name}', '{company}', EmailDesigner::UNSUBSCRIBE_PLACEHOLDER], [$sample, $sample, '#'], $html);
        $text = str_replace(['{name}', '{company}', EmailDesigner::UNSUBSCRIBE_PLACEHOLDER], [$sample, $sample, '#'], EmailDesigner::plainText($campaign->design));
        $subject = str_replace(['{name}', '{company}'], $sample, $campaign->subject);

        foreach ($to as $addr) {
            Mail::to($addr)->send(new DesignedCampaignEmail($subject, $html, $text, isTest: true));
        }

        $campaign->update(['tested_at' => now(), 'tested_by' => $request->user()->id, 'test_hash' => $campaign->contentHash()]);
        Audit::log('campaign.tested', "Test of \"{$campaign->subject}\" sent to ".$to->implode(', '), $campaign);

        return response()->json(['data' => $this->summary($campaign->fresh(), null), 'message' => 'Test sent to '.$to->implode(', ').'. Check it in Outlook, then send to your markets.']);
    }

    /** Freeze the audience and start sending. Refused unless the current content was tested. */
    public function send(ProspectCampaign $campaign, CampaignSender $sender): JsonResponse
    {
        abort_unless($campaign->isDesigned(), 404);
        if ($campaign->status !== 'draft') {
            return response()->json(['message' => 'This campaign has already been sent.'], 422);
        }
        if (! $campaign->testIsCurrent()) {
            return response()->json(['message' => $campaign->tested_at
                ? 'The campaign changed after its test. Send a new test to support first.'
                : 'Send a test to support first.'], 422);
        }
        if (empty($campaign->market_ids)) {
            return response()->json(['message' => 'Choose at least one market.'], 422);
        }

        $audience = $this->buildAudience($campaign);
        if ($audience['send']->isEmpty()) {
            return response()->json(['message' => 'Nobody in those markets can be emailed.'], 422);
        }

        DB::transaction(function () use ($campaign, $audience) {
            foreach ($audience['send'] as $row) {
                $campaign->recipients()->create([
                    'prospect_id' => $row['prospect']->id,
                    'market_id'   => $row['market_id'],
                    'email'       => $row['email'],
                    'name'        => $row['prospect']->name,
                    'status'      => 'pending',
                    'token'       => CampaignTracking::newToken(),
                ]);
            }
            $campaign->update(['status' => 'sending', 'total' => $audience['send']->count(), 'started_at' => now()]);
        });

        Audit::log('campaign.sent', "Campaign \"{$campaign->subject}\" started to {$audience['send']->count()} contact(s)", $campaign, $audience['summary']);
        $sender->drain($campaign->fresh(), 3);

        return response()->json(['data' => $this->summary($campaign->fresh(), null)]);
    }

    /** The campaign scorer. */
    public function report(ProspectCampaign $campaign): JsonResponse
    {
        abort_unless($campaign->isDesigned(), 404);
        $stats = $this->statsFor(collect([$campaign->id]))[$campaign->id] ?? null;

        $links = CampaignClick::where('campaign_id', $campaign->id)->where('suspected_bot', false)
            ->selectRaw('url, COUNT(*) clicks, COUNT(DISTINCT recipient_id) people')->groupBy('url')->orderByDesc('people')->get();

        $byMarket = $campaign->recipients()->where('status', 'sent')
            ->selectRaw('market_id, COUNT(*) sent, SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) opened, SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) clicked')
            ->groupBy('market_id')->get();
        $names = Market::whereIn('id', $byMarket->pluck('market_id')->filter())->pluck('name', 'id');

        $people = $campaign->recipients()->whereIn('status', ['sent', 'failed'])
            ->orderByRaw('clicked_at IS NULL, opened_at IS NULL')->orderBy('name')->limit(500)
            ->get(['id', 'name', 'email', 'status', 'error', 'opened_at', 'open_count', 'clicked_at', 'click_count', 'unsubscribed_at']);

        return response()->json(['data' => [
            ...$this->summary($campaign, $stats),
            'links'   => $links,
            'by_market' => $byMarket->map(fn ($m) => [
                'market' => $names[$m->market_id] ?? 'No market', 'sent' => (int) $m->sent,
                'opened' => (int) $m->opened, 'clicked' => (int) $m->clicked,
            ]),
            'people' => $people,
        ]]);
    }

    /* ── Internals ───────────────────────────────────────────────────────── */

    /**
     * Everyone in the chosen markets, deduplicated by address, minus who must
     * or should not be emailed.
     *
     * @return array{send: \Illuminate\Support\Collection, summary: array}
     */
    private function buildAudience(ProspectCampaign $campaign): array
    {
        $members = DB::table('market_members')->whereIn('market_id', $campaign->market_ids ?? [])
            ->orderBy('market_id')->get(['market_id', 'prospect_id']);
        $prospects = Prospect::whereIn('id', $members->pluck('prospect_id')->unique())->get()->keyBy('id');

        $seen = [];
        $send = collect();
        $skip = ['no_email' => 0, 'unsubscribed' => 0, 'avoid' => 0, 'duplicate' => 0];
        foreach ($members as $m) {
            $p = $prospects[$m->prospect_id] ?? null;
            if (! $p) {
                continue;
            }
            $email = mb_strtolower(trim((string) $p->email));
            match (true) {
                $email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL) => $skip['no_email']++,
                $p->unsubscribed_at !== null || $p->lead_tier === 'do_not_contact' => $skip['unsubscribed']++,
                $campaign->skip_avoid && $p->lead_tier === 'avoid' => $skip['avoid']++,
                isset($seen[$email]) => $skip['duplicate']++,
                default => (function () use (&$seen, $email, $send, $p, $m) {
                    $seen[$email] = true;
                    $send->push(['prospect' => $p, 'email' => $email, 'market_id' => $m->market_id]);
                })(),
            };
        }

        return ['send' => $send, 'summary' => ['will_send' => $send->count(), 'skipped' => $skip, 'members' => $members->count()]];
    }

    /** Opens/clicks per campaign, counting people (not repeat opens), excluding scanner clicks. */
    private function statsFor($ids): array
    {
        if ($ids->isEmpty()) {
            return [];
        }
        $rows = DB::table('prospect_campaign_recipients')->whereIn('campaign_id', $ids)
            ->selectRaw("campaign_id,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) delivered,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) failed,
                SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) opened,
                SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) clicked,
                SUM(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 ELSE 0 END) unsubscribed")
            ->groupBy('campaign_id')->get();

        return $rows->mapWithKeys(fn ($r) => [$r->campaign_id => $this->score((int) $r->delivered, (int) $r->failed, (int) $r->opened, (int) $r->clicked, (int) $r->unsubscribed)])->all();
    }

    /**
     * Rates and a 0–100 score against typical B2B email results (opens ~25%,
     * clicks ~3%): delivery 15, opens 35, clicks 40, unsubscribes 10.
     */
    private function score(int $delivered, int $failed, int $opened, int $clicked, int $unsub): array
    {
        $attempted = $delivered + $failed;
        $pct = fn ($a, $b) => $b > 0 ? round($a / $b * 100, 1) : null;
        $deliveryRate = $pct($delivered, $attempted);
        $openRate = $pct($opened, $delivered);
        $clickRate = $pct($clicked, $delivered);
        $unsubRate = $pct($unsub, $delivered);

        $score = null;
        $grade = null;
        if ($delivered >= 1) {
            $score = (int) round(
                15 * min(1, ($deliveryRate ?? 0) / 98)
                + 35 * min(1, ($openRate ?? 0) / 30)
                + 40 * min(1, ($clickRate ?? 0) / 4)
                + 10 * max(0, 1 - ($unsubRate ?? 0) / 2)
            );
            $grade = $score >= 80 ? 'Excellent' : ($score >= 60 ? 'Good' : ($score >= 40 ? 'Fair' : 'Poor'));
        }

        return [
            'delivered' => $delivered, 'failed' => $failed, 'opened' => $opened, 'clicked' => $clicked, 'unsubscribed' => $unsub,
            'delivery_rate' => $deliveryRate, 'open_rate' => $openRate, 'click_rate' => $clickRate,
            'click_to_open' => $pct($clicked, $opened), 'unsubscribe_rate' => $unsubRate,
            'score' => $score, 'grade' => $grade,
        ];
    }

    private function summary(ProspectCampaign $c, ?array $stats): array
    {
        return [
            ...$c->only(['id', 'name', 'subject', 'preheader', 'product', 'market_ids', 'skip_avoid', 'status', 'total', 'sent_count', 'failed_count', 'created_at', 'started_at', 'completed_at', 'tested_at']),
            'test_current' => $c->testIsCurrent(),
            'stats'        => $stats,
            'markets'      => Market::whereIn('id', $c->market_ids ?? [])->pluck('name'),
        ];
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name'         => ['nullable', 'string', 'max:120'],
            'subject'      => [$req, 'string', 'max:255'],
            'preheader'    => ['nullable', 'string', 'max:200'],
            'design'       => [$req, 'array'],
            'product'      => ['nullable', Rule::in(Prospect::PRODUCTS)],
            'market_ids'   => ['nullable', 'array', 'max:30'],
            'market_ids.*' => ['integer', 'exists:markets,id'],
            'skip_avoid'   => ['nullable', 'boolean'],
        ]);
    }
}
