<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Payments\FlutterwaveGateway;
use Illuminate\Http\JsonResponse;

/**
 * "Are online payments live?" — an admin-only health view of the Flutterwave
 * gateway so the team can confirm activation without reading logs. `show` is
 * instant (config only); `test` makes a live call to Flutterwave to validate
 * the keys.
 */
class PaymentHealthController extends Controller
{
    public function show(): JsonResponse
    {
        $driver = config('payments.driver');
        $cfg    = config('services.flutterwave');

        return response()->json(['data' => [
            'provider'          => 'flutterwave',
            'driver'            => $driver,
            'online_enabled'    => $driver === 'flutterwave',
            'keys_present'      => ! empty($cfg['secret_key']) && ! empty($cfg['public_key']),
            'environment'       => str_starts_with((string) ($cfg['secret_key'] ?? ''), 'FLWSECK_TEST') ? 'sandbox' : 'live',
            'webhook_secret_set' => ! empty($cfg['secret_hash']),
        ]]);
    }

    /** Live connection test — validates the configured keys against Flutterwave. */
    public function test(): JsonResponse
    {
        $result = (new FlutterwaveGateway(config('services.flutterwave')))->verifyConnection();

        return response()->json(['data' => $result]);
    }
}
