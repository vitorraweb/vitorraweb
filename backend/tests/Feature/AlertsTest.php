<?php

namespace Tests\Feature;

use App\Models\Enquiry;
use App\Models\Prospect;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlertsTest extends TestCase
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

    private function ops(string $department = 'marketing'): User
    {
        return User::create([
            'name' => 'Ops '.uniqid(),
            'email' => 'ops-'.uniqid().'@vitorra.org',
            'password' => 'password123',
            'role' => 'ops',
            'department' => $department,
        ]);
    }

    public function test_stale_contact_is_flagged_after_threshold(): void
    {
        $stale = Prospect::create([
            'name' => 'Stale Co',
            'category' => 'CARGO',
            'email' => 'stale@example.com',
            'outreach_status' => 'not_contacted',
        ]);
        $stale->forceFill(['created_at' => now()->subDays(6)])->save();

        Prospect::create([
            'name' => 'Fresh Co',
            'category' => 'CARGO',
            'email' => 'fresh@example.com',
            'outreach_status' => 'not_contacted',
        ]);

        $admin = $this->admin();
        $res = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/customers?per_page=500')
            ->assertOk();

        $staleContact = collect($res->json('data'))->firstWhere('email', 'stale@example.com');
        $freshContact = collect($res->json('data'))->firstWhere('email', 'fresh@example.com');

        $this->assertTrue($staleContact['stale']);
        $this->assertFalse($freshContact['stale']);
    }

    public function test_alerts_endpoint_lists_stale_contacts_overdue_tasks_and_unactioned_enquiries(): void
    {
        $admin = $this->admin();

        $stale = Prospect::create([
            'name' => 'Stale Co',
            'category' => 'CARGO',
            'email' => 'stale@example.com',
            'outreach_status' => 'not_contacted',
        ]);
        $stale->forceFill(['created_at' => now()->subDays(6)])->save();

        $task = Task::create([
            'title' => 'Overdue task',
            'assigned_to' => $admin->id,
            'created_by' => $admin->id,
            'status' => 'todo',
            'priority' => 'normal',
            'due_date' => now()->subDay(),
        ]);

        $enquiry = Enquiry::create([
            'product_category' => 'fuel-eco-tech',
            'name' => 'Old Lead',
            'email' => 'oldlead@example.com',
            'message' => 'Hello',
            'status' => 'new',
        ]);
        $enquiry->forceFill(['created_at' => now()->subHours(48)])->save();

        $res = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/alerts')
            ->assertOk();

        $data = $res->json('data');

        $this->assertGreaterThanOrEqual(1, $data['stale_contacts']['count']);
        $this->assertTrue(collect($data['stale_contacts']['items'])->contains('email', 'stale@example.com'));

        $this->assertGreaterThanOrEqual(1, $data['overdue_tasks']['count']);
        $this->assertTrue(collect($data['overdue_tasks']['items'])->contains('id', $task->id));

        $this->assertGreaterThanOrEqual(1, $data['unactioned_enquiries']['count']);
        $this->assertTrue(collect($data['unactioned_enquiries']['items'])->contains('id', $enquiry->id));
    }

    public function test_alerts_scoped_to_owner_for_non_admin(): void
    {
        $admin = $this->admin();
        $userA = $this->ops();
        $userB = $this->ops();

        $contactA = Prospect::create([
            'name' => 'A Co',
            'category' => 'CARGO',
            'email' => 'a-stale@example.com',
            'outreach_status' => 'not_contacted',
        ]);
        $contactA->forceFill(['created_at' => now()->subDays(6)])->save();

        $contactB = Prospect::create([
            'name' => 'B Co',
            'category' => 'CARGO',
            'email' => 'b-stale@example.com',
            'outreach_status' => 'not_contacted',
        ]);
        $contactB->forceFill(['created_at' => now()->subDays(6)])->save();

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/customers/pipeline', [
            'email' => 'a-stale@example.com',
            'owner_id' => $userA->id,
            'pipeline_stage' => 'lead',
        ])->assertOk();

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/customers/pipeline', [
            'email' => 'b-stale@example.com',
            'owner_id' => $userB->id,
            'pipeline_stage' => 'lead',
        ])->assertOk();

        $resA = $this->actingAs($userA, 'sanctum')->getJson('/api/admin/alerts')->assertOk();
        $resB = $this->actingAs($userB, 'sanctum')->getJson('/api/admin/alerts')->assertOk();

        $emailsA = collect($resA->json('data.stale_contacts.items'))->pluck('email');
        $emailsB = collect($resB->json('data.stale_contacts.items'))->pluck('email');

        $this->assertTrue($emailsA->contains('a-stale@example.com'));
        $this->assertFalse($emailsA->contains('b-stale@example.com'));

        $this->assertTrue($emailsB->contains('b-stale@example.com'));
        $this->assertFalse($emailsB->contains('a-stale@example.com'));
    }
}
