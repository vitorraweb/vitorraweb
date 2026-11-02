<?php

namespace Tests\Feature;

use App\Mail\ScreenAdNotice;
use App\Models\ActivityLog;
use App\Models\ScreenAdBooking as Booking;
use App\Models\User;
use App\Services\ScreenAds\Pricing;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ScreenAdTest extends TestCase
{
    use RefreshDatabase;

    private array $preview = ['X-Screen-Ads-Preview' => 'test-key'];

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config(['screen_ads.enabled' => false, 'screen_ads.preview_key' => 'test-key']);
    }

    private function payload(array $over = []): array
    {
        return $over + [
            'company' => 'Acme Ltd', 'contact_name' => 'Amina', 'email' => 'amina@acme.test', 'phone' => '+256772123456',
            'duration' => 15, 'visibility' => 'standard', 'days' => ['mon', 'tue', 'wed', 'thu', 'fri'], 'periods' => ['morning'],
            'start_date' => now('Africa/Kampala')->addDays(5)->toDateString(),
            'video_url' => 'https://abc123.public.blob.vercel-storage.com/screen-ads/film-x.mp4',
            'video_seconds' => 15.1, 'video_width' => 1920, 'video_height' => 1080, 'video_size' => 20_000_000,
            'terms_accepted' => true,
        ];
    }

    private function book(array $over = []): array
    {
        return $this->postJson('/api/screen-ads/bookings', $this->payload($over), $this->preview)->assertCreated()->json('data');
    }

    private function staff(string $department, array $permissions): User
    {
        return User::create(['name' => 'S', 'email' => 's-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'ops', 'department' => $department, 'permissions' => $permissions]);
    }

    private function h(User $u): array
    {
        $this->app['auth']->forgetGuards(); // each call below is a different person

        return ['Authorization' => 'Bearer '.$u->createToken('t')->plainTextToken];
    }

    private function approved(array $over = []): Booking
    {
        $b = Booking::where('reference', $this->book()['reference'])->first();
        $b->update($over + ['status' => Booking::APPROVED, 'start_date' => '2026-11-02', 'end_date' => '2026-12-01']);

        return $b;
    }

    public function test_the_approved_starting_package_costs_450000(): void
    {
        $q = app(Pricing::class)->quote(15, 'standard', 5);
        $this->assertSame(450000, $q['monthly_ugx']);
        $this->assertSame(4, $q['plays_per_hour']);
    }

    public function test_a_larger_campaign_multiplies_through_all_three_choices(): void
    {
        // 450,000 × 1.5 × 1.3 × 1.2
        $this->assertSame(1053000, app(Pricing::class)->quote(30, 'high', 7)['monthly_ugx']);
    }

    public function test_everything_is_hidden_without_the_flag_or_key(): void
    {
        $this->getJson('/api/screen-ads/pricing')->assertNotFound();
        $this->postJson('/api/screen-ads/bookings', $this->payload())->assertNotFound();
        $this->getJson('/api/screen-ads/pricing', $this->preview)->assertOk()->assertJsonPath('data.base_ugx', 450000);

        config(['screen_ads.preview_key' => null]);
        $this->getJson('/api/screen-ads/pricing', ['X-Screen-Ads-Preview' => ''])->assertNotFound();
    }

    public function test_the_server_sets_the_price_whatever_the_browser_sends(): void
    {
        $data = $this->book(['monthly_ugx' => 1, 'plays_per_hour' => 999, 'duration' => 30, 'video_seconds' => 30, 'visibility' => 'maximum', 'days' => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']]);
        $this->assertSame(1296000, $data['monthly_ugx']); // 450,000 × 1.5 × 1.6 × 1.2
        $this->assertSame(12, $data['plays_per_hour']);
    }

    public function test_a_video_must_match_the_length_chosen_and_be_landscape(): void
    {
        $this->postJson('/api/screen-ads/bookings', $this->payload(['video_seconds' => 30]), $this->preview)->assertUnprocessable();
        $this->postJson('/api/screen-ads/bookings', $this->payload(['video_width' => 1280, 'video_height' => 1920]), $this->preview)->assertUnprocessable();
    }

    public function test_a_booking_cannot_point_the_screen_at_another_website(): void
    {
        $this->postJson('/api/screen-ads/bookings', $this->payload(['video_url' => 'https://evil.test/screen-ads/x.mp4']), $this->preview)->assertUnprocessable();
    }

    public function test_longer_custom_films_cannot_be_booked_at_a_listed_price(): void
    {
        $this->postJson('/api/screen-ads/bookings', $this->payload(['duration' => 45, 'video_seconds' => 45]), $this->preview)->assertUnprocessable();
    }

    public function test_the_customer_gets_the_bank_details_and_only_their_link_opens_it(): void
    {
        $data = $this->book();
        $this->assertSame('9030027300994', $data['bank']['account_number']);
        Mail::assertSent(ScreenAdNotice::class, fn ($m) => $m->hasTo('amina@acme.test'));

        $this->getJson('/api/screen-ads/bookings/'.$data['token'])->assertOk()->assertJsonPath('data.reference', $data['reference'])->assertJsonMissingPath('data.token');
        $this->getJson('/api/screen-ads/bookings/not-a-token')->assertNotFound();
    }

    public function test_proof_is_stored_encrypted_and_moves_the_booking_on(): void
    {
        Storage::fake('local');
        $data = $this->book();
        $this->post('/api/screen-ads/bookings/'.$data['token'].'/proof', ['proof' => UploadedFile::fake()->create('slip.pdf', 200, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('data.status', Booking::PAYMENT_SUBMITTED);

        $b = Booking::first();
        $this->assertStringStartsWith('VENC1:', Storage::disk('local')->get($b->proof_path));
    }

    public function test_only_finance_can_confirm_money_and_a_paid_advert_cannot_skip_it(): void
    {
        Booking::query()->delete();
        $b = Booking::where('reference', $this->book()['reference'])->first();
        $b->update(['status' => Booking::PAYMENT_SUBMITTED]);
        $marketing = $this->staff('marketing', ['screen_ads']);
        $finance = $this->staff('finance', ['accounting']);

        $this->postJson("/api/admin/screen-ads/{$b->id}/confirm-payment", [], $this->h($marketing))->assertForbidden();
        $this->postJson("/api/admin/screen-ads/{$b->id}/approve", [], $this->h($marketing))->assertUnprocessable();
        $this->postJson("/api/admin/screen-ads/{$b->id}/confirm-payment", [], $this->h($finance))->assertOk();
        $this->postJson("/api/admin/screen-ads/{$b->id}/approve", [], $this->h($finance))->assertForbidden();
        $this->postJson("/api/admin/screen-ads/{$b->id}/approve", [], $this->h($marketing))->assertOk()->assertJsonPath('data.status', Booking::APPROVED);
        $this->assertTrue(ActivityLog::where('action', 'screen_ad.approved')->exists());
    }

    public function test_a_refused_advert_tells_the_customer_and_is_tracked_to_its_refund(): void
    {
        $b = Booking::where('reference', $this->book()['reference'])->first();
        $b->update(['status' => Booking::PAYMENT_CONFIRMED]);
        $this->postJson("/api/admin/screen-ads/{$b->id}/reject", ['reason' => 'Misleading claims'], $this->h($this->staff('marketing', ['screen_ads'])))->assertOk();
        Mail::assertSent(ScreenAdNotice::class, fn ($m) => str_contains($m->heading, 'cannot run') && in_array('Our team will contact you about your refund.', $m->lines, true));

        $this->postJson("/api/admin/screen-ads/{$b->id}/refunded", [], $this->h($this->staff('finance', ['accounting'])))->assertOk()->assertJsonPath('data.status', Booking::REFUNDED);
    }

    public function test_only_approved_adverts_in_their_days_and_times_reach_the_screen(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-04 05:30:00', 'UTC')); // Wednesday, 8:30am in Kampala
        $live = $this->approved();
        $this->book(); // unpaid
        $this->approved(['periods' => ['evening']]);
        $this->approved(['days' => ['sat']]);
        $this->approved(['start_date' => '2026-12-05', 'end_date' => '2027-01-03']);

        $ads = $this->getJson('/api/display/adverts')->assertOk()->json('data');
        $this->assertCount(1, $ads);
        $this->assertSame($live->id, $ads[0]['id']);
        $this->assertSame(4, $ads[0]['plays_per_hour']);
    }
}
