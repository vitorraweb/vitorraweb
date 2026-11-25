<?php

namespace Tests\Feature;

use App\Mail\NewEnquiry;
use App\Models\Enquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** The free-preview form on /websites (Vitorra Digital starter websites). */
class WebsitePreviewTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $over = []): array
    {
        return array_merge([
            'name' => 'Grace Namuli',
            'business' => 'Namuli Fashions',
            'phone' => '0772 123 456',
            'email' => 'grace@example.com',
            'business_type' => 'shop',
            'online_link' => 'facebook.com/namulifashions',
            'sells' => 'Kitenge dresses and bags',
            'add_ads' => true,
        ], $over);
    }

    public function test_a_preview_request_becomes_a_web_lead_for_vitorra_digital(): void
    {
        Mail::fake();

        $this->postJson('/api/websites/preview', $this->payload())->assertCreated();

        $e = Enquiry::sole();
        $this->assertSame('WEB', $e->product_category);
        $this->assertSame('Vitorra Digital', $e->assigned_to);
        $this->assertSame('Namuli Fashions', $e->company);
        $this->assertSame('+256772123456', $e->phone);
        $values = collect($e->requirements)->pluck('value', 'key');
        $this->assertSame('Shop / boutique', $values['business_type']);
        $this->assertStringContainsString('ads', $values['add_ads']);
        Mail::assertSent(NewEnquiry::class);
    }

    public function test_phone_and_business_type_are_required(): void
    {
        $this->postJson('/api/websites/preview', $this->payload(['phone' => '', 'business_type' => 'casino']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['phone', 'business_type']);
        $this->assertSame(0, Enquiry::count());
    }

    public function test_web_is_an_accepted_category_on_the_general_enquiry_form(): void
    {
        Mail::fake();
        $this->postJson('/api/enquiries', [
            'product_category' => 'WEB', 'name' => 'Owner', 'email' => 'o@example.com',
            'country' => 'Uganda', 'message' => 'I need a website.',
        ])->assertCreated();
        $this->assertSame('Vitorra Digital', Enquiry::sole()->assigned_to);
    }
}
