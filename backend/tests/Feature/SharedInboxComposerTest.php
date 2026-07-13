<?php

namespace Tests\Feature;

use App\Mail\StaffReply;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SharedInboxComposerTest extends TestCase
{
    use RefreshDatabase;

    private function admin(array $attrs = []): User
    {
        return User::create(array_merge([
            'name' => 'Thurayya', 'email' => 'thurayya@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin',
        ], $attrs));
    }

    public function test_reply_with_cc_and_attachment_is_recorded_and_emailed(): void
    {
        Mail::fake();
        $admin = $this->admin();
        $customer = 'customer@example.com';

        $file = UploadedFile::fake()->create('brochure.pdf', 20, 'application/pdf');

        $this->actingAs($admin, 'sanctum')->post('/api/admin/communications', [
            'email' => $customer,
            'body'  => 'Here is the brochure you asked for.',
            'cc'    => ['ops@vitorra.org'],
            'attachments' => [$file],
        ])->assertOk();

        $this->assertDatabaseHas('communications', [
            'email' => $customer, 'direction' => 'outbound', 'channel' => 'email', 'sent_by' => $admin->id,
        ]);

        Mail::assertSent(StaffReply::class, function ($mail) {
            return $mail->hasCc('ops@vitorra.org') && count($mail->attachments()) === 1;
        });
    }

    public function test_signature_is_appended_to_the_outgoing_email(): void
    {
        Mail::fake();
        $admin = $this->admin(['email_signature' => "— Thurayya Nakayima\nSenior Marketing Officer"]);

        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/communications', [
            'email' => 'customer2@example.com',
            'body'  => 'Thanks for reaching out.',
        ])->assertOk();

        Mail::assertSent(StaffReply::class, function ($mail) {
            $mail->assertSeeInHtml('Senior Marketing Officer');

            return true;
        });
    }

    public function test_reply_to_stays_personal_until_inbound_capture_is_enabled(): void
    {
        Mail::fake();
        config(['mail.inbound_capture_enabled' => false]);
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/communications', [
            'email' => 'customer3@example.com',
            'body'  => 'Following up.',
        ])->assertOk();

        Mail::assertSent(StaffReply::class, fn ($mail) => $mail->envelope()->replyTo[0]->address === $admin->email);
    }

    public function test_reply_to_switches_to_inbound_address_once_capture_is_enabled(): void
    {
        Mail::fake();
        config(['mail.inbound_capture_enabled' => true, 'mail.inbound_address' => 'reply@reply.vitorra.org']);
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/communications', [
            'email' => 'customer4@example.com',
            'body'  => 'Following up.',
        ])->assertOk();

        Mail::assertSent(StaffReply::class, fn ($mail) => $mail->envelope()->replyTo[0]->address === 'reply@reply.vitorra.org');
    }
}
