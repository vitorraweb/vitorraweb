<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Active payment driver
    |--------------------------------------------------------------------------
    |
    | The gateway used to take payment. Until a provider account is live this
    | stays "manual" — orders are placed and the team confirms payment offline.
    | Supported (once implemented): manual | flutterwave | paypal | stripe.
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
