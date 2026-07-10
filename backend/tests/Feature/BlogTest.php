<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlogTest extends TestCase
{
    use RefreshDatabase;

    private function author(): User
    {
        return User::create(['name' => 'Vitorra Team', 'email' => 'team-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);
    }

    private function makePost(array $extra = []): BlogPost
    {
        return BlogPost::create(array_merge([
            'user_id'      => $this->author()->id,
            'title'        => 'A Published Post',
            'slug'         => 'a-published-post-'.uniqid(),
            'excerpt'      => 'An excerpt.',
            'content'      => 'Hello world.',
            'status'       => 'published',
            'published_at' => now(),
        ], $extra));
    }

    /**
     * Regression: the public API used to eager-load `author` as the raw
     * {id, name} relation object. The public site renders it directly as
     * text (unlike /admin, which correctly expects the object) — an object
     * child crashes React with an uncaught render error, which is exactly
     * what surfaced as the generic "Something went wrong" page the moment a
     * real post existed to render.
     */
    public function test_list_returns_author_as_a_plain_string(): void
    {
        $post = $this->makePost();

        $res = $this->getJson('/api/blog/posts')->assertOk();

        $entry = collect($res->json('data'))->firstWhere('slug', $post->slug);
        $this->assertIsString($entry['author']);
        $this->assertSame('Vitorra Team', $entry['author']);
    }

    public function test_show_returns_author_as_a_plain_string(): void
    {
        $post = $this->makePost();

        $res = $this->getJson("/api/blog/posts/{$post->slug}")->assertOk();

        $this->assertIsString($res->json('data.author'));
        $this->assertSame('Vitorra Team', $res->json('data.author'));
    }

    public function test_list_only_shows_published_posts(): void
    {
        $this->makePost(['status' => 'draft', 'published_at' => null, 'slug' => 'a-draft-'.uniqid()]);
        $published = $this->makePost();

        $res = $this->getJson('/api/blog/posts')->assertOk();

        $slugs = collect($res->json('data'))->pluck('slug');
        $this->assertTrue($slugs->contains($published->slug));
        $this->assertSame(1, $slugs->count());
    }

    public function test_show_404s_for_unknown_slug(): void
    {
        $this->getJson('/api/blog/posts/does-not-exist')->assertNotFound();
    }

    public function test_show_never_leaks_raw_content_or_translations(): void
    {
        $post = $this->makePost();

        $res = $this->getJson("/api/blog/posts/{$post->slug}")->assertOk();

        $this->assertArrayNotHasKey('content', $res->json('data'));
        $this->assertArrayNotHasKey('translations', $res->json('data'));
        $this->assertStringContainsString('Hello world', $res->json('data.content_html'));
    }
}
