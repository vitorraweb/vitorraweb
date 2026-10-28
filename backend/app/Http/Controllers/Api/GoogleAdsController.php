<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\GoogleAdsAccount;
use App\Models\GoogleAdsCampaignDay;
use App\Models\GoogleAdsInsight;
use App\Models\GoogleAdsSearchTerm;
use App\Models\User;
use App\Services\GoogleAds\GoogleAdsClient;
use App\Services\GoogleAds\GoogleAdsException;
use App\Services\GoogleAds\GoogleAdsSync;
use App\Support\Audit;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

/**
 * The console's Google Ads screen (/admin/google-ads).
 *
 * Reading the numbers needs the `google_ads` module; connecting, choosing the
 * ad account and switching won-deal uploads on is admin-only, because it
 * hands the business's ad account to the system.
 *
 * The summary always answers from our own data too: Google-sourced enquiries
 * are recognised from the gclid on arrival whether or not the API is
 * connected, so "how many leads did Google Ads bring" works from day one —
 * only spend and search terms wait on the connection.
 */
class GoogleAdsController extends Controller
{
    private const PERIODS = [
        '7d'         => 'Last 7 days',
        '30d'        => 'Last 30 days',
        'mtd'        => 'This month',
        'last_month' => 'Last month',
        '90d'        => 'Last 90 days',
    ];

    /** Paid Google traffic, however it arrived (tagged or auto-tagged). */
    private const GOOGLE_PAID = 'google / cpc';

    public function status(Request $request): JsonResponse
    {
        $a = GoogleAdsAccount::current();

        return response()->json(['data' => [
            'client_configured' => GoogleAdsClient::clientConfigured(),
            'connected'         => (bool) $a?->isReady(),
            'can_manage'        => $request->user()->isAdmin(),
            'redirect_uri'      => config('services.google_ads.redirect_uri'),
            'account'           => $a ? [
                'connected_email'        => $a->connected_email,
                'customer_id'            => $a->customer_id,
                'login_customer_id'      => $a->login_customer_id,
                'name'                   => $a->descriptive_name,
                'currency'               => $a->currency_code,
                'time_zone'              => $a->time_zone,
                'conversion_action_id'   => $a->conversion_action_id,
                'conversion_action_name' => $a->conversion_action_name,
                'last_synced_at'         => $a->last_synced_at?->toIso8601String(),
                'last_error'             => $a->last_error,
                'last_error_at'          => $a->last_error_at?->toIso8601String(),
            ] : null,
        ]]);
    }

    public function summary(Request $request): JsonResponse
    {
        $period = array_key_exists($request->query('period'), self::PERIODS) ? $request->query('period') : '30d';
        $account = GoogleAdsAccount::current();
        $tz = $account?->time_zone ?: config('app.timezone', 'UTC');
        [$from, $to, $prevFrom, $prevTo] = $this->window($period, $tz);

        $campaignDays = GoogleAdsCampaignDay::betweenDates($from->toDateString(), $to->toDateString())->get();
        $prevDays = GoogleAdsCampaignDay::betweenDates($prevFrom->toDateString(), $prevTo->toDateString())->get();

        $leads = $this->googleLeads($from, $to);
        $prevLeads = $this->googleLeads($prevFrom, $prevTo);
        $won = $leads['enquiries']->where('status', 'converted');

        $totals = $this->totals($campaignDays);
        $leadCount = $leads['enquiries']->count() + $leads['messages']->count();

        return response()->json(['data' => [
            'period'       => $period,
            'period_label' => self::PERIODS[$period],
            'periods'      => self::PERIODS,
            'from'         => $from->toDateString(),
            'to'           => $to->toDateString(),
            'connected'    => (bool) $account?->isReady(),
            'currency'     => $account?->currency_code,
            'last_synced_at' => $account?->last_synced_at?->toIso8601String(),

            'totals' => [
                ...$totals,
                'leads'          => $leadCount,
                'enquiries'      => $leads['enquiries']->count(),
                'messages'       => $leads['messages']->count(),
                'won'            => $won->count(),
                'won_value'      => $this->orderValue($won),
                'cost_per_lead'  => $leadCount > 0 && $totals['cost'] > 0 ? round($totals['cost'] / $leadCount, 2) : null,
                'cost_per_won'   => $won->count() > 0 && $totals['cost'] > 0 ? round($totals['cost'] / $won->count(), 2) : null,
            ],
            'previous' => [
                'cost'  => $this->totals($prevDays)['cost'],
                'clicks' => (int) $prevDays->sum('clicks'),
                'leads' => $prevLeads['enquiries']->count() + $prevLeads['messages']->count(),
            ],
            'campaigns'    => $this->campaigns($campaignDays, $leads),
            'daily'        => $this->daily($from, $to, $campaignDays, $leads, $tz),
            'search_terms' => $this->searchTerms($from, $to),
            ...$this->insights(),
            'recent_leads' => $this->recentLeads(),
        ]]);
    }

    public function sync(): JsonResponse
    {
        $account = GoogleAdsAccount::current();
        if (! GoogleAdsClient::clientConfigured() || ! $account?->isReady()) {
            return response()->json(['message' => 'Google Ads is not connected yet.'], 422);
        }

        try {
            $result = (new GoogleAdsSync($account))->run(7);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => $e instanceof GoogleAdsException ? $e->getMessage() : 'The sync failed. Try again in a few minutes.'], 502);
        }

        return response()->json(['data' => $result, 'message' => 'Google Ads data refreshed.']);
    }

    /* ── Connection (admin only) ─────────────────────────────────────────── */

    public function connect(Request $request): JsonResponse
    {
        if (! GoogleAdsClient::clientConfigured()) {
            return response()->json(['message' => 'The Google OAuth client is not set on the server yet (GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET).'], 422);
        }

        // Single-use, 10-minute state: binds the callback to this admin and
        // stops a forged callback from attaching someone else's ad account.
        $nonce = Str::random(40);
        Cache::put("google_ads_oauth_{$nonce}", $request->user()->id, now()->addMinutes(10));
        $state = Crypt::encryptString(json_encode(['n' => $nonce]));

        return response()->json(['data' => ['url' => GoogleAdsClient::authorizationUrl($state)]]);
    }

    /** Google sends the admin's browser here after the consent screen. Public route. */
    public function callback(Request $request): RedirectResponse
    {
        $back = rtrim((string) config('services.frontend.url'), '/').'/admin/google-ads';

        try {
            $nonce = json_decode(Crypt::decryptString((string) $request->query('state')), true)['n'] ?? null;
        } catch (\Throwable) {
            $nonce = null;
        }
        $userId = $nonce ? Cache::pull("google_ads_oauth_{$nonce}") : null;

        if (! $userId) {
            return redirect()->away("{$back}?error=".urlencode('That connection link expired. Press Connect again.'));
        }
        if ($request->filled('error') || ! $request->filled('code')) {
            return redirect()->away("{$back}?error=".urlencode('Google sign-in was cancelled.'));
        }

        try {
            $tokens = GoogleAdsClient::exchangeCode((string) $request->query('code'));
        } catch (GoogleAdsException $e) {
            return redirect()->away("{$back}?error=".urlencode($e->getMessage()));
        }

        $account = GoogleAdsAccount::current() ?? new GoogleAdsAccount;
        $sameLogin = $account->exists && $account->connected_email === $tokens['email'];
        $account->fill([
            'refresh_token'   => $tokens['refresh_token'],
            'connected_email' => $tokens['email'],
            'connected_by'    => $userId,
            'last_error'      => null,
            'last_error_at'   => null,
        ]);
        // A different Google login may not reach the previous ad account.
        if (! $sameLogin) {
            $account->fill(['customer_id' => null, 'login_customer_id' => null, 'conversion_action_id' => null, 'conversion_action_name' => null]);
        }
        $account->save();
        Cache::forget("google_ads_access_token_{$account->id}");

        // One ad account and no manager in between: choose it for them.
        if (! $account->customer_id) {
            try {
                $options = array_values(array_filter(GoogleAdsSync::availableAccounts(new GoogleAdsClient($account)), fn ($o) => ! $o['manager']));
                if (count($options) === 1) {
                    $account->update(['customer_id' => $options[0]['customer_id'], 'login_customer_id' => $options[0]['login_customer_id']]);
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        // The callback carries no bearer token; credit the admin who started it.
        if ($user = User::find($userId)) {
            Auth::setUser($user);
        }
        Audit::log('google_ads.connected', "Google Ads connected ({$tokens['email']})", $account);

        return redirect()->away("{$back}?connected=1");
    }

    public function accounts(): JsonResponse
    {
        $account = GoogleAdsAccount::current();
        if (! $account) {
            return response()->json(['message' => 'Connect Google Ads first.'], 422);
        }

        try {
            return response()->json(['data' => GoogleAdsSync::availableAccounts(new GoogleAdsClient($account))]);
        } catch (GoogleAdsException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
    }

    public function conversionActions(): JsonResponse
    {
        $account = GoogleAdsAccount::current();
        if (! $account?->isReady()) {
            return response()->json(['message' => 'Choose the ad account first.'], 422);
        }

        try {
            return response()->json(['data' => GoogleAdsSync::uploadConversionActions(new GoogleAdsClient($account))]);
        } catch (GoogleAdsException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
    }

    public function updateAccount(Request $request): JsonResponse
    {
        $account = GoogleAdsAccount::current();
        if (! $account) {
            return response()->json(['message' => 'Connect Google Ads first.'], 422);
        }

        $data = $request->validate([
            'customer_id'            => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^[\d-]+$/'],
            'login_customer_id'      => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^[\d-]+$/'],
            'conversion_action_id'   => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^\d+$/'],
            'conversion_action_name' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);
        foreach (['customer_id', 'login_customer_id'] as $k) {
            if (array_key_exists($k, $data)) {
                $data[$k] = GoogleAdsClient::digits($data[$k]) ?: null;
            }
        }
        // A new ad account invalidates the old one's conversion action and numbers.
        $switching = array_key_exists('customer_id', $data) && $data['customer_id'] !== $account->customer_id;
        if ($switching) {
            $data += ['conversion_action_id' => null, 'conversion_action_name' => null];
            $data['descriptive_name'] = $data['currency_code'] = $data['time_zone'] = null;
        }

        $account->forceFill($data)->save();
        if ($switching) {
            GoogleAdsCampaignDay::query()->delete();
            GoogleAdsSearchTerm::query()->delete();
            GoogleAdsInsight::query()->delete();
        }

        Audit::log('google_ads.updated', 'Google Ads settings changed', $account, array_intersect_key($data, array_flip(['customer_id', 'conversion_action_id'])));

        return $this->status($request);
    }

    public function disconnect(Request $request): JsonResponse
    {
        $account = GoogleAdsAccount::current();
        if ($account) {
            Cache::forget("google_ads_access_token_{$account->id}");
            Audit::log('google_ads.disconnected', "Google Ads disconnected ({$account->connected_email})", $account);
            $account->delete();
        }

        // Synced numbers stay: they are history, and reconnecting refreshes them.
        return $this->status($request);
    }

    /* ── Summary pieces ──────────────────────────────────────────────────── */

    /** @return array{0:CarbonImmutable,1:CarbonImmutable,2:CarbonImmutable,3:CarbonImmutable} */
    private function window(string $period, string $tz): array
    {
        $today = CarbonImmutable::now($tz)->startOfDay();

        [$from, $to] = match ($period) {
            '7d'         => [$today->subDays(6), $today],
            'mtd'        => [$today->startOfMonth(), $today],
            'last_month' => [$today->subMonthNoOverflow()->startOfMonth(), $today->subMonthNoOverflow()->endOfMonth()->startOfDay()],
            '90d'        => [$today->subDays(89), $today],
            default      => [$today->subDays(29), $today],
        };
        $len = $from->diffInDays($to) + 1;

        return [$from, $to, $from->subDays($len), $from->subDay()];
    }

    /** Google-paid enquiries and contact messages that arrived in the window. */
    private function googleLeads(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $range = [$from->startOfDay()->utc(), $to->endOfDay()->utc()];

        return [
            'enquiries' => Enquiry::where('lead_source', self::GOOGLE_PAID)->whereBetween('created_at', $range)
                ->with('orders:id,enquiry_id,total,currency')
                ->get(['id', 'status', 'ads_campaign_id', 'utm_campaign', 'created_at']),
            'messages'  => ContactMessage::where('lead_source', self::GOOGLE_PAID)->whereBetween('created_at', $range)
                ->get(['id', 'ads_campaign_id', 'utm_campaign', 'created_at']),
        ];
    }

    private function totals($days): array
    {
        $impressions = (int) $days->sum('impressions');
        $clicks = (int) $days->sum('clicks');
        $cost = round($days->sum('cost_micros') / 1_000_000, 2);

        return [
            'impressions'         => $impressions,
            'clicks'              => $clicks,
            'cost'                => $cost,
            'ctr'                 => $impressions > 0 ? round($clicks / $impressions * 100, 2) : null,
            'avg_cpc'             => $clicks > 0 ? round($cost / $clicks, 2) : null,
            'google_conversions'  => round((float) $days->sum('conversions'), 1),
        ];
    }

    /** Value of won deals, per currency — never summed across currencies. */
    private function orderValue($enquiries): array
    {
        $out = [];
        foreach ($enquiries as $e) {
            foreach ($e->orders as $o) {
                $out[$o->currency] = ($out[$o->currency] ?? 0) + ($o->currency === 'USD' ? $o->total / 100 : $o->total);
            }
        }

        return $out;
    }

    /**
     * Each campaign's Google numbers beside the leads and wins it produced.
     * A lead belongs to a campaign by its resolved click (gclid), or failing
     * that by a utm_campaign that matches the campaign's name.
     */
    private function campaigns($days, array $leads): array
    {
        $byName = GoogleAdsCampaignDay::query()->latest('date')->get(['campaign_id', 'campaign_name'])
            ->mapWithKeys(fn ($c) => [Str::lower($c->campaign_name) => $c->campaign_id])->all();
        $campaignOf = fn ($l) => $l->ads_campaign_id ?: ($l->utm_campaign ? ($byName[Str::lower($l->utm_campaign)] ?? null) : null);

        $leadsBy = [];
        foreach ($leads['enquiries']->concat($leads['messages']) as $l) {
            $id = $campaignOf($l) ?? '_unmatched';
            $leadsBy[$id]['leads'] = ($leadsBy[$id]['leads'] ?? 0) + 1;
            if (($l->status ?? null) === 'converted') {
                $leadsBy[$id]['won'][] = $l;
            }
        }

        $rows = $days->groupBy('campaign_id')->map(function ($group, $id) use ($leadsBy) {
            $latest = $group->sortByDesc('date')->first();
            $t = $this->totals($group);
            $n = $leadsBy[$id]['leads'] ?? 0;
            $won = collect($leadsBy[$id]['won'] ?? []);

            return [
                'campaign_id'   => (string) $id,
                'name'          => $latest->campaign_name,
                'status'        => $latest->campaign_status,
                'channel'       => $latest->channel_type,
                ...$t,
                'leads'         => $n,
                'won'           => $won->count(),
                'won_value'     => $this->orderValue($won),
                'cost_per_lead' => $n > 0 && $t['cost'] > 0 ? round($t['cost'] / $n, 2) : null,
            ];
        })->sortByDesc('cost')->values()->all();

        // Leads from a campaign with no spend in this window (or before the
        // first sync) still count — as their own honest line.
        if (! empty($leadsBy['_unmatched'])) {
            $won = collect($leadsBy['_unmatched']['won'] ?? []);
            $rows[] = [
                'campaign_id' => null, 'name' => 'Not matched to a campaign', 'status' => null, 'channel' => null,
                'impressions' => 0, 'clicks' => 0, 'cost' => 0, 'ctr' => null, 'avg_cpc' => null, 'google_conversions' => 0,
                'leads' => $leadsBy['_unmatched']['leads'], 'won' => $won->count(), 'won_value' => $this->orderValue($won), 'cost_per_lead' => null,
            ];
        }

        return $rows;
    }

    private function daily(CarbonImmutable $from, CarbonImmutable $to, $days, array $leads, string $tz): array
    {
        $byDate = $days->groupBy(fn ($d) => $d->date->toDateString());
        $leadsByDate = $leads['enquiries']->concat($leads['messages'])
            ->groupBy(fn ($l) => $l->created_at->copy()->setTimezone($tz)->toDateString());

        $out = [];
        for ($d = $from; $d->lte($to); $d = $d->addDay()) {
            $k = $d->toDateString();
            $g = $byDate[$k] ?? collect();
            $out[] = [
                'date'   => $k,
                'cost'   => round($g->sum('cost_micros') / 1_000_000, 2),
                'clicks' => (int) $g->sum('clicks'),
                'leads'  => isset($leadsByDate[$k]) ? $leadsByDate[$k]->count() : 0,
            ];
        }

        return $out;
    }

    private function searchTerms(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return GoogleAdsSearchTerm::betweenDates($from->toDateString(), $to->toDateString())
            ->selectRaw('search_term, SUM(impressions) impressions, SUM(clicks) clicks, SUM(cost_micros) cost_micros, SUM(conversions) conversions')
            ->groupBy('search_term')
            ->orderByDesc('cost_micros')->orderByDesc('clicks')
            ->take(25)->get()
            ->map(fn ($t) => [
                'term'        => $t->search_term,
                'impressions' => (int) $t->impressions,
                'clicks'      => (int) $t->clicks,
                'cost'        => round($t->cost_micros / 1_000_000, 2),
                'conversions' => round((float) $t->conversions, 1),
            ])->all();
    }

    /**
     * Where Display ads showed and what Performance Max matched. A rolling
     * 30-day snapshot (see GoogleAdsSync::syncInsights), so it carries its
     * own dates rather than following the period picker.
     */
    private function insights(): array
    {
        $rows = GoogleAdsInsight::query()->get();
        $first = $rows->first();
        $placements = $rows->where('kind', GoogleAdsInsight::PLACEMENT);

        return [
            'insights_window' => $first ? ['from' => $first->window_from->toDateString(), 'to' => $first->window_to->toDateString()] : null,
            'placements' => $placements->sortByDesc('cost_micros')->take(25)->map(fn ($p) => [
                'name'        => $p->label,
                'type'        => $p->detail,
                'url'         => $p->url,
                'impressions' => $p->impressions,
                'clicks'      => $p->clicks,
                'cost'        => round(($p->cost_micros ?? 0) / 1_000_000, 2),
                'conversions' => round($p->conversions, 1),
            ])->values()->all(),
            // Spend by kind of place (apps vs websites vs YouTube): the one
            // number that says whether the Display budget lands anywhere useful.
            'placement_types' => $placements->groupBy('detail')->map(fn ($g, $type) => [
                'type'   => $type ?: 'UNKNOWN',
                'clicks' => (int) $g->sum('clicks'),
                'cost'   => round($g->sum('cost_micros') / 1_000_000, 2),
            ])->sortByDesc('cost')->values()->all(),
            'search_themes' => $rows->where('kind', GoogleAdsInsight::SEARCH_THEME)
                ->groupBy('label')->map(fn ($g, $label) => [
                    'theme'       => $label,
                    'impressions' => (int) $g->sum('impressions'),
                    'clicks'      => (int) $g->sum('clicks'),
                    'conversions' => round((float) $g->sum('conversions'), 1),
                ])->sortByDesc('clicks')->take(25)->values()->all(),
        ];
    }

    private function recentLeads(): array
    {
        return Enquiry::where('lead_source', self::GOOGLE_PAID)->latest()->take(15)
            ->get(['id', 'name', 'company', 'product_category', 'status', 'created_at', 'utm_campaign', 'ads_campaign_name', 'ads_keyword', 'ads_conversion_uploaded_at', 'ads_conversion_error'])
            ->map(fn ($e) => [
                'id'         => $e->id,
                'name'       => $e->name,
                'company'    => $e->company,
                'product'    => $e->product_category,
                'status'     => $e->status,
                'created_at' => $e->created_at->toIso8601String(),
                'campaign'   => $e->ads_campaign_name ?? $e->utm_campaign,
                'keyword'    => $e->ads_keyword,
                'reported_to_google' => $e->ads_conversion_uploaded_at !== null,
                'report_error'       => $e->ads_conversion_error,
            ])->all();
    }
}
