<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Publishing/editing/deleting a post should ping the frontend to drop its
 * cached copy immediately (see App\Support\FrontendRevalidator), rather than
 * leaving customers looking at a stale page for up to 30 minutes.
 */
class BlogAdminRevalidationTest extends TestCase
{
    use RefreshDatabase;

    private function adminHeaders(): array
    {
        $admin = User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123changeme', 'role' => 'admin']);

        return ['Authorization' => 'Bearer '.$admin->createToken('t', ['admin'])->plainTextToken];
    }

    public function test_publishing_a_post_notifies_the_frontend(): void
    {
        config(['services.frontend.revalidate_url' => 'https://frontend.test/api/revalidate', 'services.frontend.revalidate_secret' => 'sekret']);
        Http::fake();

        $this->withHeaders($this->adminHeaders())->postJson('/api/admin/blog/posts', [
            'title' => 'Hello', 'content' => 'World', 'status' => 'published',
        ])->assertCreated();

        Http::assertSent(function ($request) {
            return $request->url() === 'https://frontend.test/api/revalidate'
                && $request->hasHeader('x-revalidate-secret', 'sekret')
                && in_array('hello', $request['slugs'] ?? [], true);
        });
    }

    public function test_updating_a_post_notifies_the_frontend_of_both_slugs(): void
    {
        config(['services.frontend.revalidate_url' => 'https://frontend.test/api/revalidate', 'services.frontend.revalidate_secret' => 'sekret']);
        $admin = User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123changeme', 'role' => 'admin']);
        $post = BlogPost::create(['user_id' => $admin->id, 'title' => 'Old', 'slug' => 'old-slug', 'content' => 'x', 'status' => 'draft']);
        Http::fake();

        $this->withHeaders(['Authorization' => 'Bearer '.$admin->createToken('t', ['admin'])->plainTextToken])
            ->patchJson("/api/admin/blog/posts/{$post->id}", [
                'title' => 'New Title', 'slug' => 'new-slug', 'content' => 'x', 'status' => 'published',
            ])->assertOk();

        Http::assertSent(function ($request) {
            $slugs = $request['slugs'] ?? [];
            return in_array('old-slug', $slugs, true) && in_array('new-slug', $slugs, true);
        });
    }

    public function test_deleting_a_post_notifies_the_frontend(): void
    {
        config(['services.frontend.revalidate_url' => 'https://frontend.test/api/revalidate', 'services.frontend.revalidate_secret' => 'sekret']);
        $admin = User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123changeme', 'role' => 'admin']);
        $post = BlogPost::create(['user_id' => $admin->id, 'title' => 'Gone', 'slug' => 'gone', 'content' => 'x', 'status' => 'published']);
        Http::fake();

        $this->withHeaders(['Authorization' => 'Bearer '.$admin->createToken('t', ['admin'])->plainTextToken])
            ->deleteJson("/api/admin/blog/posts/{$post->id}")
            ->assertOk();

        Http::assertSent(fn ($request) => in_array('gone', $request['slugs'] ?? [], true));
    }

    public function test_unconfigured_revalidation_does_not_break_publishing(): void
    {
        config(['services.frontend.revalidate_url' => null, 'services.frontend.revalidate_secret' => null]);
        Http::fake(); // if a request WERE sent, this would still let it "succeed" — assert none was sent

        $this->withHeaders($this->adminHeaders())->postJson('/api/admin/blog/posts', [
            'title' => 'Fine Without It', 'content' => 'World', 'status' => 'published',
        ])->assertCreated();

        Http::assertNothingSent();
    }
}
