<?php

namespace Tests\Feature;

use App\Mail\StaffAnnouncement;
use App\Models\LeaveApproval;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LeaveTrackerTest extends TestCase
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

    public function test_tracker_has_one_row_per_current_employee_with_balances(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 10)->setTime(9, 0));
        $ops = $this->person('ops', ['department' => 'operations', 'name' => 'Victor Ops']);
        $amy = $this->person('employee', ['department' => 'finance', 'name' => 'Amy Finance', 'leave_entitlement_days' => 21]);
        $this->person('employee', ['staff_status' => 'left', 'name' => 'Gone Person']);
        $this->leave($amy, 'annual', '2026-03-02', '2026-03-06', 'approved', 5);
        $this->leave($amy, 'sick', '2026-04-01', '2026-04-02', 'approved', 2);
        $this->leave($amy, 'annual', '2026-12-14', '2026-12-16', 'pending', 3);
        $this->leave($amy, 'annual', '2026-11-09', '2026-11-11', 'approved', 3);
        $this->leave($amy, 'annual', '2026-05-04', '2026-05-05', 'declined', 2);

        $d = $this->as($ops)->getJson('/api/admin/people/leave-tracker?year=2026')->assertOk()->json('data');

        $this->assertSame(['Amy Finance', 'Victor Ops'], array_column($d['rows'], 'name'));
        $row = $d['rows'][0];
        $this->assertSame(8, $row['taken']['annual']);
        $this->assertSame(2, $row['taken']['sick']);
        $this->assertSame(3, $row['pending_days']);
        $this->assertSame(21 - 8 - 3, $row['annual_left']);
        $this->assertSame('2026-11-11', $row['current']['end_date']);
        $this->assertNotSame($d['rows'][0]['colour'], $d['rows'][1]['colour']);
    }

    public function test_tracker_export_and_access(): void
    {
        $ops = $this->person('ops', ['department' => 'operations']);
        $emp = $this->person('employee');

        $this->as($emp, ['staff'])->getJson('/api/admin/people/leave-tracker')->assertForbidden();
        $res = $this->as($ops)->get('/api/admin/people/leave-tracker/export?year=2026')->assertOk();
        $this->assertStringContainsString('Annual entitlement', $res->streamedContent());
    }

    public function test_calendar_gives_each_person_a_stable_distinct_colour(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 10));
        $ops = $this->person('ops', ['department' => 'operations']);
        $a = $this->person('employee', ['department' => 'sales']);
        $b = $this->person('employee', ['department' => 'sales']);
        $this->leave($a, 'annual', '2026-11-12', '2026-11-13');
        $this->leave($b, 'annual', '2026-11-16', '2026-11-17');

        $rows = collect($this->as($ops)->getJson('/api/admin/people/calendar?month=2026-11')->json('data.leave'))->keyBy('user_id');
        $staff = collect($this->as($a, ['staff'])->getJson('/api/staff/calendar?month=2026-11')->json('data.leave'))->keyBy('user_id');

        $this->assertNotSame($rows[$a->id]['colour'], $rows[$b->id]['colour']);
        $this->assertSame($rows[$a->id]['colour'], $staff[$a->id]['colour']);
    }

    public function test_leave_form_pdf_blank_mine_and_for_a_request(): void
    {
        $sup = $this->person('ops', ['department' => 'operations', 'name' => 'Sam Supervisor']);
        $emp = $this->person('employee', ['department' => 'sales', 'supervisor_id' => $sup->id]);
        $other = $this->person('employee');
        $l = $this->leave($emp, 'annual', '2026-11-16', '2026-11-18', 'pending', 3);
        LeaveApproval::create(['leave_request_id' => $l->id, 'user_id' => $sup->id, 'stage' => 'operations', 'decision' => 'approved']);

        $this->as($emp, ['staff'])->get('/api/staff/leave/form')->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->as($emp, ['staff'])->get('/api/staff/leave/form?blank=1')->assertOk();
        $this->as($emp, ['staff'])->get("/api/staff/leave/{$l->id}/form")->assertOk();
        $this->as($other, ['staff'])->get("/api/staff/leave/{$l->id}/form")->assertForbidden();
        $this->as($sup)->get("/api/admin/leave/{$l->id}/form")->assertOk();
        $this->as($sup)->get("/api/admin/people/employees/{$emp->id}/leave-form")->assertOk();
    }

    public function test_history_filters_by_employee(): void
    {
        $ops = $this->person('ops', ['department' => 'operations']);
        $a = $this->person();
        $b = $this->person();
        $this->leave($a, 'annual', '2026-03-02', '2026-03-03');
        $this->leave($b, 'annual', '2026-03-02', '2026-03-03');

        $this->as($ops)->getJson("/api/admin/leave?user_id={$a->id}")->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_announcement_can_be_emailed_to_staff(): void
    {
        Mail::fake();
        $ops = $this->person('ops', ['department' => 'operations']);
        $this->person('employee', ['department' => 'sales']);
        $this->person('employee', ['staff_status' => 'left']);

        $this->as($ops)->postJson('/api/admin/announcements', ['title' => 'New leave tracker', 'body' => 'Read this.', 'email_staff' => true])
            ->assertCreated()->assertJsonPath('data.emailed', 2);
        Mail::assertSent(StaffAnnouncement::class, 2);

        $this->as($ops)->postJson('/api/admin/announcements', ['title' => 'Quiet one', 'body' => 'No email.'])->assertCreated();
        Mail::assertSent(StaffAnnouncement::class, 2);
    }

    public function test_operations_records_leave_already_taken_and_the_balance_follows(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 10)->setTime(9, 0));
        $ops = $this->person('ops', ['department' => 'operations']);
        $emp = $this->person('employee', ['department' => 'sales', 'leave_entitlement_days' => 21]);

        // Mon 2 Mar to Fri 6 Mar: five working days, worked out by the system.
        $id = $this->as($ops)->postJson('/api/admin/people/leave-record', ['user_id' => $emp->id, 'type' => 'annual', 'start_date' => '2026-03-02', 'end_date' => '2026-03-06', 'note' => 'Paper form'])
            ->assertCreated()->assertJsonPath('data.status', 'approved')->assertJsonPath('data.working_days', 5)->json('data.id');

        // Days entered by hand when the count differs.
        $this->as($ops)->postJson('/api/admin/people/leave-record', ['user_id' => $emp->id, 'type' => 'sick', 'start_date' => '2026-04-01', 'end_date' => '2026-04-03', 'working_days' => 2])
            ->assertCreated()->assertJsonPath('data.working_days', 2);

        $row = collect($this->as($ops)->getJson('/api/admin/people/leave-tracker?year=2026')->json('data.rows'))->firstWhere('id', $emp->id);
        $this->assertSame(16, $row['annual_left']);
        $this->assertSame(2, $row['taken']['sick']);

        // The employee sees it, marked as recorded by Operations, and the balance agrees.
        $mine = $this->as($emp, ['staff'])->getJson('/api/staff/leave')->assertOk();
        $this->assertSame(16, $mine->json('balance.remaining'));
        $this->assertNotNull(collect($mine->json('data'))->firstWhere('id', $id)['recorded_by']);

        // The employee cannot cancel what Operations recorded.
        $this->as($emp, ['staff'])->postJson("/api/staff/leave/{$id}/cancel")->assertStatus(422);

        // A mistake can be removed; applied-for leave cannot be removed this way.
        $this->as($ops)->deleteJson("/api/admin/people/leave-record/{$id}")->assertOk();
        $applied = $this->leave($emp, 'annual', '2026-05-04', '2026-05-05');
        $this->as($ops)->deleteJson("/api/admin/people/leave-record/{$applied->id}")->assertStatus(422);
    }

    public function test_recording_refuses_future_leave_overlaps_own_leave_and_non_operations(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 10)->setTime(9, 0));
        $ops = $this->person('ops', ['department' => 'operations']);
        $emp = $this->person('employee', ['department' => 'sales']);
        $this->leave($emp, 'annual', '2026-06-01', '2026-06-05');
        $row = fn (array $x) => $x + ['user_id' => $emp->id, 'type' => 'annual'];

        $this->as($ops)->postJson('/api/admin/people/leave-record', $row(['start_date' => '2026-12-01', 'end_date' => '2026-12-02']))->assertJsonValidationErrors('start_date');
        $this->as($ops)->postJson('/api/admin/people/leave-record', $row(['start_date' => '2026-06-04', 'end_date' => '2026-06-08']))->assertJsonValidationErrors('start_date');
        $this->as($ops)->postJson('/api/admin/people/leave-record', ['user_id' => $ops->id, 'type' => 'annual', 'start_date' => '2026-07-01', 'end_date' => '2026-07-01'])->assertJsonValidationErrors('user_id');
        $this->as($emp, ['staff'])->postJson('/api/admin/people/leave-record', $row(['start_date' => '2026-07-01', 'end_date' => '2026-07-01']))->assertForbidden();
    }
}
