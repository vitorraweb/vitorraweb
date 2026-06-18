<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetUserRoleTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, string $email): User
    {
        return User::create(['name' => 'U', 'email' => $email, 'password' => 'changeme123', 'role' => $role]);
    }

    public function test_promotes_a_user_without_touching_their_login(): void
    {
        $u = $this->user('ops', 'john@v.org');
        $hash = $u->password;

        $this->artisan('staff:set-role john@v.org admin')->assertSuccessful();

        $u->refresh();
        $this->assertSame('admin', $u->role);
        $this->assertSame('john@v.org', $u->email);   // login email unchanged
        $this->assertSame($hash, $u->password);        // password unchanged
    }

    public function test_refuses_to_demote_the_last_admin(): void
    {
        $admin = $this->user('admin', 'only-admin@v.org');

        $this->artisan('staff:set-role only-admin@v.org ops')->assertFailed();

        $this->assertSame('admin', $admin->fresh()->role);
    }

    public function test_can_demote_an_admin_when_another_admin_exists(): void
    {
        $this->user('admin', 'keep@v.org');
        $demote = $this->user('admin', 'demote@v.org');

        $this->artisan('staff:set-role demote@v.org ops')->assertSuccessful();
        $this->assertSame('ops', $demote->fresh()->role);
    }

    public function test_rejects_an_unknown_role(): void
    {
        $this->user('ops', 'x@v.org');
        $this->artisan('staff:set-role x@v.org superuser')->assertFailed();
    }
}
