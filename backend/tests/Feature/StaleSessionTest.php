<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Production lists vitorra.org as a stateful (cookie) domain, and the site
 * reaches the API through its own address — so every browser call arrives
 * carrying whatever Laravel session cookie the browser still holds. The site
 * itself authenticates with Bearer tokens. Sanctum checks the session first,
 * so a leftover session for an earlier account silently beat the token of the
 * account just signed into: a customer signing in (or registering) with a new
 * email landed in the old account.
 */
class StaleSessionTest extends TestCase
{
    use RefreshDatabase;

    private const SITE = 'https://vitorra.org/en/account/login';

    protected function setUp(): void
    {
        parent::setUp();
        config(['sanctum.stateful' => ['vitorra.org', 'www.vitorra.org']]);
    }

    private function customer(string $email): User
    {
        return User::create([
            'name' => $email, 'email' => $email,
            'password' => 'password-123', 'role' => 'customer',
        ]);
    }

    public function test_a_bearer_token_beats_a_leftover_session_for_another_account(): void
    {
        $old = $this->customer('old@example.com');
        $new = $this->customer('new@example.com');

        // The browser still holds a session for the old account…
        $this->actingAs($old, 'web');

        // …while presenting the new account's token.
        $token = $new->createToken('t', ['customer'])->plainTextToken;

        $this->withHeaders(['Referer' => self::SITE, 'Authorization' => "Bearer {$token}"])
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'new@example.com');
    }

    public function test_a_token_mode_login_from_the_site_gets_a_token(): void
    {
        $this->customer('new@example.com');

        $res = $this->withHeader('Referer', self::SITE)->postJson('/api/auth/login', [
            'email' => 'new@example.com', 'password' => 'password-123', 'scope' => 'customer',
        ])->assertOk();

        $this->assertNotEmpty($res->json('data.token'));
    }

    public function test_registering_while_another_account_is_in_session_lands_in_the_new_account(): void
    {
        $old = $this->customer('old@example.com');
        $this->actingAs($old, 'web');

        $token = $this->withHeader('Referer', self::SITE)->postJson('/api/auth/register', [
            'name' => 'New Buyer', 'email' => 'fresh@example.com', 'password' => 'password-123',
        ])->assertCreated()->json('data.token');

        $this->app['auth']->forgetGuards();
        $this->actingAs($old, 'web'); // the stale cookie is still in the browser

        $this->withHeaders(['Referer' => self::SITE, 'Authorization' => "Bearer {$token}"])
            ->getJson('/api/account/profile')
            ->assertOk()
            ->assertJsonPath('data.email', 'fresh@example.com');
    }

    public function test_a_cookie_mode_login_still_uses_the_session(): void
    {
        $this->customer('new@example.com');

        $res = $this->withHeaders(['Referer' => self::SITE, 'X-XSRF-TOKEN' => 'x'])
            ->postJson('/api/auth/login', [
                'email' => 'new@example.com', 'password' => 'password-123', 'scope' => 'customer',
            ])->assertOk();

        $this->assertNull($res->json('data.token'));
    }
}
