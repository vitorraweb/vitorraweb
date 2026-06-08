<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BlogAdminController extends Controller
{
    /** All posts (drafts + published), newest first, filterable by status. */
    public function index(Request $request): JsonResponse
    {
        $query = BlogPost::with('author:id,name')
            ->select(['id', 'user_id', 'title', 'slug', 'excerpt', 'status', 'published_at', 'updated_at'])
            ->latest('updated_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(20));
    }

    /** Single post with raw markdown content + translations, for the editor. */
    public function show(BlogPost $post): JsonResponse
    {
        $post->load('author:id,name', 'translations');
        return response()->json(['data' => $post]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        $data['user_id'] = $request->user()->id;
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? '' ?: $data['title']);
        $data = $this->applyPublish($data, null);

        $post = BlogPost::create($data);
        $this->syncTranslations($post, $translations);

        return response()->json(['data' => $post->load('translations')], 201);
    }

    public function update(Request $request, BlogPost $post): JsonResponse
    {
        $data = $this->validateData($request);
        $translations = $data['translations'] ?? null;
        unset($data['translations']);

        if (! empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $post->id);
        } else {
            unset($data['slug']); // don't blank an existing slug
        }

        $data = $this->applyPublish($data, $post);
        $post->update($data);

        if ($translations !== null) {
            $this->syncTranslations($post, $translations);
        }

        return response()->json(['data' => $post->fresh()->load('translations')]);
    }

    public function destroy(BlogPost $post): JsonResponse
    {
        $post->delete();
        return response()->json(['message' => 'Post deleted.']);
    }

    /* ── Helpers ──────────────────────────────────────────────────────────── */

    /** Locales (beyond the default English base) that can be authored. */
    private const TRANSLATABLE_LOCALES = ['sw'];

    private function validateData(Request $request): array
    {
        return $request->validate([
            'title'           => ['required', 'string', 'max:255'],
            'slug'            => ['nullable', 'string', 'max:255'],
            'excerpt'         => ['nullable', 'string', 'max:500'],
            'content'         => ['required', 'string'],          // markdown
            'cover_image'     => ['nullable', 'string', 'max:1000'],
            'status'          => ['required', Rule::in(['draft', 'published'])],
            'seo_title'       => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],

            // Optional per-locale translations, e.g. translations.sw.{title,…}
            'translations'                       => ['nullable', 'array'],
            'translations.*.title'               => ['nullable', 'string', 'max:255'],
            'translations.*.excerpt'             => ['nullable', 'string', 'max:500'],
            'translations.*.content'             => ['nullable', 'string'],
            'translations.*.seo_title'           => ['nullable', 'string', 'max:255'],
            'translations.*.seo_description'     => ['nullable', 'string', 'max:500'],
        ]);
    }

    /**
     * Upsert (or clear) a post's translations. An all-blank locale removes its
     * row, so clearing the Swahili fields in the editor deletes the translation.
     */
    private function syncTranslations(BlogPost $post, array $translations): void
    {
        foreach (self::TRANSLATABLE_LOCALES as $locale) {
            $fields = $translations[$locale] ?? [];
            $clean = array_filter([
                'title'           => $fields['title'] ?? null,
                'excerpt'         => $fields['excerpt'] ?? null,
                'content'         => $fields['content'] ?? null,
                'seo_title'       => $fields['seo_title'] ?? null,
                'seo_description' => $fields['seo_description'] ?? null,
            ], fn ($v) => filled($v));

            if (empty($clean)) {
                $post->translations()->where('locale', $locale)->delete();
            } else {
                $post->translations()->updateOrCreate(['locale' => $locale], $clean);
            }
        }
    }

    /** Slugify and guarantee uniqueness (appending -2, -3, … as needed). */
    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'post';
        $original = $slug;
        $i = 2;
        while (
            BlogPost::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$original}-{$i}";
            $i++;
        }
        return $slug;
    }

    /** Stamp published_at the first time a post is published; clear when reverted to draft. */
    private function applyPublish(array $data, ?BlogPost $post): array
    {
        if (($data['status'] ?? null) === 'published') {
            if (! ($post && $post->published_at)) {
                $data['published_at'] = now();
            }
        } elseif (($data['status'] ?? null) === 'draft') {
            $data['published_at'] = null;
        }
        return $data;
    }
}
