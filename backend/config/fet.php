<?php

/*
|--------------------------------------------------------------------------
| Fuel Eco Tech — server-side savings model
|--------------------------------------------------------------------------
| Mirrors frontend/src/lib/fet-pricing.ts. Each public tier maps to a device
| model and a representative baseline fuel use (l/100km) used ONLY as a
| fallback when a real measured/declared baseline isn't recorded for an
| installation. `verified_pct` is the CTI GmbH VW T5 field-test result — the
| public proof point the measured savings are compared against.
*/

return [

    'tiers' => [
        'car'        => ['model' => 'FET-PRO-FI',   'label' => 'Car / Mini-bus',  'baseline_l_per_100' => 7.5],
        'suv'        => ['model' => 'FET-PRO-FII',  'label' => 'SUV / Large car', 'baseline_l_per_100' => 10.0],
        'lighttruck' => ['model' => 'FET-PRO-FIII', 'label' => 'Light truck',     'baseline_l_per_100' => 22.0],
        'heavytruck' => ['model' => 'FET-PRO-FIV',  'label' => 'Heavy truck',     'baseline_l_per_100' => 32.0],
    ],

    // CTI GmbH (VW T5) measured fuel reduction — the verified anchor.
    'verified_pct' => 13.9,

    // Diesel ≈ 2.64 kg CO₂ per litre burned (used to estimate emissions avoided).
    'co2_kg_per_litre' => 2.64,
];
