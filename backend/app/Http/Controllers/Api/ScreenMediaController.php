<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScreenMedia;
use App\Models\Setting;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The console's Screen editor, running order: Vitorra's own videos and designs,
 * and which scenes play in what order. Changes reach running screens within a
 * minute through GET /display.
 */
class ScreenMediaController extends Controller
{
    public const URL = '#^https://[a-z0-9]+\.public\.blob\.vercel-storage\.com/screen-media/[A-Za-z0-9._\-/%]+\.(mp4|png|jpe?g|webp)$#';

    public function index(): JsonResponse
    {
        return response()->json(['data' => [
            'media' => ScreenMedia::orderBy('id')->get(),
            'programme' => $this->programme(),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, true);
        $media = ScreenMedia::create($data + ['created_by' => $request->user()->id]);
        // New items join the end of the running order.
        $p = $this->programme();
        if ($p['order']) {
            $p['order'][] = "media-{$media->id}";
            Setting::put(['display_programme' => $p]);
        }
        Audit::log('display.media_added', "Added {$media->kind} \"{$media->title}\" to the screens");

        return response()->json(['data' => $media], 201);
    }

    public function update(Request $request, ScreenMedia $media): JsonResponse
    {
        $media->update($this->validated($request, false));
        Audit::log('display.media_changed', "Changed \"{$media->title}\" on the screens");

        return response()->json(['data' => $media]);
    }

    public function destroy(ScreenMedia $media): JsonResponse
    {
        $id = "media-{$media->id}";
        $title = $media->title;
        $media->delete();
        $p = $this->programme();
        Setting::put(['display_programme' => ['order' => array_values(array_diff($p['order'], [$id])), 'hidden' => array_values(array_diff($p['hidden'], [$id]))]]);
        Audit::log('display.media_removed', "Removed \"{$title}\" from the screens");

        return response()->json(['ok' => true]);
    }

    /** The running order and what is switched off, as scene ids. */
    public function programmeUpdate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order' => ['present', 'array', 'max:100'], 'order.*' => ['string', 'regex:/^[a-z0-9-]{1,40}$/'],
            'hidden' => ['present', 'array', 'max:100'], 'hidden.*' => ['string', 'regex:/^[a-z0-9-]{1,40}$/'],
        ]);
        Setting::put(['display_programme' => ['order' => array_values(array_unique($data['order'])), 'hidden' => array_values(array_unique($data['hidden']))]]);
        Audit::log('display.programme', 'Changed the screens\' running order ('.count($data['hidden']).' switched off)');

        return response()->json(['data' => $this->programme()]);
    }

    /** @return array{order: string[], hidden: string[]} */
    public static function programme(): array
    {
        $p = Setting::get('display_programme', []);

        return ['order' => is_array($p['order'] ?? null) ? $p['order'] : [], 'hidden' => is_array($p['hidden'] ?? null) ? $p['hidden'] : []];
    }

    private function validated(Request $request, bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'kind'      => [$req, Rule::in(['video', 'image'])],
            'url'       => [$req, 'string', 'max:500', 'regex:'.self::URL],
            'title'     => [$req, 'string', 'max:120'],
            'line1'     => ['nullable', 'string', 'max:200', 'regex:/^[^<>{}]*$/'],
            'line2'     => ['nullable', 'string', 'max:200', 'regex:/^[^<>{}]*$/'],
            'seconds'   => [$req, 'integer', 'min:4', 'max:60'],
            'screens'   => [$req, 'array', 'min:1'],
            'screens.*' => [Rule::in(ScreenMedia::SCREENS)],
            'starts_on' => ['nullable', 'date_format:Y-m-d'],
            'ends_on'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:starts_on'],
            'width'     => ['nullable', 'integer', 'min:1'],
            'height'    => ['nullable', 'integer', 'min:1'],
        ]);
    }
}
