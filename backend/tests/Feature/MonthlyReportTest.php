<?php

namespace Tests\Feature;

use App\Models\MonthlyReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MonthlyReportTest extends TestCase
{
    use RefreshDatabase;

    private function staff(array $extra = []): User
    {
        return User::create(array_merge([
            'name'     => 'Staff '.uniqid(),
            'email'    => 'staff-'.uniqid().'@vitorra.org',
            'password' => 'changeme123',
            'role'     => 'employee',
        ], $extra));
    }

    private function actingApi(User $user): self
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('t')->plainTextToken);
    }

    public function test_employee_can_draft_then_submit_a_report(): void
    {
        Mail::fake();
        $supervisor = $this->staff(['role' => 'ops']);
        $user = $this->staff(['supervisor_id' => $supervisor->id]);

        // Draft — no notification yet.
        $this->actingApi($user)
            ->postJson('/api/staff/reports', [
                'period' => '2026-06', 'status' => 'draft',
                'items'  => [['label' => 'Closed June books', 'done' => true, 'note' => '']],
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft');
        Mail::assertNothingSent();

        // Submit — supervisor notified.
        $this->actingApi($user)
            ->postJson('/api/staff/reports', ['period' => '2026-06', 'status' => 'submitted', 'items' => []])
            ->assertOk()
            ->assertJsonPath('data.status', 'submitted');
        Mail::assertSent(\App\Mail\ReportSubmitted::class);

        $this->assertSame(1, MonthlyReport::where('user_id', $user->id)->count()); // upsert, not duplicate
    }

    public function test_unrelated_staff_cannot_review_a_report(): void
    {
        $author = $this->staff();
        $report = MonthlyReport::create(['user_id' => $author->id, 'period' => '2026-06', 'status' => 'submitted', 'submitted_at' => now()]);
        $stranger = $this->staff();

        $this->actingApi($stranger)
            ->postJson("/api/staff/reports/{$report->id}/review", ['rating' => 5])
            ->assertForbidden();
    }

    public function test_supervisor_reviews_a_report(): void
    {
        Mail::fake();
        $supervisor = $this->staff(['role' => 'ops']);
        $author = $this->staff(['supervisor_id' => $supervisor->id]);
        $report = MonthlyReport::create(['user_id' => $author->id, 'period' => '2026-06', 'status' => 'submitted', 'submitted_at' => now()]);

        $this->actingApi($supervisor)
            ->postJson("/api/staff/reports/{$report->id}/review", ['rating' => 4, 'supervisor_comment' => 'Solid month.'])
            ->assertOk()
            ->assertJsonPath('data.status', 'reviewed');

        Mail::assertSent(\App\Mail\ReportReviewed::class);
        $this->assertSame('reviewed', $report->fresh()->status);
    }

    public function test_a_reviewed_report_is_locked_against_edits(): void
    {
        // One actor per test (the test guard caches the resolved user).
        $author = $this->staff();
        MonthlyReport::create(['user_id' => $author->id, 'period' => '2026-06', 'status' => 'reviewed', 'reviewed_at' => now()]);

        $this->actingApi($author)
            ->postJson('/api/staff/reports', ['period' => '2026-06', 'status' => 'draft', 'items' => []])
            ->assertStatus(422);
    }

    public function test_probation_lists_recent_starters_with_days_remaining(): void
    {
        $admin = $this->staff(['role' => 'admin']);
        $newJoiner = $this->staff(['start_date' => now()->subMonth()->toDateString()]);   // ~2 months left
        $veteran   = $this->staff(['start_date' => now()->subYear()->toDateString()]);    // past probation

        $res = $this->actingApi($admin)->getJson('/api/admin/probation')->assertOk();

        $ids = collect($res->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($newJoiner->id));
        $this->assertFalse($ids->contains($veteran->id));
    }
}
