<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Active payment driver
    |--------------------------------------------------------------------------
    |
    | The gateway used to take payment. Until a provider account is live this
    | stays "manual" — orders are placed and the team confirms payment offline.
    | Supported: manual | flutterwave (live). Scaffolded: paypal | stripe.
    |
    | "flutterwave" is the live gateway (UGX cards + MTN/Airtel mobile money,
    | plus USD cards) — set its keys in config/services.php, generate a webhook
    | secret hash in the Flutterwave dashboard, and set FLUTTERWAVE_SECRET_HASH.
    |
    */

    'driver' => env('PAYMENT_DRIVER', 'manual'),

    /*
    |--------------------------------------------------------------------------
    | Currencies
    |--------------------------------------------------------------------------
    |
    | Flutterwave settles both UGX (cards + MTN/Airtel mobile money) and USD
    | (cards). EUR invoices/orders stay offline. Credentials live in
    | config/services.php.
    |
    */

    'currencies' => ['UGX', 'USD'],

];
