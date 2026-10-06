<?php

namespace Tests\Feature;

use App\Models\Enquiry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnquirySearchTest extends TestCase
{
    use RefreshDatabase;

    private function headers(): array
    {
        $admin = User::create(['name' => 'Admin', 'email' => 'a-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);

        return ['Authorization' => 'Bearer '.$admin->createToken('t', ['admin'])->plainTextToken];
    }

    private function make(string $name, string $email, ?string $company = null): void
    {
        Enquiry::create(['name' => $name, 'email' => $email, 'company' => $company, 'country' => 'Uganda', 'message' => 'Hi', 'status' => 'new']);
    }

    public function test_search_matches_name_email_or_company(): void
    {
        $this->make('Jane Customer', 'jane@example.com');
        $this->make('Paul Fleet', 'paul@fleet.ug', 'Kampala Haulage');
        $this->make('Other', 'other@example.com');
        $h = $this->headers();

        $this->withHeaders($h)->getJson('/api/admin/enquiries?q=jane')->assertOk()->assertJsonCount(1, 'data');
        $this->withHeaders($h)->getJson('/api/admin/enquiries?q=haulage')->assertOk()->assertJsonPath('data.0.name', 'Paul Fleet');
        $this->withHeaders($h)->getJson('/api/admin/enquiries?q=example.com')->assertOk()->assertJsonCount(2, 'data');
        $this->withHeaders($h)->getJson('/api/admin/enquiries')->assertOk()->assertJsonPath('total', 3);
    }

    public function test_like_wildcards_in_the_query_are_literal(): void
    {
        $this->make('Jane Customer', 'jane@example.com');

        $this->withHeaders($this->headers())->getJson('/api/admin/enquiries?q=%25')->assertOk()->assertJsonCount(0, 'data');
    }
}
