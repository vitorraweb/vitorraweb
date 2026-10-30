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
        $this->record($u, ['model' => 'FII', 'type' => 'sold', 'quantity' => 3, 'picked_by' => 'Victor Lojum'])->assertCreated()->assertJsonPath('data.quantity', -3);

        $res = $this->withHeaders($this->h($u))->getJson('/api/admin/accounting/stock')->assertOk();
        $fii = collect($res->json('models'))->firstWhere('code', 'FII');
        $this->assertSame(7, $fii['on_hand']);
    }

    public function test_weekly_overview_carries_closing_into_next_opening(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-28')); // a Wednesday
        $u = $this->admin();

        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 20, 'moved_on' => '2026-10-13'])->assertCreated();
        $this->record($u, ['model' => 'FI', 'type' => 'sold', 'quantity' => 5, 'picked_by' => 'Victor Lojum', 'moved_on' => '2026-10-21'])->assertCreated();
        $this->record($u, ['model' => 'FI', 'type' => 'adjustment', 'quantity' => -1, 'moved_on' => '2026-10-26', 'note' => 'count'])->assertCreated();

        $weeks = $this->withHeaders($this->h($u))->getJson('/api/admin/accounting/stock?weeks=3')->assertOk()->json('weeks');

        // In date order, the current week last: 12 Oct, 19 Oct, 26 Oct.
        $this->assertSame(['2026-10-12', '2026-10-19', '2026-10-26'], array_column($weeks, 'start'));
        $this->assertSame(['opening' => 0, 'received' => 20, 'sold' => 0, 'returned' => 0, 'adjusted' => 0, 'closing' => 20], $weeks[0]['models']['FI']);
        $this->assertSame(['opening' => 20, 'received' => 0, 'sold' => 5, 'returned' => 0, 'adjusted' => 0, 'closing' => 15], $weeks[1]['models']['FI']);
        $this->assertSame(14, $weeks[2]['models']['FI']['closing']);
        $this->assertSame(0, $weeks[2]['models']['FIV']['closing']);

        // Asking for more weeks doesn't add empty weeks from before stock was first recorded.
        $this->app['auth']->forgetGuards();
        $this->assertCount(3, $this->withHeaders($this->h($u))->getJson('/api/admin/accounting/stock?weeks=8')->json('weeks'));
    }

    public function test_cannot_sell_more_than_in_stock(): void
    {
        $u = $this->admin();
        $this->record($u, ['model' => 'FIII', 'type' => 'sold', 'quantity' => 1, 'picked_by' => 'Victor Lojum'])->assertUnprocessable()->assertJsonValidationErrors('quantity');

        // A sale dated before the delivery is refused too.
        $this->record($u, ['model' => 'FIII', 'type' => 'received', 'quantity' => 2, 'moved_on' => now()->toDateString()])->assertCreated();
        $this->record($u, ['model' => 'FIII', 'type' => 'sold', 'quantity' => 1, 'picked_by' => 'Victor Lojum', 'moved_on' => now()->subDays(3)->toDateString()])->assertUnprocessable();

        // Same-day delivery and sale is fine.
        $this->record($u, ['model' => 'FIII', 'type' => 'sold', 'quantity' => 2, 'picked_by' => 'Victor Lojum'])->assertCreated();
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
        $this->record($u, ['model' => 'FI', 'type' => 'sold', 'quantity' => 2, 'picked_by' => 'Victor Lojum'])->assertCreated();
        $delivery = FetStockMovement::where('type', 'received')->first();

        $this->withHeaders($this->h($u))->deleteJson("/api/admin/accounting/stock/{$delivery->id}")->assertUnprocessable();
    }

    public function test_a_sale_needs_the_name_of_who_picked_the_devices_up(): void
    {
        $u = $this->admin();
        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 3])->assertCreated();
        $this->record($u, ['model' => 'FI', 'type' => 'sold', 'quantity' => 1])
            ->assertUnprocessable()->assertJsonValidationErrors('picked_by');

        $this->record($u, ['model' => 'FI', 'type' => 'sold', 'quantity' => 1, 'picked_by' => 'Musa (installer)'])
            ->assertCreated()->assertJsonPath('data.picked_by', 'Musa (installer)');
        $this->withHeaders($this->h($u))->getJson('/api/admin/accounting/stock')
            ->assertJsonPath('movements.0.picked_by', 'Musa (installer)');
    }

    public function test_weekly_devices_out_pdf(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-10-28'));
        $u = $this->admin();
        $this->record($u, ['model' => 'FII', 'type' => 'received', 'quantity' => 5, 'moved_on' => '2026-10-20'])->assertCreated();
        $this->record($u, ['model' => 'FII', 'type' => 'sold', 'quantity' => 2, 'moved_on' => '2026-10-27', 'picked_by' => 'Victor Lojum', 'reference' => 'INV-77'])->assertCreated();

        $res = $this->withHeaders($this->h($u))->get('/api/admin/accounting/stock/week-pdf?week=2026-10-29')->assertOk();
        $this->assertStringStartsWith('%PDF', $res->getContent());
        $this->assertStringContainsString('vitorra-fet-status-2026-10-26.pdf', $res->headers->get('content-disposition'));

        // The sheet itself names who picked the devices up.
        $html = view('documents.fet-stock-week', [
            'start' => CarbonImmutable::parse('2026-10-26'), 'end' => CarbonImmutable::parse('2026-11-01'),
            'out' => FetStockMovement::where('quantity', '<', 0)->get(), 'summary' => [], 'models' => FetStockMovement::MODELS, 'printedBy' => 'A',
        ])->render();
        $this->assertStringContainsString('Victor Lojum', $html);
        $this->assertStringContainsString('INV-77', $html);
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

    private function holders(User $u): array
    {
        $this->app['auth']->forgetGuards();

        return collect($this->withHeaders($this->h($u))->getJson('/api/admin/accounting/stock')->assertOk()->json('holders'))
            ->mapWithKeys(fn ($h) => [$h['holder'] => $h])->all();
    }

    public function test_received_by_is_where_the_devices_are_kept(): void
    {
        $u = $this->juniorFinance();
        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 10])->assertCreated()
            ->assertJsonPath('data.holder', FetStockMovement::MAIN_HOLDER);
        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 3, 'holder' => 'Mbarara branch'])->assertCreated();
        // "Victor" is the main store, not a separate holder.
        $this->record($u, ['model' => 'FII', 'type' => 'received', 'quantity' => 2, 'holder' => 'victor lojum'])->assertCreated();

        $h = $this->holders($u);
        $this->assertSame(array_keys($h)[0], FetStockMovement::MAIN_HOLDER); // main store first
        $this->assertSame(['FI' => 10, 'FII' => 2, 'FIII' => 0, 'FIV' => 0], $h[FetStockMovement::MAIN_HOLDER]['models']);
        $this->assertSame(3, $h['Mbarara branch']['total']);
    }

    public function test_hand_over_moves_devices_between_holders_not_out_of_stock(): void
    {
        $u = $this->juniorFinance();
        $this->record($u, ['model' => 'FIII', 'type' => 'received', 'quantity' => 5])->assertCreated();
        $this->record($u, ['model' => 'FIII', 'type' => 'transfer', 'quantity' => 2, 'to_holder' => 'Sarah Nuwamanya'])->assertCreated()
            ->assertJsonPath('data.quantity', 2)->assertJsonPath('data.to_holder', 'Sarah Nuwamanya');

        $h = $this->holders($u);
        $this->assertSame(3, $h[FetStockMovement::MAIN_HOLDER]['models']['FIII']);
        $this->assertSame(2, $h['Sarah Nuwamanya']['models']['FIII']);
        $this->app['auth']->forgetGuards();
        $res = $this->withHeaders($this->h($u))->getJson('/api/admin/accounting/stock')->json();
        $this->assertSame(5, collect($res['models'])->firstWhere('code', 'FIII')['on_hand']);
        $this->assertCount(2, $res['movements']); // the hand-over is listed once

        // Sarah can't hand over or sell more than she holds.
        $this->app['auth']->forgetGuards();
        $this->record($u, ['model' => 'FIII', 'type' => 'sold', 'quantity' => 3, 'holder' => 'Sarah Nuwamanya', 'picked_by' => 'Client'])
            ->assertUnprocessable()->assertJsonValidationErrors('holder');
        $this->record($u, ['model' => 'FIII', 'type' => 'sold', 'quantity' => 2, 'holder' => 'sarah nuwamanya', 'picked_by' => 'Client'])->assertCreated();
        $this->assertArrayNotHasKey('Sarah Nuwamanya', $this->holders($u));
    }

    public function test_finance_can_correct_an_entry_and_it_is_logged(): void
    {
        $u = $this->juniorFinance();
        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 4, 'reference' => 'DN-1'])->assertCreated();
        $m = FetStockMovement::first();

        $this->withHeaders($this->h($u))->patchJson("/api/admin/accounting/stock/{$m->id}", [
            'model' => 'FII', 'type' => 'received', 'quantity' => 6, 'moved_on' => now()->toDateString(),
            'reference' => 'DN-1A', 'holder' => 'Kampala warehouse',
        ])->assertOk()->assertJsonPath('data.quantity', 6)->assertJsonPath('data.holder', 'Kampala warehouse');

        $this->assertSame(['FII', 6, 'DN-1A'], [$m->fresh()->model, $m->fresh()->quantity, $m->fresh()->reference]);
        $this->assertTrue(ActivityLog::where('action', 'fet_stock.update')->exists());
        $this->assertSame(6, $this->holders($u)['Kampala warehouse']['total']);
    }

    public function test_a_correction_cannot_break_later_sales(): void
    {
        $u = $this->admin();
        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 4])->assertCreated();
        $this->record($u, ['model' => 'FI', 'type' => 'sold', 'quantity' => 3, 'picked_by' => 'Musa'])->assertCreated();
        $delivery = FetStockMovement::where('type', 'received')->first();

        $this->withHeaders($this->h($u))->patchJson("/api/admin/accounting/stock/{$delivery->id}", [
            'model' => 'FI', 'type' => 'received', 'quantity' => 2, 'moved_on' => now()->toDateString(),
        ])->assertUnprocessable();
        $this->assertSame(4, $delivery->fresh()->quantity);
    }

    public function test_editing_a_hand_over_changes_both_sides(): void
    {
        $u = $this->juniorFinance();
        $this->record($u, ['model' => 'FII', 'type' => 'received', 'quantity' => 6])->assertCreated();
        $id = $this->record($u, ['model' => 'FII', 'type' => 'transfer', 'quantity' => 2, 'to_holder' => 'Field team'])->json('data.id');

        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->h($u))->patchJson("/api/admin/accounting/stock/{$id}", [
            'model' => 'FII', 'type' => 'transfer', 'quantity' => 4, 'moved_on' => now()->toDateString(), 'to_holder' => 'Jinja office',
        ])->assertOk();

        $h = $this->holders($u);
        $this->assertSame(2, $h[FetStockMovement::MAIN_HOLDER]['total']);
        $this->assertSame(4, $h['Jinja office']['total']);
        $this->assertArrayNotHasKey('Field team', $h);
        $this->assertDatabaseCount('fet_stock_movements', 3);
    }

    public function test_where_kept_pdf(): void
    {
        $u = $this->admin();
        $this->record($u, ['model' => 'FI', 'type' => 'received', 'quantity' => 2, 'holder' => 'Gulu depot'])->assertCreated();
        $res = $this->withHeaders($this->h($u))->get('/api/admin/accounting/stock/holders-pdf')->assertOk();
        $this->assertStringStartsWith('%PDF', $res->getContent());

        $html = view('documents.fet-stock-holders', [
            'holders' => [['holder' => 'Gulu depot', 'main' => false, 'models' => ['FI' => 2, 'FII' => 0, 'FIII' => 0, 'FIV' => 0], 'total' => 2, 'last_moved_on' => now()->toDateString()]],
            'models' => FetStockMovement::MODELS, 'asAt' => CarbonImmutable::now(), 'printedBy' => 'A',
        ])->render();
        $this->assertStringContainsString('Gulu depot', $html);
    }
}
