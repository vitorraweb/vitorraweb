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
        return response()->json(['data' => ['welcome' => $this->welcome()]])
            ->header('Cache-Control', 'public, max-age=30');
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
