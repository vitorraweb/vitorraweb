<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::create([
            'name'     => 'Staff '.uniqid(),
            'email'    => 's-'.uniqid().'@vitorra.org',
            'password' => 'changeme123',
            'role'     => 'admin',
        ]);
    }

    private function actingApi(User $user): self
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('t')->plainTextToken);
    }

    /** Drive a user fully through enrolment; returns [user, secret]. */
    private function enrol(User $user): array
    {
        $secret = app(TwoFactorService::class)->generateSecret();
        $user->two_factor_secret = $secret;
        $user->two_factor_confirmed_at = now();
        $user->two_factor_recovery_codes = ['AAAA-BBBB', 'CCCC-DDDD'];
        $user->save();

        return [$user->fresh(), $secret];
    }

    public function test_setup_then_confirm_enables_two_factor_and_returns_recovery_codes(): void
    {
        $user = $this->staff();

        $this->actingApi($user)->postJson('/api/auth/2fa/setup')->assertOk()
            ->assertJsonStructure(['data' => ['secret', 'qr_code']]);

        $secret = $user->fresh()->two_factor_secret;
        $this->assertFalse($user->fresh()->hasTwoFactorEnabled(), 'Still pending until confirmed.');

        $code = (new Google2FA())->getCurrentOtp($secret);
        $this->actingApi($user)->postJson('/api/auth/2fa/confirm', ['code' => $code])
            ->assertOk()
            ->assertJsonCount(8, 'recovery_codes');

        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());
    }

    public function test_login_demands_a_code_once_two_factor_is_on(): void
    {
        [$user] = $this->enrol($this->staff());

        // Right password, no code → not a token, just a challenge flag.
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'changeme123'])
            ->assertOk()
            ->assertJsonPath('data.two_factor_required', true)
            ->assertJsonMissingPath('data.token');
    }

    public function test_login_succeeds_with_a_valid_totp_code(): void
    {
        [$user, $secret] = $this->enrol($this->staff());
        $code = (new Google2FA())->getCurrentOtp($secret);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'changeme123', 'code' => $code])
            ->assertOk()
            ->assertJsonStructure(['data' => ['token', 'user', 'expires_at']]);
    }

    public function test_login_rejects_a_wrong_code(): void
    {
        [$user] = $this->enrol($this->staff());

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'changeme123', 'code' => '000000'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');
    }

    public function test_a_recovery_code_works_once_then_is_consumed(): void
    {
        [$user] = $this->enrol($this->staff());

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'changeme123', 'code' => 'AAAA-BBBB'])
            ->assertOk()->assertJsonStructure(['data' => ['token']]);

        // Same recovery code cannot be reused.
        $this->assertNotContains('AAAA-BBBB', $user->fresh()->two_factor_recovery_codes);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'changeme123', 'code' => 'AAAA-BBBB'])
            ->assertStatus(422);
    }

    public function test_disable_requires_password_and_a_code(): void
    {
        [$user, $secret] = $this->enrol($this->staff());
        $code = (new Google2FA())->getCurrentOtp($secret);

        $this->actingApi($user)->postJson('/api/auth/2fa/disable', ['password' => 'changeme123', 'code' => $code])
            ->assertOk();

        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
    }
}
