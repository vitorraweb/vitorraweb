<?php

/*
|--------------------------------------------------------------------------
| Advertising on the street screen
|--------------------------------------------------------------------------
| The one place the prices live. The website reads them from the API and the
| server recomputes every booking from them, so they cannot drift apart.
|
| Monthly price = base × duration factor × visibility factor × days factor,
| rounded to the nearest UGX 1,000.
|
| ⚠ ONLY base_ugx IS FINANCE-APPROVED. Every factor and plays_per_hour below is
| a working example from the proposal or a placeholder. `enabled` must stay
| false until Finance signs them off. See PROGRESS.md.
*/

return [
    // Off: bookings are refused and the page is a 404 without the preview key.
    'enabled'     => (bool) env('SCREEN_ADS_ENABLED', false),
    'preview_key' => env('SCREEN_ADS_PREVIEW_KEY'),
    'site_url'    => env('FRONTEND_URL', 'https://vitorra.org'),

    'base_ugx'      => 450000,  // Finance-approved: 15s, standard, 5 days a week, 30 days.
    'campaign_days' => 30,
    'lead_days'     => 3,       // Earliest start, to allow for payment and review.

    // Seconds => factor. Longer films use more screen time.
    'durations' => [
        10 => 0.75,  // PLACEHOLDER: "lower tier", no figure agreed.
        15 => 1.00,  // Finance-approved base.
        30 => 1.50,  // Example.
    ],

    // Behind the customer's words, each level is a number of plays an hour.
    'visibility' => [
        'standard' => ['label' => 'Standard', 'blurb' => 'Consistent visibility throughout the day', 'factor' => 1.00, 'plays_per_hour' => 4],
        'high'     => ['label' => 'High Visibility', 'blurb' => 'Appears more frequently', 'factor' => 1.30, 'plays_per_hour' => 8],
        'maximum'  => ['label' => 'Maximum Visibility', 'blurb' => 'Highest available exposure', 'factor' => 1.60, 'plays_per_hour' => 12],
    ],

    // Days a week => factor. 5, 6 and 7 are examples; 1 to 4 are placeholders.
    'day_factors' => [1 => 0.40, 2 => 0.55, 3 => 0.70, 4 => 0.85, 5 => 1.00, 6 => 1.10, 7 => 1.20],

    // When it runs. Choosing these does not change the price. Kampala time.
    'periods' => [
        'morning' => ['label' => 'Morning', 'hours' => '6am to 10am', 'from' => 6, 'to' => 10],
        'midday'  => ['label' => 'Midday', 'hours' => '10am to 4pm', 'from' => 10, 'to' => 16],
        'evening' => ['label' => 'Evening', 'hours' => '4pm to 9pm', 'from' => 16, 'to' => 21],
    ],

    'video' => [
        'max_mb' => 200,
        'min_width' => 1280,
        // A film may be up to this many seconds off the length chosen.
        'tolerance_seconds' => 1,
    ],
];
