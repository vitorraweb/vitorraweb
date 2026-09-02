<?php

namespace Tests\Feature;

use App\Mail\EnquiryUnanswered;
use App\Models\Enquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * The chaser exists because a real enquiry (9 July, a buyer naming his vehicle)
 * sat unanswered until the CEO found it in a meeting. These tests pin the
 * behaviour that stops that repeating — and, just as importantly, the behaviour
 * that stops it becoming noise nobody reads.
 */
class EnquirySlaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        config([
            'enquiries.sla.chase_hours'    => 4,
            'enquiries.sla.escalate_hours' => 24,
            'enquiries.sla.escalate_to'    => ['ceo@vitorra.org'],
            'mail.team_address'            => 'team@vitorra.org',
        ]);
    }

    private function enquiry(int $hoursAgo, array $attrs = []): Enquiry
    {
        $e = Enquiry::create(array_merge([
            'name'    => 'Waiting Buyer',
            'email'   => 'buyer@example.com',
            'country' => 'Uganda',
            'message' => 'I need Fuel Eco Tech for my D-MAX.',
            'status'  => 'new',
        ], $attrs));

        // created_at is not fillable, so it is set directly.
        $e->forceFill(['created_at' => now()->subHours($hoursAgo)])->save();

        return $e->fresh();
    }

    /* ── Chasing ───────────────────────────────────────────────────────── */

    public function test_an_enquiry_past_the_threshold_is_chased(): void
    {
        $this->enquiry(5);

        $this->artisan('enquiries:chase --force')->assertSuccessful();

        Mail::assertSent(EnquiryUnanswered::class, fn ($m) => $m->stage === 'chase'
            && $m->hasTo('team@vitorra.org'));
    }

    public function test_a_fresh_enquiry_is_left_alone(): void
    {
        $this->enquiry(1);

        $this->artisan('enquiries:chase --force')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_the_same_enquiry_is_not_chased_twice(): void
    {
        $this->enquiry(5);

        $this->artisan('enquiries:chase --force');
        Mail::fake(); // forget the first send
        $this->artisan('enquiries:chase --force');

        // Running hourly must not mean emailing hourly.
        Mail::assertNothingSent();
    }

    /* ── What clears it ────────────────────────────────────────────────── */

    public function test_an_actioned_enquiry_is_not_chased(): void
    {
        $this->enquiry(5, ['status' => 'in_progress'])
            ->forceFill(['replied_at' => now()])->save();

        $this->artisan('enquiries:chase --force')->assertSuccessful();

        Mail::assertNothingSent();
    }

    /* ── Escalation ────────────────────────────────────────────────────── */

    public function test_a_long_unanswered_enquiry_escalates_and_copies_the_escalation_list(): void
    {
        $this->enquiry(30);

        $this->artisan('enquiries:chase --force')->assertSuccessful();

        Mail::assertSent(EnquiryUnanswered::class, fn ($m) => $m->stage === 'escalate'
            && $m->hasTo('team@vitorra.org')
            && $m->hasCc('ceo@vitorra.org'));
    }

    public function test_escalating_does_not_also_chase_the_same_enquiry(): void
    {
        $this->enquiry(30);

        $this->artisan('enquiries:chase --force');

        // One email about one enquiry, not an escalation plus a chase.
        Mail::assertSent(EnquiryUnanswered::class, 1);

        $e = Enquiry::first();
        $this->assertNotNull($e->sla_escalated_at);
        $this->assertNotNull($e->sla_notified_at, 'the chase stage should be marked spent');
    }

    public function test_escalation_happens_once(): void
    {
        $this->enquiry(30);

        $this->artisan('enquiries:chase --force');
        Mail::fake();
        $this->artisan('enquiries:chase --force');

        Mail::assertNothingSent();
    }

    /* ── Routing and grouping ──────────────────────────────────────────── */

    public function test_each_team_is_told_only_about_its_own_enquiries(): void
    {
        config(['enquiries.routing.FET.email' => 'fet@vitorra.org']);

        $this->enquiry(5, ['product_category' => 'FET']);
        $this->enquiry(5, ['product_category' => 'FET', 'email' => 'two@example.com']);
        $this->enquiry(5, ['product_category' => 'SEAL', 'email' => 'three@example.com']);

        $this->artisan('enquiries:chase --force');

        // Two inboxes, and the FET one lists both of its enquiries in a single
        // email rather than sending two separate nags.
        Mail::assertSent(EnquiryUnanswered::class, 2);
        Mail::assertSent(EnquiryUnanswered::class, fn ($m) => $m->hasTo('fet@vitorra.org')
            && $m->enquiries->count() === 2);
        Mail::assertSent(EnquiryUnanswered::class, fn ($m) => $m->hasTo('team@vitorra.org')
            && $m->enquiries->count() === 1);
    }

    /* ── Safety rails ──────────────────────────────────────────────────── */

    public function test_dry_run_reports_without_sending_or_marking(): void
    {
        $this->enquiry(5);

        $this->artisan('enquiries:chase --force --dry-run')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertNull(Enquiry::first()->sla_notified_at);
    }

    public function test_dry_run_does_not_double_count_an_escalation_as_a_chase(): void
    {
        // A real run keeps the stages apart through the database; a dry run
        // writes nothing, so it has to remember what it already covered.
        // Without that, one enquiry reads as both escalated AND chased, and the
        // preview overstates what a real run would send.
        $this->enquiry(30);

        $this->artisan('enquiries:chase --force --dry-run')
            ->expectsOutputToContain('Chased 0, escalated 1')
            ->assertSuccessful();
    }

    public function test_it_stays_silent_outside_the_sending_window(): void
    {
        $this->enquiry(5);

        // 03:00 on a Wednesday — a weekday, but nobody is reading email.
        $this->travelTo(now()->startOfWeek()->addDays(2)->setTime(3, 0), function () {
            $this->artisan('enquiries:chase')->assertSuccessful();
        });

        Mail::assertNothingSent();
    }

    public function test_a_weekend_enquiry_waits_for_monday_morning(): void
    {
        $this->enquiry(5);

        $sunday = now()->startOfWeek()->addDays(6)->setTime(10, 0);

        $this->travelTo($sunday, function () {
            $this->artisan('enquiries:chase')->assertSuccessful();
        });
        Mail::assertNothingSent();

        $this->travelTo($sunday->copy()->addDay()->setTime(9, 0), function () {
            $this->artisan('enquiries:chase')->assertSuccessful();
        });
        Mail::assertSent(EnquiryUnanswered::class);
    }
}
