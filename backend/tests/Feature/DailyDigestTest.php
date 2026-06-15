<?php

namespace Tests\Feature;

use App\Mail\DailyDigest;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
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
}
