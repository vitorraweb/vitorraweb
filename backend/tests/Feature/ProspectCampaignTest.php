<?php

namespace Tests\Feature;

use App\Mail\ProspectOutreach;
use App\Models\Prospect;
use App\Models\ProspectCampaign;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Prospect outreach campaigns: product segmentation, batched sending from the
 * shared support address, and attachments encrypted at rest.
 */
class ProspectCampaignTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['campaigns.throttle_ms' => 0, 'mail.campaign_from' => 'support@vitorra.org']);
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin', 'email' => 'a-'.uniqid().'@vitorra.org',
            'password' => 'changeme123', 'role' => 'admin',
        ]);
    }

    private function actingApi(User $user): self
    {
        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('t')->plainTextToken);
    }

    private function prospect(array $extra = []): Prospect
    {
        return Prospect::create(array_merge([
            'name'     => 'Company '.uniqid(),
            'category' => 'HOSPITAL',
            'product'  => 'SEAL',
            'email'    => 'p-'.uniqid().'@example.org',
        ], $extra));
    }

    public function test_campaign_sends_from_the_support_address_not_the_staff_member(): void
    {
        Mail::fake();
        $staff = $this->admin();
        $prospect = $this->prospect(['name' => 'Nakasero Hospital']);

        $this->actingApi($staff)->postJson('/api/admin/prospect-campaigns', [
            'ids'     => [$prospect->id],
            'subject' => 'Introducing SEAL wound spray',
            'body'    => 'We would like to introduce our FDA-cleared product.',
        ])->assertCreated();

        Mail::assertSent(ProspectOutreach::class, function ($mail) use ($staff) {
            $envelope = $mail->envelope();
            $this->assertSame('support@vitorra.org', $envelope->from->address);
            $this->assertSame('support@vitorra.org', $envelope->replyTo[0]->address);
            $this->assertNotSame($staff->email, $envelope->from->address);

            return true;
        });
    }

    public function test_subject_and_body_personalise_the_name_token(): void
    {
        Mail::fake();
        $prospect = $this->prospect(['name' => 'Mengo Hospital']);

        $this->actingApi($this->admin())->postJson('/api/admin/prospect-campaigns', [
            'ids'     => [$prospect->id],
            'subject' => 'A word with {name}',
            'body'    => 'Hi {name}, we have something for you.',
        ])->assertCreated();

        Mail::assertSent(ProspectOutreach::class, function ($mail) {
            $this->assertSame('A word with Mengo Hospital', $mail->envelope()->subject);
            $this->assertStringContainsString('Hi Mengo Hospital,', $mail->body);

            return true;
        });
    }

    public function test_attachments_are_encrypted_at_rest_and_attached_to_the_email(): void
    {
        Mail::fake();
        Storage::fake('local');
        $prospect = $this->prospect();

        $this->actingApi($this->admin())->post('/api/admin/prospect-campaigns', [
            'ids'         => [$prospect->id],
            'subject'     => 'SEAL product deck',
            'body'        => 'Deck attached.',
            'attachments' => [UploadedFile::fake()->createWithContent('seal-deck.pdf', 'PDF-BYTES')],
        ])->assertCreated()
          ->assertJsonPath('data.attachments.0.name', 'seal-deck.pdf');

        $stored = ProspectCampaign::first()->attachments[0]['path'];

        // On disk it is unreadable without the app key…
        $raw = Storage::disk('local')->get($stored);
        $this->assertStringStartsWith('VENC1:', $raw);
        $this->assertStringNotContainsString('PDF-BYTES', $raw);

        // …but the email carries the real file, decrypted in memory.
        Mail::assertSent(ProspectOutreach::class, function ($mail) {
            $mail->assertHasAttachedData('PDF-BYTES', 'seal-deck.pdf', ['mime' => 'application/pdf']);

            return true;
        });
    }

    public function test_prospects_without_an_email_are_skipped_and_repeats_emailed_once(): void
    {
        Mail::fake();
        $withEmail = $this->prospect(['email' => 'shared@hospital.test', 'name' => 'Site A']);
        $sameEmail = $this->prospect(['email' => 'shared@hospital.test', 'name' => 'Site B', 'category' => 'PHARMACY']);
        $noEmail   = $this->prospect(['email' => null, 'name' => 'No Contact Ltd']);

        $res = $this->actingApi($this->admin())->postJson('/api/admin/prospect-campaigns', [
            'ids'     => [$withEmail->id, $sameEmail->id, $noEmail->id],
            'subject' => 'Hello',
            'body'    => 'Body',
        ])->assertCreated();

        $res->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.sent_count', 1)
            ->assertJsonPath('data.duplicate', 1)
            ->assertJsonPath('data.skipped', 1);

        Mail::assertSentCount(1);

        // Both prospects behind that one inbox count as contacted; the one with
        // no email address does not.
        $this->assertSame('contacted', $withEmail->fresh()->outreach_status);
        $this->assertSame('contacted', $sameEmail->fresh()->outreach_status);
        $this->assertSame('not_contacted', $noEmail->fresh()->outreach_status);
    }

    public function test_large_campaign_finishes_across_batches_without_resending(): void
    {
        Mail::fake();
        config(['campaigns.batch_size' => 4]);

        $prospects = collect(range(1, 10))->map(fn ($i) => $this->prospect(['name' => "Clinic {$i}"]));

        $this->actingApi($this->admin())->postJson('/api/admin/prospect-campaigns', [
            'ids'     => $prospects->pluck('id')->all(),
            'subject' => 'Batch test',
            'body'    => 'Body',
        ])->assertCreated()->assertJsonPath('data.status', 'sending');

        $campaign = ProspectCampaign::first();
        $this->assertSame(10, $campaign->total);

        // The scheduler drains the rest a batch at a time.
        do {
            $this->artisan('campaigns:send')->assertSuccessful();
            $campaign->refresh();
        } while ($campaign->status === 'sending');

        $this->assertSame('sent', $campaign->status);
        $this->assertSame(10, $campaign->sent_count);
        $this->assertNotNull($campaign->completed_at);
        Mail::assertSentCount(10);          // exactly once each, no duplicates

        // A further run is a no-op.
        $this->artisan('campaigns:send')->assertSuccessful();
        Mail::assertSentCount(10);
    }

    public function test_a_failing_send_is_recorded_without_stopping_the_campaign(): void
    {
        $good = $this->prospect(['name' => 'Good Clinic', 'email' => 'good@clinic.test']);
        $bad  = $this->prospect(['name' => 'Bad Clinic', 'email' => 'bad@clinic.test']);

        Mail::shouldReceive('to')->andReturnUsing(function ($email) {
            if ($email === 'bad@clinic.test') {
                throw new \RuntimeException('Mailbox unavailable');
            }

            return new class {
                public function send($mailable) {}
            };
        });

        $this->actingApi($this->admin())->postJson('/api/admin/prospect-campaigns', [
            'ids'     => [$good->id, $bad->id],
            'subject' => 'Hello',
            'body'    => 'Body',
        ])->assertCreated();

        $campaign = ProspectCampaign::first();
        $this->assertSame(1, $campaign->sent_count);
        $this->assertSame(1, $campaign->failed_count);
        $this->assertSame('sent', $campaign->status);   // finished, not stuck

        $this->assertSame('contacted', $good->fresh()->outreach_status);
        $this->assertSame('not_contacted', $bad->fresh()->outreach_status);
    }

    public function test_prospect_list_is_filtered_by_product(): void
    {
        $this->prospect(['product' => 'SEAL', 'name' => 'Seal Hospital']);
        $this->prospect(['product' => 'FET', 'category' => 'CARGO', 'name' => 'Fet Hauliers']);

        $admin = $this->admin();

        $seal = $this->actingApi($admin)->getJson('/api/admin/prospects?product=SEAL')->assertOk();
        $this->assertSame(1, $seal->json('total'));
        $this->assertSame('Seal Hospital', $seal->json('data.0.name'));

        $fet = $this->actingApi($admin)->getJson('/api/admin/prospects?product=FET')->assertOk();
        $this->assertSame(1, $fet->json('total'));
        $this->assertSame('Fet Hauliers', $fet->json('data.0.name'));

        // Unscoped still returns both, for the "all products" view.
        $this->assertSame(2, $this->actingApi($admin)->getJson('/api/admin/prospects')->json('total'));
    }

    public function test_the_same_company_can_be_a_prospect_for_two_products(): void
    {
        // The old name+category key silently dropped the second of these.
        $fet = Prospect::create(['name' => 'Tororo Cement', 'category' => 'MANUFACTURING', 'product' => 'FET']);
        $seal = Prospect::create(['name' => 'Tororo Cement', 'category' => 'MANUFACTURING', 'product' => 'SEAL']);

        $this->assertNotSame($fet->id, $seal->id);
        $this->assertSame(2, Prospect::where('name', 'Tororo Cement')->count());
    }

    public function test_import_rejects_a_category_that_is_not_on_that_products_list(): void
    {
        $csv = UploadedFile::fake()->createWithContent(
            'list.csv',
            "NAME,LOCATION,CONTACT,EMAIL\nSome Clinic,Kampala,0700000000,clinic@test.org\n"
        );

        // HOSPITAL is a SEAL vertical, not an FET one.
        $this->actingApi($this->admin())->post('/api/admin/prospects/import', [
            'file' => $csv, 'product' => 'FET', 'category' => 'HOSPITAL',
        ])->assertStatus(422);

        $this->assertSame(0, Prospect::count());
    }

    public function test_import_files_rows_under_the_chosen_product(): void
    {
        $csv = UploadedFile::fake()->createWithContent(
            'list.csv',
            "NAME,LOCATION,CONTACT,EMAIL\nMulago Hospital,Kampala,0700000000,mulago@test.org\n"
        );

        $this->actingApi($this->admin())->post('/api/admin/prospects/import', [
            'file' => $csv, 'product' => 'SEAL', 'category' => 'HOSPITAL',
        ])->assertOk()->assertJsonPath('imported', 1);

        $this->assertSame('SEAL', Prospect::first()->product);
    }

    public function test_cancelling_a_campaign_stops_further_sending(): void
    {
        Mail::fake();
        config(['campaigns.batch_size' => 2]);

        $prospects = collect(range(1, 8))->map(fn ($i) => $this->prospect(['name' => "Clinic {$i}"]));

        $this->actingApi($this->admin())->postJson('/api/admin/prospect-campaigns', [
            'ids' => $prospects->pluck('id')->all(), 'subject' => 'S', 'body' => 'B',
        ])->assertCreated();

        $campaign = ProspectCampaign::first();
        $sentSoFar = $campaign->sent_count;

        $this->actingApi($this->admin())
            ->postJson("/api/admin/prospect-campaigns/{$campaign->id}/cancel")
            ->assertOk()->assertJsonPath('data.status', 'cancelled');

        $this->artisan('campaigns:send')->assertSuccessful();

        $this->assertSame($sentSoFar, $campaign->fresh()->sent_count);
        Mail::assertSentCount($sentSoFar);
    }
}
