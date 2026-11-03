<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScreenAdBooking;
use App\Models\ScreenDowntime;
use App\Models\ScreenPlay;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * What the street screen reports about itself: that it is alive (every minute)
 * and each paid advert it played. Only a screen connected from the console, with
 * its key, can report, so nobody else can add plays to a delivery report.
 */
class ScreenDeviceController extends Controller
{
    public function heartbeat(Request $request): JsonResponse
    {
        $this->screen($request);
        Setting::put(['display_last_seen' => now()->toIso8601String(), 'display_last_scene' => substr((string) $request->input('scene', ''), 0, 40)]);
        ScreenDowntime::whereNull('ended_at')->update(['ended_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function play(Request $request): JsonResponse
    {
        $this->screen($request);
        $data = $request->validate([
            'booking_id' => ['required', 'integer'],
            'played_at'  => ['required', 'date'],
            'seconds'    => ['required', 'numeric', 'min:0', 'max:120'],
            'completed'  => ['required', 'boolean'],
        ]);
        $booking = ScreenAdBooking::find($data['booking_id']);
        abort_unless($booking && $booking->status === ScreenAdBooking::APPROVED, 422, 'Not an advert on air.');

        $at = \Illuminate\Support\Carbon::parse($data['played_at']);
        // A screen with a wrong clock must not invent plays in the past or future.
        if (abs($at->diffInMinutes(now(), true)) > 10) $at = now();

        ScreenPlay::create(['screen_ad_booking_id' => $booking->id, 'played_at' => $at, 'seconds' => $data['seconds'], 'completed' => $data['completed']]);

        return response()->json(['ok' => true], 201);
    }

    private function screen(Request $request): void
    {
        $hash = (string) Setting::get('display_screen_key_hash', '');
        $key = (string) $request->header('X-Screen-Key');
        abort_unless($hash !== '' && $key !== '' && hash_equals($hash, hash('sha256', $key)), 403, 'This screen is not connected.');
    }
}
