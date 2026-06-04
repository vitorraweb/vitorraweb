<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin + Ops accounts ──────────────────────────────────────────
        // ⚠ Change these passwords immediately after first login.
        User::updateOrCreate(
            ['email' => 'admin@vitorra.org'],
            [
                'name'     => 'Vitorra Admin',
                'password' => Hash::make('changeme123'),
                'role'     => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'ops@vitorra.org'],
            [
                'name'     => 'Vitorra Ops',
                'password' => Hash::make('changeme123'),
                'role'     => 'ops',
            ]
        );

        // ── Coffee catalogue (slugs + prices mirror the storefront) ────────
        $coffee = [
            [
                'slug'            => 'gold-medium-roast-250g',
                'name'            => 'GOLD · Medium Roast',
                'description'     => 'Our flagship single-origin Arabica from the highland slopes of Mount Elgon — smooth, balanced, with notes of caramel. Washed, sun-dried, and roasted in Uganda. The everyday bag for home and office.',
                'price_ugx'       => 38000,
                'price_usd_cents' => 1200,
                'stock_quantity'  => 120,
                'images'          => [
                    ['url' => '/products/coffee/packshot.png',    'alt' => 'Vitorra GOLD medium roast — 250g bag',     'type' => 'image'],
                    ['url' => '/products/coffee/label-front.png', 'alt' => 'Vitorra GOLD front label',                 'type' => 'image'],
                    ['url' => '/products/coffee/label-back.png',  'alt' => 'Vitorra GOLD back label',                  'type' => 'image'],
                    ['url' => '/products/coffee/bean-macro.png',  'alt' => 'Close-up of roasted Arabica beans',        'type' => 'image'],
                ],
                'meta'            => [
                    'tagline' => '250g · Single origin Arabica',
                    'badge'   => 'Bestseller',
                    'weight'  => '250g',
                ],
            ],
            [
                'slug'            => 'gold-medium-roast-1kg',
                'name'            => 'GOLD · Medium Roast',
                'description'     => 'The same GOLD medium roast in a 1kg bag — built for busy households, offices, and cafés that go through coffee fast. Best value per cup, sealed fresh at origin.',
                'price_ugx'       => 135000,
                'price_usd_cents' => 4200,
                'stock_quantity'  => 60,
                'images'          => [
                    ['url' => '/products/coffee/label-front.png', 'alt' => 'Vitorra GOLD — 1kg bag',           'type' => 'image'],
                    ['url' => '/products/coffee/packshot.png',    'alt' => 'Vitorra GOLD packshot',            'type' => 'image'],
                    ['url' => '/products/coffee/lifestyle.png',   'alt' => 'Vitorra coffee with a brewed cup', 'type' => 'image'],
                    ['url' => '/products/coffee/beans.png',       'alt' => 'Roasted Vitorra coffee beans',     'type' => 'image'],
                ],
                'meta'            => [
                    'tagline' => '1kg · Single origin Arabica',
                    'badge'   => 'Best value',
                    'weight'  => '1kg',
                ],
            ],
            [
                'slug'            => 'gold-gift-box',
                'name'            => 'GOLD Gift Box',
                'description'     => 'Two 250g bags of GOLD medium roast in a premium presentation box — the taste of Uganda, ready to gift. A considered present for clients, colleagues, and coffee lovers.',
                'price_ugx'       => 82000,
                'price_usd_cents' => 2600,
                'stock_quantity'  => 40,
                'images'          => [
                    ['url' => '/products/coffee/collage.png',   'alt' => 'Vitorra GOLD gift box',            'type' => 'image'],
                    ['url' => '/products/coffee/lifestyle.png', 'alt' => 'Vitorra coffee with a brewed cup', 'type' => 'image'],
                    ['url' => '/products/coffee/packshot.png',  'alt' => 'Vitorra GOLD packshot',            'type' => 'image'],
                    ['url' => '/products/coffee/bean-macro.png','alt' => 'Close-up of roasted Arabica beans','type' => 'image'],
                ],
                'meta'            => [
                    'tagline' => '2 × 250g · Presentation box',
                    'badge'   => 'Gift',
                    'weight'  => '2 × 250g',
                ],
            ],
        ];

        $sharedMeta = [
            'roast'         => 'Medium',
            'origin'        => 'Mount Elgon, Uganda',
            'tasting_notes' => 'Smooth · Balanced · Caramel',
            'process'       => 'Washed & Sun Dried',
        ];

        foreach ($coffee as $product) {
            Product::updateOrCreate(
                ['slug' => $product['slug']],
                [
                    'name'            => $product['name'],
                    'category'        => 'COFFEE',
                    'description'     => $product['description'],
                    'price_ugx'       => $product['price_ugx'],
                    'price_usd_cents' => $product['price_usd_cents'],
                    'stock_quantity'  => $product['stock_quantity'],
                    'is_published'    => true,
                    'images'          => $product['images'],
                    'meta'            => array_merge($sharedMeta, $product['meta']),
                ]
            );
        }
    }
}
