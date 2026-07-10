<?php

namespace Tests\Feature;

use App\Mail\DailyDigest;
use App\Models\CustomerNote;
use App\Models\Prospect;
use App\Models\Task;
use App\Models\User;
use App\Notifications\PipelineContactsGoingCold;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class DailyDigestTest extends TestCase
{
    use RefreshDatabase;

    private function ops(): User
    {
        return User::create([
            'name' => 'Ops '.uniqid(),
            'email' => 'ops-'.uniqid().'@vitorra.org',
            'password' => 'password123',
            'role' => 'ops',
            'department' => 'marketing',
        ]);
    }

    public function test_user_with_overdue_task_receives_digest(): void
    {
        Mail::fake();

        $user = $this->ops();
        $other = $this->ops();

        Task::create([
            'title' => 'Overdue task',
            'assigned_to' => $user->id,
            'created_by' => $user->id,
            'status' => 'todo',
            'priority' => 'normal',
            'due_date' => now()->subDay(),
        ]);

        $this->artisan('digest:send')->assertExitCode(0);

        Mail::assertSent(DailyDigest::class, fn ($mail) => $mail->hasTo($user->email));
        Mail::assertNotSent(DailyDigest::class, fn ($mail) => $mail->hasTo($other->email));
    }

    /**
     * The email side of the cold-contact reminder already existed (bundled
     * into DailyDigest); this only adds the notification-bar half — so both
     * must fire from the same run, not one instead of the other.
     */
    public function test_user_with_a_cold_pipeline_contact_gets_the_digest_email_and_a_bar_notification(): void
    {
        Mail::fake();
        Notification::fake();

        $user = $this->ops();
        $prospect = Prospect::create([
            'name' => 'Cold Contact', 'email' => 'cold@example.com', 'category' => 'FET',
            'outreach_status' => 'contacted',
        ]);
        $prospect->forceFill(['created_at' => now()->subDays(10)])->save();
        CustomerNote::create(['email' => 'cold@example.com', 'owner_id' => $user->id, 'pipeline_stage' => 'lead']);

        $this->artisan('digest:send')->assertExitCode(0);

        Mail::assertSent(DailyDigest::class, fn ($mail) => $mail->hasTo($user->email));
        Notification::assertSentTo($user, PipelineContactsGoingCold::class);
    }

    public function test_user_with_no_cold_contacts_gets_no_cold_notification(): void
    {
        Mail::fake();
        Notification::fake();
        $user = $this->ops();

        Task::create([
            'title' => 'Due today', 'assigned_to' => $user->id, 'created_by' => $user->id,
            'status' => 'todo', 'priority' => 'normal', 'due_date' => now(),
        ]);

        $this->artisan('digest:send')->assertExitCode(0);

        Notification::assertNothingSentTo($user);
    }
}
