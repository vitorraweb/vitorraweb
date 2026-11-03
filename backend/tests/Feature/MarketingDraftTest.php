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
}
