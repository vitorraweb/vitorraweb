<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    /** Locales the public site may request a translation for. */
    private const LOCALES = ['en', 'sw'];

    private function locale(Request $request): ?string
    {
        $locale = (string) $request->get('locale', 'en');
        return in_array($locale, self::LOCALES, true) ? $locale : 'en';
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 12), 50);
        $locale  = $this->locale($request);

        $posts = BlogPost::published()
            ->with('author:id,name')
            ->when($locale !== 'en', fn ($q) => $q->with([
                'translations' => fn ($t) => $t->where('locale', $locale),
            ]))
            ->select(['id', 'user_id', 'title', 'slug', 'excerpt', 'cover_image', 'published_at', 'seo_title', 'seo_description'])
            ->latest('published_at')
            ->paginate($perPage);

        // Overlay the requested locale (with English fallback) and keep the list
        // response shape clean (no raw content / translation rows leaking out).
        $posts->getCollection()->transform(function (BlogPost $post) use ($locale) {
            return $post->applyLocale($locale)
                ->makeHidden(['content', 'translations']);
        });

        return response()->json([
            'data' => $posts->items(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'per_page'     => $posts->perPage(),
                'total'        => $posts->total(),
            ],
        ]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $locale = $this->locale($request);

        $post = BlogPost::published()
            ->with('author:id,name')
            ->when($locale !== 'en', fn ($q) => $q->with([
                'translations' => fn ($t) => $t->where('locale', $locale),
            ]))
            ->where('slug', $slug)
            ->firstOrFail();

        // Apply the translation BEFORE rendering, so content_html is built from
        // the localised markdown (still sanitised by the model accessor).
        $post->applyLocale($locale);
        $post->append('content_html');
        $post->makeHidden(['content', 'translations']);

        return response()->json(['data' => $post]);
    }
}
