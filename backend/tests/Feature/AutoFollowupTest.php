<?php

namespace Tests\Feature;

use App\Models\Prospect;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutoFollowupTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin '.uniqid(),
            'email' => 'admin-'.uniqid().'@vitorra.org',
            'password' => 'password123',
            'role' => 'admin',
        ]);
    }

    private function makeContact(string $email): void
    {
        Prospect::create([
            'name' => 'Quoted Co',
            'category' => 'CARGO',
            'email' => $email,
            'outreach_status' => 'contacted',
        ]);
    }

    public function test_moving_to_quoted_creates_a_followup_task(): void
    {
        $email = 'quoted@example.com';
        $this->makeContact($email);

        $admin = $this->admin();
        $owner = $this->admin();

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/customers/pipeline', [
            'email' => $email,
            'name' => 'Quoted Co',
            'owner_id' => $owner->id,
            'pipeline_stage' => 'quoted',
        ])->assertOk();

        $task = Task::where('contact_email', $email)->first();

        $this->assertNotNull($task);
        $this->assertSame($owner->id, $task->assigned_to);
        $this->assertSame('Follow up: Quoted Co', $task->title);
        $this->assertTrue($task->due_date->isSameDay(now()->addDays(3)));
    }

    public function test_repeated_quoted_update_does_not_duplicate_task(): void
    {
        $email = 'quoted2@example.com';
        $this->makeContact($email);

        $admin = $this->admin();
        $owner = $this->admin();

        $payload = [
            'email' => $email,
            'name' => 'Quoted Co',
            'owner_id' => $owner->id,
            'pipeline_stage' => 'quoted',
        ];

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/customers/pipeline', $payload)->assertOk();
        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/customers/pipeline', $payload)->assertOk();

        $this->assertSame(1, Task::where('contact_email', $email)->count());
    }

    public function test_non_followup_stage_does_not_create_task(): void
    {
        $email = 'contacted@example.com';
        $this->makeContact($email);

        $admin = $this->admin();
        $owner = $this->admin();

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/customers/pipeline', [
            'email' => $email,
            'name' => 'Quoted Co',
            'owner_id' => $owner->id,
            'pipeline_stage' => 'contacted',
        ])->assertOk();

        $this->assertSame(0, Task::where('contact_email', $email)->count());
    }
}
