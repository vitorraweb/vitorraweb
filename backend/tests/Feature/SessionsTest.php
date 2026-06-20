<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionsTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::create([
            'name' => 'U', 'email' => 'u-'.uniqid().'@vitorra.org',
            'password' => 'changeme123', 'role' => 'admin',
        ]);
    }

    public function test_lists_sessions_and_flags_the_current_one(): void
    {
        $user = $this->user();
        $thisDevice = $user->createToken('Admin panel · Chrome on Windows')->plainTextToken;
        $user->createToken('Staff portal · Safari on iOS'); // another device

        $res = $this->withHeader('Authorization', "Bearer {$thisDevice}")
            ->getJson('/api/auth/sessions')->assertOk();

        $data = $res->json('data');
        $this->assertCount(2, $data);
        $this->assertSame(1, collect($data)->where('current', true)->count());
    }

    public function test_revoke_others_keeps_only_the_current_session(): void
    {
        $user = $this->user();
        $thisDevice = $user->createToken('this')->plainTextToken;
        $user->createToken('other-1');
        $user->createToken('other-2');
        $this->assertSame(3, $user->tokens()->count());

        $this->withHeader('Authorization', "Bearer {$thisDevice}")
            ->postJson('/api/auth/sessions/revoke-others')->assertOk();

        $this->assertSame(1, $user->fresh()->tokens()->count());
    }

    public function test_can_revoke_a_specific_session(): void
    {
        $user = $this->user();
        $thisDevice = $user->createToken('this')->plainTextToken;
        $other = $user->createToken('other')->accessToken;

        $this->withHeader('Authorization', "Bearer {$thisDevice}")
            ->deleteJson("/api/auth/sessions/{$other->id}")->assertOk();

        $this->assertNull($user->tokens()->whereKey($other->id)->first());
    }

    public function test_cannot_revoke_another_users_session(): void
    {
        $me    = $this->user();
        $other = $this->user();
        $otherToken = $other->createToken('theirs')->accessToken;
        $mine = $me->createToken('mine')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$mine}")
            ->deleteJson("/api/auth/sessions/{$otherToken->id}")->assertOk();

        // The other user's session is untouched.
        $this->assertNotNull($other->tokens()->whereKey($otherToken->id)->first());
    }
}
