<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Surface scoping: a token issued for one portal can't be replayed against
 * another, even for a privileged user. Plus the stronger password policy.
 */
class TokenScopeTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin', 'email' => 'a-'.uniqid().'@vitorra.org',
            'password' => 'changeme123', 'role' => 'admin',
        ]);
    }

    private function bearer(User $user, array $abilities): self
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('t', $abilities)->plainTextToken);
    }

    public function test_a_staff_scoped_token_cannot_reach_the_admin_panel(): void
    {
        $admin = $this->admin(); // a full admin…

        // …but holding only a staff-scoped token.
        $this->bearer($admin, ['staff'])->getJson('/api/staff/me')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->bearer($admin, ['staff'])->getJson('/api/admin/stats')->assertForbidden();
    }

    public function test_an_admin_scoped_token_reaches_both_surfaces(): void
    {
        $admin = $this->admin();

        $this->bearer($admin, ['admin', 'staff'])->getJson('/api/admin/stats')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->bearer($admin, ['admin', 'staff'])->getJson('/api/staff/me')->assertOk();
    }

    public function test_logging_in_with_the_staff_scope_yields_a_staff_only_token(): void
    {
        $admin = $this->admin(); // a full admin signing in via the staff portal

        $this->postJson('/api/auth/login', [
            'email' => $admin->email, 'password' => 'changeme123', 'scope' => 'staff',
        ])->assertOk();

        // The issued token is scoped to 'staff' only — it can't reach /admin
        // (proven against the route in test_a_staff_scoped_token_cannot_reach…).
        $token = $admin->tokens()->latest('id')->first();
        $this->assertEqualsCanonicalizing(['staff'], $token->abilities);
    }

    public function test_password_change_rejects_a_weak_password(): void
    {
        $user = User::create([
            'name' => 'U', 'email' => 'u-'.uniqid().'@vitorra.org',
            'password' => 'currentpass12', 'role' => 'admin',
        ]);

        $this->withHeader('Authorization', 'Bearer '.$user->createToken('t')->plainTextToken)
            ->postJson('/api/auth/password', [
                'current_password'      => 'currentpass12',
                'password'              => 'short1',   // under 12 chars
                'password_confirmation' => 'short1',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }
}
