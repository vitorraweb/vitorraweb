<?php

namespace Tests\Feature;

use App\Mail\QuotationMail;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\User;
use App\Support\BrandedDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class QuotationTest extends TestCase
{
    use RefreshDatabase;

    private function h(string $role = 'admin', ?array $perms = null): array
    {
        $u = User::create(['name' => 'Finance', 'email' => 'f-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => $role, 'permissions' => $perms]);

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin'])->plainTextToken];
    }

    private function coffeeQuote(array $over = []): array
    {
        return array_merge([
            'business' => 'coffee', 'currency' => 'EUR', 'customer_name' => 'Hanseatic Coffee Importers GmbH',
            'customer_email' => 'buyer@example.com', 'customer_address' => "Kehrwieder 8\nHamburg", 'customer_tax_id' => 'DE987654321',
            'incoterms' => 'CIF Hamburg (Incoterms® 2020)', 'port_of_loading' => 'Mombasa, Kenya', 'deposit_percent' => 30,
            'payment_terms' => '30% Advance, 70% against B/L',
            'payment_schedule' => '30% Advance Deposit ({deposit}). 70% Balance ({balance}).',
            'valid_until' => now()->addDays(30)->toDateString(),
            'items' => [
                ['name' => 'Uganda Arabica AA', 'details' => 'Screen 17+', 'quantity' => 18000, 'unit' => 'kg', 'unit_price' => 420],
                ['name' => 'Ocean Freight', 'quantity' => 1, 'unit' => 'Lot', 'unit_price' => 285000],
            ],
        ], $over);
    }

    public function test_create_numbers_by_business_and_totals_in_minor_units(): void
    {
        $h = $this->h();
        $y = now()->year;

        $this->withHeaders($h)->postJson('/api/admin/accounting/quotations', $this->coffeeQuote())->assertCreated()
            ->assertJsonPath('data.number', "VHL-CF-Q-{$y}-0001")
            ->assertJsonPath('data.subtotal', 18000 * 420 + 285000)
            ->assertJsonPath('data.total', 18000 * 420 + 285000)
            ->assertJsonPath('data.status', 'draft');

        $this->withHeaders($h)->postJson('/api/admin/accounting/quotations', $this->coffeeQuote())->assertCreated()
            ->assertJsonPath('data.number', "VHL-CF-Q-{$y}-0002");

        $this->withHeaders($h)->postJson('/api/admin/accounting/quotations', $this->coffeeQuote([
            'business' => 'fet', 'currency' => 'UGX', 'tax_rate' => 18,
            'items' => [['name' => 'FET – PRO II', 'quantity' => 1, 'unit' => 'pcs.', 'unit_price' => 3245000]],
        ]))->assertCreated()
            ->assertJsonPath('data.number', "VHL-FET-Q-{$y}-0001")
            ->assertJsonPath('data.tax_total', 584100)
            ->assertJsonPath('data.total', 3829100);
    }

    public function test_pdf_renders_with_deposit_amounts_and_design_labels(): void
    {
        $h = $this->h();
        $id = $this->withHeaders($h)->postJson('/api/admin/accounting/quotations', $this->coffeeQuote())->json('data.id');

        $res = $this->withHeaders($h)->get("/api/admin/accounting/quotations/{$id}/pdf")->assertOk();
        $this->assertStringStartsWith('%PDF', $res->getContent());

        $d = BrandedDocument::data(Quotation::with('items')->find($id));
        $this->assertSame('TOTAL (CIF HAMBURG)', $d['totals'][2][0]);
        $this->assertSame('TAXES (0% EXPORT)', $d['totals'][1][0]);
        $this->assertSame('€78,450.00', $d['totals'][2][1]);           // 75,600 + 2,850
        $this->assertStringContainsString('(€23,535.00)', $d['terms']['rows'][0][1]); // 30% deposit
        $this->assertStringContainsString('(€54,915.00)', $d['terms']['rows'][0][1]); // 70% balance
        $this->assertSame('€4.20 / kg', $d['items'][0]['unit_price']);
        $this->assertSame('€2,850.00', $d['items'][1]['unit_price']);   // lots carry no "/ unit"
    }

    public function test_send_emails_the_pdf_and_marks_sent(): void
    {
        Mail::fake();
        $h = $this->h();
        $id = $this->withHeaders($h)->postJson('/api/admin/accounting/quotations', $this->coffeeQuote())->json('data.id');

        $this->withHeaders($h)->postJson("/api/admin/accounting/quotations/{$id}/send")->assertOk()->assertJsonPath('data.status', 'sent');
        Mail::assertSent(QuotationMail::class, fn ($m) => $m->hasTo('buyer@example.com'));
    }

    public function test_convert_to_commercial_invoice_copies_everything(): void
    {
        $h = $this->h();
        $id = $this->withHeaders($h)->postJson('/api/admin/accounting/quotations', $this->coffeeQuote())->json('data.id');

        $res = $this->withHeaders($h)->postJson("/api/admin/accounting/quotations/{$id}/convert", ['kind' => 'commercial'])->assertCreated();
        $res->assertJsonPath('data.number', 'VHL-CF-CI-'.now()->year.'-0001');

        $invoice = Invoice::with('items')->find($res->json('data.id'));
        $this->assertSame('commercial', $invoice->kind);
        $this->assertSame('coffee', $invoice->business);
        $this->assertSame('COFFEE', $invoice->sector);
        $this->assertSame('CIF Hamburg (Incoterms® 2020)', $invoice->incoterms);
        $this->assertSame(18000 * 420 + 285000, $invoice->total);
        $this->assertSame('kg', $invoice->items[0]->unit);
        $this->assertSame('Screen 17+', $invoice->items[0]->details);
        $this->assertSame('accepted', Quotation::find($id)->status);

        // The invoice's own PDF uses the branded template.
        $this->withHeaders($h)->get("/api/admin/accounting/invoices/{$invoice->id}/pdf")->assertOk();
        $this->assertSame('commercial', BrandedDocument::data($invoice)['kind']);
    }

    public function test_declined_quotation_cannot_be_invoiced_or_edited(): void
    {
        $h = $this->h();
        $id = $this->withHeaders($h)->postJson('/api/admin/accounting/quotations', $this->coffeeQuote())->json('data.id');
        $this->withHeaders($h)->postJson("/api/admin/accounting/quotations/{$id}/status", ['status' => 'declined'])->assertOk();

        $this->withHeaders($h)->postJson("/api/admin/accounting/quotations/{$id}/convert", ['kind' => 'final'])->assertStatus(422);
        $this->withHeaders($h)->putJson("/api/admin/accounting/quotations/{$id}", $this->coffeeQuote())->assertStatus(422);
    }

    public function test_preview_renders_an_unsaved_draft(): void
    {
        $h = $this->h();
        $res = $this->withHeaders($h)->postJson('/api/admin/accounting/documents/preview', [
            'type' => 'invoice', 'kind' => 'final', 'business' => 'fet', 'currency' => 'UGX',
            'items' => [['name' => 'FET – PRO II', 'quantity' => 1, 'unit' => 'pcs.', 'unit_price' => 3245000]],
        ])->assertOk();
        $this->assertSame('application/pdf', $res->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF', $res->getContent());
        $this->assertSame(0, Invoice::count());
    }

    public function test_branded_invoice_numbering_and_general_invoices_unchanged(): void
    {
        $h = $this->h();
        $y = now()->year;
        $this->withHeaders($h)->postJson('/api/admin/accounting/invoices', [
            'business' => 'fet', 'kind' => 'final', 'customer_name' => 'Mr Mutenga', 'currency' => 'UGX', 'tax_rate' => 18,
            'items' => [['description' => 'FET – PRO II', 'quantity' => 1, 'unit' => 'pcs.', 'unit_price' => 1000, 'vat_rate' => 0]],
        ])->assertCreated()->assertJsonPath('data.number', "VHL-FET-INV-{$y}-0001")->assertJsonPath('data.vat_total', 180);

        $this->withHeaders($h)->postJson('/api/admin/accounting/invoices', [
            'customer_name' => 'Acme', 'currency' => 'UGX', 'items' => [['description' => 'x', 'quantity' => 1, 'unit_price' => 500, 'vat_rate' => 18]],
        ])->assertCreated()->assertJsonPath('data.number', "INV-{$y}-0001")->assertJsonPath('data.vat_total', 90);
    }

    public function test_quotations_need_their_own_module_and_invoicing_needs_accounting(): void
    {
        $this->withHeaders($this->h('ops', ['accounting']))->getJson('/api/admin/accounting/quotations')->assertForbidden();
        $this->app['auth']->forgetGuards(); // the guard remembers the first user between test requests

        // Marketing / operations: may quote, may not turn a quote into an invoice.
        $h = $this->h('ops', ['quotations', 'prospects']);
        $id = $this->withHeaders($h)->postJson('/api/admin/accounting/quotations', $this->coffeeQuote())->assertCreated()->json('data.id');
        $this->withHeaders($h)->postJson('/api/admin/accounting/documents/preview', ['type' => 'quotation', 'business' => 'fet', 'currency' => 'UGX', 'items' => []])->assertOk();
        $this->withHeaders($h)->postJson("/api/admin/accounting/quotations/{$id}/convert", ['kind' => 'final'])->assertForbidden();
        $this->withHeaders($h)->getJson('/api/admin/accounting/invoices')->assertForbidden();
    }

    public function test_grant_module_command_keeps_existing_access(): void
    {
        $dept = User::create(['name' => 'Daniel', 'email' => 'daniel@v.org', 'password' => 'changeme123', 'role' => 'ops', 'department' => 'finance']);
        $custom = User::create(['name' => 'Sarah', 'email' => 'sarah@v.org', 'password' => 'changeme123', 'role' => 'ops', 'department' => 'marketing', 'permissions' => ['blog', 'prospects']]);

        $this->artisan('staff:grant-module', ['module' => 'quotations', 'emails' => ['daniel@v.org', 'sarah@v.org']])->assertSuccessful();

        $this->assertTrue($dept->fresh()->canModule('quotations'));
        $this->assertTrue($dept->fresh()->canModule('accounting'));   // department default carried over
        $this->assertEqualsCanonicalizing(['blog', 'prospects', 'quotations'], $custom->fresh()->permissions);

        $this->artisan('staff:grant-module', ['module' => 'quotations', 'emails' => ['sarah@v.org'], '--revoke' => true])->assertSuccessful();
        $this->assertFalse($custom->fresh()->canModule('quotations'));
        $this->artisan('staff:grant-module', ['module' => 'nope', 'emails' => ['sarah@v.org']])->assertFailed();
    }

    public function test_invoices_print_finance_bank_details(): void
    {
        $inv = new Invoice(['business' => 'coffee', 'kind' => 'commercial', 'currency' => 'EUR', 'number' => 'VHL-CF-CI-2026-0001', 'customer_name' => 'X']);
        $bank = collect(BrandedDocument::data($inv, [])['bank'])->mapWithKeys(fn ($r) => [$r[0] => $r[1]]);
        $this->assertSame('9030028047761', $bank['Account Number']);
        $this->assertSame('SBICUGKX', $bank['SWIFT Code']);
        $this->assertSame('Forest Mall', $bank['Branch']);

        $fet = new Invoice(['business' => 'fet', 'currency' => 'UGX', 'number' => 'VHL-FET-INV-2026-0001', 'customer_name' => 'X']);
        $this->assertSame('9030027300994', collect(BrandedDocument::data($fet, [])['bank'])->firstWhere(0, 'Account Number')[1]);
        $this->assertNull(BrandedDocument::data(new Quotation(['business' => 'fet', 'currency' => 'UGX', 'customer_name' => 'X']), [])['bank']);
    }
}
