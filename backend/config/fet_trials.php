<?php

/*
|--------------------------------------------------------------------------
| FET trials — evidence thresholds
|--------------------------------------------------------------------------
| What counts as enough evidence to state a result, and when a reading is
| suspicious enough to raise with a human. Every value is overridable per
| trial where the column exists; these are the defaults.
|
| The numbers below are not arbitrary — they come from the first real trial
| (Hariss, UA 758AM, July–August 2026), analysed in
| planning/11-hariss-ua758am-trial-analysis.md:
|
|   • The same truck on the same route varied by 4.2% between runs, while
|     different routes varied by 41%. Route variance is roughly 3x the size
|     of the 13.9% effect FET is certified to deliver — so a comparison that
|     is not route-matched measures the road, not the product.
|   • That is why comparison is stratified by route and why a route needs
|     more than one "before" trip before it can anchor anything.
*/

return [

    /*
     * A verdict needs this many trial trips that sit on a route with a usable
     * baseline. Trial trips on unmatched routes are reported, never counted.
     */
    'required_matched_trips' => 3,

    /*
     * A route can only anchor a comparison once it has this many pre-install
     * trips. One trip is a single observation, not a baseline — it carries no
     * sense of how much that route naturally varies.
     */
    'min_baseline_trips_per_route' => 2,

    'thresholds' => [
        // Manual vs tracker fuel disagreement, as a % of fuel used, before asking a human.
        'ivms_variance_pct' => 15.0,

        // Return weight above tare x this = the truck came back loaded, so it
        // did materially more work than the baseline trips it is compared to.
        'return_load_multiple' => 1.5,

        // Fuel use outside these multiples of the route/fleet reference is
        // implausible and almost always a data-entry error.
        'efficiency_band' => ['min' => 0.5, 'max' => 2.0],

        // Planned vs actually-driven distance gap worth noting.
        'planned_vs_actual_pct' => 5.0,

        // A trial trip whose load differs from its matched baseline mean by
        // more than this is not a like-for-like comparison.
        'load_tolerance_pct' => 15.0,

        // A value above this in a column labelled "tonnes" is really kilogrammes.
        'kg_in_tonnes_threshold' => 1000,

        // A trip this far above rated capacity is over-loaded (or mis-keyed).
        'capacity_tolerance_pct' => 0.0,
    ],

    // Diesel burned per litre. Mirrors config/fet.php so both modules agree.
    'co2_kg_per_litre' => 2.64,
];
