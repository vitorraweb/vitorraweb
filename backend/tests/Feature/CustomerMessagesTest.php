<?php

namespace Tests\Feature;

use App\Models\Communication;
use App\Models\User;
use App\Notifications\CustomerReplied;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CustomerMessagesTest extends TestCase
{
    use RefreshDatabase;

    private function customerToken(string $email): string
    {
        $user = User::create(['name' => 'Me', 'email' => $email, 'password' => 'changeme123changeme', 'role' => 'customer']);

        return $user->createToken('t', ['customer'])->plainTextToken;
    }

    public function test_customer_sees_the_thread_for_their_own_email(): void
    {
        $email = 'jane@example.com';
        $token = $this->customerToken($email);

        $admin = User::create(['name' => 'Admin', 'email' => 'admin@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);
        Communication::create([
            'email' => $email, 'direction' => 'outbound', 'channel' => 'email',
            'body' => 'Here is your quote.', 'sent_by' => $admin->id,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/account/communications')
            ->assertOk()
            ->assertJsonFragment(['body' => 'Here is your quote.'])
            ->assertJsonPath('unread_count', 1);
    }

    public function test_customer_can_reply_and_it_notifies_the_owner(): void
    {
        Notification::fake();
        $ops = User::create(['name' => 'Ops', 'email' => 'ops@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        $email = 'jane@example.com';
        $token = $this->customerToken($email);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/account/communications', ['body' => 'Following up on this.'])
            ->assertCreated()
            ->assertJsonFragment(['body' => 'Following up on this.', 'direction' => 'inbound', 'channel' => 'portal']);

        $this->assertDatabaseHas('communications', [
            'email' => $email, 'direction' => 'inbound', 'channel' => 'portal', 'sent_by' => null,
        ]);

        Notification::assertSentTo($ops, CustomerReplied::class);
    }

    public function test_customer_cannot_see_another_customers_thread(): void
    {
        Communication::create(['email' => 'other@example.com', 'direction' => 'outbound', 'channel' => 'email', 'body' => 'Private.']);
        $token = $this->customerToken('me@example.com');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/account/communications')
            ->assertOk()
            ->assertJsonMissing(['body' => 'Private.']);
    }

    public function test_read_all_clears_unread_count(): void
    {
        $email = 'jane@example.com';
        $token = $this->customerToken($email);
        Communication::create(['email' => $email, 'direction' => 'outbound', 'channel' => 'email', 'body' => 'Reply from staff.']);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/account/communications/read-all')->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/account/communications')
            ->assertJsonPath('unread_count', 0);
    }

    public function test_customer_can_download_their_own_attachment(): void
    {
        Mail::fake();
        $email = 'jane@example.com';
        $token = $this->customerToken($email);

        $file = UploadedFile::fake()->create('quote.pdf', 10, 'application/pdf');
        $this->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/account/communications', ['body' => 'See attached.', 'attachments' => [$file]])
            ->assertCreated();

        $communication = Communication::where('email', $email)->firstOrFail();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->get("/api/account/communications/{$communication->id}/attachments/0")
            ->assertOk();
    }

    public function test_customer_cannot_download_someone_elses_attachment(): void
    {
        $communication = Communication::create([
            'email' => 'jane@example.com', 'direction' => 'inbound', 'channel' => 'portal', 'body' => 'See attached.',
            'attachments' => [['name' => 'quote.pdf', 'path' => 'communications/x/quote.pdf', 'size' => 10, 'mime' => 'application/pdf']],
        ]);
        $intruderToken = $this->customerToken('intruder@example.com');

        $this->withHeader('Authorization', "Bearer {$intruderToken}")
            ->get("/api/account/communications/{$communication->id}/attachments/0")
            ->assertForbidden();
    }
}
