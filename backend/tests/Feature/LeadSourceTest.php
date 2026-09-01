<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\User;
use App\Support\LeadSource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LeadSourceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function submitEnquiry(array $attribution): Enquiry
    {
        $this->postJson('/api/enquiries', [
            'name'        => 'Test Buyer',
            'email'       => 'buyer@example.com',
            'country'     => 'Uganda',
            'message'     => 'Interested in FET.',
            'attribution' => $attribution,
        ])->assertCreated();

        return Enquiry::latest('id')->firstOrFail();
    }

    /* ── Channel resolution ────────────────────────────────────────────── */

    public function test_explicit_utm_tags_are_recorded_and_labelled(): void
    {
        $e = $this->submitEnquiry([
            'utm_source'   => 'Google',
            'utm_medium'   => 'CPC',
            'utm_campaign' => 'fet-fleet-aug',
        ]);

        $this->assertSame('google / cpc', $e->lead_source);
        $this->assertSame('Google', $e->utm_source);
        $this->assertSame('fet-fleet-aug', $e->utm_campaign);
    }

    public function test_untagged_google_ads_click_is_recognised_by_gclid(): void
    {
        // Auto-tagging on, no UTMs on the final URL. This is the common case and
        // the one that would otherwise be miscounted as "direct".
        $e = $this->submitEnquiry(['gclid' => 'EAIaIQobChMI-test']);

        $this->assertSame('google / cpc', $e->lead_source);
        $this->assertSame('EAIaIQobChMI-test', $e->attribution['gclid']);
    }

    public function test_referrer_is_classified_when_there_are_no_tags(): void
    {
        $this->assertSame(
            'facebook / referral',
            LeadSource::resolve(['referrer' => 'https://m.facebook.com/story'])['lead_source']
        );

        $this->assertSame(
            'google / organic',
            LeadSource::resolve(['referrer' => 'https://www.google.com/search?q=fuel'])['lead_source']
        );

        $this->assertSame(
            'linkedin / referral',
            LeadSource::resolve(['referrer' => 'https://lnkd.in/abc'])['lead_source']
        );
    }

    public function test_unknown_referrer_keeps_its_host(): void
    {
        $this->assertSame(
            'monitor.co.ug / referral',
            LeadSource::resolve(['referrer' => 'https://www.monitor.co.ug/news'])['lead_source']
        );
    }

    public function test_host_matching_is_not_fooled_by_a_substring(): void
    {
        // "notgoogle.com" contains "google" but is not Google, and "xyz.com"
        // contains "x" but is not x.com. Matching whole dot-separated parts is
        // what stops a competitor's site being reported as our ad spend working.
        $this->assertSame(
            'notgoogle.com / referral',
            LeadSource::resolve(['referrer' => 'https://notgoogle.com/'])['lead_source']
        );

        $this->assertSame(
            'xyz.com / referral',
            LeadSource::resolve(['referrer' => 'https://xyz.com/'])['lead_source']
        );
    }

    public function test_our_own_pages_are_not_a_source(): void
    {
        $this->assertSame(
            'direct',
            LeadSource::resolve(['referrer' => 'https://www.vitorra.org/products/fuel-eco-tech'])['lead_source']
        );
    }

    public function test_nothing_captured_reads_as_direct(): void
    {
        $e = $this->submitEnquiry([]);

        $this->assertSame('direct', $e->lead_source);
        $this->assertNull($e->attribution);
    }

    /* ── It must never cost us the lead ────────────────────────────────── */

    public function test_enquiry_still_succeeds_when_attribution_is_absent(): void
    {
        $this->postJson('/api/enquiries', [
            'name'    => 'No Attribution',
            'email'   => 'plain@example.com',
            'country' => 'Uganda',
            'message' => 'Hello.',
        ])->assertCreated();

        $this->assertSame('direct', Enquiry::latest('id')->first()->lead_source);
    }

    public function test_hostile_attribution_values_are_stripped_and_capped(): void
    {
        $e = $this->submitEnquiry([
            'utm_source'   => '<script>alert(1)</script>google',
            'utm_campaign' => str_repeat('a', 900),
            'referrer'     => 'not a url at all',
        ]);

        // Tags are stripped, not escaped, so nothing renders as markup wherever
        // a channel label is later printed.
        $this->assertSame('alert(1)google', $e->utm_source);
        $this->assertStringNotContainsString('<script>', (string) $e->lead_source);
        $this->assertLessThanOrEqual(255, strlen((string) $e->utm_campaign));
        // A referrer that is not a URL yields no host and is simply ignored.
        $this->assertSame('alert(1)google / referral', $e->lead_source);
    }

    /* ── Contact messages are leads too ────────────────────────────────── */

    public function test_contact_messages_capture_the_same_way(): void
    {
        $this->postJson('/api/contact', [
            'name'        => 'Contact Person',
            'email'       => 'c@example.com',
            'message'     => 'Question about SEAL.',
            'attribution' => ['utm_source' => 'linkedin', 'utm_medium' => 'social'],
        ])->assertCreated();

        $this->assertSame('linkedin / social', ContactMessage::latest('id')->first()->lead_source);
    }

    /* ── Reporting ─────────────────────────────────────────────────────── */

    public function test_dashboard_reports_enquiries_grouped_by_channel(): void
    {
        Enquiry::create(['name' => 'A', 'email' => 'a@e.com', 'country' => 'Uganda', 'message' => 'x',
            'lead_source' => 'google / cpc', 'status' => 'converted']);
        Enquiry::create(['name' => 'B', 'email' => 'b@e.com', 'country' => 'Uganda', 'message' => 'x',
            'lead_source' => 'google / cpc', 'status' => 'new']);
        Enquiry::create(['name' => 'C', 'email' => 'c@e.com', 'country' => 'Uganda', 'message' => 'x',
            'lead_source' => 'direct', 'status' => 'new']);
        // Predates tracking — must report as unknown, never as direct.
        Enquiry::create(['name' => 'D', 'email' => 'd@e.com', 'country' => 'Uganda', 'message' => 'x',
            'status' => 'new']);

        $admin = User::create([
            'name' => 'Admin', 'email' => 'admin-'.uniqid().'@vitorra.org',
            'password' => 'password123', 'role' => 'admin',
        ]);

        $sources = collect(
            $this->actingAs($admin)->getJson('/api/admin/stats')
                ->assertOk()->json('data.lead_sources.by_source')
        )->keyBy('source');

        $this->assertSame(2, $sources['google / cpc']['count']);
        $this->assertSame(1, $sources['google / cpc']['converted']);
        $this->assertSame(1, $sources['direct']['count']);
        $this->assertSame(1, $sources['unknown']['count']);
        $this->assertSame(0, $sources['direct']['converted']);
    }
}
