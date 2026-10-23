<?php

namespace Tests\Feature;

use App\Mail\ContractDeclined;
use App\Mail\ContractSigned;
use App\Mail\ContractSigningRequest;
use App\Models\Contract;
use App\Models\Quotation;
use App\Models\User;
use App\Support\ContractTemplate;
use App\Support\SecureFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContractTest extends TestCase
{
    use RefreshDatabase;

    private const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Storage::fake('local');
    }

    private function h(?array $perms = ['prospects']): array
    {
        $this->app['auth']->forgetGuards();
        $this->staff = User::create(['name' => 'Sarah', 'email' => 's-'.uniqid().'@vitorra.org', 'password' => 'changeme123', 'role' => 'ops', 'permissions' => $perms]);

        return ['Authorization' => 'Bearer '.$this->staff->createToken('t', ['admin'])->plainTextToken];
    }

    private function payload(array $over = []): array
    {
        return array_merge(ContractTemplate::defaults(), [
            'buyer_name' => 'IMPACT SALES (U) LTD', 'buyer_email' => 'buyer@example.com', 'buyer_contact' => 'Mr Wambede',
            'model_number' => 'FET-PRO-FIII', 'serial_number' => 'SN-001', 'registration_numbers' => 'UBA 123X',
            'unit_cost' => 5276000, 'total_amount' => 5276000, 'price_note' => 'Inclusive of 18% VAT',
        ], $over);
    }

    /** Create + send, returning [contract id, signing token]. */
    private function sent(array $h, array $over = []): array
    {
        $id = $this->withHeaders($h)->postJson('/api/admin/contracts', $this->payload($over))->assertCreated()->json('data.id');
        $url = $this->withHeaders($h)->postJson("/api/admin/contracts/{$id}/send")->assertOk()->json('sign_url');
        $this->app['auth']->forgetGuards();

        return [$id, basename(parse_url($url, PHP_URL_PATH))];
    }

    public function test_send_open_and_sign_once(): void
    {
        $h = $this->h();
        [$id, $token] = $this->sent($h);
        $c = Contract::find($id);
        $this->assertSame('sent', $c->status);
        $this->assertNotSame($token, $c->sign_token_hash); // only the hash is stored
        Mail::assertSent(ContractSigningRequest::class, fn ($m) => $m->hasTo('buyer@example.com') && str_contains($m->url, $token));

        $this->getJson("/api/contracts/sign/{$token}")->assertOk()
            ->assertJsonPath('data.number', $c->number)
            ->assertJsonPath('data.document.sections.0.title', 'PURPOSE');
        $this->assertSame('viewed', $c->fresh()->status);
        $this->assertStringStartsWith('%PDF', $this->get("/api/contracts/sign/{$token}/pdf")->assertOk()->getContent());

        $this->postJson("/api/contracts/sign/{$token}", ['signer_name' => 'J. Wambede', 'signature_type' => 'drawn', 'signature_data' => self::PNG])
            ->assertStatus(422); // must tick "I agree"

        $this->withHeaders(['X-Forwarded-For' => '102.85.1.10'])->postJson("/api/contracts/sign/{$token}", [
            'signer_name' => 'J. Wambede', 'signer_position' => 'Director', 'signature_type' => 'drawn', 'signature_data' => self::PNG, 'agree' => true,
        ])->assertOk()->assertJsonPath('data.status', 'signed')->assertJsonPath('data.mailed', true);

        $c = $c->fresh();
        $this->assertSame('signed', $c->status);
        $this->assertNull($c->sign_token_hash);
        $this->assertSame(64, strlen($c->signed_hash));
        $this->assertSame('102.85.1.10 (via 127.0.0.1)', $c->signer_ip); // the client, not the website relay
        $this->assertStringStartsWith('%PDF', SecureFile::read($c->signed_pdf_path));
        $this->assertStringStartsNotWith('%PDF', Storage::disk('local')->get($c->signed_pdf_path)); // encrypted at rest
        Mail::assertSent(ContractSigned::class, fn ($m) => $m->hasTo('buyer@example.com') && $m->hasCc($this->staff->email));

        // One signature per link; the record is locked.
        $this->getJson("/api/contracts/sign/{$token}")->assertStatus(410);
        $this->postJson("/api/contracts/sign/{$token}", ['signer_name' => 'X', 'signature_type' => 'typed', 'signature_data' => 'X', 'agree' => true])->assertStatus(410);
        $h = $this->h();
        $this->withHeaders($h)->putJson("/api/admin/contracts/{$id}", $this->payload())->assertStatus(422);
        $this->assertStringStartsWith('%PDF', $this->withHeaders($h)->get("/api/admin/contracts/{$id}/pdf")->assertOk()->getContent());
    }

    public function test_link_expires_after_48_hours(): void
    {
        [$id, $token] = $this->sent($this->h());
        $this->travel(47)->hours();
        $this->getJson("/api/contracts/sign/{$token}")->assertOk();
        $this->travel(2)->hours();
        $this->getJson("/api/contracts/sign/{$token}")->assertStatus(410);
        $this->assertTrue(Contract::find($id)->isExpired());
    }

    public function test_editing_or_resending_kills_the_old_link(): void
    {
        $h = $this->h();
        [$id, $token] = $this->sent($h);

        $this->withHeaders($h)->putJson("/api/admin/contracts/{$id}", $this->payload(['total_amount' => 4000000]))->assertOk()
            ->assertJsonPath('data.status', 'draft');
        $this->getJson("/api/contracts/sign/{$token}")->assertStatus(410);

        $first = basename(parse_url($this->withHeaders($h)->postJson("/api/admin/contracts/{$id}/send")->json('sign_url'), PHP_URL_PATH));
        $second = basename(parse_url($this->withHeaders($h)->postJson("/api/admin/contracts/{$id}/send")->json('sign_url'), PHP_URL_PATH));
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/contracts/sign/{$first}")->assertStatus(410);
        $this->getJson("/api/contracts/sign/{$second}")->assertOk();
    }

    public function test_client_can_decline_with_a_reason(): void
    {
        [$id, $token] = $this->sent($this->h());
        $this->postJson("/api/contracts/sign/{$token}/decline", ['reason' => 'Price too high'])->assertOk();
        $this->assertSame('declined', Contract::find($id)->status);
        $this->getJson("/api/contracts/sign/{$token}")->assertStatus(410);
        Mail::assertSent(ContractDeclined::class, fn ($m) => $m->hasTo($this->staff->email));
    }

    public function test_cannot_send_without_client_email_and_void_stops_the_link(): void
    {
        $h = $this->h();
        $id = $this->withHeaders($h)->postJson('/api/admin/contracts', $this->payload(['buyer_email' => null]))->json('data.id');
        $this->withHeaders($h)->postJson("/api/admin/contracts/{$id}/send")->assertStatus(422);

        [$id, $token] = $this->sent($h);
        $this->withHeaders($this->h())->postJson("/api/admin/contracts/{$id}/void")->assertOk()->assertJsonPath('data.status', 'void');
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/contracts/sign/{$token}")->assertStatus(410);
    }

    public function test_defaults_prefill_from_a_quotation_and_preview_renders(): void
    {
        $h = $this->h(['prospects', 'quotations']);
        $q = Quotation::create(['number' => 'VHL-FET-Q-2026-0009', 'status' => 'sent', 'business' => 'fet', 'currency' => 'UGX',
            'customer_name' => 'IMPACT SALES (U) LTD', 'customer_email' => 'buyer@example.com', 'customer_tax_id' => '1010012500',
            'tax_rate' => 18, 'tax_inclusive' => true, 'issue_date' => now()]);
        $q->items()->create(['position' => 0, 'name' => 'FET – PRO III', 'quantity' => 1, 'unit_price' => 5276000, 'line_total' => 5276000]);
        $q->recalcTotals();

        $this->withHeaders($h)->getJson("/api/admin/contracts/defaults?quotation={$q->id}")->assertOk()
            ->assertJsonPath('data.buyer_name', 'IMPACT SALES (U) LTD')
            ->assertJsonPath('data.buyer_registration', '1010012500')
            ->assertJsonPath('data.total_amount', 5276000)
            ->assertJsonPath('data.price_note', 'Inclusive of 18% VAT')
            ->assertJsonPath('data.clauses.7.title', 'WARRANTY');

        $pdf = $this->withHeaders($h)->postJson('/api/admin/contracts/preview', $this->payload(['buyer_name' => null]))->assertOk();
        $this->assertStringStartsWith('%PDF', $pdf->getContent());
    }

    public function test_staff_only(): void
    {
        $this->getJson('/api/admin/contracts')->assertUnauthorized();
        $this->withHeaders($this->h(['blog']))->getJson('/api/admin/contracts')->assertForbidden();
        $this->withHeaders($this->h(['accounting']))->getJson('/api/admin/contracts')->assertOk();
    }
}
