<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Spotlight;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

/**
 * Spotlights (Marketing → Spotlight): the one current message shown under the
 * homepage and FET page heroes. The public endpoint returns at most one per
 * page — the live one with the highest priority, newest first.
 */
class SpotlightController extends Controller
{
    private const CACHE = 'spotlight.current.';

    /** Public: the spotlight for one page, in the visitor's language. */
    public function current(Request $request): JsonResponse
    {
        $page   = $request->validate(['page' => ['required', Rule::in(Spotlight::PAGES)], 'locale' => ['nullable', 'in:en,sw']]);
        $locale = $page['locale'] ?? 'en';

        $data = Cache::remember(self::CACHE.$page['page'].'.'.$locale, 300, function () use ($page, $locale) {
            $s = Spotlight::live()->whereJsonContains('pages', $page['page'])
                ->orderByDesc('priority')->orderByDesc('starts_on')->orderByDesc('id')->first();
            if (! $s) {
                return null;
            }
            $sw = $locale === 'sw';

            return [
                'eyebrow'   => $s->eyebrow,
                'title'     => ($sw ? $s->title_sw : null) ?: $s->title,
                'body'      => ($sw ? $s->body_sw : null) ?: $s->body,
                'cta_label' => ($sw ? $s->cta_label_sw : null) ?: $s->cta_label,
                'cta_url'   => $s->cta_url,
            ];
        });

        return response()->json(['data' => $data])->header('Cache-Control', 'public, max-age=300');
    }

    public function index(): JsonResponse
    {
        return response()->json(['data' => Spotlight::orderByDesc('is_active')->orderByDesc('starts_on')->orderByDesc('id')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $s = Spotlight::create([...$this->validated($request), 'created_by' => $request->user()->id]);
        Audit::log('spotlight.create', "Created spotlight \"{$s->title}\"", $s);
        $this->forget();

        return response()->json(['data' => $s], 201);
    }

    public function update(Request $request, Spotlight $spotlight): JsonResponse
    {
        $spotlight->update($this->validated($request));
        Audit::log('spotlight.update', "Updated spotlight \"{$spotlight->title}\"", $spotlight);
        $this->forget();

        return response()->json(['data' => $spotlight]);
    }

    public function destroy(Spotlight $spotlight): JsonResponse
    {
        Audit::log('spotlight.delete', "Deleted spotlight \"{$spotlight->title}\"", $spotlight);
        $spotlight->delete();
        $this->forget();

        return response()->json(['message' => 'Spotlight removed.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'eyebrow'      => ['nullable', 'string', 'max:60'],
            'title'        => ['required', 'string', 'max:140'],
            'body'         => ['nullable', 'string', 'max:280'],
            'title_sw'     => ['nullable', 'string', 'max:140'],
            'body_sw'      => ['nullable', 'string', 'max:280'],
            'cta_label'    => ['nullable', 'required_with:cta_url', 'string', 'max:40'],
            'cta_label_sw' => ['nullable', 'string', 'max:40'],
            // Our own pages ("/enquire?sector=FET") or a full https link.
            'cta_url'      => ['nullable', 'string', 'max:500', 'regex:#^(/[^/\\\\]|https://)#'],
            'pages'        => ['required', 'array', 'min:1'],
            'pages.*'      => [Rule::in(Spotlight::PAGES)],
            'starts_on'    => ['nullable', 'date'],
            'ends_on'      => ['nullable', 'date', 'after_or_equal:starts_on'],
            'is_active'    => ['boolean'],
            'priority'     => ['nullable', 'integer', 'between:0,100'],
        ], ['cta_url.regex' => 'Use a page on our site (starting with /) or a full https:// link.']);
    }

    private function forget(): void
    {
        foreach (Spotlight::PAGES as $p) {
            foreach (['en', 'sw'] as $l) {
                Cache::forget(self::CACHE.$p.'.'.$l);
            }
        }
    }
}
