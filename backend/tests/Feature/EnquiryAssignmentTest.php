<?php

namespace Tests\Feature;

use App\Models\Enquiry;
use App\Models\User;
use App\Notifications\EnquiryAssigned;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * Notification::fake() is the correct tool here (not Mail::fake()) — it
 * verifies the right notification went to the right user without needing
 * Laravel's own mail/database channel delivery to actually run. That delivery
 * mechanism was verified directly against a running server (real email in
 * the log, real row in the notifications table) before writing these —
 * these tests exist to lock in *our* logic: who gets notified, and when.
 */
class EnquiryAssignmentTest extends TestCase
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

    private function enquiry(): Enquiry
    {
        return Enquiry::create([
            'name' => 'Jane Customer', 'email' => 'jane@example.com', 'country' => 'Uganda',
            'message' => 'Interested in FET.', 'status' => 'new', 'assigned_to' => 'General Enquiries',
        ]);
    }

    public function test_assigning_to_a_person_notifies_them(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $assignee = User::create(['name' => 'Ops Person', 'email' => 'ops@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $enquiry = $this->enquiry();

        $this->withHeaders($this->adminHeaders($admin))
            ->patchJson("/api/admin/enquiries/{$enquiry->id}", [
                'assigned_to' => $assignee->name, 'assigned_user_id' => $assignee->id,
            ])->assertOk();

        Notification::assertSentTo($assignee, EnquiryAssigned::class);
    }

    public function test_reassigning_to_the_same_person_does_not_notify_again(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $assignee = User::create(['name' => 'Ops Person', 'email' => 'ops@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $enquiry = $this->enquiry();
        $enquiry->update(['assigned_user_id' => $assignee->id]);

        $this->withHeaders($this->adminHeaders($admin))
            ->patchJson("/api/admin/enquiries/{$enquiry->id}", [
                'assigned_to' => $assignee->name, 'assigned_user_id' => $assignee->id,
            ])->assertOk();

        Notification::assertNothingSent();
    }

    public function test_reassigning_to_a_different_person_notifies_the_new_assignee_only(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $first  = User::create(['name' => 'First Ops', 'email' => 'first@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $second = User::create(['name' => 'Second Ops', 'email' => 'second@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $enquiry = $this->enquiry();
        $enquiry->update(['assigned_user_id' => $first->id]);

        $this->withHeaders($this->adminHeaders($admin))
            ->patchJson("/api/admin/enquiries/{$enquiry->id}", [
                'assigned_to' => $second->name, 'assigned_user_id' => $second->id,
            ])->assertOk();

        Notification::assertSentTo($second, EnquiryAssigned::class);
        Notification::assertNotSentTo($first, EnquiryAssigned::class);
    }

    public function test_assigning_to_a_team_without_a_person_does_not_notify(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $enquiry = $this->enquiry();

        $this->withHeaders($this->adminHeaders($admin))
            ->patchJson("/api/admin/enquiries/{$enquiry->id}", ['assigned_to' => 'Marketing'])
            ->assertOk();

        Notification::assertNothingSent();
    }

    public function test_unassigning_does_not_notify(): void
    {
        Notification::fake();
        $admin = $this->admin();
        $assignee = User::create(['name' => 'Ops Person', 'email' => 'ops@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $enquiry = $this->enquiry();
        $enquiry->update(['assigned_user_id' => $assignee->id]);

        $this->withHeaders($this->adminHeaders($admin))
            ->patchJson("/api/admin/enquiries/{$enquiry->id}", ['assigned_to' => null, 'assigned_user_id' => null])
            ->assertOk();

        Notification::assertNothingSent();
    }

    public function test_assignable_users_lists_admin_and_ops_but_not_employees_or_customers(): void
    {
        $admin = $this->admin();
        User::create(['name' => 'An Ops', 'email' => 'o-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        User::create(['name' => 'An Employee', 'email' => 'e-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'employee']);
        User::create(['name' => 'A Customer', 'email' => 'c-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'customer']);

        $res = $this->withHeaders($this->adminHeaders($admin))
            ->getJson('/api/admin/enquiries/assignable-users')->assertOk();

        $names = collect($res->json('data'))->pluck('name');
        $this->assertTrue($names->contains('An Ops'));
        $this->assertFalse($names->contains('An Employee'));
        $this->assertFalse($names->contains('A Customer'));
    }
}
