<?php

namespace Tests\Feature;

use App\Models\JobApplication;
use App\Models\JobOpening;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CareersTest extends TestCase
{
    use RefreshDatabase;

    private function opening(array $extra = []): JobOpening
    {
        return JobOpening::create(array_merge([
            'title' => 'Marketing Officer', 'slug' => 'marketing-officer-'.uniqid(),
            'status' => 'open', 'employment_type' => 'full_time',
        ], $extra));
    }

    public function test_public_list_shows_only_open_roles(): void
    {
        $this->opening(['title' => 'Open Role']);
        $this->opening(['title' => 'Closed Role', 'status' => 'closed']);

        $res = $this->getJson('/api/careers/openings')->assertOk();
        $titles = collect($res->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Open Role'));
        $this->assertFalse($titles->contains('Closed Role'));
    }

    public function test_cv_upload_extracts_details_and_application_is_created(): void
    {
        Storage::fake('local');
        Mail::fake();
        config(['services.anthropic.key' => 'test-key']);

        // Fake Claude returning structured JSON.
        Http::fake(['api.anthropic.com/*' => Http::response([
            'content' => [['type' => 'text', 'text' => json_encode([
                'name' => 'Jane Doe', 'email' => 'jane@example.com', 'phone' => '+256700000000',
                'location' => 'Kampala', 'years_experience' => 5, 'skills' => ['SEO', 'Copywriting'],
                'education' => ['BA Marketing'], 'last_role' => 'Marketing Lead',
            ])]],
        ])]);

        $opening = $this->opening();

        // Step 1 — upload CV, get token + prefilled fields.
        $extract = $this->post('/api/careers/extract', [
            'cv' => UploadedFile::fake()->create('jane-cv.pdf', 30, 'application/pdf'),
        ])->assertOk();

        $token = $extract->json('cv_token');
        $this->assertNotNull($token);
        $extract->assertJsonPath('extracted.name', 'Jane Doe');

        // Step 2 — submit the application.
        $this->postJson('/api/careers/apply', [
            'cv_token' => $token, 'slug' => $opening->slug,
            'name' => 'Jane Doe', 'email' => 'jane@example.com', 'phone' => '+256700000000',
        ])->assertCreated();

        $app = JobApplication::first();
        $this->assertNotNull($app);
        $this->assertSame($opening->id, $app->job_opening_id);
        $this->assertSame('Marketing Lead', $app->extracted['last_role']);
        $this->assertNotNull($app->cv_path);
        Storage::disk('local')->assertExists($app->cv_path);
        Mail::assertSent(\App\Mail\ApplicationReceived::class);
    }

    public function test_extraction_is_skipped_gracefully_without_an_api_key(): void
    {
        Storage::fake('local');
        config(['services.anthropic.key' => null]);

        $res = $this->post('/api/careers/extract', [
            'cv' => UploadedFile::fake()->create('cv.pdf', 20, 'application/pdf'),
        ])->assertOk();

        $this->assertNotNull($res->json('cv_token'));   // upload still works
        $this->assertNull($res->json('extracted'));      // no AI fields
    }

    public function test_honeypot_blocks_application_creation(): void
    {
        $this->postJson('/api/careers/apply', [
            'website' => 'http://spam.example', // honeypot filled → no-op
            'cv_token' => 'x', 'name' => 'Bot', 'email' => 'bot@spam.example',
        ])->assertOk();

        $this->assertSame(0, JobApplication::count());
    }

    public function test_employees_cannot_access_admin_applications(): void
    {
        $employee = User::create(['name' => 'Emp', 'email' => 'e-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'employee']);
        $this->withHeader('Authorization', 'Bearer '.$employee->createToken('t')->plainTextToken)
            ->getJson('/api/admin/applications')
            ->assertForbidden();
    }

    public function test_purge_removes_applications_past_retention(): void
    {
        Storage::fake('local');
        $old = JobApplication::create(['name' => 'Old', 'email' => 'o@v.org', 'status' => 'new', 'cv_path' => 'applications/1/cv.pdf']);
        $old->forceFill(['created_at' => now()->subMonths(7)])->save();
        Storage::disk('local')->put('applications/'.$old->id.'/cv.pdf', 'data');

        $recent = JobApplication::create(['name' => 'Recent', 'email' => 'r@v.org', 'status' => 'new']);

        $this->artisan('applications:purge')->assertSuccessful();

        $this->assertNull(JobApplication::find($old->id));
        $this->assertNotNull(JobApplication::find($recent->id));
    }
}
