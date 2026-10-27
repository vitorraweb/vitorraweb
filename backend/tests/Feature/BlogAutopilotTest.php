<?php

namespace Tests\Feature;

use App\Mail\BlogDraftReady;
use App\Models\BlogPost;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * blog:draft researches the week's news and saves a DRAFT for review; only a
 * person pressing Publish (signed email link, POST) puts it on the site.
 */
class BlogAutopilotTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Off by default in production (no AI spend yet); these tests cover it switched on.
        config(['blog_autopilot.enabled' => true]);
    }

    private function fakeClaude(array $sourceUrls = ['https://www.monitor.co.ug/fuel-prices']): void
    {
        $research = [
            'stop_reason' => 'end_turn',
            'content' => [
                ['type' => 'server_tool_use', 'id' => 's1', 'name' => 'web_search', 'input' => ['query' => 'Uganda diesel prices']],
                ['type' => 'web_search_tool_result', 'tool_use_id' => 's1', 'content' => [
                    ['type' => 'web_search_result', 'url' => 'https://www.monitor.co.ug/fuel-prices', 'title' => 'Pump prices rise'],
                    ['type' => 'web_search_result', 'url' => 'https://www.newvision.co.ug/diesel', 'title' => 'Diesel outlook'],
                ]],
                ['type' => 'text', 'text' => 'Diesel rose to UGX 5,200 a litre in Kampala this month.', 'citations' => [
                    ['type' => 'web_search_result_location', 'url' => 'https://www.monitor.co.ug/fuel-prices', 'title' => 'Pump prices rise', 'cited_text' => '...'],
                ]],
            ],
        ];

        $article = [
            'stop_reason' => 'end_turn',
            'content' => [['type' => 'text', 'text' => json_encode([
                'title'           => 'Diesel at UGX 5,200: what it means for your fleet',
                'excerpt'         => 'Pump prices rose again this month.',
                'seo_title'       => 'Uganda diesel prices October 2026',
                'seo_description' => 'What the latest diesel price rise means for Ugandan fleets.',
                'content'         => "## What happened\n\nDiesel rose to UGX 5,200.",
                'source_urls'     => array_merge($sourceUrls, ['https://invented.example/not-searched']),
            ])]],
        ];

        Http::fake(['api.anthropic.com/*' => Http::sequence()->push($research)->push($article)]);
    }

    public function test_draft_is_saved_unpublished_and_reviewers_are_emailed(): void
    {
        config(['services.anthropic.key' => 'test-key']);
        Setting::put(['blog_review_to' => 'marketing@vitorra.org, thurayya@vitorra.org']);
        Mail::fake();
        $this->fakeClaude();

        $this->artisan('blog:draft', ['--topic' => 'fet'])->assertSuccessful();

        $post = BlogPost::sole();
        $this->assertSame('draft', $post->status);
        $this->assertNull($post->published_at);
        $this->assertSame('auto', $post->origin);
        $this->assertSame('fet', $post->topic);
        $this->assertSame('diesel-at-ugx-5200-what-it-means-for-your-fleet', $post->slug);
        $this->assertStringContainsString('[Pump prices rise](https://www.monitor.co.ug/fuel-prices)', $post->content);
        // A URL the writer named but research never read is not listed as a source.
        $this->assertStringNotContainsString('invented.example', $post->content);
        $this->assertCount(0, BlogPost::published()->get());

        Mail::assertSent(BlogDraftReady::class, fn ($m) => $m->hasTo('marketing@vitorra.org') && $m->hasTo('thurayya@vitorra.org'));

        // The research call used web search; the writing call asked for structured JSON.
        $requests = Http::recorded();
        $this->assertSame('web_search_20260209', $requests[0][0]['tools'][0]['type']);
        $this->assertSame('claude-opus-5-5', $requests[0][0]['model']);
        $this->assertSame('json_schema', $requests[1][0]['output_config']['format']['type']);
    }

    public function test_rotation_favours_fet(): void
    {
        config(['services.anthropic.key' => 'test-key']);
        Mail::fake();
        BlogPost::create(['title' => 'x', 'slug' => 'x', 'content' => 'x', 'status' => 'draft', 'origin' => 'auto', 'topic' => 'fet']);
        $this->fakeClaude();

        $this->artisan('blog:draft')->assertSuccessful();

        // Second auto draft → rotation[1] = coffee.
        $this->assertSame('coffee', BlogPost::latest('id')->first()->topic);
    }

    public function test_without_an_api_key_it_does_nothing(): void
    {
        config(['services.anthropic.key' => null]);
        Http::fake();

        $this->artisan('blog:draft')->assertSuccessful();

        $this->assertSame(0, BlogPost::count());
        Http::assertNothingSent();
    }

    public function test_a_failed_api_call_saves_nothing(): void
    {
        config(['services.anthropic.key' => 'test-key']);
        Mail::fake();
        Http::fake(['api.anthropic.com/*' => Http::response(['error' => 'overloaded'], 529)]);

        $this->artisan('blog:draft', ['--topic' => 'coffee'])->assertFailed();

        $this->assertSame(0, BlogPost::count());
        Mail::assertNothingSent();
    }

    public function test_it_is_off_by_default(): void
    {
        config(['blog_autopilot.enabled' => false, 'services.anthropic.key' => 'test-key']);
        Http::fake();

        $this->artisan('blog:draft')->assertSuccessful();

        Http::assertNothingSent();
        $this->assertSame(0, BlogPost::count());
    }

    private function staffHeaders(): array
    {
        $u = \App\Models\User::create(['name' => 'Sarah N', 'email' => 'sarah-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin'])->plainTextToken];
    }

    public function test_a_hand_written_draft_can_be_sent_for_review(): void
    {
        Mail::fake();
        Setting::put(['blog_review_to' => 'marketing@vitorra.org']);
        $post = BlogPost::create(['title' => 'Our take', 'slug' => 'our-take', 'content' => 'Body', 'status' => 'draft']);

        $this->withHeaders($this->staffHeaders())
            ->postJson("/api/admin/blog/posts/{$post->id}/request-review")
            ->assertOk()->assertJsonPath('to', ['marketing@vitorra.org']);

        Mail::assertSent(BlogDraftReady::class, fn ($m) => $m->hasTo('marketing@vitorra.org') && $m->sender?->name === 'Sarah N');
        $this->assertSame('draft', $post->fresh()->status);
    }

    public function test_review_goes_to_the_support_inbox_by_default(): void
    {
        Mail::fake();
        $post = BlogPost::create(['title' => 'Our take', 'slug' => 'our-take-2', 'content' => 'Body', 'status' => 'draft']);

        $this->withHeaders($this->staffHeaders())
            ->postJson("/api/admin/blog/posts/{$post->id}/request-review")
            ->assertOk()->assertJsonPath('to', ['support@vitorra.org']);

        // A blank setting (e.g. the field cleared and saved) still reaches Marketing.
        Setting::put(['blog_review_to' => '']);
        $this->withHeaders($this->staffHeaders())
            ->postJson("/api/admin/blog/posts/{$post->id}/request-review")
            ->assertOk()->assertJsonPath('to', ['support@vitorra.org']);
    }

    public function test_a_published_post_cannot_be_sent_for_review(): void
    {
        Mail::fake();
        $post = BlogPost::create(['title' => 'Live', 'slug' => 'live', 'content' => 'Body', 'status' => 'published', 'published_at' => now()]);

        $this->withHeaders($this->staffHeaders())
            ->postJson("/api/admin/blog/posts/{$post->id}/request-review")
            ->assertStatus(422);

        Mail::assertNothingSent();
    }

    public function test_review_link_shows_the_draft_without_publishing_it(): void
    {
        $post = BlogPost::create(['title' => 'Draft title', 'slug' => 'draft-title', 'content' => "## Hi\n\nBody", 'status' => 'draft', 'origin' => 'auto', 'topic' => 'fet']);
        $url = URL::temporarySignedRoute('blog.review', now()->addDay(), ['post' => $post->id]);

        $this->get($url)->assertOk()->assertSee('Draft title')->assertSee('Publish now');

        $this->assertSame('draft', $post->fresh()->status);
    }

    public function test_pressing_publish_puts_it_live(): void
    {
        Http::fake();
        $post = BlogPost::create(['title' => 'Draft title', 'slug' => 'draft-title', 'content' => 'Body', 'status' => 'draft', 'origin' => 'auto', 'topic' => 'fet']);
        $url = URL::temporarySignedRoute('blog.review', now()->addDay(), ['post' => $post->id]);

        $this->post($url)->assertOk()->assertSee('Published');

        $post->refresh();
        $this->assertSame('published', $post->status);
        $this->assertNotNull($post->published_at);
        $this->assertCount(1, BlogPost::published()->get());
    }

    public function test_unsigned_or_expired_links_are_refused(): void
    {
        $post = BlogPost::create(['title' => 'T', 'slug' => 't', 'content' => 'B', 'status' => 'draft']);

        $this->post("/api/blog/review/{$post->id}")->assertForbidden();

        $expired = URL::temporarySignedRoute('blog.review', now()->subMinute(), ['post' => $post->id]);
        $this->post($expired)->assertForbidden();

        $this->assertSame('draft', $post->fresh()->status);
    }
}
