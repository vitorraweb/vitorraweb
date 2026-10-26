<?php

namespace Tests\Feature;

use App\Mail\DocumentForReview;
use App\Mail\InvoiceMail;
use App\Mail\QuotationMail;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Prospect;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Sending a quotation or invoice means choosing who gets it — never one click
 * straight to the customer — and only team members or clients on record.
 */
class DocumentSendTest extends TestCase
{
    use RefreshDatabase;

    private User $sender;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->sender = User::create(['name' => 'Sarah', 'email' => 'sarah@vitorra.org', 'password' => 'changeme123', 'role' => 'admin']);
    }

    private function h(): array
    {
        return ['Authorization' => 'Bearer '.$this->sender->createToken('t', ['admin'])->plainTextToken];
    }

    private function quote(): Quotation
    {
        return Quotation::create([
            'number' => Quotation::nextNumber('coffee'), 'status' => 'draft', 'business' => 'coffee',
            'customer_name' => 'Hamburg Roasters', 'customer_email' => 'buy@hamburg.test',
            'currency' => 'USD', 'issue_date' => today(), 'total' => 100000,
        ]);
    }

    private function send(Quotation $q, array $body)
    {
        return $this->withHeaders($this->h())->postJson("/api/admin/accounting/quotations/{$q->id}/send", $body);
    }

    public function test_sending_without_choosing_recipients_is_refused(): void
    {
        $q = $this->quote();
        $this->send($q, [])->assertUnprocessable()->assertJsonValidationErrors('to');

        Mail::assertNothingSent();
        $this->assertSame('draft', $q->fresh()->status);
    }

    public function test_team_review_does_not_reach_the_customer_or_mark_it_sent(): void
    {
        $joseph = User::create(['name' => 'Joseph', 'email' => 'joseph@vitorra.org', 'password' => 'changeme123', 'role' => 'ops', 'department' => 'finance']);
        $q = $this->quote();

        $this->send($q, ['to' => ['joseph@vitorra.org'], 'note' => 'Check the freight line'])->assertOk()->assertJsonPath('data.status', 'draft');

        Mail::assertNotSent(QuotationMail::class);
        Mail::assertSent(DocumentForReview::class, function (DocumentForReview $m) use ($joseph) {
            return $m->hasTo($joseph->email) && ! $m->customerSent
                && str_starts_with($m->envelope()->subject, 'For review:')
                && $m->hasReplyTo('sarah@vitorra.org');
        });
    }

    public function test_customer_send_marks_sent_and_copies_chosen_colleagues(): void
    {
        User::create(['name' => 'Victor', 'email' => 'victor@vitorra.org', 'password' => 'changeme123', 'role' => 'ops']);
        $q = $this->quote();

        $this->send($q, ['to' => ['buy@hamburg.test', 'victor@vitorra.org']])->assertOk()->assertJsonPath('data.status', 'sent');

        Mail::assertSent(QuotationMail::class, fn ($m) => $m->hasTo('buy@hamburg.test') && ! $m->hasTo('victor@vitorra.org'));
        Mail::assertSent(DocumentForReview::class, fn ($m) => $m->hasTo('victor@vitorra.org') && $m->customerSent);
        $this->assertTrue(ActivityLog::where('action', 'quotation.send')->exists());
    }

    public function test_a_typed_address_not_in_the_system_is_refused(): void
    {
        $q = $this->quote();
        $this->send($q, ['to' => ['buy@hamburgg.test']])->assertUnprocessable()->assertJsonValidationErrors('to');
        Mail::assertNothingSent();
    }

    public function test_a_client_from_the_database_can_be_added(): void
    {
        Prospect::create(['name' => 'Hamburg Roasters (accounts)', 'category' => 'Export buyers', 'product' => 'COFFEE', 'email' => 'accounts@hamburg.test']);
        $q = $this->quote();

        $this->send($q, ['to' => ['buy@hamburg.test', 'accounts@hamburg.test']])->assertOk();
        Mail::assertSent(QuotationMail::class, fn ($m) => $m->hasTo('accounts@hamburg.test') && $m->hasTo('buy@hamburg.test'));
    }

    public function test_departed_staff_are_not_on_the_team_list(): void
    {
        User::create(['name' => 'Gone', 'email' => 'gone@vitorra.org', 'password' => 'changeme123', 'role' => 'ops', 'staff_status' => 'left']);
        $q = $this->quote();

        $this->send($q, ['to' => ['gone@vitorra.org']])->assertUnprocessable();
        $team = $this->withHeaders($this->h())->getJson('/api/admin/accounting/documents/recipients')->assertOk()->json('team');
        $this->assertNotContains('gone@vitorra.org', array_column($team, 'email'));
    }

    public function test_client_search_finds_prospects_and_enquiries_but_not_staff(): void
    {
        Prospect::create(['name' => 'Kampala Café', 'category' => 'Cafés & restaurants', 'product' => 'COFFEE', 'email' => 'hello@kcafe.test']);
        \App\Models\Enquiry::create(['product_category' => 'FET', 'name' => 'Musa', 'email' => 'musa@fleet.test', 'company' => 'Kampala Fleet', 'message' => 'hi']);

        $clients = $this->withHeaders($this->h())->getJson('/api/admin/accounting/documents/recipients?q=kampala')->assertOk()->json('clients');
        $this->assertEqualsCanonicalizing(['hello@kcafe.test', 'musa@fleet.test'], array_column($clients, 'email'));

        $clients = $this->withHeaders($this->h())->getJson('/api/admin/accounting/documents/recipients?q=sarah')->json('clients');
        $this->assertSame([], $clients);
    }

    public function test_invoice_send_follows_the_same_rules(): void
    {
        $inv = Invoice::create([
            'number' => 'INV-2026-9001', 'status' => 'draft', 'customer_name' => 'Hamburg Roasters', 'customer_email' => 'buy@hamburg.test',
            'currency' => 'UGX', 'issue_date' => today(), 'subtotal' => 1000, 'vat_total' => 0, 'total' => 1000,
        ]);
        $h = $this->h();

        $this->withHeaders($h)->postJson("/api/admin/accounting/invoices/{$inv->id}/send", ['to' => ['sarah@vitorra.org']])->assertOk()->assertJsonPath('data.status', 'draft');
        Mail::assertNotSent(InvoiceMail::class);

        $this->withHeaders($h)->postJson("/api/admin/accounting/invoices/{$inv->id}/send", ['to' => ['buy@hamburg.test']])->assertOk()->assertJsonPath('data.status', 'sent');
        Mail::assertSent(InvoiceMail::class, fn ($m) => $m->hasTo('buy@hamburg.test'));
    }
}
