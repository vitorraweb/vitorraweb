<?php

namespace Tests\Feature;

use App\Models\Prospect;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

/**
 * Marketing's coffee customer book goes into the system as its own list
 * (product COFFEE), straight from the Excel file they keep it in.
 */
class CoffeeCustomerImportTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): self
    {
        $user = User::create([
            'name' => 'Admin', 'email' => 'a-'.uniqid().'@vitorra.org',
            'password' => 'changeme123', 'role' => 'admin',
        ]);

        return $this->withHeader('Authorization', 'Bearer '.$user->createToken('t')->plainTextToken);
    }

    /** A workbook laid out the way marketing keeps it: title row, a No. column. */
    private function workbook(array $rows): UploadedFile
    {
        $book = new Spreadsheet;
        $book->getActiveSheet()->fromArray($rows, null, 'A1', true);
        $path = tempnam(sys_get_temp_dir(), 'coffee').'.xlsx';
        (new Xlsx($book))->save($path);

        return new UploadedFile($path, 'coffee-customers.xlsx', null, null, true);
    }

    public function test_an_excel_customer_list_imports_onto_the_coffee_list_as_customers(): void
    {
        $file = $this->workbook([
            ['Vitorra coffee customers 2026'],
            ['No.', 'Customer name', 'Phone', 'Email', 'Location'],
            [1, 'Java House Acacia', '0772123456', 'acacia@javahouse.test', 'Kampala'],
            [2, 'Sheraton Kampala', '0414420000', 'fnb@sheraton.test', 'Kampala'],
        ]);

        $this->admin()->post('/api/admin/prospects/import', [
            'file' => $file, 'product' => 'COFFEE', 'category' => 'CAFE_RESTAURANT',
            'existing_customers' => '1',
        ])->assertOk()->assertJsonPath('imported', 2);

        $java = Prospect::where('name', 'Java House Acacia')->firstOrFail();
        $this->assertSame('COFFEE', $java->product);
        $this->assertSame('acacia@javahouse.test', $java->email);
        $this->assertSame('0772123456', $java->phone);
        $this->assertSame('Kampala', $java->location);
        $this->assertSame('converted', $java->outreach_status);
    }

    public function test_a_csv_lead_list_imports_as_not_contacted(): void
    {
        $csv = UploadedFile::fake()->createWithContent(
            'leads.csv',
            "Company,Email,Phone\nCafe Javas Ntinda,ntinda@cafejavas.test,0700111222\n"
        );

        $this->admin()->post('/api/admin/prospects/import', [
            'file' => $csv, 'product' => 'COFFEE', 'category' => 'CAFE_RESTAURANT',
        ])->assertOk()->assertJsonPath('imported', 1);

        $this->assertSame('not_contacted', Prospect::first()->outreach_status);
    }

    public function test_reimporting_the_same_list_skips_existing_rows(): void
    {
        $rows = [['Name', 'Email'], ['Kampala Serena', 'fnb@serena.test']];

        $this->admin()->post('/api/admin/prospects/import', [
            'file' => $this->workbook($rows), 'product' => 'COFFEE', 'category' => 'HOTEL',
        ])->assertJsonPath('imported', 1);

        $this->app['auth']->forgetGuards();
        $this->admin()->post('/api/admin/prospects/import', [
            'file' => $this->workbook($rows), 'product' => 'COFFEE', 'category' => 'HOTEL',
        ])->assertJsonPath('imported', 0)->assertJsonPath('skipped', 1);
    }

    public function test_go4worldbusiness_buyers_import_onto_the_coffee_list(): void
    {
        $this->admin()->post('/api/admin/prospects/import', [
            'file' => $this->workbook([['Company', 'Email', 'Country'], ['Hamburg Roasters GmbH', 'buy@roasters.test', 'Germany']]),
            'product' => 'COFFEE', 'category' => 'GO4WORLD',
        ])->assertOk()->assertJsonPath('imported', 1);

        $this->assertSame('GO4WORLD', Prospect::first()->category);
    }

    public function test_a_coffee_list_cannot_be_filed_under_an_fet_industry(): void
    {
        $this->admin()->post('/api/admin/prospects/import', [
            'file' => $this->workbook([['Name', 'Email'], ['X', 'x@x.test']]),
            'product' => 'COFFEE', 'category' => 'CARGO',
        ])->assertStatus(422);
    }

    public function test_the_coffee_list_filters_separately(): void
    {
        Prospect::create(['name' => 'Truck Co', 'category' => 'CARGO', 'product' => 'FET', 'outreach_status' => 'not_contacted']);
        Prospect::create(['name' => 'Cafe', 'category' => 'CAFE_RESTAURANT', 'product' => 'COFFEE', 'outreach_status' => 'converted']);

        $this->admin()->getJson('/api/admin/prospects?product=COFFEE')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Cafe');
    }
}
