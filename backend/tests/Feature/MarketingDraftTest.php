<?php

namespace Tests\Feature;

use App\Console\Commands\BlogDraftsToken;
use App\Models\ProspectCampaign;
use App\Models\Spotlight;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketingDraftTest extends TestCase
{
    use RefreshDatabase;

    private function key(array $abilities = [BlogDraftsToken::ABILITY]): array
    {
        $u = User::create(['name' => 'Claude drafts', 'email' => 'drafts-'.uniqid().'@v.org', 'password' => 'x-'.uniqid(), 'role' => 'ops']);

        return ['Authorization' => 'Bearer '.$u->createToken('k', $abilities)->plainTextToken];
    }

    public function test_the_drafts_key_creates_a_spotlight_that_stays_off(): void
    {
        $this->postJson('/api/drafts/spotlight', ['title' => 'Diesel is over Shs 7,000', 'pages' => ['home', 'fet'], 'cta_label' => 'Book', 'cta_url' => '/enquire?sector=FET', 'is_active' => true, 'priority' => 99], $this->key())->assertCreated();
        $s = Spotlight::first();
        $this->assertFalse($s->is_active);
        $this->assertSame(0, $s->priority);
        $this->getJson('/api/spotlight?page=home')->assertJsonPath('data', null);
    }

    public function test_the_drafts_key_creates_an_unsent_campaign_with_no_audience(): void
    {
        $this->postJson('/api/drafts/campaign', [
            'name' => 'FET: schools', 'subject' => '{name}: a free fuel check', 'product' => 'FET',
            'paragraphs' => ['Dear {name},', 'Term closes on <b>4 December</b>.'], 'button_label' => 'Book', 'button_url' => '/enquire?sector=FET',
            'status' => 'sending', 'market_ids' => [1],
        ], $this->key())->assertCreated();
        $c = ProspectCampaign::first();
        $this->assertSame('draft', $c->status);
        $this->assertNull($c->market_ids);
        $this->assertStringNotContainsString('<b>', json_encode($c->design));
    }

    public function test_other_keys_cannot_create_drafts(): void
    {
        $this->postJson('/api/drafts/spotlight', ['title' => 'x', 'pages' => ['home']], $this->key(['staff']))->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();
        $this->postJson('/api/drafts/campaign', ['name' => 'x', 'subject' => 'x', 'paragraphs' => ['x']])->assertUnauthorized();
    }

    public function test_a_draft_can_carry_our_own_photos_and_replace_this_keys_old_drafts(): void
    {
        $h = $this->key();
        $old = $this->postJson('/api/drafts/campaign', ['name' => 'v1', 'subject' => 's', 'paragraphs' => ['x']], $h)->json('data.id');
        $mine = ProspectCampaign::create(['name' => 'staff draft', 'subject' => 's', 'body' => '', 'status' => 'draft', 'created_by' => \App\Models\User::create(['name' => 'S', 'email' => 's-'.uniqid().'@v.org', 'password' => 'x-'.uniqid(), 'role' => 'ops'])->id]);

        $this->postJson('/api/drafts/campaign', ['name' => 'v2', 'subject' => 's', 'replaces' => [$old, $mine->id], 'sections' => [
            ['type' => 'text', 'text' => "Dear {name},\n\nHello."],
            ['type' => 'photo_text', 'src' => '/marketing/fet-kampala/fitted.jpg', 'alt' => 'Fitted', 'text' => 'In Kampala.'],
            ['type' => 'image', 'src' => '/marketing/fet-kampala/in-hand.jpg', 'alt' => 'In hand'],
        ]], $h)->assertCreated();
        $this->postJson('/api/drafts/campaign', ['name' => 'v3', 'subject' => 's', 'sections' => [['type' => 'image', 'src' => 'https://evil.test/x.jpg']]], $h)->assertUnprocessable();

        $this->assertNull(ProspectCampaign::find($old));          // its own old draft, replaced
        $this->assertNotNull(ProspectCampaign::find($mine->id));  // a person's draft, never touched
        $design = json_encode(ProspectCampaign::where('name', 'v2')->first()->design);
        $this->assertStringContainsString('fet-kampala\\/fitted.jpg', $design);

        $this->postJson('/api/drafts/campaign', ['name' => 'v4', 'subject' => 's', 'button_label' => 'Book', 'button_url' => '/enquire', 'sections' => [
            ['type' => 'text', 'text' => 'Hi'], ['type' => 'button'], ['type' => 'text', 'text' => 'Kind regards'],
        ]], $h)->assertCreated();
        $types = array_column(ProspectCampaign::where('name', 'v4')->first()->design['blocks'], 'type');
        $this->assertSame(['logo', 'divider', 'text', 'button', 'text', 'spacer'], $types);
    }
}
