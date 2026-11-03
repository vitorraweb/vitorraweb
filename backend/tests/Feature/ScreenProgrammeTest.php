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
}
