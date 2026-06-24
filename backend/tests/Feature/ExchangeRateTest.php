<?php

namespace Tests\Feature;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExchangeRateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config()->set('services.exchange_rate.key', null); // no key → keyless path
    }

    public function test_uses_keyless_provider_when_no_api_key(): void
    {
        Http::fake([
            'open.er-api.com/*' => Http::response(['result' => 'success', 'rates' => ['UGX' => 3725.5, 'EUR' => 0.93]]),
        ]);

        $this->getJson('/api/exchange-rate')
            ->assertOk()
            ->assertJsonPath('data.ugx_per_usd', 3725.5)
            ->assertJsonPath('data.eur_per_usd', 0.93)
            ->assertJsonPath('data.source', 'live');
    }

    public function test_falls_back_to_config_when_keyless_unavailable(): void
    {
        config()->set('services.exchange_rate.fallback_ugx_per_usd', 3750);
        Http::fake(['open.er-api.com/*' => Http::response([], 500)]);

        $this->getJson('/api/exchange-rate')
            ->assertOk()
            ->assertJsonPath('data.ugx_per_usd', 3750);
    }

    public function test_manual_override_skips_external_calls(): void
    {
        Setting::put(['exchange_rate_mode' => 'manual', 'exchange_rate_manual' => 3900]);
        Http::fake(); // any external call would throw

        $this->getJson('/api/exchange-rate')
            ->assertOk()
            ->assertJsonPath('data.ugx_per_usd', 3900)
            ->assertJsonPath('data.source', 'manual');
    }
}
