<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\EnquiryAssigned;
use App\Models\Enquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** The notification bar's API — deliberately portal-agnostic (works for any authenticated user). */
class NotificationControllerTest extends TestCase
{
    use RefreshDatabase;

    private function userWithNotification(): User
    {
        Mail::fake();
        $user = User::create(['name' => 'Ops Person', 'email' => 'ops-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $enquiry = Enquiry::create(['name' => 'Someone', 'email' => 'x@example.com', 'country' => 'Uganda', 'message' => 'Hi', 'status' => 'new']);
        $user->notify(new EnquiryAssigned($enquiry));

        return $user;
    }

    private function headers(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('t', ['admin'])->plainTextToken];
    }

    public function test_lists_the_authenticated_users_notifications_with_an_unread_count(): void
    {
        $user = $this->userWithNotification();

        $res = $this->withHeaders($this->headers($user))->getJson('/api/notifications')->assertOk();

        $this->assertCount(1, $res->json('data'));
        $this->assertSame(1, $res->json('unread_count'));
    }

    public function test_mark_read_clears_the_unread_count(): void
    {
        $user = $this->userWithNotification();
        $id = $user->notifications()->first()->id;

        $this->withHeaders($this->headers($user))->postJson("/api/notifications/{$id}/read")->assertOk();

        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_mark_all_read_clears_every_unread_notification(): void
    {
        $user = $this->userWithNotification();
        $enquiry2 = Enquiry::create(['name' => 'Another', 'email' => 'y@example.com', 'country' => 'Uganda', 'message' => 'Hi', 'status' => 'new']);
        $user->notify(new EnquiryAssigned($enquiry2));
        $this->assertSame(2, $user->fresh()->unreadNotifications()->count());

        $this->withHeaders($this->headers($user))->postJson('/api/notifications/read-all')->assertOk();

        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_a_user_cannot_see_or_mark_read_someone_elses_notification(): void
    {
        $owner = $this->userWithNotification();
        $intruder = User::create(['name' => 'Intruder', 'email' => 'i-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $notificationId = $owner->notifications()->first()->id;

        $this->withHeaders($this->headers($intruder))->getJson('/api/notifications')
            ->assertOk()->assertJsonCount(0, 'data');

        $this->withHeaders($this->headers($intruder))->postJson("/api/notifications/{$notificationId}/read")->assertOk();
        $this->assertNull($owner->fresh()->notifications()->first()->read_at);
    }
}
