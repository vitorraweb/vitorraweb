<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Indicative FX rates for the storefront, anchored to USD:
 *   ugx_per_usd — UGX for 1 USD  (coffee shop checkout transparency)
 *   eur_per_usd — EUR for 1 USD  (lets the UI convert FET's EUR prices to UGX/USD)
 *
 * Live mode pulls both from one API call (cached 1 hr); manual mode lets the team
 * pin the USD/UGX rate in System Settings. Both fall back to config so the
 * endpoint always returns usable numbers, even with no API key.
 */
class ExchangeRateController extends Controller
{
    public function show(): JsonResponse
    {
        // Admin manual override (System Settings) pins the USD/UGX rate; EUR uses
        // the config fallback so manual mode makes no external calls.
        if (Setting::get('exchange_rate_mode') === 'manual') {
            return response()->json([
                'data' => [
                    'ugx_per_usd' => (float) Setting::get('exchange_rate_manual'),
                    'eur_per_usd' => $this->fallbackEur(),
                    'source'      => 'manual',
                ],
            ]);
        }

        $rates = Cache::remember('fx_rates', 3600, fn () => $this->fetchLive());

        return response()->json(['data' => $rates + ['source' => 'live']]);
    }

    /** @return array{ugx_per_usd: float, eur_per_usd: float} */
    private function fetchLive(): array
    {
        $apiKey = config('services.exchange_rate.key');

        if ($apiKey) {
            try {
                // One call returns every rate against USD (free tier: 1,500/month).
                $res = Http::timeout(8)->get("https://v6.exchangerate-api.com/v6/{$apiKey}/latest/USD");

                if ($res->successful() && isset($res['conversion_rates'])) {
                    $r = $res['conversion_rates'];
                    return [
                        'ugx_per_usd' => (float) ($r['UGX'] ?? $this->fallbackUgx()),
                        'eur_per_usd' => (float) ($r['EUR'] ?? $this->fallbackEur()),
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('Exchange rate fetch failed: ' . $e->getMessage());
            }
        }

        return ['ugx_per_usd' => $this->fallbackUgx(), 'eur_per_usd' => $this->fallbackEur()];
    }

    private function fallbackUgx(): float
    {
        return (float) config('services.exchange_rate.fallback_ugx_per_usd', 3750);
    }

    private function fallbackEur(): float
    {
        return (float) config('services.exchange_rate.fallback_eur_per_usd', 0.92);
    }
}
