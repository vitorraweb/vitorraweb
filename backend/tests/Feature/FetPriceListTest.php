<?php

namespace Tests\Feature;

use App\Models\Product;
use Database\Seeders\FetPriceListSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Reservations are charged at the catalogue prices (UGX, October 2026). */
class FetPriceListTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_four_fet_products_carry_the_catalogue_prices(): void
    {
        $this->seed(FetPriceListSeeder::class);

        $this->assertSame(
            ['fet-car' => 1891000, 'fet-heavytruck' => 10015000, 'fet-lighttruck' => 5276000, 'fet-suv' => 3245000],
            Product::where('category', 'FET')->orderBy('slug')->pluck('price_ugx', 'slug')->map(fn ($v) => (int) $v)->all()
        );
    }

    public function test_a_reservation_is_charged_the_new_price(): void
    {
        $this->seed(FetPriceListSeeder::class);

        $res = $this->postJson('/api/orders/reserve', [
            'tier' => 'heavytruck', 'quantity' => 1, 'currency' => 'UGX',
            'customer_name' => 'Fleet Buyer', 'customer_email' => 'buyer@example.com',
        ]);

        $res->assertSuccessful();
        $this->assertDatabaseHas('orders', ['total' => 10015000, 'currency' => 'UGX']);
    }
}
