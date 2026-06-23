<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'plausible' => [
        'api_key' => env('PLAUSIBLE_API_KEY'),
        'site_id' => env('PLAUSIBLE_SITE_ID', 'vitorra.org'),
    ],

    'exchange_rate' => [
        'key'                  => env('EXCHANGE_RATE_API_KEY'),
        'fallback_ugx_per_usd' => env('EXCHANGE_RATE_FALLBACK', 3750),
        // EUR per 1 USD (used for FET's EUR prices). ~0.92 at time of writing.
        'fallback_eur_per_usd' => env('EXCHANGE_RATE_FALLBACK_EUR', 0.92),
    ],

    'flutterwave' => [
        'public_key'      => env('FLUTTERWAVE_PUBLIC_KEY'),
        'secret_key'      => env('FLUTTERWAVE_SECRET_KEY'),
        'encryption_key'  => env('FLUTTERWAVE_ENCRYPTION_KEY'),
    ],

    'paypal' => [
        'client_id'     => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),
        'mode'          => env('PAYPAL_MODE', 'sandbox'),
    ],

    // Pesapal (API 3.0) — Uganda local cards + MTN/Airtel mobile money. Set
    // PAYMENT_DRIVER=pesapal (config/payments.php) to make it the live gateway.
    // After deploying, run `php artisan pesapal:register-ipn` once — it stores the
    // IPN id in Settings, so PESAPAL_IPN_ID below is an optional fallback only.
    'pesapal' => [
        'consumer_key'    => env('PESAPAL_CONSUMER_KEY'),
        'consumer_secret' => env('PESAPAL_CONSUMER_SECRET'),
        'env'             => env('PESAPAL_ENV', 'sandbox'),   // sandbox | live
        'ipn_id'          => env('PESAPAL_IPN_ID'),
        // Public site origin only; the gateway appends each payable's own return
        // path (/pay/return for orders, /invoice/{token} for invoices). Falls
        // back to the existing FRONTEND_URL, so prod usually needs no extra var.
        'frontend_url'    => env('PESAPAL_FRONTEND_URL', env('FRONTEND_URL', 'http://localhost:3000')),
    ],

    // Anthropic Claude — used to auto-extract applicant details from uploaded CVs.
    // When the key is unset, CV auto-fill is skipped gracefully (manual entry).
    'anthropic' => [
        'key'      => env('ANTHROPIC_API_KEY'),
        'cv_model' => env('ANTHROPIC_CV_MODEL', 'claude-haiku-4-5'),
    ],

];
