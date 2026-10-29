<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DisplayTest extends TestCase
{
    use RefreshDatabase;

    private function staff(string $role): array
    {
        $u = User::create(['name' => 'R', 'email' => uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => $role]);

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin', 'staff'])->plainTextToken];
    }

    public function test_welcome_shows_until_it_expires_then_switches_itself_off(): void
    {
        $this->getJson('/api/display')->assertOk()->assertJsonPath('data.welcome', null);

        $this->withHeaders($this->staff('ops'))->putJson('/api/admin/display/welcome', ['name' => 'Mr. Okello of Kampala Haulage', 'line' => 'Your meeting is on the 3rd floor.', 'hours' => 2])
            ->assertOk()->assertJsonPath('data.welcome.name', 'Mr. Okello of Kampala Haulage');
        $this->getJson('/api/display')->assertJsonPath('data.welcome.line', 'Your meeting is on the 3rd floor.');

        $this->travel(3)->hours();
        $this->getJson('/api/display')->assertJsonPath('data.welcome', null);
    }

    public function test_only_staff_can_set_it_and_markup_is_refused(): void
    {
        $this->putJson('/api/admin/display/welcome', ['name' => 'X'])->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->staff('employee'))->putJson('/api/admin/display/welcome', ['name' => 'X'])->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->staff('admin'))->putJson('/api/admin/display/welcome', ['name' => '<script>x</script>'])->assertStatus(422);
    }
}
