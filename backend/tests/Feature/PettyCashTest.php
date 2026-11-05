<?php

namespace Tests\Feature;

use App\Models\PettyCashVoucher;
use App\Models\User;
use App\Support\AmountInWords;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PettyCashTest extends TestCase
{
    use RefreshDatabase;

    private function headers(array $perms = []): array
    {
        $u = User::create(['name' => 'Grace', 'email' => 'g-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme',
            'role' => $perms ? 'ops' : 'admin', 'permissions' => $perms ?: null]);

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin'])->plainTextToken];
    }

    private function payload(array $over = []): array
    {
        return $over + [
            'voucher_date' => '2026-11-05', 'paid_to' => 'Joseph Kato', 'department' => 'Operations', 'purpose' => 'Office supplies',
            'items' => [['description' => 'Transport', 'amount' => 15000], ['description' => 'HDMI cable', 'department' => 'IT', 'amount' => 45000]],
        ];
    }

    public function test_a_voucher_is_numbered_totalled_and_printable(): void
    {
        $h = $this->headers();
        $r = $this->withHeaders($h)->postJson('/api/admin/accounting/petty-cash', $this->payload())->assertCreated();
        $r->assertJsonPath('data.number', 'PCV-'.now()->year.'-0001')
            ->assertJsonPath('data.total', 60000)
            ->assertJsonPath('data.total_words', 'Uganda Shillings Sixty Thousand Only')
            ->assertJsonPath('data.prepared_by', 'Grace');
        $this->app['auth']->forgetGuards();

        $id = $r->json('data.id');
        $pdf = $this->withHeaders($h)->get("/api/admin/accounting/petty-cash/{$id}/pdf")->assertOk();
        $this->assertStringStartsWith('%PDF', $pdf->getContent());
        $this->app['auth']->forgetGuards();

        $this->withHeaders($h)->postJson('/api/admin/accounting/petty-cash', $this->payload())->assertJsonPath('data.number', 'PCV-'.now()->year.'-0002');
    }

    public function test_a_voucher_can_be_corrected_until_voided(): void
    {
        $h = $this->headers();
        $id = $this->withHeaders($h)->postJson('/api/admin/accounting/petty-cash', $this->payload())->json('data.id');
        $this->withHeaders($h)->patchJson("/api/admin/accounting/petty-cash/{$id}", $this->payload(['items' => [['description' => 'Fuel', 'amount' => 50000]]]))
            ->assertOk()->assertJsonPath('data.total', 50000);
        $this->withHeaders($h)->postJson("/api/admin/accounting/petty-cash/{$id}/void")->assertOk()->assertJsonPath('data.status', 'void');
        $this->withHeaders($h)->patchJson("/api/admin/accounting/petty-cash/{$id}", $this->payload())->assertStatus(422);
        $this->assertSame('void', PettyCashVoucher::findOrFail($id)->status);
    }

    public function test_empty_items_and_people_without_accounting_are_refused(): void
    {
        $this->withHeaders($this->headers())->postJson('/api/admin/accounting/petty-cash', $this->payload(['items' => []]))->assertUnprocessable();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->headers(['enquiries']))->getJson('/api/admin/accounting/petty-cash')->assertForbidden();
    }

    public function test_amounts_in_words(): void
    {
        $this->assertSame('Uganda Shillings One Million Five Hundred Thousand Only', AmountInWords::format(1500000, 'UGX'));
        $this->assertSame('Uganda Shillings Ninety Six Thousand Only', AmountInWords::format(96000, 'UGX'));
        $this->assertSame('US Dollars One Hundred Twenty and Fifty Cents Only', AmountInWords::format(12050, 'USD'));
        $this->assertSame('Euros Three Hundred Thousand Seven Hundred Five Only', AmountInWords::format(30070500, 'EUR'));
        $this->assertSame('Uganda Shillings Zero Only', AmountInWords::format(0, 'UGX'));
    }
}
