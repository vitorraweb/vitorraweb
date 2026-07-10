<?php

namespace Tests\Feature;

use App\Models\CustomerNote;
use App\Models\User;
use App\Notifications\PipelineContactAssigned;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/** See EnquiryAssignmentTest for why Notification::fake() (not Mail::fake()) is correct here. */
class PipelineAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create(['name' => 'Admin', 'email' => 'a-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);
    }

    private function adminHeaders(User $admin): array
    {
        return ['Authorization' => 'Bearer '.$admin->createToken('t', ['admin'])->plainTextToken];
    }

    public function test_assigning_a_pipeline_contact_notifies_the_owner(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $owner = User::create(['name' => 'Ops Person', 'email' => 'ops@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);

        $this->withHeaders($this->adminHeaders($admin))
            ->putJson('/api/admin/customers/pipeline', [
                'email' => 'contact@example.com', 'name' => 'A Contact', 'owner_id' => $owner->id, 'pipeline_stage' => 'lead',
            ])->assertOk();

        Notification::assertSentTo($owner, PipelineContactAssigned::class);
    }

    public function test_reassigning_to_the_same_owner_does_not_notify_again(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $owner = User::create(['name' => 'Ops Person', 'email' => 'ops@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        CustomerNote::create(['email' => 'contact@example.com', 'owner_id' => $owner->id, 'pipeline_stage' => 'lead']);

        $this->withHeaders($this->adminHeaders($admin))
            ->putJson('/api/admin/customers/pipeline', [
                'email' => 'contact@example.com', 'name' => 'A Contact', 'owner_id' => $owner->id, 'pipeline_stage' => 'contacted',
            ])->assertOk();

        Notification::assertNothingSent();
    }

    public function test_reassigning_to_a_different_owner_notifies_only_the_new_one(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $first  = User::create(['name' => 'First Ops', 'email' => 'first@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $second = User::create(['name' => 'Second Ops', 'email' => 'second@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        CustomerNote::create(['email' => 'contact@example.com', 'owner_id' => $first->id, 'pipeline_stage' => 'lead']);

        $this->withHeaders($this->adminHeaders($admin))
            ->putJson('/api/admin/customers/pipeline', [
                'email' => 'contact@example.com', 'name' => 'A Contact', 'owner_id' => $second->id, 'pipeline_stage' => 'lead',
            ])->assertOk();

        Notification::assertSentTo($second, PipelineContactAssigned::class);
        Notification::assertNotSentTo($first, PipelineContactAssigned::class);
    }

    public function test_unassigning_does_not_notify(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $owner = User::create(['name' => 'Ops Person', 'email' => 'ops@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        CustomerNote::create(['email' => 'contact@example.com', 'owner_id' => $owner->id, 'pipeline_stage' => 'lead']);

        $this->withHeaders($this->adminHeaders($admin))
            ->putJson('/api/admin/customers/pipeline', ['email' => 'contact@example.com', 'owner_id' => null])
            ->assertOk();

        Notification::assertNothingSent();
    }

    public function test_setting_stage_only_without_an_owner_does_not_notify(): void
    {
        Notification::fake();
        $admin = $this->admin();

        $this->withHeaders($this->adminHeaders($admin))
            ->putJson('/api/admin/customers/pipeline', ['email' => 'contact@example.com', 'pipeline_stage' => 'lead'])
            ->assertOk();

        Notification::assertNothingSent();
    }
}
