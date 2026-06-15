<?php

namespace Tests\Feature;

use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Prospect;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PipelineTest extends TestCase
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

    public function test_contact_with_only_a_prospect_record_appears_with_lead_stage(): void
    {
        Prospect::create([
            'name' => 'Cold Lead Ltd',
            'category' => 'CARGO',
            'email' => 'lead@example.com',
            'outreach_status' => 'not_contacted',
        ]);

        $admin = $this->admin();
        $res = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/customers?per_page=500')
            ->assertOk()
            ->assertJsonStructure(['assignees', 'stages', 'stage_labels']);

        $contact = collect($res->json('data'))->firstWhere('email', 'lead@example.com');
        $this->assertNotNull($contact);
        $this->assertSame('lead', $contact['stage']);
        $this->assertNull($contact['owner']);
    }

    public function test_stage_escalates_with_quoted_enquiry(): void
    {
        $email = 'both@example.com';

        Prospect::create([
            'name' => 'Both Co',
            'category' => 'DISTRIBUTOR',
            'email' => $email,
            'outreach_status' => 'contacted',
        ]);

        Enquiry::create([
            'product_category' => 'fuel-eco-tech',
            'name' => 'Both Co',
            'email' => $email,
            'message' => 'Please quote us.',
            'status' => 'quoted',
        ]);

        $admin = $this->admin();
        $res = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/customers?per_page=500')
            ->assertOk();

        $contact = collect($res->json('data'))->firstWhere('email', $email);
        $this->assertSame('quoted', $contact['stage']);
    }

    public function test_order_marks_contact_as_fulfilled(): void
    {
        $email = 'buyer@example.com';

        Order::create([
            'reference' => 'VIT-TEST0001',
            'customer_name' => 'Buyer Co',
            'customer_email' => $email,
            'currency' => 'UGX',
            'subtotal' => 100000,
            'total' => 100000,
            'status' => 'delivered',
            'shipping_address' => ['country' => 'Uganda'],
        ]);

        $admin = $this->admin();
        $res = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/customers?per_page=500')
            ->assertOk();

        $contact = collect($res->json('data'))->firstWhere('email', $email);
        $this->assertSame('fulfilled', $contact['stage']);
    }

    public function test_update_pipeline_sets_owner_and_stage_override(): void
    {
        $email = 'owned@example.com';
        Prospect::create([
            'name' => 'Owned Co',
            'category' => 'FARMER',
            'email' => $email,
            'outreach_status' => 'not_contacted',
        ]);

        $admin = $this->admin();
        $owner = $this->admin();

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/customers/pipeline', [
            'email' => $email,
            'owner_id' => $owner->id,
            'pipeline_stage' => 'qualified',
        ])->assertOk();

        $res = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/customers?per_page=500')
            ->assertOk();

        $contact = collect($res->json('data'))->firstWhere('email', $email);
        $this->assertSame('qualified', $contact['stage']);
        $this->assertSame($owner->id, $contact['owner']['id']);
    }

    public function test_clearing_override_reverts_to_derived_stage(): void
    {
        $email = 'revert@example.com';
        Prospect::create([
            'name' => 'Revert Co',
            'category' => 'SCHOOL',
            'email' => $email,
            'outreach_status' => 'not_contacted',
        ]);

        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/customers/pipeline', [
            'email' => $email,
            'owner_id' => $admin->id,
            'pipeline_stage' => 'qualified',
        ])->assertOk();

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/customers/pipeline', [
            'email' => $email,
            'owner_id' => $admin->id,
            'pipeline_stage' => null,
        ])->assertOk();

        $res = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/customers?per_page=500')
            ->assertOk();

        $contact = collect($res->json('data'))->firstWhere('email', $email);
        $this->assertSame('lead', $contact['stage']);
        $this->assertSame($admin->id, $contact['owner']['id']);
    }
}
