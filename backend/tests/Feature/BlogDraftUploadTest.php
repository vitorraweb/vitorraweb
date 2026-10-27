<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * scripts/push_blog_draft.py → POST /api/blog/drafts. The key from
 * blog:drafts-token can create or refresh drafts (with images) and nothing else.
 */
class BlogDraftUploadTest extends TestCase
{
    use RefreshDatabase;

    private function key(): string
    {
        Artisan::call('blog:drafts-token');
        preg_match('/^\d+\|\S+$/m', Artisan::output(), $m);

        return $m[0];
    }

    private function article(array $over = []): array
    {
        return $over + [
            'title'       => 'Diesel near Shs7,000',
            'slug'        => 'diesel-near-7000',
            'excerpt'     => 'Why prices rose.',
            'content'     => "Intro.\n\n![Chart](diesel-price.png)\n\n## More\n\nText.",
            'cover_image' => '/products/fet/field-truck.jpg',
            'topic'       => 'fet',
        ];
    }

    public function test_the_key_creates_a_draft_with_its_images(): void
    {
        Storage::fake('public');
        $key = $this->key();

        $res = $this->withHeaders(['Authorization' => "Bearer {$key}"])->post('/api/blog/drafts', $this->article() + [
            'images' => [UploadedFile::fake()->image('diesel-price.png', 1600, 700)],
        ], ['Accept' => 'application/json'])->assertCreated();

        $post = BlogPost::sole();
        $this->assertSame('draft', $post->status);
        $this->assertSame('claude', $post->origin);
        $this->assertSame('fet', $post->topic);
        $this->assertStringEndsWith("/admin/blog/{$post->id}/edit", $res->json('data.edit_url'));

        $media = Media::sole();
        $this->assertSame('diesel-price.png', $media->original_name);
        Storage::disk('public')->assertExists($media->path);
        $this->assertStringContainsString("![Chart]({$media->url})", $post->content);
        $this->assertStringNotContainsString('](diesel-price.png)', $post->content);
    }

    public function test_sending_again_refreshes_the_same_draft(): void
    {
        $key = $this->key();
        $h = ['Authorization' => "Bearer {$key}", 'Accept' => 'application/json'];

        $this->withHeaders($h)->post('/api/blog/drafts', $this->article())->assertCreated();
        $this->withHeaders($h)->post('/api/blog/drafts', $this->article(['title' => 'Diesel near Shs7,000 (v2)']))
            ->assertOk()->assertJsonPath('data.updated', true);

        $this->assertSame('Diesel near Shs7,000 (v2)', BlogPost::sole()->title);
    }

    public function test_it_never_overwrites_a_published_or_hand_written_post(): void
    {
        $key = $this->key();
        BlogPost::create(['title' => 'Live', 'slug' => 'diesel-near-7000', 'content' => 'Original', 'status' => 'published', 'published_at' => now()]);

        $this->withHeaders(['Authorization' => "Bearer {$key}", 'Accept' => 'application/json'])
            ->post('/api/blog/drafts', $this->article())->assertStatus(409);

        $this->assertSame('Original', BlogPost::sole()->content);
    }

    public function test_the_key_cannot_publish_or_open_the_admin(): void
    {
        $key = $this->key();
        $h = ['Authorization' => "Bearer {$key}", 'Accept' => 'application/json'];

        $this->withHeaders($h)->post('/api/blog/drafts', $this->article(['status' => 'published']))->assertCreated();
        $this->assertSame('draft', BlogPost::sole()->status);

        $this->withHeaders($h)->getJson('/api/admin/blog/posts')->assertForbidden();
        $this->withHeaders($h)->getJson('/api/admin/settings')->assertForbidden();
    }

    public function test_other_tokens_and_svg_images_are_refused(): void
    {
        $staff = User::create(['name' => 'S', 'email' => 's@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);
        $this->withHeaders(['Authorization' => 'Bearer '.$staff->createToken('t', ['admin'])->plainTextToken, 'Accept' => 'application/json'])
            ->post('/api/blog/drafts', $this->article())->assertForbidden();
        $this->app['auth']->forgetGuards();

        $this->withHeaders(['Authorization' => "Bearer {$this->key()}", 'Accept' => 'application/json'])
            ->post('/api/blog/drafts', $this->article() + ['images' => [UploadedFile::fake()->create('x.svg', 2, 'image/svg+xml')]])
            ->assertUnprocessable();

        $this->assertSame(0, BlogPost::count());
    }

    public function test_a_new_key_replaces_the_old_one_and_the_account_cannot_sign_in(): void
    {
        $old = $this->key();
        $this->key();
        $this->withHeaders(['Authorization' => "Bearer {$old}", 'Accept' => 'application/json'])
            ->post('/api/blog/drafts', $this->article())->assertUnauthorized();

        $this->assertSame('left', User::where('email', 'blog-drafts@vitorra.org')->value('staff_status'));
    }
}
