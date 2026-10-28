<?php

namespace App\Services\GoogleAds;

use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\GoogleAdsAccount;
use App\Models\GoogleAdsCampaignDay;
use App\Models\GoogleAdsInsight;
use App\Models\GoogleAdsSearchTerm;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Brings Google's side of the ad numbers into our database, and sends our
 * side back.
 *
 *   1. Account details (name, currency, time zone).
 *   2. Campaign spend/clicks/conversions per day.
 *   3. Search terms — what people typed before clicking.
 *   4. Click → campaign: every Google-sourced enquiry gets the campaign, ad
 *      group and keyword its gclid belongs to. Auto-tagged clicks carry no
 *      utm_campaign, so this is the only way to say which campaign a lead
 *      came from.
 *   5. Won deals → Google: an enquiry converted to an order is uploaded as an
 *      offline conversion, so Google's bidding learns from sales rather than
 *      form fills. Only when a conversion action is chosen in the console.
 *   6. Where Display ads showed, and the search themes Performance Max
 *      matched — the "what are we paying for" answer for campaign types
 *      that never fill the search-terms report. A rolling 30-day snapshot.
 *
 * Steps 2–3 replace their date window wholesale: Google restates recent days
 * as late conversions arrive, so upserting would leave stale rows behind.
 *
 * Budget: an hourly run is ~4 operations plus one per new Ads lead —
 * comfortably inside Explorer access's 2,880 a day.
 */
class GoogleAdsSync
{
    /** Click details live in click_view for 90 days; conversions upload within the same window. */
    private const CLICK_WINDOW_DAYS = 90;

    /** Cap per run, so a backlog drains over a few hours instead of one huge burst. */
    private const CLICK_LOOKUPS_PER_RUN = 40;
    private const UPLOADS_PER_RUN = 20;

    /** Placements and search themes are kept as one rolling window. */
    private const INSIGHT_WINDOW_DAYS = 30;

    private GoogleAdsClient $client;

    public function __construct(private GoogleAdsAccount $account)
    {
        $this->client = new GoogleAdsClient($account);
    }

    /**
     * @return array{campaign_days:int, search_terms:int, clicks_resolved:int, conversions_uploaded:int, conversion_errors:int, placements:int, search_themes:int}
     */
    public function run(int $days = 3): array
    {
        try {
            $this->syncAccountDetails();

            $tz = $this->timezone();
            $to = CarbonImmutable::now($tz)->toDateString();
            $from = CarbonImmutable::now($tz)->subDays(max(1, $days) - 1)->toDateString();

            $result = [
                'campaign_days'        => $this->syncCampaignDays($from, $to),
                'search_terms'         => $this->syncSearchTerms($from, $to),
                'clicks_resolved'      => $this->resolveClicks(),
                ...$this->uploadConversions(),
                ...$this->syncInsights(),
            ];

            $this->account->forceFill(['last_synced_at' => now(), 'last_error' => null, 'last_error_at' => null])->save();

            return $result;
        } catch (\Throwable $e) {
            $this->account->forceFill(['last_error' => Str::limit($e->getMessage(), 1000), 'last_error_at' => now()])->save();
            throw $e;
        }
    }

    public function syncAccountDetails(): void
    {
        $row = $this->client->search(
            'SELECT customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1'
        )[0]['customer'] ?? [];

        $this->account->forceFill([
            'descriptive_name' => $row['descriptiveName'] ?? $this->account->descriptive_name,
            'currency_code'    => $row['currencyCode'] ?? $this->account->currency_code,
            'time_zone'        => $row['timeZone'] ?? $this->account->time_zone,
        ])->save();
    }

    public function syncCampaignDays(string $from, string $to): int
    {
        $rows = $this->client->search(
            'SELECT segments.date, campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, '
            .'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value '
            ."FROM campaign WHERE segments.date BETWEEN '{$from}' AND '{$to}'"
        );

        $currency = $this->account->currency_code;
        $now = now();
        $records = collect($rows)->map(fn ($r) => [
            'date'              => $r['segments']['date'],
            'campaign_id'       => (string) $r['campaign']['id'],
            'campaign_name'     => Str::limit($r['campaign']['name'] ?? '', 250, ''),
            'campaign_status'   => $r['campaign']['status'] ?? null,
            'channel_type'      => $r['campaign']['advertisingChannelType'] ?? null,
            // The API omits zero-valued fields, so every metric defaults to 0.
            'impressions'       => (int) ($r['metrics']['impressions'] ?? 0),
            'clicks'            => (int) ($r['metrics']['clicks'] ?? 0),
            'cost_micros'       => (int) ($r['metrics']['costMicros'] ?? 0),
            'conversions'       => (float) ($r['metrics']['conversions'] ?? 0),
            'conversions_value' => (float) ($r['metrics']['conversionsValue'] ?? 0),
            'currency_code'     => $currency,
            'created_at'        => $now,
            'updated_at'        => $now,
        ])->all();

        DB::transaction(function () use ($from, $to, $records) {
            GoogleAdsCampaignDay::betweenDates($from, $to)->delete();
            foreach (array_chunk($records, 200) as $chunk) {
                GoogleAdsCampaignDay::insert($chunk);
            }
        });

        return count($records);
    }

    public function syncSearchTerms(string $from, string $to): int
    {
        $rows = $this->client->search(
            'SELECT segments.date, campaign.id, search_term_view.search_term, '
            .'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions '
            ."FROM search_term_view WHERE segments.date BETWEEN '{$from}' AND '{$to}'"
        );

        // One term can appear under several ad groups; the table is per campaign.
        $now = now();
        $records = [];
        foreach ($rows as $r) {
            $term = Str::limit(Str::lower(trim($r['searchTermView']['searchTerm'] ?? '')), 250, '');
            if ($term === '') {
                continue;
            }
            $key = $r['segments']['date'].'|'.$r['campaign']['id'].'|'.$term;
            $records[$key] ??= [
                'date' => $r['segments']['date'], 'campaign_id' => (string) $r['campaign']['id'], 'search_term' => $term,
                'impressions' => 0, 'clicks' => 0, 'cost_micros' => 0, 'conversions' => 0.0,
                'created_at' => $now, 'updated_at' => $now,
            ];
            $records[$key]['impressions'] += (int) ($r['metrics']['impressions'] ?? 0);
            $records[$key]['clicks'] += (int) ($r['metrics']['clicks'] ?? 0);
            $records[$key]['cost_micros'] += (int) ($r['metrics']['costMicros'] ?? 0);
            $records[$key]['conversions'] += (float) ($r['metrics']['conversions'] ?? 0);
        }

        DB::transaction(function () use ($from, $to, $records) {
            GoogleAdsSearchTerm::betweenDates($from, $to)->delete();
            foreach (array_chunk(array_values($records), 200) as $chunk) {
                GoogleAdsSearchTerm::insert($chunk);
            }
        });

        return count($records);
    }

    /**
     * Refresh the 30-day snapshot of Display placements and Performance Max
     * search themes. These are extras: a failure here is logged and skipped,
     * never allowed to fail the sync that carries the spend numbers.
     *
     * @return array{placements:int, search_themes:int}
     */
    public function syncInsights(): array
    {
        $tz = $this->timezone();
        $to = CarbonImmutable::now($tz)->toDateString();
        $from = CarbonImmutable::now($tz)->subDays(self::INSIGHT_WINDOW_DAYS - 1)->toDateString();
        $now = now();
        $base = ['window_from' => $from, 'window_to' => $to, 'created_at' => $now, 'updated_at' => $now];

        $placements = $this->safely('placements', fn () => collect($this->client->search(
            'SELECT campaign.id, group_placement_view.placement, group_placement_view.display_name, '
            .'group_placement_view.placement_type, group_placement_view.target_url, '
            .'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions '
            ."FROM group_placement_view WHERE segments.date BETWEEN '{$from}' AND '{$to}'"
        ))->map(fn ($r) => $base + [
            'kind'        => GoogleAdsInsight::PLACEMENT,
            'campaign_id' => (string) ($r['campaign']['id'] ?? ''),
            'label'       => Str::limit($r['groupPlacementView']['displayName'] ?? $r['groupPlacementView']['placement'] ?? 'Unknown', 250, ''),
            'detail'      => $r['groupPlacementView']['placementType'] ?? null,
            'url'         => Str::limit($r['groupPlacementView']['targetUrl'] ?? '', 490, '') ?: null,
            'impressions' => (int) ($r['metrics']['impressions'] ?? 0),
            'clicks'      => (int) ($r['metrics']['clicks'] ?? 0),
            'cost_micros' => (int) ($r['metrics']['costMicros'] ?? 0),
            'conversions' => (float) ($r['metrics']['conversions'] ?? 0),
        ])->all());

        // The insight is per campaign; ask for each Performance Max campaign
        // that spent in the window.
        $pmax = GoogleAdsCampaignDay::betweenDates($from, $to)->where('channel_type', 'PERFORMANCE_MAX')
            ->distinct()->pluck('campaign_id');
        $themes = $this->safely('search themes', fn () => $pmax->flatMap(fn ($cid) => collect($this->client->search(
            'SELECT campaign_search_term_insight.category_label, metrics.impressions, metrics.clicks, metrics.conversions '
            .'FROM campaign_search_term_insight '
            ."WHERE campaign_search_term_insight.campaign_id = {$this->digitsOnly($cid)} AND segments.date BETWEEN '{$from}' AND '{$to}'"
        ))->map(fn ($r) => $base + [
            'kind'        => GoogleAdsInsight::SEARCH_THEME,
            'campaign_id' => (string) $cid,
            // Google files searches that fit no category under an empty label.
            'label'       => Str::limit(($r['campaignSearchTermInsight']['categoryLabel'] ?? '') ?: 'Other searches', 250, ''),
            'detail'      => null,
            'url'         => null,
            'impressions' => (int) ($r['metrics']['impressions'] ?? 0),
            'clicks'      => (int) ($r['metrics']['clicks'] ?? 0),
            'cost_micros' => null,
            'conversions' => (float) ($r['metrics']['conversions'] ?? 0),
        ]))->all());

        foreach ([GoogleAdsInsight::PLACEMENT => $placements, GoogleAdsInsight::SEARCH_THEME => $themes] as $kind => $rows) {
            if ($rows === null) {
                continue; // the query failed: keep the previous snapshot
            }
            DB::transaction(function () use ($kind, $rows) {
                GoogleAdsInsight::where('kind', $kind)->delete();
                foreach (array_chunk($rows, 200) as $chunk) {
                    GoogleAdsInsight::insert($chunk);
                }
            });
        }

        return ['placements' => count($placements ?? []), 'search_themes' => count($themes ?? [])];
    }

    /** Run an optional report; null (and a log line) if Google refuses it. */
    private function safely(string $what, callable $fn): ?array
    {
        try {
            return $fn();
        } catch (GoogleAdsException $e) {
            Log::warning("Google Ads {$what} skipped: ".$e->getMessage());

            return null;
        }
    }

    private function digitsOnly(string $id): string
    {
        return GoogleAdsClient::digits($id) ?: '0';
    }

    /** Tie Google-sourced leads to the campaign, ad group and keyword of their click. */
    public function resolveClicks(): int
    {
        $since = now()->subDays(self::CLICK_WINDOW_DAYS);
        $pending = collect([Enquiry::class, ContactMessage::class])->flatMap(
            fn ($model) => $model::query()
                ->whereNull('ads_click_checked_at')
                ->where('lead_source', 'google / cpc')
                ->where('created_at', '>=', $since)
                ->oldest()->take(self::CLICK_LOOKUPS_PER_RUN)->get()
        )->take(self::CLICK_LOOKUPS_PER_RUN);

        $resolved = 0;
        foreach ($pending as $lead) {
            if ($this->resolveClick($lead)) {
                $resolved++;
            }
        }

        return $resolved;
    }

    private function resolveClick(Enquiry|ContactMessage $lead): bool
    {
        $gclid = $lead->googleClickId();
        $found = null;

        // gclids are URL-safe base64; anything else cannot be a real one and is
        // never interpolated into a query.
        if ($gclid && preg_match('/^[A-Za-z0-9_\-]{10,200}$/', $gclid)) {
            // The click happened on or just before the landing. Try that day in
            // the ad account's time zone, then the day before (a visit that
            // started just before midnight).
            $seen = CarbonImmutable::parse($lead->attribution['first_seen_at'] ?? $lead->created_at)->setTimezone($this->timezone());
            foreach ([$seen, $seen->subDay()] as $day) {
                $found = $this->client->search(
                    'SELECT click_view.gclid, campaign.id, campaign.name, ad_group.name, click_view.keyword_info.text '
                    ."FROM click_view WHERE segments.date = '{$day->toDateString()}' AND click_view.gclid = '{$gclid}'"
                )[0] ?? null;
                if ($found) {
                    break;
                }
            }
        }

        $lead->forceFill([
            'ads_campaign_id'      => isset($found['campaign']['id']) ? (string) $found['campaign']['id'] : null,
            'ads_campaign_name'    => isset($found['campaign']['name']) ? Str::limit($found['campaign']['name'], 250, '') : null,
            'ads_ad_group'         => isset($found['adGroup']['name']) ? Str::limit($found['adGroup']['name'], 250, '') : null,
            'ads_keyword'          => isset($found['clickView']['keywordInfo']['text']) ? Str::limit($found['clickView']['keywordInfo']['text'], 250, '') : null,
            'ads_click_checked_at' => now(),
        ])->save();

        return $found !== null;
    }

    /**
     * Report won enquiries back to Google as offline click conversions.
     *
     * @return array{conversions_uploaded:int, conversion_errors:int}
     */
    public function uploadConversions(): array
    {
        $actionId = GoogleAdsClient::digits($this->account->conversion_action_id);
        if ($actionId === '') {
            return ['conversions_uploaded' => 0, 'conversion_errors' => 0];
        }

        $customerId = GoogleAdsClient::digits($this->account->customer_id);
        $uploaded = $errors = 0;

        $won = Enquiry::query()
            ->where('status', 'converted')
            ->where('lead_source', 'google / cpc')
            ->whereNull('ads_conversion_uploaded_at')
            ->whereNull('ads_conversion_error')
            ->with('orders')
            ->oldest()->take(self::UPLOADS_PER_RUN)->get();

        foreach ($won as $enquiry) {
            $conversion = $this->conversionFor($enquiry, "customers/{$customerId}/conversionActions/{$actionId}");
            if (is_string($conversion)) {
                $this->markUpload($enquiry, $conversion);
                $errors++;
                continue;
            }

            // One per call, so a rejected conversion is attributable to its
            // enquiry; volume is a handful of won deals a week.
            $res = $this->client->uploadClickConversions([$conversion]);
            $failure = $res['partialFailureError']['message'] ?? null;
            $this->markUpload($enquiry, $failure ? Str::limit($failure, 250, '') : null);
            $failure ? $errors++ : $uploaded++;
        }

        return ['conversions_uploaded' => $uploaded, 'conversion_errors' => $errors];
    }

    /** The conversion payload, or a reason it cannot be sent. */
    private function conversionFor(Enquiry $enquiry, string $action): array|string
    {
        $a = $enquiry->attribution ?? [];
        $click = array_filter([
            'gclid'  => $a['gclid'] ?? null,
            'gbraid' => $a['gbraid'] ?? null,
            'wbraid' => $a['wbraid'] ?? null,
        ]);
        if ($click === []) {
            return 'No Google click id recorded';
        }
        if ($enquiry->created_at->lt(now()->subDays(self::CLICK_WINDOW_DAYS))) {
            return 'Click older than 90 days — Google no longer accepts it';
        }

        $order = $enquiry->orders->sortBy('created_at')->first();
        $wonAt = CarbonImmutable::parse($order?->created_at ?? $enquiry->updated_at)->setTimezone($this->timezone());

        $conversion = [
            // Only one click id is allowed per conversion; gclid wins.
            ...array_slice($click, 0, 1, true),
            'conversionAction'   => $action,
            'conversionDateTime' => $wonAt->format('Y-m-d H:i:sP'),
            // Dedupes on Google's side if the same enquiry is ever sent twice.
            'orderId'            => "enq-{$enquiry->id}",
        ];

        if ($order && $order->total > 0) {
            // Orders hold UGX in shillings and USD in cents.
            $conversion['conversionValue'] = $order->currency === 'USD' ? $order->total / 100 : (float) $order->total;
            $conversion['currencyCode'] = $order->currency;
        }

        return $conversion;
    }

    private function markUpload(Enquiry $enquiry, ?string $error): void
    {
        $enquiry->forceFill($error === null
            ? ['ads_conversion_uploaded_at' => now(), 'ads_conversion_error' => null]
            : ['ads_conversion_error' => $error])->save();
    }

    private function timezone(): string
    {
        return $this->account->time_zone ?: config('app.timezone', 'UTC');
    }

    /* ── Setup helpers (console "choose account" screen) ─────────────────── */

    /**
     * Every ad account the connected login can use — direct ones, plus the
     * clients under any manager account.
     *
     * @return list<array{customer_id:string, name:string, manager:bool, login_customer_id:?string, currency:?string}>
     */
    public static function availableAccounts(GoogleAdsClient $client): array
    {
        $out = [];
        foreach ($client->accessibleCustomers() as $id) {
            try {
                $c = $client->search('SELECT customer.id, customer.descriptive_name, customer.manager, customer.currency_code FROM customer LIMIT 1', $id)[0]['customer'] ?? [];
            } catch (GoogleAdsException) {
                continue; // cancelled or suspended accounts refuse queries
            }
            $manager = (bool) ($c['manager'] ?? false);
            $out[$id] = ['customer_id' => $id, 'name' => $c['descriptiveName'] ?? $id, 'manager' => $manager, 'login_customer_id' => null, 'currency' => $c['currencyCode'] ?? null];

            if ($manager) {
                $children = $client->search(
                    'SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.currency_code '
                    .'FROM customer_client WHERE customer_client.level = 1', $id
                );
                foreach ($children as $row) {
                    $child = $row['customerClient'] ?? [];
                    $cid = (string) ($child['id'] ?? '');
                    if ($cid === '' || ($child['manager'] ?? false) || isset($out[$cid])) {
                        continue;
                    }
                    $out[$cid] = ['customer_id' => $cid, 'name' => $child['descriptiveName'] ?? $cid, 'manager' => false, 'login_customer_id' => $id, 'currency' => $child['currencyCode'] ?? null];
                }
            }
        }

        return array_values($out);
    }

    /**
     * Conversion actions that accept uploaded (offline) clicks.
     *
     * @return list<array{id:string, name:string}>
     */
    public static function uploadConversionActions(GoogleAdsClient $client): array
    {
        $rows = $client->search(
            "SELECT conversion_action.id, conversion_action.name, conversion_action.type FROM conversion_action WHERE conversion_action.status = 'ENABLED'"
        );

        return collect($rows)
            ->map(fn ($r) => $r['conversionAction'] ?? [])
            ->filter(fn ($c) => ($c['type'] ?? '') === 'UPLOAD_CLICKS')
            ->map(fn ($c) => ['id' => (string) $c['id'], 'name' => $c['name'] ?? (string) $c['id']])
            ->values()->all();
    }
}
