<?php

namespace Tests\Feature;

use App\Mail\FetSavingsDigest;
use App\Models\FetInstallation;
use App\Models\User;
use App\Services\FetSavingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class FetSavingsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): string
    {
        $u = User::create(['name' => 'A', 'email' => 'a@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);

        return $u->createToken('t', ['admin', 'staff'])->plainTextToken;
    }

    public function test_service_computes_brim_to_brim_savings(): void
    {
        // Baseline 10 l/100km; after install, 1000 km on 85 litres (8.5 l/100km) → 15% cut.
        $install = FetInstallation::create([
            'reference' => 'FET-INST-2026-0001', 'customer_name' => 'Fleet Co',
            'tier' => 'suv', 'currency' => 'UGX', 'baseline_l_per_100' => 10, 'baseline_source' => 'declared',
        ]);
        // First fill sets the starting full tank; subsequent fills count toward distance.
        $install->fuelLogs()->createMany([
            ['logged_on' => '2026-06-01', 'odometer_km' => 10000, 'litres' => 50, 'cost' => 250000, 'phase' => 'after'],
            ['logged_on' => '2026-06-10', 'odometer_km' => 10500, 'litres' => 42, 'cost' => 210000, 'phase' => 'after'],
            ['logged_on' => '2026-06-20', 'odometer_km' => 11000, 'litres' => 43, 'cost' => 215000, 'phase' => 'after'],
        ]);

        $s = app(FetSavingsService::class)->summary($install->fresh());

        // 85 litres over 1000 km = 8.5 l/100km.
        $this->assertEqualsWithDelta(8.5, $s['measured_l_per_100'], 0.01);
        $this->assertEqualsWithDelta(15.0, $s['reduction_pct'], 0.1);
        $this->assertEquals(1000, $s['distance_km']);
        // (10 - 8.5)/100 * 1000 = 15 litres saved.
        $this->assertEqualsWithDelta(15.0, $s['litres_saved'], 0.1);
        $this->assertTrue($s['has_enough_data']);
        // Money saved uses avg price ≈ 5000 UGX/litre → ~75,000.
        $this->assertEqualsWithDelta(75000, $s['money_saved'], 1500);
    }

    public function test_insufficient_data_is_flagged_not_errored(): void
    {
        $install = FetInstallation::create([
            'reference' => 'FET-INST-2026-0002', 'customer_name' => 'Solo',
            'tier' => 'car', 'currency' => 'UGX',
        ]);
        $install->fuelLogs()->create(['logged_on' => '2026-06-01', 'odometer_km' => 5000, 'litres' => 40, 'phase' => 'after']);

        $s = app(FetSavingsService::class)->summary($install->fresh());
        $this->assertFalse($s['has_enough_data']);
        $this->assertNull($s['measured_l_per_100']);
        // Falls back to the segment baseline for 'car' (7.5).
        $this->assertEqualsWithDelta(7.5, $s['baseline_l_per_100'], 0.01);
    }

    public function test_admin_can_create_installation_and_log_fuel(): void
    {
        $token = $this->admin();

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/fet', [
                'customer_name' => 'Test Customer', 'customer_email' => 'cust@example.com',
                'tier' => 'car', 'currency' => 'UGX', 'registration' => 'UAX 123A',
            ])->assertCreated();

        $ref = $create->json('data.reference');
        $this->assertStringStartsWith('FET-INST-', $ref);
        // Device model auto-filled from the tier.
        $this->assertEquals('FET-PRO-FI', $create->json('data.device_model'));

        $id = $create->json('data.id');
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/fet/{$id}/logs", ['logged_on' => '2026-06-01', 'odometer_km' => 1000, 'litres' => 40])
            ->assertCreated();

        // Number plate is encrypted at rest.
        $this->assertDatabaseMissing('fet_installations', ['registration' => 'UAX 123A']);
        $this->assertSame('UAX 123A', FetInstallation::find($id)->registration);
    }

    public function test_customer_sees_only_their_own_installations(): void
    {
        FetInstallation::create(['reference' => 'FET-INST-2026-0010', 'customer_name' => 'Mine', 'customer_email' => 'me@example.com', 'tier' => 'car', 'currency' => 'UGX']);
        FetInstallation::create(['reference' => 'FET-INST-2026-0011', 'customer_name' => 'Other', 'customer_email' => 'other@example.com', 'tier' => 'car', 'currency' => 'UGX']);

        $customer = User::create(['name' => 'Me', 'email' => 'me@example.com', 'password' => 'changeme123changeme', 'role' => 'customer']);
        $token = $customer->createToken('t', ['customer'])->plainTextToken;

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/account/fet')->assertOk();

        $this->assertCount(1, $res->json('data'));
        $this->assertEquals('FET-INST-2026-0010', $res->json('data.0.reference'));
        // Customer payload omits internal fields.
        $this->assertArrayNotHasKey('notes', $res->json('data.0'));
    }

    public function test_customer_can_log_a_fillup_for_their_vehicle(): void
    {
        FetInstallation::create(['reference' => 'FET-INST-2026-0020', 'customer_name' => 'Me', 'customer_email' => 'me@example.com', 'tier' => 'car', 'currency' => 'UGX']);
        $customer = User::create(['name' => 'Me', 'email' => 'me@example.com', 'password' => 'changeme123changeme', 'role' => 'customer']);
        $token = $customer->createToken('t', ['customer'])->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/account/fet/FET-INST-2026-0020/logs', ['logged_on' => '2026-06-01', 'odometer_km' => 2000, 'litres' => 35])
            ->assertCreated();

        $this->assertDatabaseHas('fet_fuel_logs', ['odometer_km' => 2000, 'source' => 'customer', 'phase' => 'after']);
    }

    /** A vehicle with three after-readings spanning 1000 km at ~8.5 l/100km. */
    private function installWithData(string $ref, string $currency, string $email = null): FetInstallation
    {
        $i = FetInstallation::create([
            'reference' => $ref, 'customer_name' => 'Fleet Co', 'customer_email' => $email,
            'tier' => 'suv', 'currency' => $currency, 'baseline_l_per_100' => 10, 'baseline_source' => 'declared',
        ]);
        $i->fuelLogs()->createMany([
            ['logged_on' => now()->subDays(20)->toDateString(), 'odometer_km' => 10000, 'litres' => 50, 'cost' => 250000, 'phase' => 'after'],
            ['logged_on' => now()->subDays(10)->toDateString(), 'odometer_km' => 10500, 'litres' => 42, 'cost' => 210000, 'phase' => 'after'],
            ['logged_on' => now()->subDays(2)->toDateString(),  'odometer_km' => 11000, 'litres' => 43, 'cost' => 215000, 'phase' => 'after'],
        ]);

        return $i;
    }

    public function test_fleet_rollup_separates_money_by_currency_and_totals_physical_units(): void
    {
        $svc = app(FetSavingsService::class);
        $ugx = $this->installWithData('FET-INST-2026-0030', 'UGX');
        $usd = $this->installWithData('FET-INST-2026-0031', 'USD');

        $fleet = $svc->fleetFromSummaries([$svc->summary($ugx), $svc->summary($usd)]);

        $this->assertEquals(2, $fleet['vehicles']);
        $this->assertEquals(2, $fleet['vehicles_with_data']);
        // Money never crosses currencies.
        $this->assertArrayHasKey('UGX', $fleet['by_currency']);
        $this->assertArrayHasKey('USD', $fleet['by_currency']);
        // Litres + CO₂ are physical units → they total across both vehicles (15 L each).
        $this->assertEqualsWithDelta(30.0, $fleet['total_litres_saved'], 0.2);
        // Both reduced 15% over equal distance → weighted average 15%.
        $this->assertEqualsWithDelta(15.0, $fleet['avg_reduction_pct'], 0.1);
    }

    public function test_digest_emails_customers_with_data_or_overdue_readings_only(): void
    {
        Mail::fake();

        // A: has measured data (recent readings) → savings email.
        $this->installWithData('FET-INST-2026-0040', 'UGX', 'a@example.com');
        // B: an install with no readings at all → overdue nudge.
        FetInstallation::create(['reference' => 'FET-INST-2026-0041', 'customer_name' => 'Bee', 'customer_email' => 'b@example.com', 'tier' => 'car', 'currency' => 'UGX']);
        // C: one recent reading — not overdue, not enough data → no email.
        $c = FetInstallation::create(['reference' => 'FET-INST-2026-0042', 'customer_name' => 'Cee', 'customer_email' => 'c@example.com', 'tier' => 'car', 'currency' => 'UGX']);
        $c->fuelLogs()->create(['logged_on' => now()->subDay()->toDateString(), 'odometer_km' => 100, 'litres' => 30, 'phase' => 'after']);

        $this->artisan('fet:digest')->assertExitCode(0);

        Mail::assertSent(FetSavingsDigest::class, fn ($m) => $m->hasTo('a@example.com') && $m->hasData);
        Mail::assertSent(FetSavingsDigest::class, fn ($m) => $m->hasTo('b@example.com') && $m->reminder);
        Mail::assertNotSent(FetSavingsDigest::class, fn ($m) => $m->hasTo('c@example.com'));
        Mail::assertSent(FetSavingsDigest::class, 2);
    }
}
