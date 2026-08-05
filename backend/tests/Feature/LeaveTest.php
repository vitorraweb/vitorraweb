<?php

namespace Tests\Feature;

use App\Models\CompanyEvent;
use App\Models\LeaveRequest;
use App\Models\PublicHoliday;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LeaveTest extends TestCase
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

    public function test_working_days_exclude_weekends_and_holidays(): void
    {
        Mail::fake();
        // Mon 2026-01-05 → Fri 2026-01-09 is 5 weekdays; one holiday lands midweek.
        PublicHoliday::create(['name' => 'Test Holiday', 'date' => '2026-01-07', 'recurring' => false]);
        $user = $this->staff();

        $this->actingApi($user)
            ->postJson('/api/staff/leave', ['type' => 'annual', 'start_date' => '2026-01-05', 'end_date' => '2026-01-09'])
            ->assertCreated()
            ->assertJsonPath('data.working_days', 4);
    }

    public function test_same_department_clash_is_rejected(): void
    {
        Mail::fake();
        $colleague = $this->staff(['department' => 'finance']);
        $applicant = $this->staff(['department' => 'finance']);

        // Existing approved leave for a colleague in the same department.
        LeaveRequest::create([
            'user_id' => $colleague->id, 'type' => 'annual',
            'start_date' => '2026-01-05', 'end_date' => '2026-01-09', 'working_days' => 5, 'status' => 'approved',
        ]);

        $this->actingApi($applicant)
            ->postJson('/api/staff/leave', ['type' => 'annual', 'start_date' => '2026-01-06', 'end_date' => '2026-01-08'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('start_date');
    }

    public function test_blackout_period_is_rejected(): void
    {
        Mail::fake();
        CompanyEvent::create(['title' => 'Annual Audit', 'start_date' => '2026-01-05', 'end_date' => '2026-01-16', 'blocks_leave' => true]);
        $user = $this->staff();

        $this->actingApi($user)
            ->postJson('/api/staff/leave', ['type' => 'annual', 'start_date' => '2026-01-06', 'end_date' => '2026-01-08'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('start_date');
    }

    public function test_annual_balance_is_enforced(): void
    {
        Mail::fake();
        $user = $this->staff(['leave_entitlement_days' => 2]);

        // Mon–Fri = 5 working days, exceeds the 2-day entitlement.
        $this->actingApi($user)
            ->postJson('/api/staff/leave', ['type' => 'annual', 'start_date' => '2026-01-05', 'end_date' => '2026-01-09'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('type');
    }

    public function test_sick_leave_requires_a_document(): void
    {
        Mail::fake();
        $user = $this->staff();

        $this->actingApi($user)
            ->postJson('/api/staff/leave', ['type' => 'sick', 'start_date' => '2026-01-05', 'end_date' => '2026-01-06'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('document');

        Storage::fake('local');
        $this->actingApi($user)
            ->postJson('/api/staff/leave', [
                'type' => 'sick', 'start_date' => '2026-01-05', 'end_date' => '2026-01-06',
                'document' => UploadedFile::fake()->create('note.pdf', 20, 'application/pdf'),
            ])
            ->assertCreated();
    }

    public function test_unrelated_employee_cannot_review_a_request(): void
    {
        $applicant = $this->staff();
        $leave = LeaveRequest::create([
            'user_id' => $applicant->id, 'type' => 'annual',
            'start_date' => '2026-01-05', 'end_date' => '2026-01-06', 'working_days' => 2, 'status' => 'pending',
        ]);
        $stranger = $this->staff();

        $this->actingApi($stranger)
            ->postJson("/api/staff/leave/{$leave->id}/decision", ['status' => 'approved'])
            ->assertForbidden();
    }

    public function test_supervisor_can_approve_and_employee_is_emailed(): void
    {
        Mail::fake();
        $supervisor = $this->staff(['role' => 'ops']);
        $applicant  = $this->staff(['supervisor_id' => $supervisor->id]);
        $leave = LeaveRequest::create([
            'user_id' => $applicant->id, 'type' => 'annual',
            'start_date' => '2026-01-05', 'end_date' => '2026-01-06', 'working_days' => 2, 'status' => 'pending',
        ]);

        $this->actingApi($supervisor)
            ->postJson("/api/staff/leave/{$leave->id}/decision", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertSame('approved', $leave->fresh()->status);
        Mail::assertSent(\App\Mail\LeaveDecided::class);
    }

    public function test_nobody_can_approve_their_own_leave_not_even_an_admin(): void
    {
        foreach (['admin', 'ops', 'employee'] as $role) {
            // The auth guard caches the resolved user for the lifetime of the
            // test app, so without this every request after the first would run
            // as the previous role rather than the new applicant.
            $this->app['auth']->forgetGuards();

            $applicant = $this->staff(['role' => $role]);
            $leave = LeaveRequest::create([
                'user_id' => $applicant->id, 'type' => 'annual',
                'start_date' => '2026-01-05', 'end_date' => '2026-01-06', 'working_days' => 2, 'status' => 'pending',
            ]);

            $this->actingApi($applicant)
                ->postJson("/api/staff/leave/{$leave->id}/decision", ['status' => 'approved'])
                ->assertForbidden();

            $this->assertSame('pending', $leave->fresh()->status, "{$role} approved their own leave");
        }
    }

    public function test_admin_cannot_approve_their_own_leave_from_the_hr_screen(): void
    {
        $admin = $this->staff(['role' => 'admin']);
        $leave = LeaveRequest::create([
            'user_id' => $admin->id, 'type' => 'annual',
            'start_date' => '2026-01-05', 'end_date' => '2026-01-06', 'working_days' => 2, 'status' => 'pending',
        ]);

        $this->actingApi($admin)
            ->postJson("/api/admin/leave/{$leave->id}/decision", ['status' => 'approved'])
            ->assertForbidden();

        $this->assertSame('pending', $leave->fresh()->status);
    }

    public function test_own_request_is_not_listed_in_the_review_queue(): void
    {
        $admin     = $this->staff(['role' => 'admin']);
        $applicant = $this->staff();

        $own = LeaveRequest::create([
            'user_id' => $admin->id, 'type' => 'annual',
            'start_date' => '2026-01-05', 'end_date' => '2026-01-06', 'working_days' => 2, 'status' => 'pending',
        ]);
        $theirs = LeaveRequest::create([
            'user_id' => $applicant->id, 'type' => 'annual',
            'start_date' => '2026-02-05', 'end_date' => '2026-02-06', 'working_days' => 2, 'status' => 'pending',
        ]);

        $res = $this->actingApi($admin)->getJson('/api/staff/leave/pending')->assertOk();

        $ids = array_column($res->json('data'), 'id');
        $this->assertNotContains($own->id, $ids, 'reviewer saw their own request in the queue');
        $this->assertContains($theirs->id, $ids);
    }
}
