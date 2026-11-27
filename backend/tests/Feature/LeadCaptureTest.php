<?php

namespace Tests\Feature;

use App\Mail\FetBuyersPack;
use App\Mail\NewContactMessage;
use App\Mail\NewEnquiry;
use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use App\Support\LeadSource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * The public lead forms, end to end: where a lead came from (channels, Meta
 * ads in particular, for the Vitorra Digital launch), that a repeat
 * submission is one lead, and that leads reach Sales → Today.
 */
class LeadCaptureTest extends TestCase
{
    use RefreshDatabase;

    private const META_AD = ['utm_source' => 'facebook', 'utm_medium' => 'paid', 'utm_campaign' => 'websites-launch', 'fbclid' => 'IwAR-test', 'landing_page' => '/websites?utm_source=facebook'];

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function admin(): array
    {
        $u = User::create(['name' => 'Admin', 'email' => 'a-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin', 'staff'])->plainTextToken];
    }

    private function website(array $over = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/websites/preview', array_merge([
            'name' => 'Grace Namuli', 'business' => 'Namuli Fashions', 'phone' => '0772 123 456',
            'email' => 'grace@example.com', 'business_type' => 'shop', 'attribution' => self::META_AD,
        ], $over));
    }

    /* ── Channels ─────────────────────────────────────────────────────── */

    public function test_labels_fold_into_channels(): void
    {
        $cases = [
            'facebook / paid'        => 'meta_ads',
            'ig / paid_social'       => 'meta_ads',
            'fb / cpc'               => 'meta_ads',
            'facebook / referral'    => 'meta',      // fbclid alone: Facebook, but not proof of spend
            'instagram / referral'   => 'meta',
            'google / cpc'           => 'google_ads',
            'google / organic'       => 'organic_search',
            'bing / organic'         => 'organic_search',
            'whatsapp / status'      => 'whatsapp',
            'mailchimp / email'      => 'email',
            'linkedin / referral'    => 'other_social',
            'kcca.go.ug / referral'  => 'referral',
            'direct'                 => 'direct',
            'unknown'                => 'unknown',
        ];
        foreach ($cases as $label => $channel) {
            $this->assertSame($channel, LeadSource::channel($label), $label);
        }
        $this->assertSame('unknown', LeadSource::channel(null));

        // An untagged Meta click (fbclid only) resolves to unpaid Meta.
        $this->assertSame('meta', LeadSource::channel(LeadSource::resolve(['fbclid' => 'x'])['lead_source']));
    }

    public function test_a_website_lead_from_a_meta_ad_keeps_its_tags_and_is_countable(): void
    {
        $this->website()->assertCreated()->assertJsonStructure(['data' => ['id']]);
        $this->website(['email' => 'g2@example.com', 'attribution' => ['gclid' => 'EAIa-test']])->assertCreated();
        $this->postJson('/api/enquiries', [
            'product_category' => 'FET', 'name' => 'Fleet', 'email' => 'f@example.com', 'country' => 'Uganda',
            'message' => 'Price for 10 trucks', 'attribution' => self::META_AD,
        ])->assertCreated();

        $web = Enquiry::where('email', 'grace@example.com')->sole();
        $this->assertSame('facebook / paid', $web->lead_source);
        $this->assertSame('websites-launch', $web->utm_campaign);
        $this->assertSame('IwAR-test', $web->attribution['fbclid']);

        $h = $this->admin();
        // "How many website enquiries came from Meta ads?"
        $this->withHeaders($h)->getJson('/api/admin/enquiries?category=WEB&channel=meta_ads')
            ->assertOk()->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.email', 'grace@example.com')
            ->assertJsonPath('data.0.lead_channel', 'meta_ads');
        $this->withHeaders($h)->getJson('/api/admin/enquiries?channel=meta_ads')->assertJsonPath('total', 2);
        $this->withHeaders($h)->getJson('/api/admin/enquiries?channel=google_ads')->assertJsonPath('total', 1);
        $this->withHeaders($h)->getJson('/api/admin/enquiries?channel=nonsense')->assertJsonPath('total', 3);

        $channels = collect($this->withHeaders($h)->getJson('/api/admin/stats')->assertOk()->json('data.lead_sources.by_channel'))->keyBy('channel');
        $this->assertSame(2, $channels['meta_ads']['count']);
        $this->assertSame(1, $channels['meta_ads']['by_product']['WEB']);
        $this->assertSame(1, $channels['meta_ads']['by_product']['FET']);
        $this->assertSame(2, $channels['meta_ads']['last_30']);
        $this->assertSame(1, $channels['google_ads']['by_product']['WEB']);

        $csv = $this->withHeaders($h)->get('/api/admin/enquiries/export?channel=meta_ads&category=WEB')->streamedContent();
        $this->assertStringContainsString('Channel', $csv);
        $this->assertStringContainsString('Meta ads (Facebook / Instagram)', $csv);
        $this->assertStringNotContainsString('f@example.com', $csv);
    }

    public function test_unknown_channel_finds_leads_from_before_tracking(): void
    {
        Enquiry::create(['name' => 'Old', 'email' => 'old@example.com', 'country' => 'Uganda', 'message' => 'Hi']);
        $this->website()->assertCreated();

        $this->withHeaders($this->admin())->getJson('/api/admin/enquiries?channel=unknown')
            ->assertJsonPath('total', 1)->assertJsonPath('data.0.email', 'old@example.com');
    }

    /* ── One lead per submission ──────────────────────────────────────── */

    public function test_a_repeated_website_request_is_one_lead_with_one_team_email(): void
    {
        $id = $this->website()->assertCreated()->json('data.id');
        $this->website(['email' => 'GRACE@example.com'])->assertOk()
            ->assertJsonPath('duplicate', true)->assertJsonPath('data.id', $id);

        $this->assertSame(1, Enquiry::count());
        Mail::assertSent(NewEnquiry::class, 1);
    }

    public function test_the_same_person_after_the_window_is_a_new_lead(): void
    {
        $this->website()->assertCreated();
        $this->travel(Enquiry::DUPLICATE_WINDOW_MINUTES + 1)->minutes();
        $this->website()->assertCreated();

        $this->assertSame(2, Enquiry::count());
    }

    public function test_a_repeated_buyers_pack_resends_the_pack_but_tells_the_team_once(): void
    {
        $payload = ['name' => 'Fleet Boss', 'email' => 'boss@fleet.ug', 'fleet_size' => '6-20'];
        $id = $this->postJson('/api/fet/buyers-pack', $payload)->assertCreated()->json('data.id');
        $this->postJson('/api/fet/buyers-pack', $payload)->assertOk()->assertJsonPath('data.id', $id);

        $this->assertSame(1, Enquiry::count());
        Mail::assertSent(FetBuyersPack::class, 2);
        Mail::assertSent(NewEnquiry::class, 1);
    }

    public function test_a_repeated_enquiry_is_one_lead_but_a_new_question_is_another(): void
    {
        $body = ['product_category' => 'FET', 'name' => 'Paul', 'email' => 'paul@fleet.ug', 'country' => 'Uganda', 'message' => 'Price for 12 trucks?'];

        $id = $this->postJson('/api/enquiries', $body)->assertCreated()->json('data.id');
        $this->postJson('/api/enquiries', $body)->assertOk()->assertJsonPath('data.id', $id);
        $this->assertSame(1, Enquiry::count());

        $this->postJson('/api/enquiries', [...$body, 'message' => 'And for 3 buses?'])->assertCreated();
        $this->postJson('/api/enquiries', [...$body, 'product_category' => 'SEAL'])->assertCreated();
        $this->assertSame(3, Enquiry::count());
        Mail::assertSent(NewEnquiry::class, 3);
    }

    public function test_a_repeated_contact_message_is_one_message(): void
    {
        $body = ['name' => 'Asha', 'email' => 'asha@example.com', 'subject' => 'Delivery', 'message' => 'Do you deliver to Gulu?'];

        $this->postJson('/api/contact', $body)->assertCreated();
        $this->postJson('/api/contact', $body)->assertOk()->assertJsonPath('duplicate', true);
        $this->assertSame(1, ContactMessage::count());
        Mail::assertSent(NewContactMessage::class, 1);
    }

    /* ── Newsletter now records where the subscriber came from ────────── */

    public function test_newsletter_signup_records_its_source(): void
    {
        $this->postJson('/api/newsletter/subscribe', ['email' => 'reader@example.com', 'attribution' => self::META_AD])->assertCreated();

        $s = NewsletterSubscriber::sole();
        $this->assertSame('facebook / paid', $s->lead_source);
        $this->assertSame('websites-launch', $s->utm_campaign);
        $this->assertSame('IwAR-test', $s->attribution['fbclid']);
    }

    /* ── Sales → Today ────────────────────────────────────────────────── */

    public function test_today_says_where_each_lead_came_from_and_lists_unread_messages(): void
    {
        $this->website()->assertCreated();
        $this->postJson('/api/contact', ['name' => 'Asha', 'email' => 'asha@example.com', 'message' => 'Do you deliver to Gulu?'])->assertCreated();

        $d = $this->withHeaders($this->admin())->getJson('/api/admin/crm/today')->assertOk()->json('data');
        $this->assertSame('meta_ads', $d['new_enquiries'][0]['channel']);
        $this->assertSame('Meta ads (Facebook / Instagram)', $d['new_enquiries'][0]['channel_label']);
        $this->assertSame('asha@example.com', $d['new_messages'][0]['email']);
        $this->assertSame('direct', $d['new_messages'][0]['channel']);
    }

    public function test_today_hides_messages_from_staff_without_the_messages_module(): void
    {
        $this->postJson('/api/contact', ['name' => 'Asha', 'email' => 'asha@example.com', 'message' => 'Hello'])->assertCreated();
        // Marketing has prospects + customers (so Today) but not the Messages inbox.
        $rep = User::create(['name' => 'Rep', 'email' => 'rep@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops', 'department' => 'marketing']);

        $this->withHeader('Authorization', 'Bearer '.$rep->createToken('t', ['admin', 'staff'])->plainTextToken)
            ->getJson('/api/admin/crm/today')->assertOk()->assertJsonCount(0, 'data.new_messages');
    }
}
