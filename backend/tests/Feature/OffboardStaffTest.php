<?php

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OffboardStaffTest extends TestCase
{
    use RefreshDatabase;

    private function user(array $extra = []): User
    {
        return User::create(array_merge([
            'name'         => 'Leaver',
            'email'        => 'leaver-'.uniqid().'@vitorra.org',
            'password'     => 'changeme123',
            'role'         => 'employee',
            'staff_status' => 'active',
        ], $extra));
    }

    public function test_offboarding_revokes_access_but_keeps_the_employment_record(): void
    {
        $user = $this->user();
        $user->createToken('phone');
        $leave = LeaveRequest::create([
            'user_id' => $user->id, 'type' => 'annual',
            'start_date' => '2026-01-05', 'end_date' => '2026-01-06',
            'working_days' => 2, 'status' => 'approved',
        ]);

        $this->artisan("staff:offboard {$user->email} --force")->assertSuccessful();

        $user->refresh();
        $this->assertSame('left', $user->staff_status);
        $this->assertSame([], $user->permissions);
        $this->assertSame(0, $user->tokens()->count(), 'active sessions were not revoked');

        // The record itself must survive — it anchors HR and audit history.
        $this->assertNotNull(User::find($user->id));
        $this->assertNotNull(LeaveRequest::find($leave->id), 'leave history was destroyed');
    }

    public function test_a_departed_staff_member_can_no_longer_sign_in(): void
    {
        $user = $this->user(['password' => 'a-very-long-password-1']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email, 'password' => 'a-very-long-password-1',
        ])->assertOk();

        $this->app['auth']->forgetGuards();
        $this->artisan("staff:offboard {$user->email} --force")->assertSuccessful();

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', [
            'email' => $user->email, 'password' => 'a-very-long-password-1',
        ])->assertStatus(422);
    }

    public function test_marking_someone_left_in_admin_also_closes_their_login(): void
    {
        // /admin/staff can set staff_status directly — that route must shut the
        // account too, not just relabel it.
        $user = $this->user(['password' => 'a-very-long-password-1']);
        $user->forceFill(['staff_status' => 'left'])->save();

        $this->postJson('/api/auth/login', [
            'email' => $user->email, 'password' => 'a-very-long-password-1',
        ])->assertStatus(422);
    }

    public function test_reports_are_detached_from_a_closed_supervisor(): void
    {
        $supervisor = $this->user(['role' => 'ops']);
        $report     = $this->user(['supervisor_id' => $supervisor->id]);

        $this->artisan("staff:offboard {$supervisor->email} --force")->assertSuccessful();

        $this->assertNull($report->fresh()->supervisor_id);
    }

    public function test_refuses_to_close_the_only_admin(): void
    {
        $admin = $this->user(['role' => 'admin']);

        $this->artisan("staff:offboard {$admin->email} --force")->assertFailed();

        $this->assertSame('active', $admin->fresh()->staff_status);
    }

    public function test_unknown_email_fails_rather_than_guessing(): void
    {
        $this->artisan('staff:offboard nobody@vitorra.org --force')->assertFailed();
    }
}
