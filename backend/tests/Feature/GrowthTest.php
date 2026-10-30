<?php

namespace Tests\Feature;

use App\Mail\FetBuyersPack;
use App\Mail\NewEnquiry;
use App\Models\Enquiry;
use App\Models\Product;
use App\Models\Spotlight;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** The website's lead and freshness tools: the FET Buyer's Pack and Spotlights. */
class GrowthTest extends TestCase
{
    use RefreshDatabase;

    private function h(User $u): array
    {
        return ['Authorization' => 'Bearer '.$u->createToken('t')->plainTextToken];
    }

    public function test_buyers_pack_emails_the_visitor_and_logs_an_fet_lead(): void
    {
        Mail::fake();
        Product::create(['slug' => 'fet-car', 'name' => 'FI', 'category' => 'FET', 'price_ugx' => 1_891_000, 'price_usd_cents' => 0, 'is_published' => true]);

        $this->postJson('/api/fet/buyers-pack', [
            'name' => 'Grace Fleet', 'email' => 'grace@example.com', 'phone' => '0772123456',
            'fleet_size' => '6-20', 'vehicle' => 'lighttruck',
            'attribution' => ['utm_source' => 'facebook', 'utm_medium' => 'paid_social'],
        ])->assertCreated();

        $e = Enquiry::sole();
        $this->assertSame(['FET', 'grace@example.com', '+256772123456'], [$e->product_category, $e->email, $e->phone]);
        $this->assertSame('6-20', collect($e->requirements)->firstWhere('key', 'fleet_size')['value']);
        $this->assertSame('Light & medium trucks', collect($e->requirements)->firstWhere('key', 'vehicle')['value']);

        Mail::assertSent(FetBuyersPack::class, fn ($m) => $m->hasTo('grace@example.com') && $m->prices[0]['price_ugx'] === 1_891_000);
        Mail::assertSent(NewEnquiry::class);
    }

    public function test_buyers_pack_needs_email_and_fleet_size(): void
    {
        Mail::fake();
        $this->postJson('/api/fet/buyers-pack', ['name' => 'X'])->assertJsonValidationErrors(['email', 'fleet_size']);
        $this->assertSame(0, Enquiry::count());
    }

    public function test_buyers_pack_email_only_lists_catalogue_prices(): void
    {
        $html = (new FetBuyersPack('Grace', []))->render();
        $this->assertStringNotContainsString('Prices, installation included', $html);
        $this->assertStringContainsString('free fuel assessment', $html);
    }

    public function test_spotlight_shows_the_live_one_for_the_page_in_the_visitors_language(): void
    {
        Spotlight::create(['title' => 'Old', 'pages' => ['home'], 'ends_on' => now()->subDay()]);
        Spotlight::create(['title' => 'Future', 'pages' => ['home'], 'starts_on' => now()->addWeek()]);
        Spotlight::create(['title' => 'FET only', 'pages' => ['fet']]);
        Spotlight::create(['title' => 'Assessment week', 'title_sw' => 'Wiki ya tathmini', 'pages' => ['home', 'fet'], 'priority' => 5, 'cta_label' => 'Book', 'cta_url' => '/enquire?sector=FET']);

        $this->getJson('/api/spotlight?page=home')->assertOk()->assertJsonPath('data.title', 'Assessment week');
        $this->getJson('/api/spotlight?page=home&locale=sw')->assertJsonPath('data.title', 'Wiki ya tathmini')->assertJsonPath('data.cta_label', 'Book');
        $this->getJson('/api/spotlight?page=fet')->assertJsonPath('data.title', 'Assessment week');
    }

    public function test_no_spotlight_returns_null(): void
    {
        $this->getJson('/api/spotlight?page=home')->assertOk()->assertJsonPath('data', null);
    }

    public function test_marketing_manages_spotlights_and_links_are_checked(): void
    {
        $mk = User::create(['name' => 'Sarah', 'email' => 's@v.org', 'password' => 'changeme123456', 'role' => 'ops', 'department' => 'marketing']);
        $body = ['title' => 'Fleet assessment drive', 'pages' => ['home'], 'cta_label' => 'Book', 'cta_url' => 'javascript:alert(1)'];

        $this->withHeaders($this->h($mk))->postJson('/api/admin/spotlights', $body)->assertJsonValidationErrors('cta_url');
        $id = $this->withHeaders($this->h($mk))->postJson('/api/admin/spotlights', ['cta_url' => '/enquire?sector=FET'] + $body)->assertCreated()->json('data.id');

        // The public answer updates straight away (cache cleared on save).
        $this->getJson('/api/spotlight?page=home')->assertJsonPath('data.title', 'Fleet assessment drive');
        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->h($mk))->patchJson("/api/admin/spotlights/{$id}", ['is_active' => false] + ['cta_url' => '/enquire?sector=FET'] + $body)->assertOk();
        $this->getJson('/api/spotlight?page=home')->assertJsonPath('data', null);
    }

    public function test_customers_cannot_manage_spotlights(): void
    {
        $c = User::create(['name' => 'C', 'email' => 'c@x.org', 'password' => 'changeme123456', 'role' => 'customer']);
        $this->withHeaders($this->h($c))->getJson('/api/admin/spotlights')->assertForbidden();
    }
}
