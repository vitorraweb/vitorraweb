<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PeopleTest extends TestCase
{
    use RefreshDatabase;

    private function person(string $role = 'employee', array $extra = []): User
    {
        return User::create($extra + [
            'name' => ucfirst($role).' '.uniqid(), 'email' => uniqid().'@vitorra.org', 'password' => 'changeme123changeme',
            'role' => $role, 'staff_status' => 'active',
        ]);
    }

    private function as(User $u, array $abilities = ['admin', 'staff']): self
    {
        $this->app['auth']->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer '.$u->createToken('t', $abilities)->plainTextToken);
    }

    private function leave(User $u, string $type, string $from, string $to, string $status = 'approved', int $days = 2): LeaveRequest
    {
        return LeaveRequest::create(['user_id' => $u->id, 'type' => $type, 'start_date' => $from, 'end_date' => $to, 'working_days' => $days, 'status' => $status]);
    }

    public function test_hr_overview_shows_who_is_away_and_what_is_coming_up(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 15)->setTime(9, 0));
        $ops = $this->person('ops', ['department' => 'operations']);
        $away = $this->person('employee', ['department' => 'finance', 'start_date' => '2024-10-02', 'date_of_birth' => '1990-10-20']);
        $newbie = $this->person('employee', ['department' => 'sales', 'start_date' => '2026-07-20', 'contract_end_date' => '2026-11-30']);
        $this->person('employee', ['staff_status' => 'left']);
        $this->leave($away, 'annual', '2026-10-14', '2026-10-16');
        $this->leave($newbie, 'annual', '2026-10-20', '2026-10-21');
        $this->leave($newbie, 'annual', '2026-12-01', '2026-12-02', 'pending');

        $d = $this->as($ops)->getJson('/api/admin/people/overview')->assertOk()->json('data');

        $this->assertSame(3, $d['headcount']);
        $this->assertSame($away->id, $d['on_leave_today'][0]['user_id']);
        $this->assertSame($newbie->id, $d['away_soon'][0]['user_id']);
        $this->assertSame(1, $d['pending_leave']);
        $this->assertSame('2026-10-20', $d['probation_ending'][0]['date']);
        $this->assertSame('2026-11-30', $d['contracts_ending'][0]['date']);
        $this->assertSame(20, $d['birthdays'][0]['day']);
        $this->assertSame(2, $d['anniversaries'][0]['years']);
        $this->assertSame('2026-09', $d['missing_reports']['period']);
    }

    public function test_employee_records_show_leave_taken_and_hr_can_update_hr_fields_only(): void
    {
        $ops = $this->person('ops', ['department' => 'operations']);
        $emp = $this->person('employee', ['leave_entitlement_days' => 21]);
        $this->leave($emp, 'annual', now()->startOfYear()->addDays(40)->toDateString(), now()->startOfYear()->addDays(44)->toDateString(), 'approved', 5);
        $this->leave($emp, 'sick', now()->startOfYear()->addDays(60)->toDateString(), now()->startOfYear()->addDays(60)->toDateString(), 'approved', 1);

        $row = collect($this->as($ops)->getJson('/api/admin/people/employees')->assertOk()->json('data'))->firstWhere('id', $emp->id);
        $this->assertSame(['entitlement' => 21, 'annual_used' => 5, 'annual_left' => 16, 'sick_used' => 1, 'other_used' => 0], $row['leave']);

        $this->as($ops)->patchJson("/api/admin/people/employees/{$emp->id}", [
            'employment_type' => 'contract', 'contract_end_date' => '2027-03-31', 'emergency_contact_phone' => '+256700000000',
            'role' => 'admin', 'email' => 'x@evil.test', // not HR's to change — ignored
        ])->assertOk()->assertJsonPath('data.employment_type', 'contract');

        $emp->refresh();
        $this->assertSame('employee', $emp->role);
        $this->assertStringEndsWith('@vitorra.org', $emp->email);
        $this->assertSame('2027-03-31', $emp->contract_end_date->toDateString());
        $this->assertDatabaseHas('activity_logs', ['action' => 'people.employee_updated']);
    }

    public function test_people_screens_need_the_people_module(): void
    {
        $sales = $this->person('ops', ['department' => 'sales']);
        $this->as($sales)->getJson('/api/admin/people/overview')->assertForbidden();
        $emp = $this->person();
        $this->as($emp, ['staff'])->getJson('/api/admin/people/employees')->assertForbidden();
    }

    public function test_calendar_hr_sees_types_staff_see_only_their_departments_approved_leave(): void
    {
        $ops = $this->person('ops', ['department' => 'operations']);
        $me = $this->person('employee', ['department' => 'finance']);
        $mate = $this->person('employee', ['department' => 'finance']);
        $other = $this->person('employee', ['department' => 'sales']);
        $month = now()->format('Y-m');
        $day = now()->startOfMonth()->addDays(3)->toDateString();
        $this->leave($mate, 'sick', $day, $day, 'approved', 1);
        $this->leave($mate, 'annual', $day, $day, 'pending', 1);
        $this->leave($other, 'annual', $day, $day, 'approved', 1);

        $hr = $this->as($ops)->getJson("/api/admin/people/calendar?month={$month}")->assertOk()->json('data.leave');
        $this->assertCount(3, $hr);
        $this->assertContains('sick', array_column($hr, 'type'));

        $staff = $this->as($me, ['staff'])->getJson("/api/staff/calendar?month={$month}")->assertOk()->json('data.leave');
        $this->assertCount(1, $staff);
        $this->assertSame($mate->id, $staff[0]['user_id']);
        $this->assertArrayNotHasKey('type', $staff[0]);
    }

    public function test_announcements_reach_the_right_people_until_they_expire(): void
    {
        $ops = $this->person('ops', ['department' => 'operations']);
        $fin = $this->person('employee', ['department' => 'finance']);
        $sales = $this->person('employee', ['department' => 'sales']);

        $this->as($ops)->postJson('/api/admin/announcements', ['title' => 'Office closed Friday', 'body' => 'Public holiday.', 'pinned' => true])->assertCreated();
        $this->as($ops)->postJson('/api/admin/announcements', ['title' => 'Finance: close the books', 'body' => 'By the 5th.', 'department' => 'finance'])->assertCreated();
        Announcement::create(['title' => 'Old news', 'body' => 'x', 'expires_at' => now()->subDay()]);

        $seen = fn (User $u) => array_column($this->as($u, ['staff'])->getJson('/api/staff/announcements')->assertOk()->json('data'), 'title');
        $this->assertSame(['Office closed Friday', 'Finance: close the books'], $seen($fin));
        $this->assertSame(['Office closed Friday'], $seen($sales));

        $this->as($fin, ['staff'])->postJson('/api/admin/announcements', ['title' => 'x', 'body' => 'y'])->assertForbidden();
    }

    public function test_staff_keep_their_own_phone_and_emergency_contact_up_to_date(): void
    {
        $emp = $this->person();
        $this->as($emp, ['staff'])->putJson('/api/staff/profile', [
            'phone' => '+256711111111', 'emergency_contact_name' => 'Jane', 'emergency_contact_phone' => '+256722222222',
            'emergency_contact_relation' => 'Sister', 'job_title' => 'CEO',
        ])->assertOk()->assertJsonPath('data.emergency_contact_name', 'Jane');

        $this->assertNull($emp->fresh()->job_title);
    }

    public function test_console_session_reaches_self_service_without_a_second_login(): void
    {
        $ops = $this->person('ops', ['department' => 'finance']);
        $this->as($ops, ['admin', 'staff'])->getJson('/api/staff/leave')->assertOk();
        $this->as($ops, ['admin', 'staff'])->getJson('/api/staff/me')->assertOk()->assertJsonPath('data.id', $ops->id);
    }
}
