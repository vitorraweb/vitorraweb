<?php

namespace Tests\Feature;

use App\Mail\DesignedCampaignEmail;
use App\Models\CampaignClick;
use App\Models\Communication;
use App\Models\Market;
use App\Models\Prospect;
use App\Models\ProspectCampaign;
use App\Models\ProspectCampaignRecipient;
use App\Models\User;
use App\Services\CampaignSender;
use App\Services\Marketing\CampaignTracking;
use App\Services\Marketing\EmailDesigner;
use App\Services\Marketing\LeadScorer;
use App\Services\Marketing\StarterDesigns;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MarketingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config([
            'mail.campaign_from' => 'support@vitorra.org',
            'mail.campaign_cc' => 'support@vitorra.org',
            'campaigns.throttle_ms' => 0,
            'services.frontend.url' => 'https://vitorra.org',
        ]);
    }

    private function headers(string $role = 'admin', ?string $department = null): array
    {
        $u = User::create(['name' => 'Thurayya Test', 'email' => 's-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => $role, 'department' => $department]);

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin'])->plainTextToken];
    }

    private function prospect(array $attrs = []): Prospect
    {
        return tap((new Prospect)->forceFill([
            'name' => 'Lead '.uniqid(), 'category' => 'CARGO', 'product' => 'FET',
            'email' => uniqid().'@fleet.ug', 'outreach_status' => 'not_contacted', ...$attrs,
        ]))->save();
    }

    private function design(): array
    {
        return ['settings' => ['background' => '#FFFFFF'], 'blocks' => [
            ['type' => 'heading', 'props' => ['text' => 'Hello {name}']],
            ['type' => 'text', 'props' => ['html' => '<p>Save fuel.</p>']],
            ['type' => 'button', 'props' => ['label' => 'Book', 'url' => 'https://vitorra.org/enquire']],
        ]];
    }

    /* ── Designer ─────────────────────────────────────────────────────────── */

    public function test_normalise_refuses_anything_that_could_reach_a_style_or_script(): void
    {
        $d = EmailDesigner::normalise(['settings' => ['canvas' => 'red;background:url(x)', 'width' => 99999, 'font' => 'Comic'], 'blocks' => [
            ['type' => 'text', 'props' => ['html' => '<p onclick="x()">Hi<script>alert(1)</script></p>', 'size' => 500, 'color' => 'expression(1)']],
            ['type' => 'button', 'props' => ['url' => 'javascript:alert(1)', 'label' => '<b>Go</b>']],
            ['type' => 'evil', 'props' => []],
        ]]);

        $this->assertSame('#F2F2F2', $d['settings']['canvas']);
        $this->assertSame(720, $d['settings']['width']);
        $this->assertSame('arial', $d['settings']['font']);
        $this->assertCount(2, $d['blocks']);
        $this->assertStringNotContainsString('script', $d['blocks'][0]['props']['html']);
        $this->assertStringNotContainsString('onclick', $d['blocks'][0]['props']['html']);
        $this->assertSame(28, $d['blocks'][0]['props']['size']);
        $this->assertNull($d['blocks'][0]['props']['color']);
        $this->assertStringStartsWith('https://vitorra.org/', $d['blocks'][1]['props']['url']);
        $this->assertSame('Go', $d['blocks'][1]['props']['label']);
    }

    public function test_every_starter_renders_with_an_unsubscribe_link(): void
    {
        foreach (StarterDesigns::all() as $s) {
            $html = EmailDesigner::render($s['design'], 'Subject', 'Pre');
            $this->assertStringContainsString(EmailDesigner::UNSUBSCRIBE_PLACEHOLDER, $html, $s['key']);
            $this->assertStringContainsString('<table', $html);
        }
    }

    /* ── Test before send ────────────────────────────────────────────────── */

    public function test_a_campaign_must_be_tested_and_untouched_before_it_goes_out(): void
    {
        $h = $this->headers();
        $market = Market::create(['name' => 'Fleets']);
        $market->prospects()->attach($this->prospect()->id);

        $id = $this->withHeaders($h)->postJson('/api/admin/marketing/campaigns', [
            'subject' => 'Save fuel, {name}', 'design' => $this->design(), 'market_ids' => [$market->id],
        ])->assertCreated()->json('data.id');

        $this->withHeaders($h)->postJson("/api/admin/marketing/campaigns/{$id}/send")->assertStatus(422)->assertJsonFragment(['message' => 'Send a test to support first.']);

        $this->withHeaders($h)->postJson("/api/admin/marketing/campaigns/{$id}/test")->assertOk()->assertJsonPath('data.test_current', true);
        Mail::assertSent(DesignedCampaignEmail::class, fn ($m) => $m->hasTo('support@vitorra.org') && $m->isTest && str_starts_with($m->envelope()->subject, '[TEST]'));

        // Edit after testing: the test no longer counts.
        $this->withHeaders($h)->patchJson("/api/admin/marketing/campaigns/{$id}", ['subject' => 'Changed'])->assertOk()->assertJsonPath('data.test_current', false);
        $this->withHeaders($h)->postJson("/api/admin/marketing/campaigns/{$id}/send")->assertStatus(422)->assertJsonFragment(['message' => 'The campaign changed after its test. Send a new test to support first.']);

        $this->withHeaders($h)->postJson("/api/admin/marketing/campaigns/{$id}/test")->assertOk();
        $this->withHeaders($h)->postJson("/api/admin/marketing/campaigns/{$id}/send")->assertOk()->assertJsonPath('data.status', 'sent');
    }

    public function test_tests_only_go_to_our_own_people(): void
    {
        $h = $this->headers();
        $c = ProspectCampaign::create(['subject' => 'S', 'body' => '', 'design' => EmailDesigner::normalise($this->design()), 'status' => 'draft']);

        $this->withHeaders($h)->postJson("/api/admin/marketing/campaigns/{$c->id}/test", ['also' => ['stranger@gmail.com']])->assertStatus(422);
        Mail::assertNothingSent();
    }

    public function test_send_reaches_each_address_once_and_skips_who_it_should(): void
    {
        $h = $this->headers();
        $a = Market::create(['name' => 'A']);
        $b = Market::create(['name' => 'B']);
        $good = $this->prospect(['email' => 'good@fleet.ug']);
        $twin = $this->prospect(['email' => 'GOOD@fleet.ug', 'category' => 'SCHOOL']);
        $unsub = $this->prospect(['unsubscribed_at' => now()]);
        $avoid = $this->prospect(['lead_tier' => 'avoid']);
        $noEmail = $this->prospect(['email' => null, 'phone' => '+256700000000']);
        $a->prospects()->attach([$good->id, $unsub->id, $avoid->id]);
        $b->prospects()->attach([$good->id, $twin->id, $noEmail->id]);

        $c = ProspectCampaign::create(['subject' => 'Hi {name}', 'body' => '', 'design' => EmailDesigner::normalise($this->design()), 'status' => 'draft', 'market_ids' => [$a->id, $b->id], 'skip_avoid' => true]);
        $c->update(['tested_at' => now(), 'test_hash' => $c->contentHash()]);

        $this->withHeaders($h)->getJson("/api/admin/marketing/campaigns/{$c->id}/audience")->assertOk()
            ->assertJsonPath('data.will_send', 1)
            ->assertJsonPath('data.skipped.unsubscribed', 1)
            ->assertJsonPath('data.skipped.avoid', 1)
            ->assertJsonPath('data.skipped.no_email', 1)
            ->assertJsonPath('data.skipped.duplicate', 2);

        $this->withHeaders($h)->postJson("/api/admin/marketing/campaigns/{$c->id}/send")->assertOk();

        $r = ProspectCampaignRecipient::sole();
        $this->assertSame('good@fleet.ug', $r->email);
        $this->assertSame('sent', $r->status);
        $this->assertSame(32, strlen($r->token));
        Mail::assertSent(DesignedCampaignEmail::class, function ($m) use ($r) {
            return $m->hasTo('good@fleet.ug') && ! $m->isTest
                && str_contains($m->bodyHtml, "/api/t/o/{$r->token}.gif")
                && str_contains($m->bodyHtml, "/api/t/c/{$r->token}?u=")
                && str_contains($m->bodyHtml, "/api/t/u/{$r->token}")
                && str_contains($m->bodyHtml, e($r->name))
                && ! str_contains($m->bodyHtml, '{name}');
        });
    }

    /* ── Tracking ────────────────────────────────────────────────────────── */

    private function sentRecipient(): ProspectCampaignRecipient
    {
        $c = ProspectCampaign::create(['subject' => 'S', 'body' => '', 'design' => EmailDesigner::normalise($this->design()), 'status' => 'sent']);
        $p = $this->prospect();

        return $c->recipients()->create(['prospect_id' => $p->id, 'email' => $p->email, 'name' => $p->name, 'status' => 'sent', 'sent_at' => now()->subHour(), 'token' => CampaignTracking::newToken()]);
    }

    public function test_open_pixel_and_signed_clicks_are_recorded(): void
    {
        $r = $this->sentRecipient();

        $this->get("/api/t/o/{$r->token}.gif")->assertOk()->assertHeader('Content-Type', 'image/gif');
        $this->assertNotNull($r->refresh()->opened_at);

        $url = CampaignTracking::clickUrl($r->token, 'https://vitorra.org/enquire?sector=FET');
        $path = parse_url($url, PHP_URL_PATH).'?'.parse_url($url, PHP_URL_QUERY);
        $this->get($path, ['User-Agent' => 'Mozilla/5.0'])->assertRedirect('https://vitorra.org/enquire?sector=FET');

        $this->assertSame(1, $r->refresh()->click_count);
        $this->assertSame('https://vitorra.org/enquire?sector=FET', CampaignClick::sole()->url);
    }

    public function test_a_tampered_click_link_cannot_redirect_elsewhere(): void
    {
        $r = $this->sentRecipient();
        $evil = rtrim(strtr(base64_encode('https://evil.example'), '+/', '-_'), '=');

        $this->get("/api/t/c/{$r->token}?u={$evil}&s=forged")->assertRedirect('https://vitorra.org/');
        $this->assertSame(0, CampaignClick::count());
    }

    public function test_scanner_clicks_are_kept_but_not_counted(): void
    {
        $r = $this->sentRecipient();
        $url = CampaignTracking::clickUrl($r->token, 'https://vitorra.org/');

        $this->get(parse_url($url, PHP_URL_PATH).'?'.parse_url($url, PHP_URL_QUERY), ['User-Agent' => 'Microsoft SafeLinks scanner'])->assertRedirect();

        $this->assertTrue(CampaignClick::sole()->suspected_bot);
        $this->assertNull($r->refresh()->clicked_at);
    }

    public function test_unsubscribe_needs_the_button_and_then_sticks(): void
    {
        $r = $this->sentRecipient();
        $sibling = $this->prospect(['email' => strtoupper($r->email), 'category' => 'SCHOOL']);

        $this->get("/api/t/u/{$r->token}")->assertOk()->assertSee('Stop receiving our emails?');
        $this->assertNull($r->refresh()->unsubscribed_at, 'a link scanner opening the page must not unsubscribe anyone');

        $this->post("/api/t/u/{$r->token}")->assertOk()->assertSee('You are unsubscribed');
        $this->assertNotNull($r->refresh()->unsubscribed_at);
        $this->assertNotNull($sibling->refresh()->unsubscribed_at);
        $this->assertSame('do_not_contact', $sibling->lead_tier);
    }

    public function test_report_scores_the_campaign(): void
    {
        $h = $this->headers();
        $c = ProspectCampaign::create(['subject' => 'S', 'body' => '', 'design' => EmailDesigner::normalise($this->design()), 'status' => 'sent']);
        foreach (range(1, 10) as $i) {
            $c->recipients()->create(['email' => "p{$i}@x.ug", 'status' => 'sent', 'token' => CampaignTracking::newToken(),
                'opened_at' => $i <= 4 ? now() : null, 'clicked_at' => $i === 1 ? now() : null]);
        }

        $this->withHeaders($h)->getJson("/api/admin/marketing/campaigns/{$c->id}/report")->assertOk()
            ->assertJsonPath('data.stats.open_rate', 40)
            ->assertJsonPath('data.stats.click_rate', 10)
            ->assertJsonPath('data.stats.click_to_open', 25)
            ->assertJsonPath('data.stats.score', 100)
            ->assertJsonPath('data.stats.grade', 'Excellent');
    }

    /* ── Markets ─────────────────────────────────────────────────────────── */

    public function test_markets_add_move_create_and_remove(): void
    {
        $h = $this->headers();
        $a = $this->withHeaders($h)->postJson('/api/admin/marketing/markets', ['name' => 'Kampala fleets', 'product' => 'FET'])->assertCreated()->json('data.id');
        $b = $this->withHeaders($h)->postJson('/api/admin/marketing/markets', ['name' => 'Upcountry fleets'])->assertCreated()->json('data.id');
        $p1 = $this->prospect();
        $p2 = $this->prospect();

        $this->withHeaders($h)->postJson("/api/admin/marketing/markets/{$a}/members", ['ids' => [$p1->id, $p2->id]])->assertOk()->assertJsonPath('added', 2);
        $this->withHeaders($h)->postJson("/api/admin/marketing/markets/{$a}/move", ['ids' => [$p1->id], 'to' => $b])->assertOk()->assertJsonPath('moved', 1);
        $this->assertSame([$p2->id], Market::find($a)->prospects()->pluck('prospects.id')->all());
        $this->assertSame([$p1->id], Market::find($b)->prospects()->pluck('prospects.id')->all());

        $this->withHeaders($h)->postJson("/api/admin/marketing/markets/{$a}/contacts", ['name' => 'New Haulage Ltd', 'email' => 'ops@newhaulage.ug', 'category' => 'CARGO'])->assertCreated();
        $this->assertTrue(Market::find($a)->prospects()->where('name', 'New Haulage Ltd')->exists());

        $this->withHeaders($h)->postJson("/api/admin/marketing/markets/{$a}/remove", ['ids' => [$p2->id]])->assertOk()->assertJsonPath('removed', 1);
        $this->assertNotNull(Prospect::find($p2->id), 'removing from a market keeps the contact');
    }

    public function test_marketing_needs_the_prospects_module(): void
    {
        $this->withHeaders($this->headers('ops', 'it'))->getJson('/api/admin/marketing/markets')->assertForbidden();
    }

    /* ── Decision engine ─────────────────────────────────────────────────── */

    public function test_the_engine_ranks_engaged_leads_up_and_disappointing_ones_out(): void
    {
        $clicker = $this->prospect(['outreach_status' => 'contacted', 'phone' => '+256700000001']);
        $ignorer = $this->prospect(['outreach_status' => 'contacted']);
        $said_no = $this->prospect(['outreach_status' => 'not_interested']);
        $gone = $this->prospect(['unsubscribed_at' => now()]);
        $replier = $this->prospect(['outreach_status' => 'contacted']);

        $c = ProspectCampaign::create(['subject' => 'S', 'body' => '', 'status' => 'sent']);
        foreach (range(1, 4) as $i) {
            $c->recipients()->create(['email' => $ignorer->email, 'status' => 'sent', 'sent_at' => now()->subDays(10 * $i)]);
        }
        $c->recipients()->create(['email' => $clicker->email, 'status' => 'sent', 'sent_at' => now()->subDays(3), 'opened_at' => now()->subDays(2), 'clicked_at' => now()->subDays(2)]);
        Communication::create(['email' => $replier->email, 'direction' => 'inbound', 'channel' => 'email', 'subject' => 'Re: fuel', 'body' => 'Tell me more']);

        LeadScorer::forAll()->scoreAndStore();

        $fresh = $this->prospect();
        LeadScorer::forAll()->scoreAndStore();
        $this->assertSame('cold', $fresh->refresh()->lead_tier, 'a lead we have never emailed is not "avoid"');

        $this->assertSame('do_not_contact', $gone->refresh()->lead_tier);
        $this->assertSame('avoid', $said_no->refresh()->lead_tier);
        $this->assertSame('avoid', $ignorer->refresh()->lead_tier);
        $this->assertStringContainsString('Ignored 4 campaigns', implode(' ', $ignorer->lead_reasons));
        $this->assertGreaterThan($ignorer->lead_score, $clicker->refresh()->lead_score);
        $this->assertStringContainsString('Call them', $clicker->lead_action);
        $this->assertStringContainsString('Replied to us', implode(' ', $replier->refresh()->lead_reasons));
    }

    public function test_priorities_endpoint_lists_a_tier_with_counts(): void
    {
        $this->prospect(['lead_tier' => 'hot', 'lead_score' => 80, 'lead_reasons' => ['Clicked']]);
        $this->prospect(['lead_tier' => 'avoid', 'lead_score' => 5]);

        $this->withHeaders($this->headers())->getJson('/api/admin/marketing/priorities?tier=hot')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('counts.hot', 1)->assertJsonPath('counts.avoid', 1);
    }
}
