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

    // On-demand cache busting on the Next.js frontend — tells it to drop its
    // cached copy of a blog page immediately after publish/edit/delete, instead
    // of waiting up to 30 minutes for the ISR revalidate window to expire.
    // See App\Support\FrontendRevalidator. Unconfigured (no secret) = no-op;
    // the frontend cache still self-heals on its own schedule either way.
    'frontend' => [
        'url'               => env('FRONTEND_URL', 'http://localhost:3000'),
        'revalidate_url'    => env('FRONTEND_REVALIDATE_URL', rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/').'/api/revalidate'),
        'revalidate_secret' => env('FRONTEND_REVALIDATE_SECRET'),
    ],

    // Inbound-email capture (Phase B of the shared inbox): lets a customer's
    // reply to their own email client land back in the system instead of
    // dead-ending in a staff member's personal mailbox. Default-off — set
    // MAIL_INBOUND_CAPTURE_ENABLED=true (config/mail.php) once the reply
    // subdomain's MX + this webhook secret are set up in the Resend dashboard.
    'resend' => [
        'key'                    => env('RESEND_API_KEY'),
        'inbound_webhook_secret' => env('RESEND_INBOUND_WEBHOOK_SECRET'),
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

    /*
     * Google Ads — spend, campaigns and search terms pulled into the console,
     * and won enquiries reported back as conversions. See App\Services\GoogleAds.
     *
     * Only the OAuth client lives here. The account itself (refresh token,
     * customer id, conversion action) is connected from /admin/google-ads and
     * stored encrypted in `google_ads_accounts`, so Marketing can reconnect
     * without a deploy. Developer tokens were retired by Google on 9 Sep 2026
     * — access comes from the Cloud project's API access level (Explorer is
     * enough: 2,880 production operations a day; an hourly sync uses ~250).
     */
    // PostHog web analytics — read side for the console's Website screen.
    // personal_api_key is a secret (scope: query:read) and never leaves the
    // server; the public project key lives in the frontend's NEXT_PUBLIC_POSTHOG_KEY.
    'posthog' => [
        'host'             => rtrim((string) env('POSTHOG_HOST', 'https://eu.posthog.com'), '/'),
        'project_id'       => env('POSTHOG_PROJECT_ID'),
        'personal_api_key' => env('POSTHOG_PERSONAL_API_KEY'),
    ],

    'google_ads' => [
        'client_id'     => env('GOOGLE_ADS_CLIENT_ID'),
        'client_secret' => env('GOOGLE_ADS_CLIENT_SECRET'),
        // Where Google sends the admin back after "Connect Google Ads". Must be
        // listed as an authorised redirect URI on the OAuth client.
        'redirect_uri'  => env('GOOGLE_ADS_REDIRECT_URI', rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/').'/api/google-ads/oauth/callback'),
        'api_version'   => env('GOOGLE_ADS_API_VERSION', 'v26'),
        // Optional and ignored by Google since the sunset; sent only if set,
        // for as long as the API still accepts the header.
        'developer_token' => env('GOOGLE_ADS_DEVELOPER_TOKEN'),
    ],

    'exchange_rate' => [
        'key'                  => env('EXCHANGE_RATE_API_KEY'),
        'fallback_ugx_per_usd' => env('EXCHANGE_RATE_FALLBACK', 3750),
        // EUR per 1 USD (used for FET's EUR prices). ~0.92 at time of writing.
        'fallback_eur_per_usd' => env('EXCHANGE_RATE_FALLBACK_EUR', 0.92),
    ],

    // Flutterwave — Uganda cards + MTN/Airtel mobile money, and USD cards. Set
    // PAYMENT_DRIVER=flutterwave (config/payments.php) to make it the live gateway.
    // Sandbox vs live is determined by which keys you were issued (test keys are
    // prefixed FLWSECK_TEST-/FLWPUBK_TEST-), not a separate env setting.
    // The webhook secret hash is generated in the Flutterwave dashboard
    // (Settings → Webhooks) — there is no registration API call to run.
    'flutterwave' => [
        'public_key'     => env('FLUTTERWAVE_PUBLIC_KEY'),
        'secret_key'     => env('FLUTTERWAVE_SECRET_KEY'),
        'encryption_key' => env('FLUTTERWAVE_ENCRYPTION_KEY'),
        'secret_hash'    => env('FLUTTERWAVE_SECRET_HASH'),
        // Public site origin only; the gateway appends each payable's own return
        // path (/order/{ref}, /invoice/{token}, …). Falls back to the existing
        // FRONTEND_URL, so prod usually needs no extra var.
        'frontend_url'   => env('FLUTTERWAVE_FRONTEND_URL', env('FRONTEND_URL', 'http://localhost:3000')),
    ],

    'paypal' => [
        'client_id'     => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),
        'mode'          => env('PAYPAL_MODE', 'sandbox'),
    ],

    // Cloudflare Turnstile — free, privacy-friendly bot protection on the public
    // forms (enquiry, contact, newsletter, supplier, careers). Default-off: leave
    // the secret blank and verification is skipped (see VerifyTurnstile). The
    // frontend uses the matching NEXT_PUBLIC_TURNSTILE_SITE_KEY.
    'turnstile' => [
        'secret'   => env('TURNSTILE_SECRET_KEY'),
        'site_key' => env('TURNSTILE_SITE_KEY'),
    ],

    // Anthropic Claude — used to auto-extract applicant details from uploaded CVs.
    // When the key is unset, CV auto-fill is skipped gracefully (manual entry).
    'anthropic' => [
        'key'      => env('ANTHROPIC_API_KEY'),
        'cv_model' => env('ANTHROPIC_CV_MODEL', 'claude-haiku-4-5'),
    ],

    // IndexNow (Bing and others) — pings search engines when a blog post is
    // published. The key matches the file the website serves at /{key}.txt.
    'indexnow' => [
        'key'     => env('INDEXNOW_KEY', '25453b7fae61c6b0aa0b2c5a0db0a22b'),
        'site'    => env('INDEXNOW_SITE', 'https://vitorra.org'),
        'enabled' => env('INDEXNOW_ENABLED', env('APP_ENV') === 'production'),
    ],

];
