<?php

namespace Tests\Feature;

use App\Models\Setting;
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
        config()->set('services.pesapal', ['consumer_key' => null, 'consumer_secret' => null, 'env' => 'sandbox', 'ipn_id' => null]);

        $this->withHeaders($this->adminHeaders())->getJson('/api/admin/payments/health')
            ->assertOk()
            ->assertJsonPath('data.online_enabled', false)
            ->assertJsonPath('data.keys_present', false)
            ->assertJsonPath('data.ipn_registered', false);
    }

    public function test_health_reports_live_when_configured(): void
    {
        config()->set('payments.driver', 'pesapal');
        config()->set('services.pesapal', ['consumer_key' => 'ck', 'consumer_secret' => 'cs', 'env' => 'live', 'ipn_id' => null]);
        Setting::put(['pesapal_ipn_id' => 'IPN-1']);

        $this->withHeaders($this->adminHeaders())->getJson('/api/admin/payments/health')
            ->assertOk()
            ->assertJsonPath('data.online_enabled', true)
            ->assertJsonPath('data.keys_present', true)
            ->assertJsonPath('data.environment', 'live')
            ->assertJsonPath('data.ipn_registered', true);
    }

    public function test_connection_test_passes_when_fully_configured(): void
    {
        config()->set('services.pesapal', ['consumer_key' => 'ck', 'consumer_secret' => 'cs', 'env' => 'sandbox', 'frontend_url' => 'https://vitorra.org', 'ipn_id' => 'IPN-1']);
        Http::fake([
            '*/Auth/RequestToken' => Http::response(['token' => 'tok']),
            '*/Transactions/SubmitOrderRequest' => Http::response(['order_tracking_id' => 'T', 'redirect_url' => 'https://pay/T', 'status' => '200']),
        ]);

        $this->withHeaders($this->adminHeaders())->postJson('/api/admin/payments/health/test')
            ->assertOk()
            ->assertJsonPath('data.ok', true);
    }

    public function test_connection_test_flags_missing_return_url(): void
    {
        config()->set('services.pesapal', ['consumer_key' => 'ck', 'consumer_secret' => 'cs', 'env' => 'sandbox', 'frontend_url' => 'http://localhost:3000']);

        $this->withHeaders($this->adminHeaders())->postJson('/api/admin/payments/health/test')
            ->assertOk()
            ->assertJsonPath('data.ok', false);
    }

    public function test_connection_test_reports_bad_keys(): void
    {
        config()->set('services.pesapal', ['consumer_key' => 'ck', 'consumer_secret' => 'cs', 'env' => 'sandbox', 'frontend_url' => 'https://vitorra.org', 'ipn_id' => 'IPN-1']);
        Http::fake(['*/Auth/RequestToken' => Http::response(['error' => ['message' => 'invalid_consumer_key']], 401)]);

        $this->withHeaders($this->adminHeaders())->postJson('/api/admin/payments/health/test')
            ->assertOk()
            ->assertJsonPath('data.ok', false);
    }

    public function test_connection_test_flags_missing_ipn(): void
    {
        config()->set('services.pesapal', ['consumer_key' => 'ck', 'consumer_secret' => 'cs', 'env' => 'sandbox', 'frontend_url' => 'https://vitorra.org', 'ipn_id' => null]);
        Http::fake(['*/Auth/RequestToken' => Http::response(['token' => 'tok'])]);

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
