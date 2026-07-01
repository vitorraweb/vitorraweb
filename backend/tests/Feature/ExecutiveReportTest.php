<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use App\Services\ExecutiveReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ExecutiveReportTest extends TestCase
{
    use RefreshDatabase;

    private function paidOrder(int $total, string $when): void
    {
        $o = Order::create([
            'reference' => 'EXE-'.uniqid(), 'currency' => 'UGX',
            'subtotal' => $total, 'total' => $total,
            'status' => 'complete', 'payment_status' => 'paid',
            'customer_email' => 'c@v.org', 'customer_name' => 'C',
            'shipping_address' => ['country' => 'Uganda'],
        ]);
        $o->forceFill(['created_at' => $when])->save();
    }

    public function test_summary_computes_period_over_period_revenue_delta(): void
    {
        // Current month-to-date vs the same point last month. Mirror the
        // service's own "days elapsed this month" instead of a hardcoded +2 —
        // hardcoding overshoots past now() (and out of the mtd window) when
        // the suite runs on the 1st/2nd of a month.
        $daysElapsed = now()->startOfMonth()->diffInDays(now());
        $this->paidOrder(100000, now()->startOfMonth()->addDays($daysElapsed)->toDateTimeString());
        $this->paidOrder(50000, now()->subMonthNoOverflow()->startOfMonth()->addDays($daysElapsed)->toDateTimeString());

        $summary = app(ExecutiveReportService::class)->summary('mtd');

        $this->assertSame(100000, $summary['revenue']['UGX']['current']);
        $this->assertSame(50000, $summary['revenue']['UGX']['previous']);
        $this->assertSame(100, $summary['revenue']['UGX']['delta_pct']); // +100%
    }

    public function test_outstanding_reflects_unpaid_orders(): void
    {
        Order::create([
            'reference' => 'OWE-'.uniqid(), 'currency' => 'UGX',
            'subtotal' => 30000, 'total' => 30000, 'status' => 'pending', 'payment_status' => 'pending',
            'customer_email' => 'c@v.org', 'customer_name' => 'C',
            'shipping_address' => ['country' => 'Uganda'],
        ]);

        $summary = app(ExecutiveReportService::class)->summary('mtd');
        $this->assertSame(30000, $summary['outstanding']['UGX']);
    }

    public function test_admin_can_view_the_executive_summary(): void
    {
        $admin = User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'admin']);
        $this->withHeader('Authorization', 'Bearer '.$admin->createToken('t')->plainTextToken)
            ->getJson('/api/admin/executive/summary')
            ->assertOk()
            ->assertJsonStructure(['data' => ['revenue', 'orders', 'outstanding', 'conversion_rate']]);
    }

    public function test_ops_without_the_executive_module_is_forbidden(): void
    {
        $ops = User::create(['name' => 'O', 'email' => 'o-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'ops', 'department' => 'operations']);
        $this->withHeader('Authorization', 'Bearer '.$ops->createToken('t')->plainTextToken)
            ->getJson('/api/admin/executive/summary')
            ->assertForbidden();
    }

    public function test_report_command_emails_configured_recipients(): void
    {
        Mail::fake();
        Setting::put(['exec_report_to' => 'ceo@vitorra.org', 'exec_report_cc' => 'ops@vitorra.org, finance@vitorra.org']);

        $this->artisan('executive:report --period=mtd')->assertSuccessful();

        Mail::assertSent(\App\Mail\ExecutiveReport::class, function ($mail) {
            return $mail->hasTo('ceo@vitorra.org') && $mail->hasCc('ops@vitorra.org') && $mail->hasCc('finance@vitorra.org');
        });
    }
}
