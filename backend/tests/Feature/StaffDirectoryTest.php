<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffDirectoryTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin', 'email' => 'admin-'.uniqid().'@vitorra.org',
            'password' => 'password123', 'role' => 'admin',
        ]);
    }

    public function test_admin_lists_staff_with_module_registry(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonStructure(['data', 'modules', 'departments', 'department_modules']);
    }

    public function test_admin_creates_a_staff_member_with_department_and_permissions(): void
    {
        $res = $this->actingAs($this->admin(), 'sanctum')->postJson('/api/admin/users', [
            'name'        => 'Sarah Marketing',
            'email'       => 'sarah@vitorra.org',
            'role'        => 'ops',
            'password'    => 'password123',
            'department'  => 'marketing',
            'job_title'   => 'Marketing Officer',
            'start_date'  => '2026-06-01',
            'permissions' => ['blog', 'media'],
        ]);

        $res->assertCreated()->assertJsonPath('data.department', 'marketing');
        $this->assertDatabaseHas('users', ['email' => 'sarah@vitorra.org', 'role' => 'ops', 'department' => 'marketing']);

        $sarah = User::where('email', 'sarah@vitorra.org')->first();
        $this->assertEqualsCanonicalizing(['blog', 'media', 'dashboard'], $sarah->effectivePermissions());
    }

    public function test_admin_updates_staff_permissions(): void
    {
        $staff = User::create([
            'name' => 'Joe', 'email' => 'joe@vitorra.org', 'password' => 'password123',
            'role' => 'ops', 'department' => 'finance',
        ]);

        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson("/api/admin/users/{$staff->id}", ['permissions' => ['orders', 'customers']])
            ->assertOk();

        $this->assertEqualsCanonicalizing(['orders', 'customers', 'dashboard'], $staff->fresh()->effectivePermissions());
    }

    public function test_invalid_department_is_rejected(): void
    {
        $this->actingAs($this->admin(), 'sanctum')->postJson('/api/admin/users', [
            'name' => 'X', 'email' => 'x@vitorra.org', 'role' => 'ops', 'password' => 'password123',
            'department' => 'not-a-department',
        ])->assertStatus(422);
    }

    public function test_ops_cannot_manage_staff(): void
    {
        $ops = User::create([
            'name' => 'Ops', 'email' => 'ops@vitorra.org', 'password' => 'password123',
            'role' => 'ops', 'department' => 'operations',
        ]);

        $this->actingAs($ops, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_cannot_demote_the_last_admin(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$admin->id}", ['role' => 'ops'])
            ->assertStatus(422);
    }
}
