<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\SignatureHtml;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EmailSignatureTest extends TestCase
{
    use RefreshDatabase;

    private function staff(string $role = 'admin'): User
    {
        return User::create([
            'name'     => 'Test Staff',
            'email'    => 'staff-'.uniqid().'@vitorra.org',
            'password' => 'changeme123',
            'role'     => $role,
        ]);
    }

    public function test_staff_can_save_a_rich_html_signature(): void
    {
        $user = $this->staff();

        $this->actingAs($user, 'sanctum')->putJson('/api/auth/signature', [
            'signature' => '<p><b>Jane Doe</b><br>Vitorra Holdings</p>',
        ])->assertOk();

        $user->refresh();
        $this->assertStringContainsString('<b>Jane Doe</b>', $user->email_signature);
    }

    public function test_signature_script_tags_are_stripped(): void
    {
        $user = $this->staff();

        $this->actingAs($user, 'sanctum')->putJson('/api/auth/signature', [
            'signature' => 'Hi<script>alert(1)</script> there',
        ])->assertOk();

        $user->refresh();
        $this->assertStringNotContainsString('<script', $user->email_signature);
        $this->assertStringContainsString('Hi', $user->email_signature);
        $this->assertStringContainsString('there', $user->email_signature);
    }

    public function test_signature_event_handlers_and_javascript_urls_are_stripped(): void
    {
        $user = $this->staff();

        $this->actingAs($user, 'sanctum')->putJson('/api/auth/signature', [
            'signature' => '<img src="x.png" onerror="alert(1)"><a href="javascript:alert(1)">link</a>',
        ])->assertOk();

        $user->refresh();
        $this->assertStringNotContainsString('onerror', $user->email_signature);
        $this->assertStringNotContainsString('javascript:', $user->email_signature);
    }

    public function test_customer_cannot_set_a_signature(): void
    {
        $customer = User::create([
            'name'     => 'A Customer',
            'email'    => 'customer-'.uniqid().'@example.com',
            'password' => 'changeme123',
            'role'     => 'customer',
        ]);

        $this->actingAs($customer, 'sanctum')->putJson('/api/auth/signature', [
            'signature' => 'hi',
        ])->assertForbidden();
    }

    public function test_embedded_base64_image_is_extracted_to_a_real_file(): void
    {
        Storage::fake('public');

        $user = $this->staff();
        // 1x1 transparent PNG, inline so the test has no filesystem dependency.
        $pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

        $this->actingAs($user, 'sanctum')->putJson('/api/auth/signature', [
            'signature' => '<p>Jane</p><img src="data:image/png;base64,'.$pixel.'">',
        ])->assertOk();

        $user->refresh();
        $this->assertStringNotContainsString('base64', $user->email_signature);
        $this->assertMatchesRegularExpression('#/storage/signatures/'.$user->id.'/#', $user->email_signature);

        preg_match('#signatures/'.$user->id.'/[a-zA-Z0-9]+\.png#', $user->email_signature, $m);
        $this->assertNotEmpty($m, 'Expected an extracted signature image path.');
        Storage::disk('public')->assertExists($m[0]);
    }

    public function test_unknown_tags_are_unwrapped_but_content_kept(): void
    {
        $clean = SignatureHtml::process('<o:p>Hello</o:p> <weird>World</weird>', 1);

        $this->assertSame('Hello World', trim(preg_replace('/\s+/', ' ', $clean)));
    }

    public function test_undecodable_base64_image_is_dropped_not_stored(): void
    {
        $clean = SignatureHtml::process('<img src="data:image/png;base64,!!!not-base64!!!">', 1);

        $this->assertSame('', trim($clean));
    }

    public function test_blank_signature_clears_it(): void
    {
        $user = $this->staff();
        $user->update(['email_signature' => '<p>old</p>']);

        $this->actingAs($user, 'sanctum')->putJson('/api/auth/signature', [
            'signature' => '',
        ])->assertOk();

        $this->assertNull($user->refresh()->email_signature);
    }
}
