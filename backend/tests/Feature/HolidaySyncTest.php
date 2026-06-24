<?php

namespace Tests\Feature;

use App\Models\PublicHoliday;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HolidaySyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_syncs_holidays_from_nager(): void
    {
        Http::fake([
            'date.nager.at/*' => Http::response([
                ['date' => '2027-01-01', 'name' => "New Year's Day", 'fixed' => true],
                ['date' => '2027-06-09', 'name' => 'Heroes Day', 'fixed' => true],
            ]),
        ]);

        $this->artisan('holidays:sync 2027')->assertSuccessful();

        $this->assertTrue(PublicHoliday::where('name', "New Year's Day")->whereDate('date', '2027-01-01')->where('source', 'Nager.Date')->exists());
        $this->assertTrue(PublicHoliday::where('name', 'Heroes Day')->whereDate('date', '2027-06-09')->exists());
    }

    public function test_is_idempotent_and_preserves_manual_entries(): void
    {
        // A manually-added company entry that must survive the sync untouched.
        PublicHoliday::create(['name' => 'Company Retreat', 'date' => '2027-03-15', 'source' => 'manual']);

        Http::fake([
            'date.nager.at/*' => Http::response([
                ['date' => '2027-01-01', 'name' => "New Year's Day", 'fixed' => true],
            ]),
        ]);

        $this->artisan('holidays:sync 2027')->assertSuccessful();
        $this->artisan('holidays:sync 2027')->assertSuccessful(); // run twice

        $this->assertSame(1, PublicHoliday::where('name', "New Year's Day")->count());
        $this->assertDatabaseHas('public_holidays', ['name' => 'Company Retreat', 'source' => 'manual']);
    }

    public function test_survives_unreachable_api(): void
    {
        Http::fake(['date.nager.at/*' => Http::response([], 500)]);

        $this->artisan('holidays:sync 2027')->assertSuccessful();
    }
}
