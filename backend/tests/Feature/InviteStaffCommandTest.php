<?php

namespace Tests\Feature;

use App\Mail\StaffInvite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InviteStaffCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_resets_password_and_emails_the_staff_member(): void
    {
        Mail::fake();

        $user = User::create([
            'name'     => 'Test Staff',
            'email'    => 'test.staff@vitorra.org',
            'password' => 'oldpassword',
            'role'     => 'ops',
        ]);

        $oldHash = $user->password;

        $this->artisan('staff:invite', ['emails' => ['test.staff@vitorra.org']])
            ->assertExitCode(0);

        $user->refresh();

        $this->assertNotEquals($oldHash, $user->password);
        Mail::assertSent(StaffInvite::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_it_reports_missing_accounts_without_sending_mail(): void
    {
        Mail::fake();

        $this->artisan('staff:invite', ['emails' => ['nobody@vitorra.org']])
            ->assertExitCode(0);

        Mail::assertNothingSent();
    }
}
