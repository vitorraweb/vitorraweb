<?php

namespace Tests\Feature;

use App\Models\Communication;
use App\Models\User;
use App\Notifications\CustomerReplied;
use App\Support\EmailQuoteStripper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class InboundEmailTest extends TestCase
{
    use RefreshDatabase;

    private function svixHeaders(string $secret, string $body, string $id = 'msg_1', ?string $timestamp = null): array
    {
        $timestamp ??= (string) time();
        $key = str_starts_with($secret, 'whsec_') ? base64_decode(substr($secret, 6)) : $secret;
        $sig = base64_encode(hash_hmac('sha256', "{$id}.{$timestamp}.{$body}", $key, true));

        return ['svix-id' => $id, 'svix-timestamp' => $timestamp, 'svix-signature' => "v1,{$sig}"];
    }

    public function test_webhook_is_a_no_op_when_capture_is_disabled(): void
    {
        Notification::fake();
        config(['mail.inbound_capture_enabled' => false]);

        $this->postJson('/api/webhooks/email/inbound', ['data' => ['from' => 'customer@example.com', 'text' => 'Hi']])
            ->assertOk()
            ->assertJsonPath('status', 'ignored');

        $this->assertDatabaseCount('communications', 0);
    }

    public function test_webhook_rejects_an_invalid_signature(): void
    {
        Notification::fake();
        config(['mail.inbound_capture_enabled' => true]);
        config(['services.resend.inbound_webhook_secret' => 'whsec_'.base64_encode('supersecret')]);

        $this->postJson('/api/webhooks/email/inbound', ['data' => ['from' => 'customer@example.com', 'text' => 'Hi']], [
            'svix-id' => 'msg_1', 'svix-timestamp' => (string) time(), 'svix-signature' => 'v1,not-the-right-signature',
        ])->assertOk()->assertJsonPath('status', 'ignored');

        $this->assertDatabaseCount('communications', 0);
    }

    public function test_valid_webhook_captures_the_reply_and_notifies_the_owner(): void
    {
        Notification::fake();
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);

        $secret = 'whsec_'.base64_encode('supersecret');
        config(['mail.inbound_capture_enabled' => true]);
        config(['services.resend.inbound_webhook_secret' => $secret]);

        $body = json_encode(['data' => [
            'from'    => ['email' => 'Customer@Example.com', 'name' => 'Jane Doe'],
            'subject' => 'Re: your enquiry',
            'text'    => "Sounds good, thank you!\n\nOn Mon, Jan 1, 2026, Vitorra Team wrote:\n> original message",
        ]]);

        $headers = $this->svixHeaders($secret, $body);

        $this->call('POST', '/api/webhooks/email/inbound', [], [], [], array_merge([
            'CONTENT_TYPE' => 'application/json',
        ], collect($headers)->mapWithKeys(fn ($v, $k) => ['HTTP_'.strtoupper(str_replace('-', '_', $k)) => $v])->all()), $body)
            ->assertOk();

        $this->assertDatabaseHas('communications', [
            'email' => 'customer@example.com', 'direction' => 'inbound', 'channel' => 'email',
        ]);

        $communication = Communication::where('email', 'customer@example.com')->firstOrFail();
        $this->assertStringNotContainsString('original message', $communication->body);
        $this->assertStringContainsString('Sounds good', $communication->body);

        Notification::assertSentTo($admin, CustomerReplied::class);
    }

    public function test_quote_stripper_removes_trailing_history(): void
    {
        $text = "Thanks, that works.\n\nOn Mon, wrote:\n> quoted line 1\n> quoted line 2";
        $this->assertSame('Thanks, that works.', EmailQuoteStripper::strip($text));
    }

    public function test_quote_stripper_is_a_no_op_when_nothing_matches(): void
    {
        $text = "Just a normal short reply.";
        $this->assertSame($text, EmailQuoteStripper::strip($text));
    }
}
