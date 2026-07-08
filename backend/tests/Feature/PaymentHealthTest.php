<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentHealthTest extends TestCase
{
    use RefreshDatabase;

    private function adminHeaders(): array
    {
        $admin = User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123changeme', 'role' => 'admin']);

        return ['Authorization' => 'Bearer '.$admin->createToken('t', ['admin'])->plainTextToken];
    }

    public function test_health_reports_not_live_by_default(): void
    {
        config()->set('payments.driver', 'manual');
        config()->set('services.flutterwave', ['public_key' => null, 'secret_key' => null, 'secret_hash' => null]);

        $this->withHeaders($this->adminHeaders())->getJson('/api/admin/payments/health')
            ->assertOk()
            ->assertJsonPath('data.online_enabled', false)
            ->assertJsonPath('data.keys_present', false)
            ->assertJsonPath('data.webhook_secret_set', false);
    }

    public function test_health_reports_live_when_configured(): void
    {
        config()->set('payments.driver', 'flutterwave');
        config()->set('services.flutterwave', ['public_key' => 'FLWPUBK-pk', 'secret_key' => 'FLWSECK-sk', 'secret_hash' => 'hash123']);

        $this->withHeaders($this->adminHeaders())->getJson('/api/admin/payments/health')
            ->assertOk()
            ->assertJsonPath('data.online_enabled', true)
            ->assertJsonPath('data.keys_present', true)
            ->assertJsonPath('data.environment', 'live')
            ->assertJsonPath('data.webhook_secret_set', true);
    }

    public function test_health_reports_sandbox_for_test_keys(): void
    {
        config()->set('payments.driver', 'flutterwave');
        config()->set('services.flutterwave', ['public_key' => 'FLWPUBK_TEST-pk', 'secret_key' => 'FLWSECK_TEST-sk', 'secret_hash' => 'hash123']);

        $this->withHeaders($this->adminHeaders())->getJson('/api/admin/payments/health')
            ->assertOk()
            ->assertJsonPath('data.environment', 'sandbox');
    }

    public function test_connection_test_passes_when_fully_configured(): void
    {
        config()->set('services.flutterwave', ['secret_key' => 'FLWSECK-sk', 'secret_hash' => 'hash123', 'frontend_url' => 'https://vitorra.org']);
        Http::fake([
            '*/v3/payments' => Http::response(['status' => 'success', 'data' => ['link' => 'https://checkout.flutterwave.com/pay/T']]),
        ]);

        $this->withHeaders($this->adminHeaders())->postJson('/api/admin/payments/health/test')
            ->assertOk()
            ->assertJsonPath('data.ok', true);
    }

    public function test_connection_test_flags_missing_return_url(): void
    {
        config()->set('services.flutterwave', ['secret_key' => 'FLWSECK-sk', 'secret_hash' => 'hash123', 'frontend_url' => 'http://localhost:3000']);

        $this->withHeaders($this->adminHeaders())->postJson('/api/admin/payments/health/test')
            ->assertOk()
            ->assertJsonPath('data.ok', false);
    }

    public function test_connection_test_flags_missing_webhook_secret(): void
    {
        config()->set('services.flutterwave', ['secret_key' => 'FLWSECK-sk', 'secret_hash' => null, 'frontend_url' => 'https://vitorra.org']);

        $this->withHeaders($this->adminHeaders())->postJson('/api/admin/payments/health/test')
            ->assertOk()
            ->assertJsonPath('data.ok', false);
    }

    public function test_connection_test_reports_bad_keys(): void
    {
        config()->set('services.flutterwave', ['secret_key' => 'FLWSECK-bad', 'secret_hash' => 'hash123', 'frontend_url' => 'https://vitorra.org']);
        Http::fake(['*/v3/payments' => Http::response(['message' => 'Invalid authorization key'], 401)]);

        $this->withHeaders($this->adminHeaders())->postJson('/api/admin/payments/health/test')
            ->assertOk()
            ->assertJsonPath('data.ok', false);
    }

    public function test_non_admin_cannot_view_health(): void
    {
        $ops = User::create(['name' => 'O', 'email' => 'o-'.uniqid().'@v.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $headers = ['Authorization' => 'Bearer '.$ops->createToken('t', ['admin'])->plainTextToken];

        $this->withHeaders($headers)->getJson('/api/admin/payments/health')->assertForbidden();
    }
}
