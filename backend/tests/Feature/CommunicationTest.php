<?php

namespace Tests\Feature;

use App\Mail\StaffReply;
use App\Models\Enquiry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CommunicationTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin '.uniqid(),
            'email' => 'admin-'.uniqid().'@vitorra.org',
            'password' => 'password123',
            'role' => 'admin',
        ]);
    }

    public function test_sending_a_reply_creates_a_communication_and_emails_the_contact(): void
    {
        Mail::fake();

        $admin = $this->admin();
        $email = 'customer@example.com';

        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/communications', [
            'email'   => $email,
            'subject' => 'Re: your enquiry',
            'body'    => 'Thanks for reaching out, here is the info you asked for.',
        ])->assertOk();

        $this->assertDatabaseHas('communications', [
            'email'   => $email,
            'subject' => 'Re: your enquiry',
            'sent_by' => $admin->id,
        ]);

        Mail::assertSent(StaffReply::class, fn ($mail) => $mail->hasTo($email));
    }

    public function test_reply_appears_in_customer_detail(): void
    {
        Mail::fake();

        $admin = $this->admin();
        $email = 'customer2@example.com';

        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/communications', [
            'email' => $email,
            'body'  => 'Following up on your request.',
        ])->assertOk();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/customers/detail?email='.$email)->assertOk();

        $response->assertJsonFragment(['body' => 'Following up on your request.']);
    }

    public function test_reply_linked_to_enquiry_stamps_replied_at(): void
    {
        Mail::fake();

        $admin = $this->admin();

        $enquiry = Enquiry::create([
            'product_category' => 'FET',
            'name'             => 'Jane Doe',
            'email'            => 'jane@example.com',
            'message'          => 'Tell me more.',
            'status'           => 'new',
        ]);

        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/communications', [
            'email'        => $enquiry->email,
            'name'         => $enquiry->name,
            'body'         => 'Here are the details you requested.',
            'related_type' => 'enquiry',
            'related_id'   => $enquiry->id,
        ])->assertOk();

        $this->assertNotNull($enquiry->refresh()->replied_at);
    }

    public function test_body_is_required(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/communications', [
            'email' => 'customer3@example.com',
        ])->assertStatus(422);
    }
}
