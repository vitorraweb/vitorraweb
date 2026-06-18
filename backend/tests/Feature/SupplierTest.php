<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'admin']);
    }

    private function actingApi(User $u): self
    {
        return $this->withHeader('Authorization', 'Bearer '.$u->createToken('t')->plainTextToken);
    }

    public function test_public_onboarding_creates_supplier_with_documents(): void
    {
        Storage::fake('local');
        Mail::fake();

        $this->post('/api/suppliers/onboard', [
            'company_name'        => 'Acme Packaging',
            'email'               => 'sales@acme.test',
            'category'            => 'Packaging',
            'bank_account_number' => '0123456789',
            'documents'           => [UploadedFile::fake()->create('reg.pdf', 20, 'application/pdf')],
        ])->assertCreated();

        $supplier = Supplier::first();
        $this->assertNotNull($supplier);
        $this->assertSame('pending', $supplier->status);
        $this->assertSame(1, $supplier->documents()->count());
        Storage::disk('local')->assertExists($supplier->documents()->first()->path);
        Mail::assertSent(\App\Mail\SupplierOnboarded::class);
    }

    public function test_bank_details_are_encrypted_at_rest(): void
    {
        $supplier = Supplier::create([
            'company_name' => 'SecureCo', 'email' => 's@v.org', 'bank_account_number' => '1234567890',
        ]);

        // Raw DB value is ciphertext, not the plaintext number.
        $raw = DB::table('suppliers')->where('id', $supplier->id)->value('bank_account_number');
        $this->assertNotSame('1234567890', $raw);
        // The model transparently decrypts it.
        $this->assertSame('1234567890', $supplier->fresh()->bank_account_number);
    }

    public function test_honeypot_blocks_creation(): void
    {
        $this->post('/api/suppliers/onboard', [
            'website' => 'http://spam.test', 'company_name' => 'Bot', 'email' => 'bot@spam.test',
        ])->assertOk();

        $this->assertSame(0, Supplier::count());
    }

    public function test_admin_can_approve_a_supplier(): void
    {
        $supplier = Supplier::create(['company_name' => 'X', 'email' => 'x@v.org', 'status' => 'pending']);

        $this->actingApi($this->admin())
            ->patchJson("/api/admin/suppliers/{$supplier->id}/status", ['status' => 'approved'])
            ->assertOk();

        $this->assertSame('approved', $supplier->fresh()->status);
        $this->assertNotNull($supplier->fresh()->reviewed_by);
    }

    public function test_assigning_an_approver_creates_a_task(): void
    {
        $supplier = Supplier::create(['company_name' => 'Y', 'email' => 'y@v.org', 'status' => 'pending']);
        $admin = $this->admin();
        $approver = User::create(['name' => 'Ops', 'email' => 'ops-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'ops', 'department' => 'operations']);

        $this->actingApi($admin)
            ->postJson("/api/admin/suppliers/{$supplier->id}/assign", ['user_id' => $approver->id])
            ->assertOk();

        $this->assertTrue(Task::where('assigned_to', $approver->id)->where('contact_email', 'y@v.org')->exists());
    }

    public function test_employees_cannot_access_admin_suppliers(): void
    {
        $employee = User::create(['name' => 'E', 'email' => 'e-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'employee']);
        $this->actingApi($employee)->getJson('/api/admin/suppliers')->assertForbidden();
    }
}
