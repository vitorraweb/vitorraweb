<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\GoogleAdsAccount;
use App\Models\GoogleAdsCampaignDay;
use App\Models\GoogleAdsInsight;
use App\Models\GoogleAdsSearchTerm;
use App\Models\Order;
use App\Models\User;
use App\Support\LeadSource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAdsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.google_ads.client_id'     => 'client-id',
            'services.google_ads.client_secret' => 'client-secret',
            'services.google_ads.redirect_uri'  => 'https://vitorra.org/api/google-ads/oauth/callback',
            'services.google_ads.api_version'   => 'v26',
            'services.frontend.url'             => 'https://vitorra.org',
        ]);
    }

    private function account(array $extra = []): GoogleAdsAccount
    {
        return GoogleAdsAccount::create([
            'refresh_token'   => 'refresh-xyz',
            'connected_email' => 'ads@vitorra.org',
            'customer_id'     => '1234567890',
            'time_zone'       => 'Africa/Kampala',
            'currency_code'   => 'UGX',
            ...$extra,
        ]);
    }

    private function headers(string $role = 'admin', ?string $department = null): array
    {
        $u = User::create([
            'name' => 'Staff', 'email' => 's-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme',
            'role' => $role, 'department' => $department,
        ]);

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin'])->plainTextToken];
    }

    /** Fake Google: token endpoint + a GAQL router keyed on the FROM clause. */
    private function fakeGoogle(array $byResource, array $upload = ['results' => [[]]]): void
    {
        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'access-abc', 'expires_in' => 3599]),
            'googleads.googleapis.com/v26/customers/*:uploadClickConversions' => Http::response($upload),
            'googleads.googleapis.com/v26/customers/*/googleAds:search' => function (Request $r) use ($byResource) {
                preg_match('/FROM (\w+)/', $r['query'], $m);

                return Http::response(['results' => $byResource[$m[1]] ?? []]);
            },
        ]);
    }

    private function googleEnquiry(array $attrs = []): Enquiry
    {
        // forceFill: the ads_* columns are written by the sync, not mass-assigned.
        return tap((new Enquiry)->forceFill([
            'name' => 'Fleet Buyer', 'email' => 'b-'.uniqid().'@example.com', 'country' => 'Uganda', 'message' => 'FET for 12 trucks',
            'status' => 'new', 'lead_source' => 'google / cpc',
            'attribution' => ['gclid' => 'EAIaIQobChMI_test-1', 'first_seen_at' => now()->toIso8601String()],
            ...$attrs,
        ]))->save();
    }

    /* ── Sync ─────────────────────────────────────────────────────────────── */

    public function test_sync_is_a_quiet_no_op_until_connected(): void
    {
        Http::fake();

        $this->artisan('google-ads:sync')->assertSuccessful();
        Http::assertNothingSent();
    }

    public function test_sync_stores_campaigns_and_search_terms_and_matches_clicks(): void
    {
        $account = $this->account();
        $today = now('Africa/Kampala')->toDateString();
        $enquiry = $this->googleEnquiry();
        // A stale row inside the window must be replaced, not kept.
        GoogleAdsCampaignDay::create(['date' => $today, 'campaign_id' => '999', 'campaign_name' => 'Old', 'cost_micros' => 5]);

        $this->fakeGoogle([
            'customer' => [['customer' => ['descriptiveName' => 'Vitorra Holdings', 'currencyCode' => 'UGX', 'timeZone' => 'Africa/Kampala']]],
            'campaign' => [[
                'segments' => ['date' => $today],
                'campaign' => ['id' => '111', 'name' => 'FET Fleet Kampala', 'status' => 'ENABLED', 'advertisingChannelType' => 'SEARCH'],
                // Zero-valued fields are omitted by the API (conversions here).
                'metrics'  => ['impressions' => '1200', 'clicks' => '40', 'costMicros' => '80000000000'],
            ]],
            'search_term_view' => [
                ['segments' => ['date' => $today], 'campaign' => ['id' => '111'], 'searchTermView' => ['searchTerm' => 'Fuel Saving Device'], 'metrics' => ['clicks' => '3', 'costMicros' => '6000000000']],
                // Same term from another ad group → one row.
                ['segments' => ['date' => $today], 'campaign' => ['id' => '111'], 'searchTermView' => ['searchTerm' => 'fuel saving device'], 'metrics' => ['clicks' => '2', 'costMicros' => '4000000000']],
            ],
            'click_view' => [[
                'clickView' => ['gclid' => 'EAIaIQobChMI_test-1', 'keywordInfo' => ['text' => 'fuel saver uganda']],
                'campaign'  => ['id' => '111', 'name' => 'FET Fleet Kampala'],
                'adGroup'   => ['name' => 'Trucks'],
            ]],
        ]);

        $this->artisan('google-ads:sync')->assertSuccessful();

        $this->assertSame(1, GoogleAdsCampaignDay::count());
        $day = GoogleAdsCampaignDay::first();
        $this->assertSame(80_000_000_000, $day->cost_micros);
        $this->assertSame(0.0, $day->conversions);

        $term = GoogleAdsSearchTerm::sole();
        $this->assertSame('fuel saving device', $term->search_term);
        $this->assertSame(5, $term->clicks);

        $enquiry->refresh();
        $this->assertSame('111', $enquiry->ads_campaign_id);
        $this->assertSame('Trucks', $enquiry->ads_ad_group);
        $this->assertSame('fuel saver uganda', $enquiry->ads_keyword);
        $this->assertNotNull($enquiry->ads_click_checked_at);

        $account->refresh();
        $this->assertSame('Vitorra Holdings', $account->descriptive_name);
        $this->assertNotNull($account->last_synced_at);
        $this->assertNull($account->last_error);

        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Bearer access-abc'));
    }

    public function test_unknown_gclid_is_checked_once_not_every_hour(): void
    {
        $this->account();
        $enquiry = $this->googleEnquiry();
        $this->fakeGoogle([]);

        $this->artisan('google-ads:sync')->assertSuccessful();
        $enquiry->refresh();
        $this->assertNull($enquiry->ads_campaign_id);
        $this->assertNotNull($enquiry->ads_click_checked_at);
    }

    public function test_a_malformed_gclid_is_never_put_into_a_query(): void
    {
        $this->account();
        $this->googleEnquiry(['attribution' => ['gclid' => "x' OR '1'='1"]]);
        $this->fakeGoogle([]);

        $this->artisan('google-ads:sync')->assertSuccessful();
        Http::assertNotSent(fn (Request $r) => str_contains((string) ($r['query'] ?? ''), 'click_view'));
    }

    public function test_api_failure_is_recorded_on_the_account(): void
    {
        $account = $this->account();
        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['error' => 'invalid_grant'], 400),
        ]);

        $this->artisan('google-ads:sync')->assertFailed();
        $this->assertStringContainsString('Reconnect Google Ads', $account->refresh()->last_error);
    }

    /* ── Display placements & Performance Max themes ───────────────────── */

    public function test_sync_stores_display_placements_and_pmax_search_themes(): void
    {
        $this->account();
        $today = now('Africa/Kampala')->toDateString();
        $this->fakeGoogle([
            'campaign' => [[
                'segments' => ['date' => $today],
                'campaign' => ['id' => '222', 'name' => 'PMax FET', 'status' => 'ENABLED', 'advertisingChannelType' => 'PERFORMANCE_MAX'],
                'metrics'  => ['clicks' => '900', 'costMicros' => '50000000'],
            ]],
            'group_placement_view' => [
                ['campaign' => ['id' => '333'], 'groupPlacementView' => ['placement' => 'mobileapp::2-123', 'displayName' => 'Puzzle Game', 'placementType' => 'MOBILE_APPLICATION'], 'metrics' => ['clicks' => '800', 'costMicros' => '40000000']],
                ['campaign' => ['id' => '333'], 'groupPlacementView' => ['placement' => 'monitor.co.ug', 'displayName' => 'monitor.co.ug', 'placementType' => 'WEBSITE', 'targetUrl' => 'monitor.co.ug'], 'metrics' => ['clicks' => '20', 'costMicros' => '5000000']],
            ],
            'campaign_search_term_insight' => [
                ['campaignSearchTermInsight' => ['categoryLabel' => 'fuel saving devices'], 'metrics' => ['impressions' => '300', 'clicks' => '12']],
                ['campaignSearchTermInsight' => ['categoryLabel' => ''], 'metrics' => ['impressions' => '50', 'clicks' => '1']],
            ],
        ]);

        $this->artisan('google-ads:sync')->assertSuccessful();

        $this->assertSame(2, GoogleAdsInsight::where('kind', 'placement')->count());
        $this->assertEqualsCanonicalizing(['fuel saving devices', 'Other searches'], GoogleAdsInsight::where('kind', 'search_theme')->pluck('label')->all());
        Http::assertSent(fn (Request $r) => str_contains((string) ($r['query'] ?? ''), 'campaign_search_term_insight.campaign_id = 222'));

        $res = $this->withHeaders($this->headers())->getJson('/api/admin/google-ads/summary')->assertOk();
        $res->assertJsonPath('data.placements.0.name', 'Puzzle Game')
            ->assertJsonPath('data.placements.0.cost', 40)
            ->assertJsonPath('data.placement_types.0.type', 'MOBILE_APPLICATION')
            ->assertJsonPath('data.search_themes.0.theme', 'fuel saving devices');
        $this->assertNotNull($res->json('data.insights_window.from'));
    }

    public function test_a_refused_insight_report_does_not_fail_the_sync(): void
    {
        $account = $this->account();
        GoogleAdsInsight::create(['kind' => 'placement', 'label' => 'Kept from last time', 'window_from' => now(), 'window_to' => now()]);
        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'a', 'expires_in' => 3599]),
            'googleads.googleapis.com/v26/customers/*/googleAds:search' => function (Request $r) {
                return str_contains($r['query'], 'group_placement_view')
                    ? Http::response(['error' => ['message' => 'Not available for this account']], 400)
                    : Http::response(['results' => []]);
            },
        ]);

        $this->artisan('google-ads:sync')->assertSuccessful();

        $this->assertNull($account->refresh()->last_error);
        $this->assertSame('Kept from last time', GoogleAdsInsight::sole()->label);
    }

    /* ── Won deals → Google ───────────────────────────────────────────────── */

    public function test_won_enquiry_is_uploaded_once_with_its_order_value(): void
    {
        $this->account(['conversion_action_id' => '555']);
        $enquiry = $this->googleEnquiry(['status' => 'converted', 'ads_click_checked_at' => now()]);
        Order::create([
            'reference' => 'VH-T1', 'enquiry_id' => $enquiry->id, 'customer_name' => 'Fleet Buyer', 'customer_email' => $enquiry->email,
            'currency' => 'UGX', 'subtotal' => 5276000, 'total' => 5276000, 'status' => 'pending', 'payment_status' => 'pending', 'shipping_address' => [],
        ]);
        $this->fakeGoogle([]);

        $this->artisan('google-ads:sync')->assertSuccessful();
        $this->artisan('google-ads:sync')->assertSuccessful();

        $uploads = Http::recorded(fn (Request $r) => str_contains($r->url(), 'uploadClickConversions'))->values();
        $this->assertCount(1, $uploads);
        $c = $uploads[0][0]['conversions'][0];
        $this->assertSame('EAIaIQobChMI_test-1', $c['gclid']);
        $this->assertSame('customers/1234567890/conversionActions/555', $c['conversionAction']);
        $this->assertEquals(5276000, $c['conversionValue']);
        $this->assertSame('UGX', $c['currencyCode']);
        $this->assertSame("enq-{$enquiry->id}", $c['orderId']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\+03:00$/', $c['conversionDateTime']);
        $this->assertNotNull($enquiry->refresh()->ads_conversion_uploaded_at);
    }

    public function test_rejected_conversion_is_recorded_and_not_retried(): void
    {
        $this->account(['conversion_action_id' => '555']);
        $enquiry = $this->googleEnquiry(['status' => 'converted', 'ads_click_checked_at' => now()]);
        $this->fakeGoogle([], ['partialFailureError' => ['message' => 'The click was not found.'], 'results' => [[]]]);

        $this->artisan('google-ads:sync')->assertSuccessful();
        $this->artisan('google-ads:sync')->assertSuccessful();

        $this->assertSame('The click was not found.', $enquiry->refresh()->ads_conversion_error);
        $this->assertNull($enquiry->ads_conversion_uploaded_at);
        $this->assertCount(1, Http::recorded(fn (Request $r) => str_contains($r->url(), 'uploadClickConversions')));
    }

    public function test_nothing_is_uploaded_without_a_conversion_action(): void
    {
        $this->account();
        $this->googleEnquiry(['status' => 'converted', 'ads_click_checked_at' => now()]);
        $this->fakeGoogle([]);

        $this->artisan('google-ads:sync')->assertSuccessful();
        Http::assertNotSent(fn (Request $r) => str_contains($r->url(), 'uploadClickConversions'));
    }

    /* ── Console summary ─────────────────────────────────────────────────── */

    public function test_summary_puts_leads_and_wins_beside_campaign_spend(): void
    {
        $this->account();
        $today = now('Africa/Kampala')->toDateString();
        GoogleAdsCampaignDay::create(['date' => $today, 'campaign_id' => '111', 'campaign_name' => 'FET Fleet Kampala', 'impressions' => 1000, 'clicks' => 50, 'cost_micros' => 100_000_000_000]);
        // Matched by click, by utm_campaign name, and not at all.
        $won = $this->googleEnquiry(['ads_campaign_id' => '111', 'status' => 'converted']);
        Order::create(['reference' => 'VH-T2', 'enquiry_id' => $won->id, 'customer_name' => 'x', 'customer_email' => 'x@example.com', 'currency' => 'UGX', 'subtotal' => 1891000, 'total' => 1891000, 'status' => 'pending', 'payment_status' => 'pending', 'shipping_address' => []]);
        $this->googleEnquiry(['utm_campaign' => 'fet fleet kampala']);
        ContactMessage::create(['name' => 'Q', 'email' => 'q@example.com', 'subject' => 'Price', 'message' => 'Hi', 'lead_source' => 'google / cpc']);
        // Not Google — must not count.
        Enquiry::create(['name' => 'D', 'email' => 'd@example.com', 'country' => 'Uganda', 'message' => 'Hi', 'status' => 'new', 'lead_source' => 'direct']);

        $res = $this->withHeaders($this->headers('ops', 'marketing'))->getJson('/api/admin/google-ads/summary?period=7d')->assertOk();

        $res->assertJsonPath('data.totals.cost', 100000)
            ->assertJsonPath('data.totals.leads', 3)
            ->assertJsonPath('data.totals.won', 1)
            ->assertJsonPath('data.totals.won_value.UGX', 1891000)
            ->assertJsonPath('data.totals.cost_per_lead', 33333.33)
            ->assertJsonPath('data.campaigns.0.name', 'FET Fleet Kampala')
            ->assertJsonPath('data.campaigns.0.leads', 2)
            ->assertJsonPath('data.campaigns.0.won', 1)
            ->assertJsonPath('data.campaigns.1.name', 'Not matched to a campaign')
            ->assertJsonPath('data.campaigns.1.leads', 1);
        $this->assertCount(7, $res->json('data.daily'));
    }

    public function test_reading_needs_the_module_and_connecting_needs_admin(): void
    {
        $ops = $this->headers('ops', 'operations');
        $this->withHeaders($ops)->getJson('/api/admin/google-ads/summary')->assertForbidden();
        $this->app['auth']->forgetGuards(); // the guard otherwise keeps the first user

        $marketing = $this->headers('ops', 'marketing');
        $this->withHeaders($marketing)->getJson('/api/admin/google-ads/status')->assertOk()->assertJsonPath('data.can_manage', false);
        $this->withHeaders($marketing)->getJson('/api/admin/google-ads/connect')->assertForbidden();
        $this->withHeaders($marketing)->deleteJson('/api/admin/google-ads')->assertForbidden();
    }

    public function test_refresh_token_is_never_served_and_is_encrypted_at_rest(): void
    {
        $this->account();

        $body = $this->withHeaders($this->headers())->getJson('/api/admin/google-ads/status')->assertOk()->getContent();
        $this->assertStringNotContainsString('refresh-xyz', $body);
        $this->assertNotSame('refresh-xyz', DB::table('google_ads_accounts')->value('refresh_token'));
    }

    /* ── Connecting ──────────────────────────────────────────────────────── */

    public function test_connect_then_callback_stores_the_account_and_picks_the_only_ad_account(): void
    {
        $h = $this->headers();
        $url = $this->withHeaders($h)->getJson('/api/admin/google-ads/connect')->assertOk()->json('data.url');
        parse_str(parse_url($url, PHP_URL_QUERY), $q);
        $this->assertSame('offline', $q['access_type']);
        $this->assertStringContainsString('auth/adwords', $q['scope']);

        $idToken = 'h.'.rtrim(strtr(base64_encode(json_encode(['email' => 'marketing@vitorra.org'])), '+/', '-_'), '=').'.s';
        Http::fake([
            'oauth2.googleapis.com/token' => Http::sequence()
                ->push(['refresh_token' => 'new-refresh', 'access_token' => 'a1', 'id_token' => $idToken])
                ->push(['access_token' => 'a2', 'expires_in' => 3599]),
            'googleads.googleapis.com/v26/customers:listAccessibleCustomers' => Http::response(['resourceNames' => ['customers/7778889990']]),
            'googleads.googleapis.com/v26/customers/*/googleAds:search' => Http::response(['results' => [['customer' => ['id' => '7778889990', 'descriptiveName' => 'Vitorra Ads', 'manager' => false]]]]),
        ]);

        $this->get('/api/google-ads/oauth/callback?code=abc&state='.urlencode($q['state']))
            ->assertRedirect('https://vitorra.org/admin/google-ads?connected=1');

        $a = GoogleAdsAccount::sole();
        $this->assertSame('new-refresh', $a->refresh_token);
        $this->assertSame('marketing@vitorra.org', $a->connected_email);
        $this->assertSame('7778889990', $a->customer_id);

        // The state is single-use.
        $this->get('/api/google-ads/oauth/callback?code=abc&state='.urlencode($q['state']))
            ->assertRedirect()->assertRedirectContains('error=');
    }

    public function test_forged_state_is_refused(): void
    {
        Http::fake();
        Cache::flush();

        $this->get('/api/google-ads/oauth/callback?code=abc&state='.urlencode(Crypt::encryptString(json_encode(['n' => 'guess']))))
            ->assertRedirectContains('error=');
        $this->get('/api/google-ads/oauth/callback?code=abc&state=garbage')->assertRedirectContains('error=');
        $this->assertSame(0, GoogleAdsAccount::count());
        Http::assertNothingSent();
    }

    public function test_switching_ad_account_clears_the_old_numbers(): void
    {
        $this->account(['conversion_action_id' => '555']);
        GoogleAdsCampaignDay::create(['date' => now()->toDateString(), 'campaign_id' => '1', 'campaign_name' => 'Old']);

        $this->withHeaders($this->headers())->putJson('/api/admin/google-ads/account', ['customer_id' => '222-333-4444'])
            ->assertOk()
            ->assertJsonPath('data.account.customer_id', '2223334444')
            ->assertJsonPath('data.account.conversion_action_id', null);
        $this->assertSame(0, GoogleAdsCampaignDay::count());
    }

    /* ── Attribution ─────────────────────────────────────────────────────── */

    public function test_ios_click_ids_count_as_google_ads(): void
    {
        $this->assertSame('google / cpc', LeadSource::resolve(['gbraid' => '0AAAAAxyz'])['lead_source']);
        $this->assertSame('google / cpc', LeadSource::resolve(['wbraid' => 'CjkKCQjw'])['lead_source']);
        $this->assertSame('0AAAAAxyz', LeadSource::resolve(['gbraid' => '0AAAAAxyz'])['attribution']['gbraid']);
    }
}
