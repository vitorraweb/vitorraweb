<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Tier-1 security hardening: short staff sessions, HR-only medical notes, and
 * the audit trail.
 */
class Tier1SecurityTest extends TestCase
{
    use RefreshDatabase;

    private function user(array $extra = []): User
    {
        return User::create(array_merge([
            'name'     => 'User '.uniqid(),
            'email'    => 'u-'.uniqid().'@vitorra.org',
            'password' => 'changeme123',
            'role'     => 'employee',
        ], $extra));
    }

    private function actingApi(User $user): self
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('t')->plainTextToken);
    }

    private function leaveWithNote(User $owner): LeaveRequest
    {
        Storage::fake('local');
        Storage::disk('local')->put("staff/{$owner->id}/leave/note.pdf", 'PDF');

        return LeaveRequest::create([
            'user_id'       => $owner->id, 'type' => 'sick',
            'start_date'    => '2026-02-02', 'end_date' => '2026-02-03', 'working_days' => 2,
            'status'        => 'pending', 'document_path' => "staff/{$owner->id}/leave/note.pdf",
        ]);
    }

    public function test_employee_sessions_are_short_not_thirty_days(): void
    {
        $employee = $this->user(['role' => 'employee']);

        $expiresAt = $this->postJson('/api/auth/login', [
            'email' => $employee->email, 'password' => 'changeme123',
        ])->assertOk()->json('data.expires_at');

        $this->assertNotNull($expiresAt);
        // Default staff lifetime is 8h — must be well under a day, not the 30-day customer window.
        $this->assertTrue(now()->addHours(8)->diffInMinutes($expiresAt, true) < 2);
    }

    public function test_a_line_manager_who_is_not_hr_cannot_open_a_medical_note(): void
    {
        $supervisor = $this->user(['role' => 'employee']);          // a plain supervisor, no HR module
        $applicant  = $this->user(['supervisor_id' => $supervisor->id]);
        $leave      = $this->leaveWithNote($applicant);

        $this->actingApi($supervisor)
            ->getJson("/api/staff/leave/{$leave->id}/note")
            ->assertForbidden();
    }

    public function test_hr_can_open_a_medical_note_and_it_is_audited(): void
    {
        $hr        = $this->user(['role' => 'ops', 'department' => 'operations']); // ops = HR (has the People module)
        $applicant = $this->user();
        $leave     = $this->leaveWithNote($applicant);

        $this->actingApi($hr)
            ->getJson("/api/staff/leave/{$leave->id}/note")
            ->assertOk();

        $this->assertSame(1, ActivityLog::where('action', 'sick_note.download')->where('user_id', $hr->id)->count());
    }

    public function test_owner_can_open_their_own_note_without_being_audited(): void
    {
        $applicant = $this->user();
        $leave     = $this->leaveWithNote($applicant);

        $this->actingApi($applicant)
            ->getJson("/api/staff/leave/{$leave->id}/note")
            ->assertOk();

        $this->assertSame(0, ActivityLog::where('action', 'sick_note.download')->count());
    }

    public function test_audit_log_is_readable_by_admin_only(): void
    {
        ActivityLog::create(['user_id' => null, 'action' => 'transaction.approve', 'description' => 'x', 'created_at' => now()]);

        $admin = $this->user(['role' => 'admin']);
        $this->actingApi($admin)->getJson('/api/admin/audit')->assertOk()->assertJsonPath('data.0.action', 'transaction.approve');

        // Drop the cached guard user so the next request re-resolves from its token.
        $this->app['auth']->forgetGuards();

        $ops = $this->user(['role' => 'ops', 'department' => 'operations']);
        $this->actingApi($ops)->getJson('/api/admin/audit')->assertForbidden();
    }
}
