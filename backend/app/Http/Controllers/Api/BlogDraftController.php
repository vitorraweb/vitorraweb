<?php

namespace App\Http\Controllers\Api;

use App\Console\Commands\BlogDraftsToken;
use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Drafts written with Claude in a session (the /blog-post routine) arrive here
 * from scripts/push_blog_draft.py, so nobody has to copy fields by hand.
 *
 * Images (charts, photos) come in the same request as `images[]`. Each is
 * saved to the media library and every reference to its file name in the
 * content or cover — `![Chart](diesel-price.png)` — is swapped for its URL.
 * PNG/JPEG/WebP only: no SVG, so nothing scriptable reaches the public site.
 *
 * Only a token issued by `blog:drafts-token` (ability "blog-drafts", never the
 * legacy "*") gets in, and all it can do is create or refresh a DRAFT. A
 * person still reviews it in the console and sends it to Marketing.
 */
class BlogDraftController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();
        if (! $token || ! in_array(BlogDraftsToken::ABILITY, (array) ($token->abilities ?? []), true)) {
            return response()->json(['message' => 'This key cannot create blog drafts.'], 403);
        }

        $data = $request->validate([
            'title'           => ['required', 'string', 'max:255'],
            'slug'            => ['nullable', 'string', 'max:255'],
            'excerpt'         => ['nullable', 'string', 'max:500'],
            'content'         => ['required', 'string'],
            'cover_image'     => ['nullable', 'string', 'max:1000'],
            'seo_title'       => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],
            'topic'           => ['nullable', 'string', 'max:40'],
            'images'          => ['nullable', 'array', 'max:8'],
            'images.*'        => ['file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);
        unset($data['images']);

        $slug = Str::slug($data['slug'] ?? '' ?: $data['title']) ?: 'post';
        $existing = BlogPost::where('slug', $slug)->first();

        // Re-sending the same article refreshes its draft; it never touches
        // a published post or a draft somebody wrote in the console.
        if ($existing && ($existing->status !== 'draft' || $existing->origin !== 'claude')) {
            return response()->json(['message' => "A post with the address \"{$slug}\" already exists. Change the slug and send again."], 409);
        }

        foreach ($request->file('images', []) as $file) {
            $original = $file->getClientOriginalName();
            $name = Str::random(24).'.'.strtolower($file->getClientOriginalExtension() ?: $file->extension());
            $path = $file->storeAs('media', $name, 'public');
            $url = Storage::disk('public')->url($path);

            Media::create([
                'filename'      => $name,
                'original_name' => $original,
                'path'          => $path,
                'url'           => $url,
                'type'          => 'image',
                'mime'          => $file->getMimeType() ?? '',
                'size'          => $file->getSize(),
                'uploaded_by'   => $request->user()->name,
            ]);

            $data['content'] = str_replace("]({$original})", "]({$url})", $data['content']);
            if (($data['cover_image'] ?? null) === $original) {
                $data['cover_image'] = $url;
            }
        }

        $fields = ['slug' => $slug, 'status' => 'draft', 'origin' => 'claude'] + $data;

        $post = $existing
            ? tap($existing)->update($fields)
            : BlogPost::create($fields + ['user_id' => $request->user()->id]);

        return response()->json([
            'data' => [
                'id'       => $post->id,
                'slug'     => $post->slug,
                'updated'  => (bool) $existing,
                'edit_url' => rtrim((string) config('services.frontend.url'), '/').'/admin/blog/'.$post->id.'/edit',
            ],
        ], $existing ? 200 : 201);
    }
}
