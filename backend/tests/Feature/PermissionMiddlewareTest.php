<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private function staff(string $role, ?string $department = null, ?array $permissions = null): User
    {
        return User::create([
            'name'        => ucfirst($role).' User',
            'email'       => $role.'-'.uniqid().'@vitorra.org',
            'password'    => 'password123',
            'role'        => $role,
            'department'  => $department,
            'permissions' => $permissions,
        ]);
    }

    public function test_admin_can_reach_any_module(): void
    {
        $this->actingAs($this->staff('admin'), 'sanctum')
            ->getJson('/api/admin/orders')->assertOk();
    }

    public function test_staff_with_the_module_in_their_department_passes(): void
    {
        // Marketing's default modules include blog but not orders.
        $marketing = $this->staff('ops', 'marketing');

        $this->actingAs($marketing, 'sanctum')->getJson('/api/admin/blog/posts')->assertOk();
    }

    public function test_staff_without_the_module_gets_403(): void
    {
        $marketing = $this->staff('ops', 'marketing');

        $this->actingAs($marketing, 'sanctum')->getJson('/api/admin/orders')->assertForbidden();
    }

    public function test_per_person_override_beats_department_default(): void
    {
        // Finance normally has no blog access; grant it explicitly.
        $finance = $this->staff('ops', 'finance', ['orders', 'blog']);

        $this->actingAs($finance, 'sanctum')->getJson('/api/admin/blog/posts')->assertOk();
        // And the override list (without prospects) blocks prospects.
        $this->actingAs($finance, 'sanctum')->getJson('/api/admin/prospects')->assertForbidden();
    }

    public function test_dashboard_is_always_available_to_staff(): void
    {
        $sales = $this->staff('ops', 'sales');

        $this->actingAs($sales, 'sanctum')->getJson('/api/admin/stats')->assertOk();
    }

    public function test_customers_cannot_reach_admin_at_all(): void
    {
        $this->actingAs($this->staff('customer'), 'sanctum')
            ->getJson('/api/admin/orders')->assertForbidden();
    }

    public function test_effective_permissions_resolution(): void
    {
        $this->assertContains('orders', $this->staff('admin')->effectivePermissions());
        $marketing = $this->staff('ops', 'marketing')->effectivePermissions();
        $this->assertContains('blog', $marketing);
        $this->assertNotContains('orders', $marketing);
        $this->assertContains('dashboard', $marketing);
    }
}
