<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Active payment driver
    |--------------------------------------------------------------------------
    |
    | The gateway used to take payment. Until a provider account is live this
    | stays "manual" — orders are placed and the team confirms payment offline.
    | Supported: manual | pesapal (live). Scaffolded: flutterwave | paypal | stripe.
    |
    | "pesapal" is the live Uganda gateway (cards + MTN/Airtel mobile money) —
    | set its keys in config/services.php and run `php artisan pesapal:register-ipn`.
    |
    */

    'driver' => env('PAYMENT_DRIVER', 'manual'),

    /*
    |--------------------------------------------------------------------------
    | Currencies
    |--------------------------------------------------------------------------
    |
    | UGX is settled by Flutterwave (cards + MTN/Airtel mobile money); USD by
    | PayPal. Provider credentials live in config/services.php.
    |
    */

    'currencies' => ['UGX', 'USD'],

];
