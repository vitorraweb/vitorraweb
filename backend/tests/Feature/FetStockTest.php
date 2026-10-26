<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\FetStockMovement;
use App\Models\Product;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FetStockTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'admin']);
    }

    private function juniorFinance(): User
    {
        return User::create(['name' => 'Daniel', 'email' => 'd-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'ops', 'department' => 'finance']);
    }

    private function h(User $u): array
    {
        return ['Authorization' => 'Bearer '.$u->createToken('t')->plainTextToken];
    }

    private function record(User $u, array $body)
    {
        return $this->withHeaders($this->h($u))->postJson('/api/admin/accounting/stock', $body + ['moved_on' => now()->toDateString()]);
    }

    public function test_sold_is_stored_as_stock_leaving(): void
    {
        $u = $this->juniorFinance();
        $this->record($u, ['model' => 'FII', 'type' => 'received', 'quantity' => 10])->assertCreated();
        $this->record($u, ['model' => 'FII', 'type' => 'sold', 'quantity' => 3])->assertCreated()->assertJsonPath('data.quantity', -3);

        $res = $this->withHeaders($this->h($u))->getJson('/api/admin/accounting/stock')->assertOk();
        $fii = collect($res->json('models'))->firstWhere('code', 'FII');
        $this->assertSame(7, $fii['on_hand']);
    }

    public function test_weekly_overview_carries_closing_into_next_opening(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-28')); // a Wednesday
        $u = $this->admin();

        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 20, 'moved_on' => '2026-10-13'])->assertCreated();
        $this->record($u, ['model' => 'FI', 'type' => 'sold', 'quantity' => 5, 'moved_on' => '2026-10-21'])->assertCreated();
        $this->record($u, ['model' => 'FI', 'type' => 'adjustment', 'quantity' => -1, 'moved_on' => '2026-10-26', 'note' => 'count'])->assertCreated();

        $weeks = $this->withHeaders($this->h($u))->getJson('/api/admin/accounting/stock?weeks=3')->assertOk()->json('weeks');

        // Newest first: 26 Oct, 19 Oct, 12 Oct.
        $this->assertSame(['2026-10-26', '2026-10-19', '2026-10-12'], array_column($weeks, 'start'));
        $this->assertSame(['opening' => 0, 'received' => 20, 'sold' => 0, 'returned' => 0, 'adjusted' => 0, 'closing' => 20], $weeks[2]['models']['FI']);
        $this->assertSame(['opening' => 20, 'received' => 0, 'sold' => 5, 'returned' => 0, 'adjusted' => 0, 'closing' => 15], $weeks[1]['models']['FI']);
        $this->assertSame(14, $weeks[0]['models']['FI']['closing']);
        $this->assertSame(0, $weeks[0]['models']['FIV']['closing']);
    }

    public function test_cannot_sell_more_than_in_stock(): void
    {
        $u = $this->admin();
        $this->record($u, ['model' => 'FIII', 'type' => 'sold', 'quantity' => 1])->assertUnprocessable()->assertJsonValidationErrors('quantity');

        // A sale dated before the delivery is refused too.
        $this->record($u, ['model' => 'FIII', 'type' => 'received', 'quantity' => 2, 'moved_on' => now()->toDateString()])->assertCreated();
        $this->record($u, ['model' => 'FIII', 'type' => 'sold', 'quantity' => 1, 'moved_on' => now()->subDays(3)->toDateString()])->assertUnprocessable();

        // Same-day delivery and sale is fine.
        $this->record($u, ['model' => 'FIII', 'type' => 'sold', 'quantity' => 2])->assertCreated();
    }

    public function test_adjustment_needs_a_reason(): void
    {
        $u = $this->admin();
        $this->record($u, ['model' => 'FI', 'type' => 'adjustment', 'quantity' => 2])->assertJsonValidationErrors('note');
        $this->record($u, ['model' => 'FI', 'type' => 'adjustment', 'quantity' => 2, 'note' => 'Stock count'])->assertCreated();
    }

    public function test_value_uses_catalogue_price(): void
    {
        Product::create(['slug' => 'fet-car', 'name' => 'FI', 'category' => 'FET', 'price_ugx' => 1_891_000, 'price_usd_cents' => 0, 'is_published' => true]);
        $u = $this->admin();
        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 3])->assertCreated();

        $fi = collect($this->withHeaders($this->h($u))->getJson('/api/admin/accounting/stock')->json('models'))->firstWhere('code', 'FI');
        $this->assertSame(5_673_000, $fi['value_ugx']);
    }

    public function test_only_senior_finance_can_delete_and_it_is_logged(): void
    {
        $junior = $this->juniorFinance();
        $this->record($junior, ['model' => 'FI', 'type' => 'received', 'quantity' => 4])->assertCreated();
        $m = FetStockMovement::first();

        $this->withHeaders($this->h($junior))->deleteJson("/api/admin/accounting/stock/{$m->id}")->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->h($this->admin()))->deleteJson("/api/admin/accounting/stock/{$m->id}")->assertOk();

        $this->assertDatabaseCount('fet_stock_movements', 0);
        $this->assertTrue(ActivityLog::where('action', 'fet_stock.delete')->exists());
    }

    public function test_cannot_delete_a_delivery_already_sold_from(): void
    {
        $u = $this->admin();
        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 2])->assertCreated();
        $this->record($u, ['model' => 'FI', 'type' => 'sold', 'quantity' => 2])->assertCreated();
        $delivery = FetStockMovement::where('type', 'received')->first();

        $this->withHeaders($this->h($u))->deleteJson("/api/admin/accounting/stock/{$delivery->id}")->assertUnprocessable();
    }

    public function test_customers_cannot_see_stock(): void
    {
        $c = User::create(['name' => 'C', 'email' => 'c@x.org', 'password' => 'changeme123', 'role' => 'customer']);
        $this->withHeaders($this->h($c))->getJson('/api/admin/accounting/stock')->assertForbidden();
    }

    public function test_export_is_csv(): void
    {
        $u = $this->admin();
        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 1])->assertCreated();
        $res = $this->withHeaders($this->h($u))->get('/api/admin/accounting/stock/export')->assertOk();
        $this->assertStringContainsString('FET-PRO-FI', $res->streamedContent());
    }
}
