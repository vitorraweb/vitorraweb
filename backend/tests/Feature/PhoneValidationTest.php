<?php

namespace Tests\Feature;

use App\Support\Phone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PhoneValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_normalises_local_uganda_number_to_e164(): void
    {
        $this->assertSame('+256772123456', Phone::e164('0772 123456'));
        $this->assertSame('+256772123456', Phone::e164('+256 772 123456'));
    }

    public function test_keeps_unparseable_input_rather_than_dropping_it(): void
    {
        $this->assertSame('1234', Phone::e164('1234'));
        $this->assertNull(Phone::e164(null));
        $this->assertNull(Phone::e164(''));
    }

    public function test_validity_check(): void
    {
        $this->assertTrue(Phone::isValid('0772123456'));
        $this->assertTrue(Phone::isValid(null));     // blank is allowed (use with nullable)
        $this->assertFalse(Phone::isValid('123'));
    }

    public function test_enquiry_rejects_invalid_phone(): void
    {
        $this->postJson('/api/enquiries', [
            'name' => 'A', 'email' => 'a@b.com', 'country' => 'Uganda', 'message' => 'Hi', 'phone' => '123',
        ])->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_enquiry_stores_normalised_phone(): void
    {
        Mail::fake();

        $this->postJson('/api/enquiries', [
            'name' => 'A', 'email' => 'a@b.com', 'country' => 'Uganda', 'message' => 'Hi', 'phone' => '0772 123456',
        ])->assertCreated();

        $this->assertDatabaseHas('enquiries', ['email' => 'a@b.com', 'phone' => '+256772123456']);
    }
}
