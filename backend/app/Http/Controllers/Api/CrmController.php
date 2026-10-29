<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Communication;
use App\Models\ContactMessage;
use App\Models\CustomerNote;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Prospect;
use App\Models\ProspectCampaignRecipient;
use App\Models\SalesActivity;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

/**
 * The working side of the CRM:
 *   - deals: a value, product and expected close date on each pipeline contact,
 *   - activities: the calls, WhatsApp chats, visits and meetings with customers
 *     and prospects, each with an outcome and an agreed next step,
 *   - a timeline per customer (everything we know, newest first),
 *   - "Today" for each salesperson, and a weighted forecast.
 */
class CrmController extends Controller
{
    /** Pipeline stage a logged outcome implies (forward moves only). */
    private const OUTCOME_STAGE = ['reached' => 'contacted', 'no_answer' => 'contacted', 'interested' => 'contacted', 'quote_requested' => 'qualified', 'assessment' => 'qualified', 'negotiating' => 'quoted', 'won' => 'won'];

    /** Prospect outreach status a logged outcome implies (forward moves only, except "not interested"). */
    private const OUTCOME_PROSPECT = ['reached' => 'contacted', 'no_answer' => 'contacted', 'interested' => 'responded', 'quote_requested' => 'qualified', 'assessment' => 'qualified', 'negotiating' => 'quoted', 'won' => 'converted'];

    private const PROSPECT_ORDER = ['not_contacted', 'contacted', 'delivered', 'responded', 'qualified', 'quoted', 'converted'];

    /* ── Deals ────────────────────────────────────────────────────────────── */

    public function updateDeal(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'          => ['required', 'email'],
            'deal_value'     => ['nullable', 'integer', 'min:0', 'max:100000000000'],
            'deal_currency'  => ['nullable', Rule::in(['UGX', 'USD', 'EUR'])],
            'deal_product'   => ['nullable', Rule::in(['FET', 'SEAL', 'COFFEE', 'LOGISTICS'])],
            'expected_close' => ['nullable', 'date'],
            'lost_reason'    => ['nullable', Rule::in(array_keys(CustomerNote::LOST_REASONS))],
            'next_action'    => ['nullable', 'string', 'max:255'],
            'next_action_on' => ['nullable', 'date'],
        ]);
        $email = mb_strtolower(trim($data['email']));
        unset($data['email']);
        $data['deal_currency'] ??= 'UGX';

        $note = CustomerNote::updateOrCreate(['email' => $email], $data + ['updated_by' => $request->user()->name]);

        return response()->json(['data' => $this->deal($note)]);
    }

    /* ── Activities ───────────────────────────────────────────────────────── */

    public function storeActivity(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'          => ['nullable', 'email', 'required_without:prospect_id'],
            'prospect_id'    => ['nullable', 'integer', 'exists:prospects,id'],
            'kind'           => ['required', Rule::in(array_keys(SalesActivity::KINDS))],
            'outcome'        => ['nullable', Rule::in(array_keys(SalesActivity::OUTCOMES))],
            'summary'        => ['nullable', 'string', 'max:5000'],
            'next_action'    => ['nullable', 'string', 'max:255'],
            'next_action_on' => ['nullable', 'date'],
            'occurred_at'    => ['nullable', 'date', 'before_or_equal:now'],
        ]);
        $prospect = isset($data['prospect_id']) ? Prospect::find($data['prospect_id']) : null;
        $email = mb_strtolower(trim((string) ($data['email'] ?? $prospect?->email ?? ''))) ?: null;

        $activity = SalesActivity::create([
            ...$data,
            'email'       => $email,
            'user_id'     => $request->user()->id,
            'occurred_at' => $data['occurred_at'] ?? now(),
        ]);

        $this->applyOutcome($activity, $prospect, $request->user());

        return response()->json(['data' => $this->activity($activity->load('user:id,name'))], 201);
    }

    public function destroyActivity(Request $request, SalesActivity $activity): JsonResponse
    {
        abort_unless($activity->user_id === $request->user()->id || $request->user()->role === 'admin', 403, 'Only the person who logged it can remove it.');
        $activity->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /* ── Timeline ─────────────────────────────────────────────────────────── */

    public function timeline(Request $request): JsonResponse
    {
        $in = $request->validate(['email' => ['nullable', 'email', 'required_without:prospect_id'], 'prospect_id' => ['nullable', 'integer']]);
        $prospect = isset($in['prospect_id']) ? Prospect::find($in['prospect_id']) : null;
        // An empty string never matches a real address, so a prospect with no email only shows its own activities.
        $email = mb_strtolower(trim((string) ($in['email'] ?? $prospect?->email ?? '')));
        $lower = fn ($q, $col) => $q->whereRaw("LOWER({$col}) = ?", [$email]);
        $prospectIds = $email !== '' ? $lower(Prospect::query(), 'email')->pluck('id') : collect();
        if ($prospect) {
            $prospectIds->push($prospect->id);
        }
        $events = collect();

        foreach ($lower(Enquiry::query(), 'email')->get() as $e) {
            $answers = collect((array) $e->requirements)->map(fn ($r) => ($r['label'] ?? '').': '.($r['value'] ?? ''))->implode("\n");
            $body = trim(mb_substr((string) $e->message, 0, 280)."\n".$answers);
            $events->push($this->event('enquiry', $e->created_at, 'Enquiry'.($e->product_category ? " — {$e->product_category}" : ''), $body ?: null, ['status' => $e->status, 'href' => '/admin/enquiries']));
        }
        foreach ($lower(Order::query(), 'customer_email')->get() as $o) {
            $events->push($this->event('order', $o->created_at, "Order {$o->reference}", null, ['status' => $o->status, 'payment' => $o->payment_status, 'href' => '/admin/orders']));
        }
        foreach ($lower(ContactMessage::query(), 'email')->get() as $m) {
            $events->push($this->event('message', $m->created_at, $m->subject ?: 'Website message', mb_substr((string) $m->message, 0, 280)));
        }
        foreach ($lower(Communication::query(), 'email')->get() as $c) {
            $events->push($this->event($c->direction === 'inbound' ? 'email_in' : 'email_out', $c->created_at, ($c->direction === 'inbound' ? 'Email from them: ' : 'Email sent: ').($c->subject ?: '(no subject)'), mb_substr(strip_tags((string) $c->body), 0, 280)));
        }
        foreach (ProspectCampaignRecipient::with('campaign:id,name')->where(fn ($q) => $q->whereIn('prospect_id', $prospectIds)->orWhereRaw('LOWER(email) = ?', [$email]))->whereNotNull('sent_at')->get() as $r) {
            $what = $r->clicked_at ? 'opened and clicked' : ($r->opened_at ? 'opened' : 'was sent');
            $events->push($this->event('campaign', $r->sent_at, 'Campaign "'.($r->campaign?->name ?? 'email').'" — '.$what, null));
        }
        foreach (SalesActivity::with('user:id,name')->where(fn ($q) => $q->where('email', $email)->orWhereIn('prospect_id', $prospectIds))->get() as $a) {
            $events->push(['type' => 'activity'] + $this->activity($a));
        }

        $note = $email !== '' ? CustomerNote::where('email', $email)->first() : null;
        if ($note && trim((string) $note->note) !== '') {
            $events->push($this->event('note', $note->updated_at, 'Internal note'.($note->updated_by ? " — {$note->updated_by}" : ''), $note->note));
        }

        return response()->json(['data' => $events->sortByDesc('at')->values(), 'deal' => $note ? $this->deal($note) : null]);
    }

    /* ── Today ────────────────────────────────────────────────────────────── */

    public function today(Request $request): JsonResponse
    {
        $user = $request->user();
        $everyone = $request->boolean('all') && in_array($user->role, ['admin'], true);
        $soon = today()->addDays(7);

        $notes = CustomerNote::query()->whereNotNull('next_action_on')->whereDate('next_action_on', '<=', $soon)
            ->when(! $everyone, fn ($q) => $q->where('owner_id', $user->id))
            ->with('owner:id,name')->orderBy('next_action_on')->limit(50)->get();
        $names = $this->contactInfo($notes->pluck('email'));

        $followUps = $notes->map(fn (CustomerNote $n) => [
            'kind' => 'customer', 'email' => $n->email, 'prospect_id' => null,
            'name' => $n->override_name ?: ($names[$n->email]['name'] ?? $n->email),
            'phone' => $n->override_phone ?: ($names[$n->email]['phone'] ?? null),
            'what' => $n->next_action ?: 'Follow up', 'due' => $n->next_action_on->toDateString(),
            'stage' => $n->pipeline_stage, 'owner' => $n->owner?->name,
        ]);

        $prospects = Prospect::query()->whereNotNull('follow_up_on')->whereDate('follow_up_on', '<=', $soon)
            ->whereNotIn('outreach_status', ['converted', 'not_interested'])
            ->when(! $everyone, fn ($q) => $q->whereIn('assigned_to', [(string) $user->id, $user->name]))
            ->orderBy('follow_up_on')->limit(50)->get();
        $followUps = $followUps->concat($prospects->map(fn (Prospect $p) => [
            'kind' => 'prospect', 'email' => $p->email, 'prospect_id' => $p->id, 'name' => $p->name, 'phone' => $p->phone,
            'what' => $p->follow_up ?: 'Follow up', 'due' => $p->follow_up_on->toDateString(), 'stage' => $p->outreach_status, 'owner' => $p->assigned_to,
        ]))->sortBy('due')->values();

        $enquiries = Enquiry::query()->where('status', 'new')
            ->when(! $everyone, fn ($q) => $q->where(fn ($w) => $w->where('assigned_user_id', $user->id)->orWhereNull('assigned_user_id')))
            ->latest()->limit(10)->get(['id', 'name', 'company', 'email', 'phone', 'product_category', 'requirements', 'created_at'])
            ->map(fn (Enquiry $e) => $e->only(['id', 'name', 'company', 'email', 'phone', 'product_category', 'created_at']) + $this->asks($e));

        $hot = Prospect::query()->whereIn('lead_tier', ['hot', 'warm'])->whereNotIn('outreach_status', ['converted', 'not_interested'])
            ->when(! $everyone, fn ($q) => $q->where(fn ($w) => $w->whereNull('assigned_to')->orWhere('assigned_to', '')->orWhereIn('assigned_to', [(string) $user->id, $user->name])))
            ->orderByDesc('lead_score')->limit(8)->get(['id', 'name', 'email', 'phone', 'product', 'lead_score', 'lead_tier', 'lead_action']);

        $closing = CustomerNote::query()->whereNotNull('expected_close')->whereDate('expected_close', '<=', today()->addDays(30))
            ->whereNotIn('pipeline_stage', ['won', 'fulfilled', 'lost'])
            ->when(! $everyone, fn ($q) => $q->where('owner_id', $user->id))
            ->orderBy('expected_close')->limit(10)->get();
        $closingNames = $this->contactInfo($closing->pluck('email'));

        $week = SalesActivity::query()->where('occurred_at', '>=', now()->startOfWeek())
            ->when(! $everyone, fn ($q) => $q->where('user_id', $user->id))
            ->selectRaw('kind, count(*) as n')->groupBy('kind')->pluck('n', 'kind');

        return response()->json(['data' => [
            'follow_ups'   => $followUps,
            'overdue'      => $followUps->where('due', '<', today()->toDateString())->count(),
            'new_enquiries' => $enquiries,
            'hot_leads'    => $hot,
            'closing_soon' => $closing->map(fn ($n) => $this->deal($n) + ['name' => $n->override_name ?: ($closingNames[$n->email]['name'] ?? $n->email), 'phone' => $n->override_phone ?: ($closingNames[$n->email]['phone'] ?? null)])->values(),
            'this_week'    => ['activities' => (int) $week->sum(), 'by_kind' => $week],
            'everyone'     => $everyone,
            'kinds'        => SalesActivity::KINDS,
            'outcomes'     => SalesActivity::OUTCOMES,
        ]]);
    }

    /* ── Forecast ─────────────────────────────────────────────────────────── */

    public function forecast(): JsonResponse
    {
        $deals = CustomerNote::whereNotNull('deal_value')->where('deal_value', '>', 0)->get();
        $byCurrency = [];

        foreach ($deals as $d) {
            $stage = $d->pipeline_stage ?: 'lead';
            $c = $d->deal_currency ?: 'UGX';
            $byCurrency[$c] ??= ['open' => 0, 'weighted' => 0, 'won_this_month' => 0, 'closing_this_month' => 0, 'by_stage' => []];
            $row = &$byCurrency[$c];
            $row['by_stage'][$stage] ??= ['count' => 0, 'value' => 0];
            $row['by_stage'][$stage]['count']++;
            $row['by_stage'][$stage]['value'] += $d->deal_value;

            if (! in_array($stage, ['won', 'fulfilled', 'lost'], true)) {
                $row['open'] += $d->deal_value;
                $row['weighted'] += (int) round($d->deal_value * CustomerNote::STAGE_PROBABILITY[$stage] / 100);
                if ($d->expected_close && $d->expected_close->isSameMonth(now())) {
                    $row['closing_this_month'] += $d->deal_value;
                }
            } elseif ($stage !== 'lost' && $d->stage_changed_at && $d->stage_changed_at->isSameMonth(now())) {
                $row['won_this_month'] += $d->deal_value;
            }
            unset($row);
        }

        $decided = CustomerNote::whereIn('pipeline_stage', ['won', 'fulfilled', 'lost'])->where('stage_changed_at', '>=', now()->subDays(90))->get(['pipeline_stage', 'lost_reason']);
        $won = $decided->whereIn('pipeline_stage', ['won', 'fulfilled'])->count();

        return response()->json(['data' => [
            'currencies'   => $byCurrency,
            'win_rate'     => $decided->count() ? (int) round($won / $decided->count() * 100) : null,
            'decided_90d'  => $decided->count(),
            'lost_reasons' => $decided->where('pipeline_stage', 'lost')->whereNotNull('lost_reason')->countBy('lost_reason'),
            'lost_labels'  => CustomerNote::LOST_REASONS,
            'probability'  => CustomerNote::STAGE_PROBABILITY,
        ]]);
    }

    /* ── helpers ──────────────────────────────────────────────────────────── */

    /** Move the customer / prospect forward to match what the activity found, and record its next step. */
    private function applyOutcome(SalesActivity $a, ?Prospect $prospect, User $by): void
    {
        if ($a->email && ($a->outcome || $a->next_action_on)) {
            $note = CustomerNote::firstOrNew(['email' => $a->email]);
            $target = self::OUTCOME_STAGE[$a->outcome] ?? null;
            $current = $note->pipeline_stage;
            if ($target && (! $current || array_search($target, CustomerNote::STAGES, true) > array_search($current, CustomerNote::STAGES, true)) && $current !== 'lost') {
                $note->pipeline_stage = $target;
                $note->stage_changed_at = now();
            }
            if ($a->outcome === 'not_interested' && ! in_array($current, ['won', 'fulfilled'], true)) {
                $note->pipeline_stage = 'lost';
                $note->stage_changed_at = now();
            }
            if ($a->next_action_on) {
                $note->next_action = $a->next_action ?: 'Follow up';
                $note->next_action_on = $a->next_action_on;
            }
            $note->owner_id ??= $by->id;
            $note->updated_by = $by->name;
            $note->save();
        }

        if ($prospect) {
            $target = $a->outcome === 'not_interested' ? 'not_interested' : (self::OUTCOME_PROSPECT[$a->outcome] ?? null);
            $now = array_search($prospect->outreach_status, self::PROSPECT_ORDER, true);
            if ($target === 'not_interested' || ($target && ($now === false || array_search($target, self::PROSPECT_ORDER, true) > $now))) {
                $prospect->outreach_status = $target;
            }
            if ($a->next_action_on) {
                $prospect->follow_up = $a->next_action ?: 'Follow up';
                $prospect->follow_up_on = $a->next_action_on;
            }
            if ($a->summary) {
                $prospect->feedback = mb_substr(trim($a->summary), 0, 1000);
            }
            $prospect->save();
        }
    }

    /** What an enquiry asked for: a free assessment (when/where) and how they want to be contacted. */
    private function asks(Enquiry $e): array
    {
        $a = collect((array) $e->requirements)->mapWithKeys(fn ($r) => [$r['key'] ?? '' => $r['value'] ?? null]);

        return [
            // Answers arrive as the visitor's language label ("Yes, please visit us" / "Ndiyo, …").
            'wants_assessment' => (bool) preg_match('/^(yes|ndiyo|oui)\b/i', trim((string) $a->get('assessment'))),
            'assessment_when'  => $a->get('assessment_when'),
            'assessment_where' => $a->get('assessment_where'),
            'contact_pref'     => $a->get('contact_pref'),
        ];
    }

    /** Best-known name and phone for each email, from enquiries, orders and prospects. */
    private function contactInfo(Collection $emails): array
    {
        $emails = $emails->filter()->map(fn ($e) => mb_strtolower($e))->unique()->values();
        if ($emails->isEmpty()) {
            return [];
        }
        $out = [];
        $take = function ($rows, string $emailCol, string $nameCol, string $phoneCol) use (&$out) {
            foreach ($rows as $r) {
                $k = mb_strtolower((string) $r->{$emailCol});
                $out[$k]['name'] ??= $r->{$nameCol} ?: null;
                $out[$k]['phone'] ??= $r->{$phoneCol} ?: null;
            }
        };
        $in = fn ($q, $col) => $q->whereIn(\DB::raw("LOWER({$col})"), $emails->all());
        $take($in(Enquiry::query(), 'email')->latest()->get(['email', 'name', 'phone']), 'email', 'name', 'phone');
        $take($in(Order::query(), 'customer_email')->latest()->get(['customer_email', 'customer_name', 'customer_phone']), 'customer_email', 'customer_name', 'customer_phone');
        $take($in(Prospect::query(), 'email')->get(['email', 'name', 'phone']), 'email', 'name', 'phone');

        return $out;
    }

    private function deal(CustomerNote $n): array
    {
        $stage = $n->pipeline_stage ?: 'lead';

        return [
            'email'          => $n->email,
            'stage'          => $stage,
            'deal_value'     => $n->deal_value,
            'deal_currency'  => $n->deal_currency ?: 'UGX',
            'deal_product'   => $n->deal_product,
            'expected_close' => $n->expected_close?->toDateString(),
            'lost_reason'    => $n->lost_reason,
            'next_action'    => $n->next_action,
            'next_action_on' => $n->next_action_on?->toDateString(),
            'probability'    => CustomerNote::STAGE_PROBABILITY[$stage] ?? 0,
        ];
    }

    private function activity(SalesActivity $a): array
    {
        return [
            'id'             => $a->id,
            'at'             => $a->occurred_at->toIso8601String(),
            'kind'           => $a->kind,
            'title'          => (SalesActivity::KINDS[$a->kind] ?? $a->kind).($a->outcome ? ' — '.(SalesActivity::OUTCOMES[$a->outcome] ?? $a->outcome) : ''),
            'body'           => $a->summary,
            'outcome'        => $a->outcome,
            'next_action'    => $a->next_action,
            'next_action_on' => $a->next_action_on?->toDateString(),
            'by'             => $a->user?->name,
            'user_id'        => $a->user_id,
        ];
    }

    private function event(string $type, $at, string $title, ?string $body, array $extra = []): array
    {
        return ['type' => $type, 'at' => optional($at)->toIso8601String(), 'title' => $title, 'body' => $body] + $extra;
    }
}
