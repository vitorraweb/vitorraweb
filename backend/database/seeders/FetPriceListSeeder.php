<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * FET catalogue entries for the "Reserve Now" self-serve flow, at the prices
 * printed in the Fuel Eco Tech product catalogue (October 2026, UGX). Mirrors
 * `frontend/src/lib/fet-pricing.ts` FET_TIERS — change both together.
 *
 * Reservations are priced from these rows on the server, so the website and
 * what a customer is charged only agree once this has run. Safe to run on
 * production on its own; it touches nothing but the four FET products:
 *
 *   php artisan db:seed --class=FetPriceListSeeder --force
 *
 * The USD figure is derived from the fallback exchange rate, for the USD
 * checkout path only; UGX is the price of record.
 */
class FetPriceListSeeder extends Seeder
{
    public const TIERS = [
        'fet-car' => [
            'name' => 'FET-PRO-FI — Car / Mini-bus',
            'desc' => 'Fuel Eco Tech device for small, compact & mid-range cars, mini-buses and vans (1.0–2.0L). Includes professional installation.',
            'ugx'  => 1_891_000,
        ],
        'fet-suv' => [
            'name' => 'FET-PRO-FII — SUV / Large car',
            'desc' => 'Fuel Eco Tech device for SUVs, sports & upper-class cars and Sprinter-class vans to 5t (1.5–3.0L). Includes professional installation.',
            'ugx'  => 3_245_000,
        ],
        'fet-lighttruck' => [
            'name' => 'FET-PRO-FIII — Light truck',
            'desc' => 'Fuel Eco Tech device for light & medium trucks to 18t and performance cars (3.0–9.0L). Includes professional installation.',
            'ugx'  => 5_276_000,
        ],
        'fet-heavytruck' => [
            'name' => 'FET-PRO-FIV — Heavy truck',
            'desc' => 'Fuel Eco Tech device for heavy goods vehicles & haulage (10–16L). Includes professional installation.',
            'ugx'  => 10_015_000,
        ],
    ];

    public function run(): void
    {
        $ugxPerUsd = (float) config('services.exchange_rate.fallback_ugx_per_usd', 3750);

        foreach (self::TIERS as $slug => $tier) {
            $product = Product::firstOrNew(['slug' => $slug]);

            $product->fill([
                'name'            => $tier['name'],
                'category'        => 'FET',
                'description'     => $tier['desc'],
                'price_ugx'       => $tier['ugx'],
                'price_usd_cents' => (int) round($tier['ugx'] / $ugxPerUsd * 100),
                'stock_quantity'  => null, // unlimited — not physically stock-constrained
                'is_published'    => true,
                'meta'            => ['price_source' => 'FET product catalogue, October 2026'],
            ]);

            // Keep any photo staff have since set in /admin/products.
            if (empty($product->images)) {
                $product->images = [
                    ['url' => '/products/fet/packshot.png', 'alt' => $tier['name'], 'type' => 'image'],
                ];
            }

            $product->save();
        }
    }
}
