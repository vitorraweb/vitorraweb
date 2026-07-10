<?php

namespace Tests\Feature;

use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    private function user(array $extra = []): User
    {
        return User::create(array_merge([
            'name'     => 'Someone Locked Out',
            'email'    => 'locked-'.uniqid().'@vitorra.org',
            'password' => 'OldPassword123',
            'role'     => 'admin',
        ], $extra));
    }

    public function test_forgot_password_emails_a_reset_link(): void
    {
        Mail::fake();
        $user = $this->user();

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])->assertOk();

        Mail::assertSent(PasswordResetMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_forgot_password_gives_the_same_response_for_an_unknown_email(): void
    {
        Mail::fake();

        $res = $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@vitorra.org'])->assertOk();

        // Same message either way — never confirm or deny an account exists.
        $this->assertStringContainsString("If an account exists", $res->json('message'));
        Mail::assertNothingSent();
    }

    public function test_reset_link_routes_admin_and_ops_to_the_admin_panel(): void
    {
        Mail::fake();
        $user = $this->user(['role' => 'admin']);

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email]);

        Mail::assertSent(PasswordResetMail::class, fn ($mail) => str_contains($mail->resetUrl, '/admin/reset-password'));
    }

    public function test_reset_link_routes_employees_to_the_staff_portal(): void
    {
        Mail::fake();
        $user = $this->user(['role' => 'employee']);

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email]);

        Mail::assertSent(PasswordResetMail::class, fn ($mail) => str_contains($mail->resetUrl, '/staff/reset-password'));
    }

    public function test_reset_password_with_a_valid_token_lets_the_user_sign_in_with_the_new_password(): void
    {
        $user = $this->user();
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'email' => $user->email, 'token' => $token,
            'password' => 'BrandNewPassword456', 'password_confirmation' => 'BrandNewPassword456',
        ])->assertOk();

        $this->postJson('/api/auth/login', [
            'email' => $user->email, 'password' => 'BrandNewPassword456',
        ])->assertOk();
    }

    public function test_reset_password_revokes_every_existing_session(): void
    {
        $user = $this->user();
        $user->createToken('old-session');
        $this->assertSame(1, $user->tokens()->count());

        $token = Password::createToken($user);
        $this->postJson('/api/auth/reset-password', [
            'email' => $user->email, 'token' => $token,
            'password' => 'BrandNewPassword456', 'password_confirmation' => 'BrandNewPassword456',
        ])->assertOk();

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_reset_password_rejects_an_invalid_token(): void
    {
        $user = $this->user();

        $this->postJson('/api/auth/reset-password', [
            'email' => $user->email, 'token' => 'not-a-real-token',
            'password' => 'BrandNewPassword456', 'password_confirmation' => 'BrandNewPassword456',
        ])->assertStatus(422);
    }

    public function test_reset_password_token_is_single_use(): void
    {
        $user = $this->user();
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'email' => $user->email, 'token' => $token,
            'password' => 'FirstNewPassword1', 'password_confirmation' => 'FirstNewPassword1',
        ])->assertOk();

        $this->postJson('/api/auth/reset-password', [
            'email' => $user->email, 'token' => $token,
            'password' => 'SecondNewPassword2', 'password_confirmation' => 'SecondNewPassword2',
        ])->assertStatus(422);
    }
}
