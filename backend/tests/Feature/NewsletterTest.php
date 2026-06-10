<?php

namespace Tests\Feature;

use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewsletterTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_can_subscribe(): void
    {
        $res = $this->postJson('/api/newsletter/subscribe', ['email' => 'jane@example.com']);

        $res->assertCreated();
        $this->assertDatabaseHas('newsletter_subscribers', [
            'email'  => 'jane@example.com',
            'status' => 'subscribed',
        ]);
        $this->assertNotEmpty(NewsletterSubscriber::first()->token);
    }

    public function test_subscribing_is_idempotent_and_case_insensitive(): void
    {
        $this->postJson('/api/newsletter/subscribe', ['email' => 'Jane@Example.com'])->assertCreated();
        $this->postJson('/api/newsletter/subscribe', ['email' => 'jane@example.com'])->assertCreated();

        $this->assertSame(1, NewsletterSubscriber::count());
    }

    public function test_the_honeypot_silently_drops_bots(): void
    {
        $this->postJson('/api/newsletter/subscribe', [
            'email' => 'bot@example.com',
            'hp'    => 'i am a bot',
        ])->assertStatus(422);

        $this->assertDatabaseCount('newsletter_subscribers', 0);
    }

    public function test_a_subscriber_can_unsubscribe_with_their_token(): void
    {
        $this->postJson('/api/newsletter/subscribe', ['email' => 'jane@example.com'])->assertCreated();
        $token = NewsletterSubscriber::first()->token;

        $res = $this->postJson('/api/newsletter/unsubscribe', ['token' => $token]);

        $res->assertOk()->assertJsonPath('email', 'jane@example.com');
        $this->assertDatabaseHas('newsletter_subscribers', [
            'email'  => 'jane@example.com',
            'status' => 'unsubscribed',
        ]);
    }

    public function test_an_invalid_unsubscribe_token_is_rejected(): void
    {
        $this->postJson('/api/newsletter/unsubscribe', ['token' => 'nope'])->assertNotFound();
    }

    public function test_re_subscribing_after_unsubscribe_reactivates(): void
    {
        $this->postJson('/api/newsletter/subscribe', ['email' => 'jane@example.com'])->assertCreated();
        $token = NewsletterSubscriber::first()->token;
        $this->postJson('/api/newsletter/unsubscribe', ['token' => $token])->assertOk();

        $this->postJson('/api/newsletter/subscribe', ['email' => 'jane@example.com'])->assertCreated();

        $this->assertDatabaseHas('newsletter_subscribers', [
            'email'  => 'jane@example.com',
            'status' => 'subscribed',
        ]);
    }
}
