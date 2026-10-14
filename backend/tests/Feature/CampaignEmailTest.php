<?php

namespace Tests\Feature;

use App\Mail\ProspectOutreach;
use App\Models\Prospect;
use App\Models\User;
use App\Support\EmailBody;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** The branded campaign email, support copied, and the test-before-sending flow. */
class CampaignEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'campaigns.throttle_ms'      => 0,
            'mail.campaign_from'         => 'support@vitorra.org',
            'mail.campaign_cc'           => 'support@vitorra.org',
            'campaigns.test_recipients'  => ['thurayya@vitorra.org', 'sarah@vitorra.org'],
            'services.frontend.url'      => 'https://vitorra.org',
        ]);
    }

    private function staff(string $email = 'john@vitorra.org'): self
    {
        $user = User::firstOrCreate(['email' => $email], [
            'name' => 'Staff', 'password' => 'changeme123', 'role' => 'admin',
        ]);
        $this->app['auth']->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('t')->plainTextToken);
    }

    /* ── The message text ───────────────────────────────────────────────── */

    public function test_typed_text_becomes_clean_paragraphs_lists_and_links(): void
    {
        $html = EmailBody::toHtml(
            "We have a new harvest.\nGrade AA is available.\n\n- 1 tonne minimum\n- FOB Mombasa\n\n**Samples** at www.vitorra.org or sales@vitorra.org"
        );

        $this->assertSame(3, substr_count($html, '<p ') + substr_count($html, '<ul '));
        $this->assertStringContainsString('We have a new harvest.<br>Grade AA is available.', $html);
        $this->assertSame(2, substr_count($html, '<li '));
        $this->assertStringContainsString('<strong', $html);
        $this->assertStringContainsString('href="https://www.vitorra.org"', $html);
        $this->assertStringContainsString('href="mailto:sales@vitorra.org"', $html);
    }

    public function test_typed_markup_is_escaped(): void
    {
        $this->assertStringNotContainsString('<script>', EmailBody::toHtml('<script>alert(1)</script>'));
    }

    public function test_the_email_is_branded_and_does_not_double_greetings_or_sign_offs(): void
    {
        $plain = new ProspectOutreach('Java House', 'Hello', 'A note about our coffee.', [], 'COFFEE');
        $html = $plain->previewHtml();
        $this->assertStringContainsString('https://vitorra.org/logo.png', $html);
        $this->assertStringContainsString('Vitorra Coffee', $html);
        $this->assertStringContainsString('Dear Java House,', $html);
        $this->assertStringContainsString('The Vitorra team', $html);
        $this->assertStringContainsString('/enquire?sector=COFFEE', $html);

        $own = new ProspectOutreach('Java House', 'Hello', "Hello team,\n\nA note.\n\nKind regards,\nSarah", [], 'COFFEE');
        $html = $own->previewHtml();
        $this->assertStringNotContainsString('Dear Java House,', $html);
        $this->assertStringNotContainsString('The Vitorra team', $html);
    }

    /* ── Support copied on every real send ──────────────────────────────── */

    public function test_campaign_emails_copy_support_and_reply_to_support(): void
    {
        Mail::fake();
        $p = Prospect::create(['name' => 'Hamburg Roasters', 'category' => 'GO4WORLD', 'product' => 'COFFEE', 'email' => 'buy@hamburg.test']);

        $this->staff()->postJson('/api/admin/prospect-campaigns', [
            'ids' => [$p->id], 'subject' => 'New harvest', 'body' => 'Hi {name}',
        ])->assertCreated();

        Mail::assertSent(ProspectOutreach::class, function (ProspectOutreach $mail) {
            $env = $mail->envelope();
            $this->assertSame('support@vitorra.org', $env->cc[0]->address);
            $this->assertSame('support@vitorra.org', $env->replyTo[0]->address);
            $this->assertSame('COFFEE', $mail->product);

            return $mail->hasTo('buy@hamburg.test');
        });
    }

    /* ── Preview and test send ──────────────────────────────────────────── */

    public function test_preview_returns_the_rendered_email(): void
    {
        $this->staff()->postJson('/api/admin/prospect-campaigns/preview', [
            'subject' => 'For {name}', 'body' => 'Hi {name}, hello.', 'product' => 'COFFEE',
            'sample_name' => 'Java House', 'attachment_names' => ['price-list.pdf'],
        ])->assertOk()
          ->assertJsonPath('data.subject', 'For Java House')
          ->assertSee('price-list.pdf', false);
    }

    public function test_a_test_send_goes_to_marketing_marked_test_with_attachments_and_no_copy(): void
    {
        Mail::fake();
        Storage::fake('local');

        $this->staff()->post('/api/admin/prospect-campaigns/test', [
            'subject' => 'New harvest', 'body' => 'Hi {name}', 'product' => 'COFFEE',
            'recipients' => ['thurayya@vitorra.org', 'sarah@vitorra.org'],
            'attachments' => [UploadedFile::fake()->createWithContent('deck.pdf', 'PDF-BYTES')],
        ])->assertOk();

        Mail::assertSent(ProspectOutreach::class, 2);
        Mail::assertSent(ProspectOutreach::class, function (ProspectOutreach $mail) {
            $env = $mail->envelope();
            $this->assertSame('[TEST] New harvest', $env->subject);
            $this->assertSame([], $env->cc);
            $mail->assertHasAttachedData('PDF-BYTES', 'deck.pdf', ['mime' => 'application/pdf']);

            return $mail->hasTo('thurayya@vitorra.org') || $mail->hasTo('sarah@vitorra.org');
        });

        // Nothing recorded, nothing left on disk.
        $this->assertDatabaseCount('prospect_campaigns', 0);
        $this->assertSame([], Storage::disk('local')->allFiles('campaigns/tests'));
    }

    public function test_a_test_send_can_go_to_the_sender_but_never_to_outsiders(): void
    {
        Mail::fake();

        $this->staff('john@vitorra.org')->postJson('/api/admin/prospect-campaigns/test', [
            'subject' => 'S', 'body' => 'B', 'recipients' => ['john@vitorra.org'],
        ])->assertOk();

        $this->staff('john@vitorra.org')->postJson('/api/admin/prospect-campaigns/test', [
            'subject' => 'S', 'body' => 'B', 'recipients' => ['customer@outside.test'],
        ])->assertStatus(422);

        Mail::assertSent(ProspectOutreach::class, 1);
    }

    public function test_test_recipients_lists_marketing_and_the_sender(): void
    {
        User::create(['name' => 'Thurayya Nakayima', 'email' => 'thurayya@vitorra.org', 'password' => 'x', 'role' => 'ops']);

        $this->staff('john@vitorra.org')->getJson('/api/admin/prospect-campaigns/test-recipients')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Thurayya Nakayima')
            ->assertJsonPath('data.2.email', 'john@vitorra.org')
            ->assertJsonPath('data.2.me', true);
    }

    /* ── The sender's signature ─────────────────────────────────────────── */

    public function test_a_campaign_is_signed_with_the_senders_own_signature_and_still_copies_support(): void
    {
        Mail::fake();
        $thurayya = User::create([
            'name' => 'Thurayya Nakayima', 'email' => 'thurayya@vitorra.org', 'password' => 'x', 'role' => 'admin',
            'email_signature' => '<p><strong>Thurayya Nakayima</strong><br>Senior Marketing Officer</p>',
        ]);
        $p = Prospect::create(['name' => 'Java House', 'category' => 'CAFE_RESTAURANT', 'product' => 'COFFEE', 'email' => 'java@buyer.test']);

        $this->withHeader('Authorization', 'Bearer '.$thurayya->createToken('t')->plainTextToken)
            ->postJson('/api/admin/prospect-campaigns', ['ids' => [$p->id], 'subject' => 'S', 'body' => 'A note.'])
            ->assertCreated();

        Mail::assertSent(ProspectOutreach::class, function (ProspectOutreach $mail) {
            $html = $mail->previewHtml();
            $this->assertStringContainsString('Senior Marketing Officer', $html);
            $this->assertStringNotContainsString('The Vitorra team', $html); // her name replaces the generic one
            $this->assertSame('support@vitorra.org', $mail->envelope()->cc[0]->address);
            $this->assertSame('support@vitorra.org', $mail->envelope()->from->address);

            return true;
        });
    }

    public function test_without_a_signature_the_email_signs_off_as_the_team(): void
    {
        $html = (new ProspectOutreach('Java House', 'S', 'A note.', [], 'COFFEE'))->previewHtml();

        $this->assertStringContainsString('The Vitorra team', $html);
    }

    public function test_the_test_send_and_preview_use_the_testers_signature(): void
    {
        $sarah = User::create([
            'name' => 'Sarah Nuwamanya', 'email' => 'sarah@vitorra.org', 'password' => 'x', 'role' => 'admin',
            'email_signature' => '<p>Sarah Nuwamanya<br>Marketing Officer</p>',
        ]);

        $this->withHeader('Authorization', 'Bearer '.$sarah->createToken('t')->plainTextToken)
            ->postJson('/api/admin/prospect-campaigns/preview', ['subject' => 'S', 'body' => 'A note.'])
            ->assertOk()
            ->assertSee('Marketing Officer', false);
    }
}
