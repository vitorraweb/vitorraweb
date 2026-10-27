<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class IndexNowTest extends TestCase
{
    use RefreshDatabase;

    private function draft(): BlogPost
    {
        return BlogPost::create(['title' => 'Diesel prices', 'slug' => 'diesel-prices', 'content' => 'Body', 'status' => 'draft']);
    }

    public function test_publishing_a_post_pings_indexnow(): void
    {
        config(['services.indexnow.enabled' => true]);
        Http::fake();

        $this->draft()->update(['status' => 'published', 'published_at' => now()]);

        Http::assertSent(fn ($r) => $r->url() === 'https://api.indexnow.org/indexnow'
            && $r['host'] === 'vitorra.org'
            && in_array('https://vitorra.org/blog/diesel-prices', $r['urlList'], true));
    }

    public function test_drafts_and_disabled_config_send_nothing(): void
    {
        Http::fake();
        config(['services.indexnow.enabled' => true]);
        $this->draft()->update(['title' => 'Edited draft']);

        config(['services.indexnow.enabled' => false]);
        BlogPost::create(['title' => 'Live', 'slug' => 'live', 'content' => 'Body', 'status' => 'published', 'published_at' => now()]);

        Http::assertNothingSent();
    }
}
