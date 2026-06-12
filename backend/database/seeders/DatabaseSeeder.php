<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin + Ops accounts ──────────────────────────────────────────
        // Passwords come from the environment (ADMIN_PASSWORD / OPS_PASSWORD).
        // If unset, a strong random password is generated and printed ONCE so
        // the deployer can record it. Re-seeding never overwrites a password
        // that has already been changed in the admin panel.
        $this->seedStaffUser('admin@vitorra.org', 'Vitorra Admin', 'admin', env('ADMIN_PASSWORD'));
        $this->seedStaffUser('ops@vitorra.org', 'Vitorra Ops', 'ops', env('OPS_PASSWORD'));

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

        $this->seedFetProducts();
    }

    /**
     * FET catalogue entries for the "Reserve Now, Pay Cash" self-serve flow.
     * Mirrors `frontend/src/lib/fet-pricing.ts` FET_TIERS (EUR, Kampala landed
     * + installation, 35% margin). UGX/USD prices are computed here from the
     * fallback exchange rate and rounded to the nearest 10,000 UGX — review
     * and adjust in /admin/products before these are customer-facing.
     */
    protected function seedFetProducts(): void
    {
        $eurPerUsd = (float) config('services.exchange_rate.fallback_eur_per_usd', 0.92);
        $ugxPerUsd = (float) config('services.exchange_rate.fallback_ugx_per_usd', 3750);

        $tiers = [
            [
                'slug'  => 'fet-car',
                'name'  => 'FET-PRO-FI — Car / Mini-bus',
                'desc'  => 'Fuel Eco Tech device for compact & mid-range cars and mini-buses (1.4–2.0L). Kampala landed price, includes professional installation.',
                'eur'   => 365.40,
            ],
            [
                'slug'  => 'fet-suv',
                'name'  => 'FET-PRO-FII — SUV / Large car',
                'desc'  => 'Fuel Eco Tech device for SUVs, sports, upper-class & large cars (1.5–3.0L). Kampala landed price, includes professional installation.',
                'eur'   => 630.71,
            ],
            [
                'slug'  => 'fet-lighttruck',
                'name'  => 'FET-PRO-FIII — Light truck',
                'desc'  => 'Fuel Eco Tech device for light commercial trucks & vans (3.0–6.7L). Kampala landed price, includes professional installation.',
                'eur'   => 1028.69,
            ],
            [
                'slug'  => 'fet-heavytruck',
                'name'  => 'FET-PRO-FIV — Heavy truck',
                'desc'  => 'Fuel Eco Tech device for heavy goods vehicles & haulage (12–13L). Kampala landed price, includes professional installation.',
                'eur'   => 1957.30,
            ],
        ];

        foreach ($tiers as $tier) {
            $priceUsd = $tier['eur'] / $eurPerUsd;
            $priceUgx = (int) (round(($priceUsd * $ugxPerUsd) / 10000) * 10000);

            Product::updateOrCreate(
                ['slug' => $tier['slug']],
                [
                    'name'            => $tier['name'],
                    'category'        => 'FET',
                    'description'     => $tier['desc'],
                    'price_ugx'       => $priceUgx,
                    'price_usd_cents' => (int) round($priceUsd * 100),
                    'stock_quantity'  => null, // unlimited — not physically stock-constrained
                    'is_published'    => true,
                    'images'          => [
                        ['url' => '/products/fet/packshot.png', 'alt' => $tier['name'], 'type' => 'image'],
                    ],
                    'meta'            => [
                        'price_eur' => $tier['eur'],
                    ],
                ]
            );
        }
    }

    /**
     * Create or refresh a staff account without ever resetting a password
     * that was already changed. The password is only set when the account is
     * first created — taken from $password (env) or a generated strong secret
     * which is printed once to the console.
     */
    protected function seedStaffUser(string $email, string $name, string $role, ?string $password): void
    {
        $existing = User::where('email', $email)->first();

        if ($existing) {
            // Account already exists — keep its (possibly changed) password,
            // only keep name/role in sync.
            $existing->fill(['name' => $name, 'role' => $role])->save();

            return;
        }

        $generated = false;
        if (blank($password)) {
            $password = Str::password(20);
            $generated = true;
        }

        User::create([
            'email'    => $email,
            'name'     => $name,
            'role'     => $role,
            'password' => Hash::make($password),
        ]);

        if ($generated && $this->command) {
            $this->command->warn("Generated password for {$email}: {$password}");
            $this->command->warn('  ↑ Record this now — it is not shown again. Change it in /admin/users after first login.');
        }
    }
}
