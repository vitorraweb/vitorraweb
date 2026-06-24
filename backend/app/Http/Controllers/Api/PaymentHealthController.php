<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\Payments\PesapalGateway;
use Illuminate\Http\JsonResponse;

/**
 * "Are online payments live?" — an admin-only health view of the Pesapal gateway
 * so the team can confirm activation without reading logs. `show` is instant
 * (config only); `test` makes a live call to Pesapal to validate the keys.
 */
class PaymentHealthController extends Controller
{
    public function show(): JsonResponse
    {
        $driver = config('payments.driver');
        $cfg    = config('services.pesapal');

        return response()->json(['data' => [
            'provider'       => 'pesapal',
            'driver'         => $driver,
            'online_enabled' => $driver === 'pesapal',
            'keys_present'   => ! empty($cfg['consumer_key']) && ! empty($cfg['consumer_secret']),
            'environment'    => $cfg['env'] ?? 'sandbox',
            'ipn_registered' => ! empty(Setting::get('pesapal_ipn_id') ?: ($cfg['ipn_id'] ?? null)),
        ]]);
    }

    /** Live connection test — validates the configured keys against Pesapal. */
    public function test(): JsonResponse
    {
        $result = (new PesapalGateway(config('services.pesapal')))->verifyConnection();

        return response()->json(['data' => $result]);
    }
}
