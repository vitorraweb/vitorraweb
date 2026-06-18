<?php

namespace Tests\Feature;

use App\Models\InstallmentPlan;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallmentTest extends TestCase
{
    use RefreshDatabase;

    private function order(int $total = 90000, string $email = 'biz@v.org'): Order
    {
        return Order::create([
            'reference' => 'INST-'.uniqid(), 'currency' => 'UGX',
            'subtotal' => $total, 'total' => $total, 'status' => 'pending', 'payment_status' => 'pending',
            'customer_email' => $email, 'customer_name' => 'Biz Co', 'shipping_address' => ['country' => 'Uganda'],
        ]);
    }

    private function admin(): User
    {
        return User::create(['name' => 'A', 'email' => 'a-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'admin']);
    }

    public function test_recording_part_payments_drives_payment_status(): void
    {
        $order = $this->order(90000);
        $token = $this->admin()->createToken('t')->plainTextToken;
        $h = ['Authorization' => "Bearer {$token}"];

        $res = $this->withHeaders($h)->postJson("/api/admin/orders/{$order->id}/installments", [
            'installments' => [['amount' => 30000], ['amount' => 30000], ['amount' => 30000]],
        ])->assertCreated();

        $ids = collect($res->json('data.plan.payments'))->pluck('id');
        $this->assertSame('pending', $order->fresh()->payment_status);

        $this->withHeaders($h)->postJson("/api/admin/installments/{$ids[0]}/pay")->assertOk();
        $this->assertSame('partial', $order->fresh()->payment_status);

        $this->withHeaders($h)->postJson("/api/admin/installments/{$ids[1]}/pay")->assertOk();
        $this->withHeaders($h)->postJson("/api/admin/installments/{$ids[2]}/pay")->assertOk();
        $this->assertSame('paid', $order->fresh()->payment_status);

        // Reversing a payment drops it back to partial.
        $this->withHeaders($h)->postJson("/api/admin/installments/{$ids[2]}/unpay")->assertOk();
        $this->assertSame('partial', $order->fresh()->payment_status);
    }

    public function test_a_plan_cannot_be_created_twice(): void
    {
        $order = $this->order();
        $token = $this->admin()->createToken('t')->plainTextToken;
        $h = ['Authorization' => "Bearer {$token}"];

        $this->withHeaders($h)->postJson("/api/admin/orders/{$order->id}/installments", ['installments' => [['amount' => 90000]]])->assertCreated();
        $this->withHeaders($h)->postJson("/api/admin/orders/{$order->id}/installments", ['installments' => [['amount' => 90000]]])->assertStatus(422);
    }

    public function test_employees_cannot_manage_installments(): void
    {
        $order = $this->order();
        $employee = User::create(['name' => 'E', 'email' => 'e-'.uniqid().'@v.org', 'password' => 'changeme123', 'role' => 'employee']);

        $this->withHeader('Authorization', 'Bearer '.$employee->createToken('t')->plainTextToken)
            ->getJson("/api/admin/orders/{$order->id}/installments")
            ->assertForbidden();
    }

    public function test_customer_sees_their_payment_plan_in_the_portal(): void
    {
        $customer = User::create(['name' => 'Biz', 'email' => 'biz@v.org', 'password' => 'changeme123', 'role' => 'customer']);
        $order = $this->order(60000, 'biz@v.org');

        $plan = InstallmentPlan::create(['order_id' => $order->id, 'currency' => 'UGX', 'total' => 60000]);
        $plan->payments()->create(['label' => 'Deposit', 'amount' => 30000, 'paid_at' => now()]);
        $plan->payments()->create(['label' => 'Balance', 'amount' => 30000]);

        $this->withHeader('Authorization', 'Bearer '.$customer->createToken('t')->plainTextToken)
            ->getJson("/api/account/orders/{$order->reference}")
            ->assertOk()
            ->assertJsonPath('data.installment_plan.paid', 30000)
            ->assertJsonPath('data.installment_plan.balance', 30000)
            ->assertJsonCount(2, 'data.installment_plan.payments');
    }
}
