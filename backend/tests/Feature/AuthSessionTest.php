<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthSessionTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::create([
            'name'     => 'Test Staff',
            'email'    => 'staff-'.uniqid().'@vitorra.org',
            'password' => 'changeme123',
            'role'     => 'admin',
        ]);
    }

    public function test_login_returns_a_token_expiry_for_staff(): void
    {
        Setting::put(['staff_session_lifetime_hours' => 8]);
        $user = $this->staff();

        $res = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'changeme123',
        ])->assertOk();

        $expiresAt = $res->json('data.expires_at');
        $this->assertNotNull($expiresAt, 'Login should return a session expiry.');
        $this->assertTrue(now()->addHours(8)->diffInMinutes($expiresAt) < 2);
    }

    public function test_an_expired_token_is_rejected(): void
    {
        $user  = $this->staff();
        $token = $user->createToken('expired', ['*'], now()->subMinute())->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    public function test_password_change_requires_the_correct_current_password(): void
    {
        $user  = $this->staff();
        $token = $user->createToken('t')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/password', [
                'current_password'      => 'wrong-password',
                'password'              => 'newsecret123',
                'password_confirmation' => 'newsecret123',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('current_password');
    }

    public function test_password_change_updates_the_password_and_revokes_other_sessions(): void
    {
        $user  = $this->staff();
        $other = $user->createToken('other-device')->plainTextToken;
        $token = $user->createToken('this-device')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/password', [
                'current_password'      => 'changeme123',
                'password'              => 'newsecret123',
                'password_confirmation' => 'newsecret123',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('newsecret123', $user->fresh()->password));

        // Only the current device's token survives — the other is revoked.
        $this->assertSame(1, $user->fresh()->tokens()->count());
        $this->assertSame('this-device', $user->fresh()->tokens()->first()->name);
        $this->assertNull(
            \Laravel\Sanctum\PersonalAccessToken::findToken(explode('|', $other, 2)[1]),
            'The other device session should be revoked on password change.'
        );
    }
}
