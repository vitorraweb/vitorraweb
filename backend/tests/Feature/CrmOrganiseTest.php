<?php

namespace Tests\Feature;

use App\Models\Enquiry;
use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceReceipt;
use App\Models\FinanceTransaction;
use App\Models\Market;
use App\Models\Prospect;
use App\Models\ReceiptScanLink;
use App\Models\User;
use App\Services\Marketing\MarketBuilder;
use App\Support\SecureFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CrmOrganiseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config(['services.frontend.url' => 'https://vitorra.org', 'services.anthropic.key' => null]);
    }

    private function user(string $role = 'admin', ?string $department = null): User
    {
        return User::create(['name' => 'Joseph Finance', 'email' => 'u-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => $role, 'department' => $department]);
    }

    private function headers(?User $u = null): array
    {
        $u ??= $this->user();

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin'])->plainTextToken];
    }

    private function prospect(array $a = []): Prospect
    {
        return Prospect::create(['name' => 'Co '.uniqid(), 'category' => 'CARGO', 'product' => 'FET', 'email' => uniqid().'@x.ug', ...$a]);
    }

    /* ── Markets from the lists ──────────────────────────────────────────── */

    public function test_build_sorts_everyone_and_brings_website_enquirers_in(): void
    {
        $staff = $this->user();
        $cargo = $this->prospect();
        $hospital = $this->prospect(['product' => 'SEAL', 'category' => 'HOSPITAL']);
        $this->prospect(['category' => 'INTERNAL_TEST']);
        Enquiry::create(['name' => 'Asha', 'company' => 'Asha Freight', 'email' => 'asha@freight.ug', 'country' => 'Uganda', 'message' => 'FET for 10 trucks', 'product_category' => 'FET', 'status' => 'converted']);
        Enquiry::create(['name' => 'Staff test', 'email' => $staff->email, 'country' => 'Uganda', 'message' => 'test', 'product_category' => 'FET', 'status' => 'new']);
        Enquiry::create(['name' => 'Freight', 'email' => 'f@logistics.ug', 'country' => 'Kenya', 'message' => 'Rates?', 'product_category' => 'LOGISTICS', 'status' => 'new']);

        $this->withHeaders($this->headers())->postJson('/api/admin/marketing/markets/build')->assertOk()
            ->assertJsonPath('data.website_added', 1)
            ->assertJsonPath('data.markets_created', 3);

        $web = Prospect::where('category', 'WEBSITE_LEAD')->sole();
        $this->assertSame('Asha Freight', $web->name);
        $this->assertSame('converted', $web->outreach_status);
        $this->assertSame('customer', $web->lead_tier, 'everyone is ranked after building');

        $this->assertSame([$cargo->id], Market::where('auto_key', 'FET|CARGO')->sole()->prospects()->pluck('prospects.id')->all());
        $this->assertSame('SEAL Wound Spray · Hospitals', Market::where('auto_key', 'SEAL|HOSPITAL')->sole()->name);
        $this->assertNull(Market::where('auto_key', 'FET|INTERNAL_TEST')->first());
        $this->assertTrue($hospital->markets()->exists());
    }

    public function test_rebuilding_never_undoes_the_teams_moves(): void
    {
        $p = $this->prospect();
        (new MarketBuilder)->build();
        $mine = Market::create(['name' => 'Priority fleets']);
        $auto = Market::where('auto_key', 'FET|CARGO')->sole();
        $mine->prospects()->attach($p->id);
        $auto->prospects()->detach($p->id);

        (new MarketBuilder)->build();

        $this->assertFalse($auto->prospects()->where('prospects.id', $p->id)->exists());
        $this->assertSame(1, Market::where('auto_key', 'FET|CARGO')->count());
    }

    /* ── Getting outside data in ─────────────────────────────────────────── */

    public function test_import_reads_an_industry_column_and_files_rows_into_a_market(): void
    {
        $market = Market::create(['name' => 'Trade fair 2026']);
        $known = $this->prospect(['name' => 'Known Haulage', 'email' => 'ops@known.ug']);
        $csv = "Name,Email,Phone,Location,Industry\n"
            ."New School,head@school.ug,+256700000001,Mukono,Schools\n"
            ."Builders Ltd,info@builders.ug,,Jinja,construction\n"
            ."Mystery Co,m@mystery.ug,,Gulu,Spaceships\n"
            ."Known Haulage,ops@known.ug,,Kampala,Cargo\n";
        $file = UploadedFile::fake()->createWithContent('fair.csv', $csv);

        $this->withHeaders($this->headers())->post('/api/admin/prospects/import', ['file' => $file, 'product' => 'FET', 'category' => 'CARGO', 'market_id' => $market->id], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('imported', 3)->assertJsonPath('skipped', 1);

        $this->assertSame('SCHOOL', Prospect::where('name', 'New School')->sole()->category);
        $this->assertSame('CONSTRUCTION', Prospect::where('name', 'Builders Ltd')->sole()->category);
        $this->assertSame('CARGO', Prospect::where('name', 'Mystery Co')->sole()->category, 'unknown industry falls back to the chosen one');
        $this->assertSame('Mukono', Prospect::where('name', 'New School')->sole()->location);
        $this->assertSame(4, $market->prospects()->count(), 'new and already-known rows both join the market');
        $this->assertTrue($market->prospects()->where('prospects.id', $known->id)->exists());
    }

    public function test_one_contact_can_be_added_by_hand_without_duplicating(): void
    {
        (new MarketBuilder)->build();
        $this->prospect(['name' => 'Seed']); // so FET|CARGO exists after a rebuild
        (new MarketBuilder)->build();
        $h = $this->headers();

        $this->withHeaders($h)->postJson('/api/admin/prospects', ['name' => 'Referral Freight', 'product' => 'FET', 'category' => 'CARGO', 'phone' => '0700 123456'])
            ->assertCreated()->assertJsonPath('data.phone', '+256700123456');
        $this->assertTrue(Market::where('auto_key', 'FET|CARGO')->sole()->prospects()->where('name', 'Referral Freight')->exists());

        $this->withHeaders($h)->postJson('/api/admin/prospects', ['name' => 'Referral freight ltd', 'product' => 'FET', 'category' => 'CARGO', 'phone' => '+256700123456'])
            ->assertStatus(409);
        $this->withHeaders($h)->postJson('/api/admin/prospects', ['name' => 'No way to reach', 'product' => 'FET', 'category' => 'CARGO'])->assertStatus(422);
    }

    public function test_import_template_downloads(): void
    {
        $res = $this->withHeaders($this->headers())->get('/api/admin/prospects/import-template')->assertOk();
        $this->assertStringContainsString('Name,Email,Phone,Location,Industry', $res->streamedContent());
    }

    /* ── Receipts ────────────────────────────────────────────────────────── */

    public function test_phone_scan_link_lets_a_phone_add_receipts_and_nothing_else(): void
    {
        $finance = $this->user('ops', 'finance');
        $url = $this->withHeaders($this->headers($finance))->postJson('/api/admin/accounting/receipts/scan-link')->assertOk()->json('data.url');
        $token = basename($url);
        $this->assertStringStartsWith('https://vitorra.org/scan/', $url);
        $this->assertNull(ReceiptScanLink::where('token_hash', $token)->first(), 'only the hash is stored');

        $this->getJson("/api/scan/{$token}")->assertOk()->assertJsonPath('data.for', 'Joseph Finance');
        $this->post("/api/scan/{$token}", ['file' => UploadedFile::fake()->image('r.jpg', 800, 1200)], ['Accept' => 'application/json'])->assertCreated();

        $r = FinanceReceipt::sole();
        $this->assertSame('phone', $r->source);
        $this->assertSame($finance->id, $r->uploaded_by);
        $this->assertStringStartsWith('VENC1:', Storage::disk('local')->get($r->path), 'encrypted at rest');

        // The link is no key to anything else.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/admin/accounting/receipts', ['Authorization' => "Bearer {$token}"])->assertUnauthorized();

        ReceiptScanLink::query()->update(['expires_at' => now()->subMinute()]);
        $this->post("/api/scan/{$token}", ['file' => UploadedFile::fake()->image('r2.jpg')], ['Accept' => 'application/json'])->assertStatus(410);
    }

    public function test_a_receipt_is_read_then_recorded_as_a_draft_expense(): void
    {
        config(['services.anthropic.key' => 'test-key']);
        Http::fake(['api.anthropic.com/*' => Http::response(['content' => [['type' => 'text', 'text' => json_encode([
            'vendor' => 'Total Energies Ntinda', 'date' => '2026-10-20', 'currency' => 'UGX', 'amount' => 250000, 'vat_rate' => 18, 'description' => 'Diesel',
        ])]]])]);
        $h = $this->headers();
        $this->withHeaders($h)->post('/api/admin/accounting/receipts', ['files' => [UploadedFile::fake()->image('fuel.jpg')]], ['Accept' => 'application/json'])->assertCreated();
        $r = FinanceReceipt::sole();

        $this->artisan('receipts:read')->assertSuccessful();
        $r->refresh();
        $this->assertSame('Total Energies Ntinda', $r->vendor);
        $this->assertSame(250000, $r->amount_minor);
        $this->assertSame('2026-10-20', $r->receipt_date->toDateString());

        $usd = FinanceAccount::create(['name' => 'USD bank', 'type' => 'bank', 'currency' => 'USD']);
        $ugx = FinanceAccount::create(['name' => 'UGX cash', 'type' => 'cash', 'currency' => 'UGX']);
        $fuel = FinanceCategory::create(['name' => 'Fuel', 'kind' => 'expense']);
        $body = ['finance_category_id' => $fuel->id, 'amount' => 250000, 'vat_rate' => 18, 'occurred_on' => '2026-10-20'];

        $this->withHeaders($h)->postJson("/api/admin/accounting/receipts/{$r->id}/record", $body + ['finance_account_id' => $usd->id])->assertStatus(422);
        $this->withHeaders($h)->postJson("/api/admin/accounting/receipts/{$r->id}/record", $body + ['finance_account_id' => $ugx->id])->assertOk()->assertJsonPath('data.status', 'recorded');

        $tx = FinanceTransaction::sole();
        $this->assertSame('draft', $tx->status);
        $this->assertSame('expense', $tx->type);
        $this->assertSame($r->path, $tx->receipt_path);
        $this->assertSame('Total Energies Ntinda', $tx->description);

        $this->withHeaders($h)->get("/api/admin/accounting/receipts/{$r->id}/file")->assertOk()->assertHeader('Content-Type', 'image/jpeg');
    }

    public function test_receipts_need_the_accounting_module(): void
    {
        $this->withHeaders($this->headers($this->user('ops', 'marketing')))->getJson('/api/admin/accounting/receipts')->assertForbidden();
    }
}
