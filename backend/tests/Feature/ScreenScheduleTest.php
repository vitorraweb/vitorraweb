<?php

namespace Tests\Feature;

use App\Models\ScreenMedia;
use App\Models\User;
use App\Support\ScreenSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Screen editor → Running order: dates and daily hours for each item. */
class ScreenScheduleTest extends TestCase
{
    use RefreshDatabase;

    private const URL = 'https://abc.public.blob.vercel-storage.com/screen-media/promo.png';

    private function admin(): array
    {
        $u = User::create(['name' => 'A', 'email' => 'adm-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'admin']);

        return ['Authorization' => 'Bearer '.$u->createToken('t')->plainTextToken];
    }

    private function item(array $h, array $over = []): int
    {
        return $this->postJson('/api/admin/screen-media', $over + [
            'kind' => 'image', 'url' => self::URL, 'title' => 'December promo', 'seconds' => 10, 'screens' => ['street'],
        ], $h)->assertCreated()->json('data.id');
    }

    public function test_an_added_item_can_be_set_to_daily_hours_and_the_screen_receives_them(): void
    {
        $h = $this->admin();
        $id = $this->item($h, ['daily_from' => '06:30', 'daily_until' => '10:00']);

        $m = collect($this->getJson('/api/display')->json('data.media'))->firstWhere('id', "media-{$id}");
        $this->assertSame(['starts_on' => null, 'ends_on' => null, 'daily_from' => '06:30', 'daily_until' => '10:00'], $m['schedule']);

        // Past midnight is allowed (an evening-to-early-hours item); clearing the hours works.
        $this->patchJson("/api/admin/screen-media/{$id}", ['daily_from' => '20:00', 'daily_until' => '02:00'], $h)->assertOk();
        $this->patchJson("/api/admin/screen-media/{$id}", ['daily_from' => null, 'daily_until' => null], $h)->assertOk();
        $this->assertNull(ScreenMedia::findOrFail($id)->daily_from);
    }

    public function test_daily_hours_must_be_real_times_and_not_the_same_twice(): void
    {
        $h = $this->admin();
        $id = $this->item($h);

        foreach (['24:00', '6:30', '06:60', 'morning', '06:30:00'] as $bad) {
            $this->patchJson("/api/admin/screen-media/{$id}", ['daily_from' => $bad], $h)->assertUnprocessable();
        }
        $this->patchJson("/api/admin/screen-media/{$id}", ['daily_from' => '09:00', 'daily_until' => '09:00'], $h)->assertUnprocessable();
        $this->patchJson("/api/admin/screen-media/{$id}", ['starts_on' => '2026-12-15', 'ends_on' => '2026-12-01'], $h)->assertUnprocessable();
    }

    public function test_dates_follow_kampalas_calendar_not_the_servers(): void
    {
        $h = $this->admin();
        $id = $this->item($h, ['starts_on' => '2026-12-01', 'ends_on' => '2026-12-15']);
        $on = fn () => collect($this->getJson('/api/display')->json('data.media'))->pluck('id')->contains("media-{$id}");

        // Kampala is UTC+3: 30 Nov 21:00 UTC is already 1 December in Kampala.
        $this->travelTo(CarbonImmutable::parse('2026-11-30 20:59', 'UTC'));
        $this->assertFalse($on());
        $this->travelTo(CarbonImmutable::parse('2026-11-30 21:00', 'UTC'));
        $this->assertTrue($on());
        // The last day plays to its end, and is gone at Kampala's midnight.
        $this->travelTo(CarbonImmutable::parse('2026-12-15 20:59', 'UTC'));
        $this->assertTrue($on());
        $this->travelTo(CarbonImmutable::parse('2026-12-15 21:00', 'UTC'));
        $this->assertFalse($on());
        $this->travelBack();
    }

    public function test_built_in_scenes_can_be_scheduled_and_moving_items_keeps_their_schedule(): void
    {
        $h = $this->admin();
        $this->putJson('/api/admin/display/programme', [
            'order' => ['ident', 'coffee', 'fet'], 'hidden' => [],
            'schedule' => [
                'coffee' => ['daily_from' => '05:00', 'daily_until' => '10:00'],
                'fet' => ['starts_on' => '2026-12-01', 'ends_on' => '2026-12-15', 'daily_from' => '', 'daily_until' => null],
                'proof' => ['starts_on' => null, 'ends_on' => '', 'daily_from' => null, 'daily_until' => null], // nothing set: dropped
            ],
        ], $h)->assertOk();

        $p = $this->getJson('/api/display')->json('data.programme');
        $this->assertSame(['coffee', 'fet'], array_keys($p['schedule']));
        $this->assertSame('10:00', $p['schedule']['coffee']['daily_until']);
        $this->assertSame(['starts_on' => '2026-12-01', 'ends_on' => '2026-12-15', 'daily_from' => null, 'daily_until' => null], $p['schedule']['fet']);

        // The console's move and switch-off send only the order: the schedule stays.
        $this->putJson('/api/admin/display/programme', ['order' => ['fet', 'ident', 'coffee'], 'hidden' => ['ident']], $h)->assertOk();
        $this->assertSame(['coffee', 'fet'], array_keys($this->getJson('/api/display')->json('data.programme.schedule')));

        // Adding and deleting an item keep it too.
        $id = $this->item($h);
        $this->deleteJson("/api/admin/screen-media/{$id}", [], $h)->assertOk();
        $p = $this->getJson('/api/display')->json('data.programme');
        $this->assertSame(['fet', 'ident', 'coffee'], $p['order']);
        $this->assertSame(['coffee', 'fet'], array_keys($p['schedule']));

        // An empty schedule clears every built-in one, and reads back as an object.
        $this->putJson('/api/admin/display/programme', ['order' => ['fet'], 'hidden' => [], 'schedule' => []], $h)->assertOk();
        $this->assertSame('{}', json_encode($this->getJson('/api/display')->getData()->data->programme->schedule));
    }

    public function test_a_built_in_schedule_is_checked_like_an_items(): void
    {
        $h = $this->admin();
        $put = fn (array $schedule) => $this->putJson('/api/admin/display/programme', ['order' => [], 'hidden' => [], 'schedule' => $schedule], $h);

        $put(['fet' => ['daily_from' => '25:00']])->assertUnprocessable();
        $put(['fet' => ['daily_from' => '08:00', 'daily_until' => '08:00']])->assertUnprocessable();
        $put(['fet' => ['starts_on' => '2026-12-15', 'ends_on' => '2026-12-01']])->assertUnprocessable();
        $put(['FET!' => ['daily_from' => '08:00']])->assertUnprocessable();
        // Added items keep their schedule on the item, not here.
        $put(['media-1' => ['daily_from' => '08:00']])->assertUnprocessable();
        $put(['fet' => ['starts_on' => '2026-12-01', 'ends_on' => '2026-12-01']])->assertOk(); // a single day
    }

    public function test_the_schedule_needs_a_signed_in_editor(): void
    {
        $this->putJson('/api/admin/display/programme', ['order' => [], 'hidden' => [], 'schedule' => ['fet' => ['daily_from' => '08:00']]])->assertUnauthorized();
    }

    public function test_in_dates_compares_whole_days(): void
    {
        $at = CarbonImmutable::parse('2026-12-01 12:00', 'Africa/Kampala');
        $this->assertTrue(ScreenSchedule::inDates(null, null, $at));
        $this->assertTrue(ScreenSchedule::inDates('2026-12-01', '2026-12-01', $at));
        $this->assertFalse(ScreenSchedule::inDates('2026-12-02', null, $at));
        $this->assertFalse(ScreenSchedule::inDates(null, '2026-11-30', $at));
        $this->assertSame(null, ScreenSchedule::clean(['starts_on' => ' ', 'daily_until' => null]));
    }
}
