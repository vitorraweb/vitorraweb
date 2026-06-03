<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExchangeRateController extends Controller
{
    /* UGX per 1 USD. Cached for 1 hour to avoid hammering the API. */
    public function show(): JsonResponse
    {
        $ugxPerUsd = Cache::remember('fx_ugx_usd', 3600, function () {
            return $this->fetchLive();
        });

        return response()->json([
            'data' => ['ugx_per_usd' => $ugxPerUsd],
        ]);
    }

    private function fetchLive(): float
    {
        $apiKey = config('services.exchange_rate.key');

        if (!$apiKey) {
            return $this->fallback();
        }

        try {
            // Uses exchangerate-api.com — free tier: 1,500 req/month
            $res = Http::timeout(8)->get(
                "https://v6.exchangerate-api.com/v6/{$apiKey}/pair/USD/UGX"
            );

            if ($res->successful() && isset($res['conversion_rate'])) {
                return (float) $res['conversion_rate'];
            }
        } catch (\Throwable $e) {
            Log::warning('Exchange rate fetch failed: ' . $e->getMessage());
        }

        return $this->fallback();
    }

    /* Last-known rate — used when the API is unreachable or not yet configured */
    private function fallback(): float
    {
        return (float) config('services.exchange_rate.fallback_ugx_per_usd', 3750);
    }
}
