<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, ?string $department = null, ?array $permissions = null): User
    {
        return User::create([
            'name' => ucfirst($role).' '.uniqid(),
            'email' => $role.'-'.uniqid().'@vitorra.org',
            'password' => 'password123',
            'role' => $role,
            'department' => $department,
            'permissions' => $permissions,
        ]);
    }

    public function test_staff_without_tasks_permission_are_blocked(): void
    {
        // IT default modules do not include... actually they do (tasks is in every
        // department). Use an explicit override without tasks.
        $u = $this->user('ops', 'finance', ['orders']);
        $this->actingAs($u, 'sanctum')->getJson('/api/admin/tasks')->assertForbidden();
    }

    public function test_a_staff_member_can_create_and_list_tasks(): void
    {
        $u = $this->user('ops', 'operations');

        $this->actingAs($u, 'sanctum')->postJson('/api/admin/tasks', [
            'title' => 'Call the supplier',
            'assigned_to' => $u->id,
            'priority' => 'high',
        ])->assertCreated()->assertJsonPath('data.created_by', $u->id);

        $this->actingAs($u, 'sanctum')->getJson('/api/admin/tasks')
            ->assertOk()
            ->assertJsonStructure(['data', 'assignees'])
            ->assertJsonPath('data.0.title', 'Call the supplier');
    }

    public function test_scoping_hides_other_peoples_tasks(): void
    {
        $marketing = $this->user('ops', 'marketing');
        $finance   = $this->user('ops', 'finance');

        // A finance task assigned to finance, created by finance.
        Task::create(['title' => 'Reconcile', 'created_by' => $finance->id, 'assigned_to' => $finance->id, 'department' => 'finance']);

        $this->actingAs($marketing, 'sanctum')->getJson('/api/admin/tasks')
            ->assertOk()->assertJsonCount(0, 'data');

        $this->actingAs($finance, 'sanctum')->getJson('/api/admin/tasks')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_department_members_see_department_tasks(): void
    {
        $a = $this->user('ops', 'sales');
        $b = $this->user('ops', 'sales');

        Task::create(['title' => 'Follow up lead', 'created_by' => $a->id, 'department' => 'sales']);

        $this->actingAs($b, 'sanctum')->getJson('/api/admin/tasks')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_admin_sees_all_tasks(): void
    {
        $admin = $this->user('admin');
        Task::create(['title' => 'X', 'created_by' => $this->user('ops', 'finance')->id, 'department' => 'finance']);
        Task::create(['title' => 'Y', 'created_by' => $this->user('ops', 'marketing')->id, 'department' => 'marketing']);

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/tasks')
            ->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_only_creator_or_admin_can_delete(): void
    {
        $creator = $this->user('ops', 'operations');
        $other   = $this->user('ops', 'operations');
        $task = Task::create(['title' => 'Shared', 'created_by' => $creator->id, 'department' => 'operations']);

        $this->actingAs($other, 'sanctum')->deleteJson("/api/admin/tasks/{$task->id}")->assertForbidden();
        $this->actingAs($creator, 'sanctum')->deleteJson("/api/admin/tasks/{$task->id}")->assertOk();
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }
}
