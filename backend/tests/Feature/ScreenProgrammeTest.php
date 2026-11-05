<?php

namespace Tests\Feature;

use App\Models\ScreenAdBooking as Booking;
use App\Models\ScreenDowntime;
use App\Models\ScreenPlay;
use App\Models\Setting;
use App\Models\User;
use App\Services\ScreenAds\Inventory;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ScreenProgrammeTest extends TestCase
{
    use RefreshDatabase;

    private int $n = 0;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config(['screen_ads.enabled' => true]);
    }

    private function payload(array $over = []): array
    {
        return $over + [
            'company' => 'Acme', 'contact_name' => 'A', 'email' => 'a@acme.test', 'phone' => '+256772123456', 'package' => 'standard',
            'start_date' => now('Africa/Kampala')->addDays(5)->toDateString(),
            'video_url' => 'https://abc.public.blob.vercel-storage.com/screen-ads/x.mp4',
            'video_seconds' => 15, 'video_width' => 1920, 'video_height' => 1080, 'video_size' => 1000, 'terms_accepted' => true,
        ];
    }

    private function booking(array $over = []): Booking
    {
        $this->n++;

        return Booking::create($over + [
            'reference' => 'VHL-SA-T-'.$this->n, 'access_token_hash' => hash('sha256', 't'.$this->n), 'status' => Booking::APPROVED,
            'company' => 'C', 'contact_name' => 'C', 'email' => 'c@c.test', 'package' => 'standard', 'price_ugx' => 450000,
            'plays_per_hour' => 15, 'units' => 1, 'start_date' => now()->addDays(5)->toDateString(), 'end_date' => now()->addDays(34)->toDateString(),
            'video_url' => 'https://abc.public.blob.vercel-storage.com/screen-ads/x.mp4', 'video_seconds' => 15,
        ]);
    }

    private function admin(): array
    {
        $u = User::create(['name' => 'A', 'email' => 'adm-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'admin']);

        return ['Authorization' => 'Bearer '.$u->createToken('t')->plainTextToken];
    }

    public function test_packages_take_their_units_and_the_screen_cannot_be_oversold(): void
    {
        $this->booking(['units' => 4]);
        $this->booking(['units' => 4]);
        $this->booking(['units' => 2]); // 10 of 12 sold

        $this->postJson('/api/screen-ads/bookings', $this->payload(['package' => 'high']))->assertUnprocessable()->assertJsonPath('message', fn ($m) => str_contains($m, 'Only 2'));
        $this->postJson('/api/screen-ads/bookings', $this->payload(['package' => 'growth']))->assertCreated()->assertJsonPath('data.plays_per_hour', 30);
        $this->postJson('/api/screen-ads/bookings', $this->payload(['package' => 'trial']))->assertUnprocessable()->assertJsonPath('message', fn ($m) => str_contains($m, 'fully booked'));
        $this->assertSame(2, Booking::latest('id')->first()->units);
    }

    public function test_an_unpaid_booking_frees_its_units_after_72_hours(): void
    {
        foreach (range(1, 12) as $i) $this->booking(['status' => Booking::AWAITING_PAYMENT]);
        $this->postJson('/api/screen-ads/bookings', $this->payload())->assertUnprocessable();

        $this->travel(73)->hours();
        $this->postJson('/api/screen-ads/bookings', $this->payload())->assertCreated();
    }

    public function test_refused_and_cancelled_bookings_free_their_units(): void
    {
        foreach (range(1, 12) as $i) $this->booking(['status' => $i % 2 ? Booking::REJECTED : Booking::CANCELLED]);
        $this->postJson('/api/screen-ads/bookings', $this->payload())->assertCreated();
    }

    public function test_only_the_connected_screen_can_report_plays(): void
    {
        $b = $this->booking(['start_date' => now()->toDateString()]);
        $play = ['booking_id' => $b->id, 'played_at' => now()->toIso8601String(), 'seconds' => 15, 'completed' => true];

        $this->postJson('/api/display/plays', $play)->assertForbidden();
        $key = $this->postJson('/api/admin/screen-ads/screen-key', [], $this->admin())->assertOk()->json('data.key');
        $this->postJson('/api/display/plays', $play, ['X-Screen-Key' => 'wrong'])->assertForbidden();
        $this->postJson('/api/display/plays', $play, ['X-Screen-Key' => $key])->assertCreated();
        $this->assertSame(1, ScreenPlay::count());
    }

    public function test_plays_for_an_advert_not_on_air_are_refused(): void
    {
        Setting::put(['display_screen_key_hash' => hash('sha256', 'k')]);
        $b = $this->booking(['status' => Booking::PAYMENT_CONFIRMED]);
        $this->postJson('/api/display/plays', ['booking_id' => $b->id, 'played_at' => now()->toIso8601String(), 'seconds' => 15, 'completed' => true], ['X-Screen-Key' => 'k'])->assertUnprocessable();
    }

    public function test_downtime_opens_when_the_screen_goes_quiet_alerts_once_and_closes_on_return(): void
    {
        Setting::put(['display_screen_key_hash' => hash('sha256', 'k')]);
        $this->travelTo(CarbonImmutable::parse('2026-11-04 07:00:00', 'UTC')); // 10am Kampala
        $this->postJson('/api/display/heartbeat', ['scene' => 'fet'], ['X-Screen-Key' => 'k'])->assertOk();

        $this->travel(5)->minutes();
        $this->artisan('screen:watch')->assertSuccessful();
        $this->assertSame(1, ScreenDowntime::whereNull('ended_at')->count());

        $this->travel(20)->minutes();
        $this->artisan('screen:watch');
        $this->artisan('screen:watch');
        Mail::assertSent(\App\Mail\ScreenAdNotice::class, 1);

        $this->postJson('/api/display/heartbeat', [], ['X-Screen-Key' => 'k'])->assertOk();
        $this->assertSame(0, ScreenDowntime::whereNull('ended_at')->count());
        $this->assertSame(25, ScreenDowntime::first()->minutes());
    }

    public function test_no_downtime_is_logged_outside_on_air_hours(): void
    {
        Setting::put(['display_last_seen' => CarbonImmutable::parse('2026-11-04 19:30:00', 'UTC')->toIso8601String()]);
        $this->travelTo(CarbonImmutable::parse('2026-11-04 20:30:00', 'UTC')); // 11:30pm Kampala
        $this->artisan('screen:watch');
        $this->assertSame(0, ScreenDowntime::count());
    }

    public function test_the_delivery_report_counts_booked_against_delivered(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-06 18:00:00', 'UTC')); // 9pm Kampala, after 6am to 10pm? 21:00, so 15 hours in
        $b = $this->booking(['start_date' => '2026-11-05', 'end_date' => '2026-12-04', 'units' => 2]);
        foreach (range(1, 400) as $i) ScreenPlay::create(['screen_ad_booking_id' => $b->id, 'played_at' => CarbonImmutable::parse('2026-11-05 08:00:00', 'UTC'), 'seconds' => 15, 'completed' => true]);
        ScreenPlay::create(['screen_ad_booking_id' => $b->id, 'played_at' => CarbonImmutable::parse('2026-11-05 08:00:00', 'UTC'), 'seconds' => 3, 'completed' => false]);

        $r = app(Inventory::class)->delivery($b);
        $this->assertSame(480, $r['days'][0]['expected']);  // 2 units × 15 an hour × 16 hours
        $this->assertSame(400, $r['days'][0]['delivered']); // the half-played one does not count
        $this->assertSame(450, $r['days'][1]['expected']);  // today, 15 hours so far
        $this->assertTrue($r['owed']);
        $this->assertSame(14400, $r['campaign_expected']);

        $this->getJson("/api/admin/screen-ads/{$b->id}/report.csv", $this->admin())->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_missed_airtime_is_made_good_by_extending_the_campaign(): void
    {
        $b = $this->booking();
        $end = $b->end_date->copy()->addDays(3)->toDateString();
        $this->postJson("/api/admin/screen-ads/{$b->id}/extend", ['days' => 3], $this->admin())->assertOk();
        $this->assertSame($end, $b->fresh()->end_date->toDateString());
    }

    public function test_inventory_shows_units_against_break_even(): void
    {
        $this->booking(['units' => 4, 'start_date' => now()->subDay()->toDateString()]);
        $this->booking(['units' => 1, 'status' => Booking::AWAITING_PAYMENT, 'start_date' => now()->subDay()->toDateString()]);
        $d = $this->getJson('/api/admin/screen-ads/inventory', $this->admin())->assertOk()->json('data');
        $this->assertSame(4, $d['paid_today']);
        $this->assertSame(7, $d['break_even']);
        $this->assertSame(3150000, $d['break_even_ugx']);
        $this->assertSame(5, $d['held_by_day'][now('Africa/Kampala')->toDateString()]);
    }

    public function test_staff_add_their_own_media_and_screens_receive_it_in_order(): void
    {
        $h = $this->admin();
        $url = 'https://abc.public.blob.vercel-storage.com/screen-media/poster.png';
        $id = $this->postJson('/api/admin/screen-media', ['kind' => 'image', 'url' => $url, 'title' => 'Poster', 'line1' => 'NEW', 'seconds' => 10, 'screens' => ['street']], $h)->assertCreated()->json('data.id');
        $this->postJson('/api/admin/screen-media', ['kind' => 'image', 'url' => 'https://evil.test/x.png', 'title' => 'x', 'seconds' => 10, 'screens' => ['street']], $h)->assertUnprocessable();
        $this->postJson('/api/admin/screen-media', ['kind' => 'video', 'url' => $url, 'title' => 'x', 'seconds' => 10, 'screens' => ['street'], 'starts_on' => '2030-01-01'], $h)->assertCreated();

        $this->putJson('/api/admin/display/programme', ['order' => ["media-{$id}", 'ident', 'fet'], 'hidden' => ['seal']], $h)->assertOk();

        $d = $this->getJson('/api/display')->json('data');
        $this->assertSame(["media-{$id}", 'ident', 'fet'], $d['programme']['order']);
        $this->assertSame(['seal'], $d['programme']['hidden']);
        $this->assertCount(1, $d['media']); // the 2030 one is not live yet
        $this->assertSame('NEW', $d['media'][0]['line1']);

        $this->deleteJson("/api/admin/screen-media/{$id}", [], $h)->assertOk();
        $this->assertSame(['ident', 'fet'], $this->getJson('/api/display')->json('data.programme.order'));
    }

    public function test_a_customer_can_book_a_1080_design_shown_for_15_seconds(): void
    {
        $img = 'https://abc.public.blob.vercel-storage.com/screen-ads/design.png';
        $this->postJson('/api/screen-ads/bookings', $this->payload(['media_type' => 'image', 'video_url' => $img, 'video_seconds' => null, 'video_width' => 1080, 'video_height' => 1920]))->assertUnprocessable();
        $this->postJson('/api/screen-ads/bookings', $this->payload(['media_type' => 'video', 'video_url' => $img]))->assertUnprocessable();
        $this->postJson('/api/screen-ads/bookings', $this->payload(['media_type' => 'image', 'video_url' => $img, 'video_seconds' => null]))->assertCreated();

        $b = Booking::latest('id')->first();
        $this->assertSame('image', $b->media_type);
        $b->update(['status' => Booking::APPROVED, 'start_date' => now()->subDay()->toDateString()]);
        $this->travelTo(now('Africa/Kampala')->setTime(12, 0));
        $this->assertSame('image', $this->getJson('/api/display/adverts')->json('data.0.kind'));
    }

    public function test_a_campaign_in_chosen_slots_gets_the_same_airtime_packed_into_them(): void
    {
        $b = $this->booking(['units' => 1, 'slots' => ['morning']]);
        $this->assertSame(4.0, $b->unitsInSlot());       // 16 on-air hours ÷ 4 morning hours
        $this->assertSame(60, $b->playsPerHourOnAir());  // a Standard unit, four times as often

        $this->travelTo(CarbonImmutable::parse('2026-11-04 05:00:00', 'UTC')); // 8am Kampala
        $b->update(['start_date' => '2026-11-01', 'end_date' => '2026-11-30']);
        $this->assertTrue($b->fresh()->isOnAirAt(now()));
        $this->travelTo(CarbonImmutable::parse('2026-11-04 10:00:00', 'UTC')); // 1pm Kampala
        $this->assertFalse($b->fresh()->isOnAirAt(now()));
        // Delivery: the day's total matches an all-day Standard booking.
        $this->travelTo(CarbonImmutable::parse('2026-11-05 20:00:00', 'UTC'));
        $this->assertSame(240, app(Inventory::class)->delivery($b->fresh())['days'][0]['expected']);
    }

    public function test_each_slot_has_its_own_twelve_units(): void
    {
        $this->booking(['units' => 2, 'slots' => ['morning']]);   // takes 8 morning units
        $this->booking(['units' => 1, 'slots' => ['morning']]);   // and 4 more: mornings are full

        $this->postJson('/api/screen-ads/bookings', $this->payload(['slots' => ['morning']]))->assertUnprocessable()->assertJsonPath('message', fn ($m) => str_contains($m, 'Those times are fully booked'));
        $this->postJson('/api/screen-ads/bookings', $this->payload(['slots' => ['evening']]))->assertCreated();
        // All day needs a unit in every slot, including the full morning.
        $this->postJson('/api/screen-ads/bookings', $this->payload())->assertUnprocessable();
        // Choosing all three is stored as all day.
        $this->booking(['units' => 0, 'start_date' => now()->addYears(2)->toDateString(), 'end_date' => now()->addYears(2)->toDateString()]);
        $this->postJson('/api/screen-ads/bookings', $this->payload(['slots' => ['morning', 'lunchtime', 'evening'], 'start_date' => now('Africa/Kampala')->addDays(60)->toDateString()]))->assertCreated();
        $this->assertNull(Booking::latest('id')->first()->slots);
    }

    public function test_the_booking_page_shows_each_packages_airtime_and_the_slots(): void
    {
        $d = $this->getJson('/api/screen-ads/pricing')->assertOk()->json('data');
        $this->assertSame([60, 60, 120, 240], array_column($d['packages'], 'minutes_per_day'));
        $this->assertSame(['morning', 'lunchtime', 'evening'], array_column($d['slots'], 'id'));
    }

    public function test_replacing_an_items_file_keeps_its_settings_and_a_built_in_can_be_swapped_in_place(): void
    {
        $h = $this->admin();
        $id = $this->postJson('/api/admin/screen-media', [
            'kind' => 'video', 'url' => 'https://abc.public.blob.vercel-storage.com/screen-media/old.mp4', 'title' => 'Promo',
            'line1' => 'Caption', 'seconds' => 20, 'screens' => ['street'], 'width' => 1920, 'height' => 1080,
        ], $h)->assertCreated()->json('data.id');

        // Swap the file for a design: name, caption and screens stay.
        $this->patchJson("/api/admin/screen-media/{$id}", [
            'kind' => 'image', 'url' => 'https://abc.public.blob.vercel-storage.com/screen-media/new.png', 'width' => 1920, 'height' => 1080, 'seconds' => 10,
        ], $h)->assertOk();
        $m = \App\Models\ScreenMedia::findOrFail($id);
        $this->assertSame(['image', 'Promo', 'Caption', ['street']], [$m->kind, $m->title, $m->line1, $m->screens]);
        $this->assertStringEndsWith('/new.png', $m->url);

        // A file from anywhere else is refused.
        $this->patchJson("/api/admin/screen-media/{$id}", ['url' => 'https://evil.example/x.mp4'], $h)->assertUnprocessable();

        // A built-in scene replaced in place: switched off, the new item right after it.
        $this->putJson('/api/admin/display/programme', ['order' => ['ident', 'logistics', "media-{$id}", 'proof'], 'hidden' => ['logistics']], $h)->assertOk();
        $this->assertSame(['order' => ['ident', 'logistics', "media-{$id}", 'proof'], 'hidden' => ['logistics']], $this->getJson('/api/display')->json('data.programme'));
    }

    public function test_an_adverts_file_can_be_replaced_or_made_light_but_not_swapped_between_video_and_design(): void
    {
        $h = $this->admin();
        $b = $this->booking(['media_type' => 'video']);

        $this->patchJson("/api/admin/screen-ads/{$b->id}/video", ['url' => 'https://abc.public.blob.vercel-storage.com/screen-ads/light.mp4', 'optimised' => true], $h)->assertOk();
        $b->refresh();
        $this->assertStringEndsWith('/light.mp4', $b->video_url);
        $this->assertTrue((bool) $b->video_optimised);

        $this->patchJson("/api/admin/screen-ads/{$b->id}/video", ['url' => 'https://abc.public.blob.vercel-storage.com/screen-ads/design.png'], $h)->assertUnprocessable();
        $this->patchJson("/api/admin/screen-ads/{$b->id}/video", ['url' => 'https://evil.example/x.mp4'], $h)->assertUnprocessable();
    }

    public function test_uploads_carry_their_business_and_small_line_to_the_screen(): void
    {
        $h = $this->admin();
        $id = $this->postJson('/api/admin/screen-media', [
            'kind' => 'video', 'url' => 'https://abc.public.blob.vercel-storage.com/screen-media/v.mp4', 'title' => 'Tyres',
            'line1' => 'Fleet fuel bills', 'line2' => 'Down, month after month', 'small' => 'vitorra.org/fet', 'business' => 'fet',
            'seconds' => 20, 'screens' => ['street'], 'optimised' => true,
        ], $h)->assertCreated()->json('data.id');

        $m = collect($this->getJson('/api/display')->json('data.media'))->firstWhere('id', "media-{$id}");
        $this->assertSame(['fet', 'vitorra.org/fet'], [$m['business'], $m['small']]);
        $this->assertTrue(\App\Models\ScreenMedia::findOrFail($id)->optimised);

        $this->patchJson("/api/admin/screen-media/{$id}", ['business' => 'banana'], $h)->assertUnprocessable();
    }
}
