<?php

namespace Tests\Feature;

use App\Models\StaffDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StaffPortalTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, array $extra = []): User
    {
        return User::create(array_merge([
            'name'     => ucfirst($role).' '.uniqid(),
            'email'    => $role.'-'.uniqid().'@vitorra.org',
            'password' => 'changeme123',
            'role'     => $role,
        ], $extra));
    }

    public function test_employee_can_use_staff_portal_but_not_admin(): void
    {
        $employee = $this->user('employee');
        $token = $employee->createToken('t')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/staff/me')
            ->assertOk()
            ->assertJsonPath('data.id', $employee->id);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/stats')
            ->assertForbidden();
    }

    public function test_customer_cannot_use_staff_portal(): void
    {
        $customer = $this->user('customer');
        $token = $customer->createToken('t')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/staff/me')
            ->assertForbidden();
    }

    public function test_me_returns_the_assigned_supervisor(): void
    {
        $supervisor = $this->user('ops', ['job_title' => 'Head of Ops']);
        $report     = $this->user('employee', ['supervisor_id' => $supervisor->id]);

        // One user's token per test — the test guard caches the resolved user
        // across requests, so mixing tokens in one method gives false results.
        $this->withHeader('Authorization', "Bearer {$report->createToken('t')->plainTextToken}")
            ->getJson('/api/staff/me')
            ->assertOk()
            ->assertJsonPath('data.supervisor.id', $supervisor->id)
            ->assertJsonPath('data.is_supervisor', false);
    }

    public function test_supervisor_sees_their_reports(): void
    {
        $supervisor = $this->user('ops', ['job_title' => 'Head of Ops']);
        $report     = $this->user('employee', ['supervisor_id' => $supervisor->id]);

        $supToken = $supervisor->createToken('t')->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$supToken}")
            ->getJson('/api/staff/me')
            ->assertOk()
            ->assertJsonPath('data.is_supervisor', true);

        $this->withHeader('Authorization', "Bearer {$supToken}")
            ->getJson('/api/staff/team')
            ->assertOk()
            ->assertJsonPath('data.0.id', $report->id);
    }

    public function test_admin_uploads_a_private_document_visible_to_the_owner(): void
    {
        Storage::fake('local');
        $admin    = $this->user('admin');
        $employee = $this->user('employee');
        $adminToken = $admin->createToken('t')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson("/api/admin/users/{$employee->id}/documents", [
                'type'  => 'contract',
                'title' => 'Employment contract',
                'file'  => UploadedFile::fake()->create('contract.pdf', 40, 'application/pdf'),
            ])
            ->assertCreated();

        $doc = StaffDocument::where('user_id', $employee->id)->first();
        $this->assertNotNull($doc);
        Storage::disk('local')->assertExists($doc->path);

        // Owner can download their own document.
        $empToken = $employee->createToken('t')->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$empToken}")
            ->get("/api/staff/documents/{$doc->id}/download")
            ->assertOk();
    }

    public function test_other_employee_cannot_download_someone_elses_document(): void
    {
        Storage::fake('local');
        $owner = $this->user('employee');
        $other = $this->user('employee');
        $doc = $owner->staffDocuments()->create([
            'type' => 'contract', 'title' => 'Contract', 'path' => 'staff/'.$owner->id.'/c.pdf',
        ]);
        Storage::disk('local')->put($doc->path, 'data');

        $otherToken = $other->createToken('t')->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$otherToken}")
            ->get("/api/staff/documents/{$doc->id}/download")
            ->assertForbidden();
    }

    public function test_admin_can_set_supervisor_jd_and_leave_entitlement(): void
    {
        $admin      = $this->user('admin');
        $supervisor = $this->user('ops');
        $employee   = $this->user('employee');

        $this->withHeader('Authorization', "Bearer {$admin->createToken('t')->plainTextToken}")
            ->patchJson("/api/admin/users/{$employee->id}", [
                'supervisor_id'          => $supervisor->id,
                'job_description'        => 'Run the front desk.',
                'leave_entitlement_days' => 25,
                'role'                   => 'employee',
            ])
            ->assertOk();

        $employee->refresh();
        $this->assertSame($supervisor->id, $employee->supervisor_id);
        $this->assertSame('Run the front desk.', $employee->job_description);
        $this->assertSame(25, $employee->leave_entitlement_days);
    }
}
