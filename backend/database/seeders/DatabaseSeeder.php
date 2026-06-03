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

        // ── Sample coffee product (the Coffee Shop reads published products) ─
        Product::updateOrCreate(
            ['slug' => 'vitorra-gold-medium-roast-250g'],
            [
                'name'            => 'Vitorra GOLD — Medium Roast',
                'category'        => 'COFFEE',
                'description'     => 'Single-origin 100% Arabica from Mount Elgon, Uganda. Smooth, balanced, with caramel notes. Washed & sun-dried, roasted in Uganda. 250g.',
                'price_ugx'       => 35000,
                'price_usd_cents' => 950,
                'stock_quantity'  => 100,
                'is_published'    => true,
                'images'          => [
                    ['url' => '/products/coffee/packshot.png', 'alt' => 'Vitorra GOLD medium roast coffee bag', 'type' => 'image'],
                    ['url' => '/products/coffee/lifestyle.png', 'alt' => 'Vitorra coffee with a brewed cup', 'type' => 'image'],
                ],
                'meta'            => [
                    'roast'        => 'Medium',
                    'origin'       => 'Mount Elgon, Uganda',
                    'tasting_notes'=> 'Smooth · Balanced · Caramel',
                    'process'      => 'Washed & Sun Dried',
                    'weight'       => '250g',
                ],
            ]
        );
    }
}
