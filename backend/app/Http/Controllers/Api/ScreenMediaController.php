<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScreenMedia;
use App\Models\Setting;
use App\Support\Audit;
use App\Support\ScreenSchedule;
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
            'programme' => self::programmeForScreen(),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, true);
        $media = ScreenMedia::create($data + ['created_by' => $request->user()->id]);
        // New items join the end of the running order.
        $p = self::programme();
        if ($p['order']) {
            self::save([...$p['order'], "media-{$media->id}"], $p['hidden'], $p['schedule']);
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
        $p = self::programme();
        self::save(array_values(array_diff($p['order'], [$id])), array_values(array_diff($p['hidden'], [$id])), $p['schedule']);
        Audit::log('display.media_removed', "Removed \"{$title}\" from the screens");

        return response()->json(['ok' => true]);
    }

    /**
     * The running order, what is switched off, and when built-in scenes may show
     * (`schedule`, by scene id). A request without `schedule` keeps the saved one,
     * so moving an item never clears another's dates.
     */
    public function programmeUpdate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order' => ['present', 'array', 'max:100'], 'order.*' => ['string', 'regex:/^[a-z0-9-]{1,40}$/'],
            'hidden' => ['present', 'array', 'max:100'], 'hidden.*' => ['string', 'regex:/^[a-z0-9-]{1,40}$/'],
            'schedule' => ['sometimes', 'array', 'max:100'],
            ...ScreenSchedule::rules('schedule.*.'),
        ]);

        $before = self::programme();
        $schedule = $before['schedule'];
        if (array_key_exists('schedule', $data)) {
            $schedule = [];
            foreach ($data['schedule'] as $id => $s) {
                abort_unless(is_string($id) && preg_match('/^[a-z0-9-]{1,40}$/', $id) && is_array($s), 422, 'Unknown scene.');
                // Vitorra's own videos and designs keep their dates and hours on the item itself.
                abort_if(str_starts_with($id, 'media-'), 422, 'Set an added item\'s dates and hours on the item.');
                if ($clean = ScreenSchedule::clean($s)) {
                    $schedule[$id] = $clean;
                }
            }
            ksort($schedule); // the validator reorders nested keys; keep it stable
        }

        self::save(array_values(array_unique($data['order'])), array_values(array_unique($data['hidden'])), $schedule);
        Audit::log('display.programme', 'Changed the screens\' running order ('.count($data['hidden']).' switched off'
            .($schedule !== $before['schedule'] ? '; '.count($schedule).' built-in scene(s) on a schedule' : '').')');

        return response()->json(['data' => self::programmeForScreen()]);
    }

    /** @return array{order: string[], hidden: string[], schedule: array<string, array>} */
    public static function programme(): array
    {
        $p = Setting::get('display_programme', []);
        $p = is_array($p) ? $p : [];

        return [
            'order' => is_array($p['order'] ?? null) ? $p['order'] : [],
            'hidden' => is_array($p['hidden'] ?? null) ? $p['hidden'] : [],
            'schedule' => is_array($p['schedule'] ?? null) ? $p['schedule'] : [],
        ];
    }

    /** As JSON: an empty schedule is an object, never a list. */
    public static function programmeForScreen(): array
    {
        $p = self::programme();
        $p['schedule'] = (object) $p['schedule'];

        return $p;
    }

    private static function save(array $order, array $hidden, array $schedule): void
    {
        Setting::put(['display_programme' => ['order' => $order, 'hidden' => $hidden, 'schedule' => (object) $schedule]]);
    }

    private function validated(Request $request, bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        $data = $request->validate([
            'kind'      => [$req, Rule::in(['video', 'image'])],
            'url'       => [$req, 'string', 'max:500', 'regex:'.self::URL],
            'title'     => [$req, 'string', 'max:120'],
            'line1'     => ['nullable', 'string', 'max:200', 'regex:/^[^<>{}]*$/'],
            'line2'     => ['nullable', 'string', 'max:200', 'regex:/^[^<>{}]*$/'],
            'small'     => ['nullable', 'string', 'max:200', 'regex:/^[^<>{}]*$/'],
            'captions'         => ['nullable', 'array', 'max:'.ScreenMedia::MAX_CAPTIONS],
            'captions.*.line1' => ['nullable', 'string', 'max:200', 'regex:/^[^<>{}]*$/'],
            'captions.*.line2' => ['nullable', 'string', 'max:200', 'regex:/^[^<>{}]*$/'],
            'captions.*.small' => ['nullable', 'string', 'max:200', 'regex:/^[^<>{}]*$/'],
            'captions.*.at'    => ['nullable', 'integer', 'min:1', 'max:59'],
            'business'  => ['nullable', Rule::in(ScreenMedia::BUSINESSES)],
            'optimised' => ['sometimes', 'boolean'],
            'seconds'   => [$req, 'integer', 'min:4', 'max:60'],
            'screens'   => [$req, 'array', 'min:1'],
            'screens.*' => [Rule::in(ScreenMedia::SCREENS)],
            ...ScreenSchedule::rules(),
            'width'     => ['nullable', 'integer', 'min:1'],
            'height'    => ['nullable', 'integer', 'min:1'],
        ]);

        // validate() rebuilds nested arrays out of order; keep the order the editor listed them.
        if (isset($data['captions'])) {
            ksort($data['captions'], SORT_NUMERIC);
            $data['captions'] = array_values($data['captions']);
        }

        return $data;
    }
}
