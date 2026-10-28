<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\CustomerNote;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PurgeTestLeadsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Storage::fake('public');
        User::create(['name' => 'John Oluwaseyi', 'email' => 'john@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'admin']);
        User::create(['name' => 'Thurayya Nakayima', 'email' => 'thurayya@vitorra.org', 'password' => 'changeme123changeme', 'role' => 'ops']);
        User::create(['name' => 'Real Customer', 'email' => 'buyer@fleet.ug', 'password' => 'changeme123changeme', 'role' => 'customer']);
    }

    private function enquiry(string $name, string $email): Enquiry
    {
        return Enquiry::create(['name' => $name, 'email' => $email, 'country' => 'Uganda', 'message' => 'Hi', 'status' => 'new']);
    }

    private function order(string $name, string $email): Order
    {
        return Order::create(['reference' => 'VH-'.uniqid(), 'customer_name' => $name, 'customer_email' => $email, 'currency' => 'UGX',
            'subtotal' => 1, 'total' => 1, 'status' => 'pending', 'payment_status' => 'pending', 'shipping_address' => []]);
    }

    private function seedFeeds(): array
    {
        return [
            'staffEmail'   => $this->enquiry('Anything', 'John@Vitorra.org'),
            'domain'       => $this->enquiry('Someone', 'sales@vitorra.org'),
            'gmail'        => $this->order('J O', 'leojohnseyi@gmail.com'),
            'fullName'     => $this->order('Thurayya Nakayima', 'thurayya.test@gmail.com'),
            'message'      => ContactMessage::create(['name' => 'John Oluwaseyi', 'email' => 'johngraphics@gmail.com', 'subject' => 'Test', 'message' => 'test']),
            'firstOnly'    => $this->enquiry('John', 'john.k@example.com'),
            'customer'     => $this->enquiry('Kampala Haulage', 'buyer@fleet.ug'),
            'customerJohn' => $this->enquiry('John Mukasa', 'jm@haulage.ug'),
        ];
    }

    public function test_listing_deletes_nothing(): void
    {
        $this->seedFeeds();

        $this->artisan('leads:purge-test', ['--email' => ['leojohnseyi@gmail.com']])->assertSuccessful();

        $this->assertSame(5, Enquiry::count());
        $this->assertSame(2, Order::count());
        $this->assertSame(1, ContactMessage::count());
    }

    public function test_force_removes_staff_records_and_keeps_customers(): void
    {
        $r = $this->seedFeeds();
        CustomerNote::create(['email' => 'leojohnseyi@gmail.com']);
        CustomerNote::create(['email' => 'buyer@fleet.ug']);

        $this->artisan('leads:purge-test', ['--email' => ['leojohnseyi@gmail.com'], '--force' => true])->assertSuccessful();

        $this->assertEqualsCanonicalizing(
            [$r['firstOnly']->id, $r['customer']->id, $r['customerJohn']->id],
            Enquiry::pluck('id')->all(),
        );
        $this->assertSame(0, Order::count());
        $this->assertSame(0, ContactMessage::count());
        // Test address gone from the customer directory; the customer stays.
        $this->assertSame(['buyer@fleet.ug'], CustomerNote::pluck('email')->all());
        $this->assertCount(1, Storage::disk('local')->files('purge-backups'));
    }

    public function test_first_name_only_needs_its_own_flag(): void
    {
        $r = $this->seedFeeds();

        $this->artisan('leads:purge-test', ['--force' => true, '--include-first-names' => true])->assertSuccessful();

        $this->assertNull(Enquiry::find($r['firstOnly']->id));
        $this->assertNotNull(Enquiry::find($r['customerJohn']->id), 'a different John is a customer');
        $this->assertNotNull(Enquiry::find($r['customer']->id));
    }
}
