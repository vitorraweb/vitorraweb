<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * php artisan staff:disable-2fa — the only way back in for someone locked out
 * of their authenticator, since 2FA blocks login before a token is issued
 * (the self-service /auth/2fa/disable endpoint is unreachable to them).
 */
class DisableUserTwoFactorCommandTest extends TestCase
{
    use RefreshDatabase;

    private function userWithTwoFactor(): User
    {
        $user = User::create([
            'name' => 'Locked Out Employee', 'email' => 'locked-'.uniqid().'@vitorra.org',
            'password' => 'changeme123changeme', 'role' => 'employee',
        ]);
        $user->forceFill([
            'two_factor_secret'         => 'FAKESECRET',
            'two_factor_confirmed_at'   => now(),
            'two_factor_recovery_codes' => ['code-a', 'code-b'],
        ])->save();

        return $user;
    }

    public function test_disables_two_factor_for_the_given_email(): void
    {
        $user = $this->userWithTwoFactor();
        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());

        $this->artisan('staff:disable-2fa', ['email' => $user->email])->assertSuccessful();

        $fresh = $user->fresh();
        $this->assertFalse($fresh->hasTwoFactorEnabled());
        $this->assertNull($fresh->two_factor_secret);
        $this->assertNull($fresh->two_factor_recovery_codes);
    }

    public function test_lets_the_user_sign_in_without_a_code_afterwards(): void
    {
        $user = $this->userWithTwoFactor();

        $this->artisan('staff:disable-2fa', ['email' => $user->email]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email, 'password' => 'changeme123changeme',
        ])->assertOk()->assertJsonMissing(['two_factor_required' => true]);
    }

    public function test_records_an_audit_entry(): void
    {
        $user = $this->userWithTwoFactor();

        $this->artisan('staff:disable-2fa', ['email' => $user->email]);

        $this->assertSame(1, ActivityLog::where('action', 'user.2fa_disabled')
            ->where('subject_id', $user->id)->count());
    }

    public function test_is_a_no_op_when_two_factor_is_already_off(): void
    {
        $user = User::create(['name' => 'No 2FA', 'email' => 'no2fa-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'employee']);

        $this->artisan('staff:disable-2fa', ['email' => $user->email])->assertSuccessful();

        $this->assertSame(0, ActivityLog::where('action', 'user.2fa_disabled')->count());
    }

    public function test_fails_for_an_unknown_email(): void
    {
        $this->artisan('staff:disable-2fa', ['email' => 'nobody@vitorra.org'])->assertFailed();
    }
}
