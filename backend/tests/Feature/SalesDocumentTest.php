<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesDocumentTest extends TestCase
{
    use RefreshDatabase;

    private function h(string $role = 'admin', ?array $perms = null): array
    {
        $u = User::create(['name' => 'Staff', 'email' => 's-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => $role, 'permissions' => $perms]);

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin'])->plainTextToken];
    }

    public function test_sales_staff_can_read_and_download_the_fet_agreement(): void
    {
        $h = $this->h('ops', ['prospects']);

        $this->withHeaders($h)->getJson('/api/admin/sales-documents')->assertOk()
            ->assertJsonPath('data.0.key', 'fet-sales-agreement')
            ->assertJsonPath('data.0.formats', ['pdf', 'docx']);

        $pdf = $this->withHeaders($h)->get('/api/admin/sales-documents/fet-sales-agreement/pdf')->assertOk();
        $this->assertSame('application/pdf', $pdf->headers->get('Content-Type'));
        $this->assertStringStartsWith('inline', $pdf->headers->get('Content-Disposition'));

        $this->withHeaders($h)->get('/api/admin/sales-documents/fet-sales-agreement/docx')->assertOk()
            ->assertDownload('fet-sales-agreement.docx');

        $this->assertSame(2, ActivityLog::where('action', 'like', 'sales_document.%')->count());
    }

    public function test_it_is_not_public_and_not_open_to_unrelated_staff(): void
    {
        $this->getJson('/api/admin/sales-documents')->assertUnauthorized();
        $this->get('/api/admin/sales-documents/fet-sales-agreement/pdf', ['Accept' => 'application/json'])->assertUnauthorized();

        $this->withHeaders($this->h('ops', ['blog']))->getJson('/api/admin/sales-documents')->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->h('ops', ['accounting']))->getJson('/api/admin/sales-documents')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->h())->getJson('/api/admin/sales-documents/nope/pdf')->assertNotFound();
    }
}
