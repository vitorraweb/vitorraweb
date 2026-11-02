<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * The reception / street screen (/display). Public read of what the screen
 * should show beyond its built-in story — today, a personal welcome for a
 * visiting client — and the staff side that sets it.
 *
 * The welcome is the only thing here a person types, and it appears on a
 * public screen, so it is short, plain text and switches itself off.
 */
class DisplayController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => ['welcome' => $this->welcome(), 'copy' => (object) $this->copy()]])
            ->header('Cache-Control', 'public, max-age=30');
    }

    /**
     * Replace the screens' edited wording. Only the changes are stored, keyed by
     * the field names the console sends, so anything left alone keeps following
     * the default in the code. An empty value hides that line.
     */
    public function updateCopy(Request $request): JsonResponse
    {
        $request->validate(['copy' => ['present', 'array', 'max:300']]);

        // Field names contain dots, so these are checked by hand: the validator
        // would read each dot as a level of nesting.
        $copy = [];
        foreach ($request->input('copy') as $key => $value) {
            abort_unless(preg_match('/^[a-z0-9_.-]{1,80}$/', (string) $key), 422, 'Unknown field.');
            $value = trim((string) $value);
            abort_if(is_array($value) || mb_strlen($value) > 200 || preg_match('/[<>{}]/', $value), 422, 'Keep each line plain text, under 200 characters.');
            $copy[$key] = $value;
        }

        $before = $this->copy();
        Setting::put(['display_copy' => $copy]);
        $changed = array_keys(array_diff_assoc($copy, $before) + array_diff_assoc($before, $copy));
        if ($changed) {
            Audit::log('display.copy', 'Changed screen wording: '.collect($changed)->map(fn ($k) => $k.' → "'.($copy[$k] ?? '(default)').'"')->implode('; '));
        }

        return response()->json(['data' => ['copy' => (object) $copy]]);
    }

    /** @return array<string, string> */
    private function copy(): array
    {
        $copy = Setting::get('display_copy', []);

        return is_array($copy) ? $copy : [];
    }

    public function updateWelcome(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => ['nullable', 'string', 'max:60', 'regex:/^[^<>{}]*$/'],
            'line'  => ['nullable', 'string', 'max:90', 'regex:/^[^<>{}]*$/'],
            'hours' => ['nullable', 'integer', 'min:1', 'max:72'],
        ]);

        $name = trim((string) ($data['name'] ?? ''));
        Setting::put([
            'display_welcome_name'  => $name,
            'display_welcome_line'  => trim((string) ($data['line'] ?? '')),
            'display_welcome_until' => $name === '' ? '' : now()->addHours($data['hours'] ?? 4)->toIso8601String(),
        ]);
        Audit::log('display.welcome', $name === '' ? 'Cleared the reception screen welcome' : 'Set the reception screen welcome for '.$name);

        return response()->json(['data' => ['welcome' => $this->welcome()]]);
    }

    /** @return array{name:string, line:string, until:string}|null */
    private function welcome(): ?array
    {
        $name = trim((string) Setting::get('display_welcome_name', ''));
        $until = (string) Setting::get('display_welcome_until', '');
        if ($name === '' || $until === '' || Carbon::parse($until)->isPast()) {
            return null;
        }

        return ['name' => $name, 'line' => (string) Setting::get('display_welcome_line', ''), 'until' => $until];
    }
}
