<?php

/*
|--------------------------------------------------------------------------
| Advertising on the street screen
|--------------------------------------------------------------------------
| The one place the prices live. The website reads them from the API and the
| server takes every booking's price from here, so they cannot drift apart.
|
| Prices: Finance's rate card (Vitorra_Weekly_Advertising_Booking_Calendar.xlsx,
| Joseph Rwabu, 2 November 2026): fixed packages of 15-second plays. The sheet's
| per-10-minute formula is marked unapproved and is deliberately not used.
|
| plays_per_hour: the rate card's 15-second play in a 4-minute loop gives Trial
| and Standard 15 an hour. Growth doubles it and High Visibility doubles it again,
| so a bigger package costs a little less per play (decided 2 November 2026).
*/

return [
    // Off: bookings are refused and the page is a 404 without the preview key.
    'enabled'     => (bool) env('SCREEN_ADS_ENABLED', false),
    'preview_key' => env('SCREEN_ADS_PREVIEW_KEY'),
    'site_url'    => env('FRONTEND_URL', 'https://vitorra.org'),

    'lead_days' => 3,       // Earliest start, to allow for payment and review.
    'refund_working_days' => 10,

    'packages' => [
        'trial'    => ['label' => 'Trial', 'price_ugx' => 150000, 'days' => 7, 'plays_per_hour' => 15],
        'standard' => ['label' => 'Standard', 'price_ugx' => 450000, 'days' => 30, 'plays_per_hour' => 15],
        'growth'   => ['label' => 'Growth', 'price_ugx' => 850000, 'days' => 30, 'plays_per_hour' => 30],
        'high'     => ['label' => 'High Visibility', 'price_ugx' => 1600000, 'days' => 30, 'plays_per_hour' => 60],
    ],

    // On screen every day of a campaign, Kampala time: the rate card's 16-hour day.
    'on_air' => ['from' => 6, 'to' => 22, 'label' => '6am to 10pm'],

    'video' => [
        // The only length the rate card prices. Longer films go to a quote.
        'seconds' => 15,
        'max_mb' => 200,
        'min_width' => 1280,
        // A film may be up to this many seconds off.
        'tolerance_seconds' => 1,
    ],
];
