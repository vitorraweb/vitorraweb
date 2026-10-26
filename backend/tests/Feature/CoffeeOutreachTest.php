<?php

namespace Tests\Feature;

use App\Models\Prospect;
use App\Models\ProspectCampaign;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

/**
 * Marketing work the coffee list end to end: re-upload the growing workbook
 * without duplicates, email the whole list, quote a customer and be reminded
 * to chase.
 */
class CoffeeOutreachTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): self
    {
        $user = User::create([
            'name' => 'Admin', 'email' => 'a-'.uniqid().'@vitorra.org',
            'password' => 'changeme123', 'role' => 'admin',
        ]);

        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('t')->plainTextToken);
    }

    private function upload(array $rows, string $category = 'GO4WORLD')
    {
        $book = new Spreadsheet;
        $book->getActiveSheet()->fromArray($rows, null, 'A1', true);
        $path = tempnam(sys_get_temp_dir(), 'coffee').'.xlsx';
        (new Xlsx($book))->save($path);

        $this->app['auth']->forgetGuards();

        return $this->admin()->post('/api/admin/prospects/import', [
            'file' => new UploadedFile($path, 'coffee.xlsx', null, null, true),
            'product' => 'COFFEE', 'category' => $category,
        ]);
    }

    private function coffee(string $name, array $extra = []): Prospect
    {
        return Prospect::create(array_merge([
            'name' => $name, 'category' => 'GO4WORLD', 'product' => 'COFFEE',
            'email' => strtolower(str_replace(' ', '', $name)).'@buyer.test',
            'outreach_status' => 'not_contacted',
        ], $extra));
    }

    /* ── Re-uploading the growing workbook ─────────────────────────────── */

    public function test_reuploading_the_updated_sheet_adds_only_the_new_customers(): void
    {
        $header = ['Company', 'Email', 'Phone', 'Country'];

        $this->upload([$header,
            ['Hamburg Roasters GmbH', 'buy@hamburg.test', '+49 40 1234567', 'Germany'],
            ['Kampala Beans Ltd', 'info@kbeans.test', '0772 123456', 'Uganda'],
        ])->assertJsonPath('imported', 2);

        // The same workbook a week later: one new buyer, and the old rows
        // retyped the way spreadsheets drift.
        $this->upload([$header,
            ['HAMBURG ROASTERS', 'buy@hamburg.test', '+49 40 1234567', 'Germany'],   // case + suffix
            ['Kampala Beans Limited', 'INFO@KBEANS.TEST', '+256772123456', 'Uganda'], // suffix, email case, phone format
            ['Lisbon Cafe Co', 'compras@lisbon.test', '+351 21 0000000', 'Portugal'], // new
        ])->assertOk()->assertJsonPath('imported', 1)->assertJsonPath('skipped', 2);

        $this->assertSame(3, Prospect::where('product', 'COFFEE')->count());
    }

    public function test_a_customer_filed_under_another_type_is_still_not_duplicated(): void
    {
        $this->coffee('Sheraton Kampala', ['category' => 'HOTEL']);

        $this->upload([['Company', 'Email'], ['Sheraton Kampala', 'fnb@sheraton.test']], 'GO4WORLD')
            ->assertJsonPath('imported', 0);

        $this->assertSame(1, Prospect::count());
    }

    public function test_a_renamed_row_is_matched_on_email_and_reported(): void
    {
        $this->coffee('Sheratan Kampala', ['email' => 'fnb@sheraton.test']);

        $this->upload([['Company', 'Email'], ['Sheraton Kampala Hotel', 'fnb@sheraton.test']])
            ->assertJsonPath('imported', 0)
            ->assertJsonPath('matched_differently.0.existing', 'Sheratan Kampala')
            ->assertJsonPath('matched_differently.0.by', 'email');
    }

    public function test_a_reupload_fills_blank_details_but_never_overwrites_edits(): void
    {
        $this->coffee('Java House', ['email' => 'edited@java.test', 'phone' => null, 'flags' => ['no_contact']]);

        $this->upload([['Company', 'Email', 'Phone'], ['Java House', 'old@java.test', '0700111222']])
            ->assertJsonPath('filled', 1);

        $java = Prospect::first();
        $this->assertSame('edited@java.test', $java->email); // the team's edit stands
        $this->assertSame('0700111222', $java->phone);      // the blank was filled
    }

    public function test_a_row_repeated_within_one_file_is_added_once(): void
    {
        $this->upload([['Company', 'Email'], ['Cafe Javas', 'a@cj.test'], ['Cafe Javas', 'a@cj.test']])
            ->assertJsonPath('imported', 1);
    }

    /* ── Email the whole list ──────────────────────────────────────────── */

    public function test_a_campaign_can_go_to_every_row_matching_the_filters(): void
    {
        Mail::fake();
        foreach (range(1, 30) as $i) {
            $this->coffee("Buyer {$i}");
        }
        Prospect::create(['name' => 'Truck Co', 'category' => 'CARGO', 'product' => 'FET', 'email' => 't@t.test']);

        $this->admin()->post('/api/admin/prospect-campaigns', [
            'all_matching' => '1', 'product' => 'COFFEE',
            'subject' => 'New harvest', 'body' => 'Hi {name}',
        ])->assertCreated();

        // All 30 coffee rows — more than one page — and nobody from FET.
        $this->assertSame(30, ProspectCampaign::first()->total);
    }

    public function test_bulk_follow_up_applies_to_the_whole_filtered_list(): void
    {
        foreach (range(1, 30) as $i) {
            $this->coffee("Buyer {$i}");
        }
        $fet = Prospect::create(['name' => 'Truck Co', 'category' => 'CARGO', 'product' => 'FET']);

        $this->admin()->patchJson('/api/admin/prospects/bulk', [
            'all_matching' => true, 'product' => 'COFFEE',
            'follow_up_on' => today()->addWeek()->toDateString(),
        ])->assertOk()->assertJsonPath('updated', 30);

        $this->assertNull($fet->fresh()->follow_up_on);
    }

    /* ── Follow-ups ────────────────────────────────────────────────────── */

    public function test_due_follow_ups_filter_and_count(): void
    {
        $this->coffee('Due Today', ['follow_up_on' => today()]);
        $this->coffee('Overdue', ['follow_up_on' => today()->subDays(2)]);
        $this->coffee('Next Week', ['follow_up_on' => today()->addWeek()]);
        $this->coffee('No Date');

        $this->admin()->getJson('/api/admin/prospects?due=1')->assertJsonCount(2, 'data');

        $this->app['auth']->forgetGuards();
        $this->admin()->getJson('/api/admin/stats')->assertJsonPath('data.prospects.follow_ups_due', 2);
    }

    /* ── Quotations ────────────────────────────────────────────────────── */

    public function test_emailing_a_quotation_marks_the_customer_quoted_and_sets_a_follow_up(): void
    {
        Mail::fake();
        $buyer = $this->coffee('Hamburg Roasters', ['email' => 'buy@hamburg.test']);
        $existing = $this->coffee('Old Customer', ['email' => 'old@cust.test', 'outreach_status' => 'converted']);

        foreach ([$buyer, $existing] as $p) {
            $q = Quotation::create([
                'number' => Quotation::nextNumber('coffee'), 'status' => 'draft', 'business' => 'coffee',
                'customer_name' => $p->name, 'customer_email' => strtoupper($p->email),
                'currency' => 'USD', 'issue_date' => today(),
            ]);
            $this->app['auth']->forgetGuards();
            $this->admin()->postJson("/api/admin/accounting/quotations/{$q->id}/send", ['to' => [$p->email]])->assertOk();
        }

        $buyer->refresh();
        $this->assertSame('quoted', $buyer->outreach_status);
        $this->assertTrue($buyer->follow_up_on->isSameDay(today()->addDays(3)));
        $this->assertStringStartsWith('Chase quotation VHL-CF-Q-', $buyer->follow_up);

        // An existing customer stays a customer, but still gets the reminder.
        $existing->refresh();
        $this->assertSame('converted', $existing->outreach_status);
        $this->assertNotNull($existing->follow_up_on);
    }
}
