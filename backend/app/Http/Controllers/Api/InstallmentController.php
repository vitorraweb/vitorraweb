<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InstallmentPayment;
use App\Models\InstallmentPlan;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Pay-in-parts plans for B2B orders. Staff record each part-payment as it's
 * received offline; the order's paid total and payment_status (pending →
 * partial → paid) update automatically. Slots into the provider-agnostic
 * payment design — pay-online-in-parts can be layered on when a gateway lands.
 */
class InstallmentController extends Controller
{
    /** The plan + schedule + money summary for an order (null plan if none). */
    public function show(Order $order): JsonResponse
    {
        return response()->json(['data' => $this->shape($order)]);
    }

    /** Create the plan and its schedule. One plan per order. */
    public function store(Request $request, Order $order): JsonResponse
    {
        if ($order->installmentPlan()->exists()) {
            return response()->json(['message' => 'This order already has a payment plan. Delete it first to start over.'], 422);
        }

        $data = $request->validate([
            'note'                  => ['nullable', 'string', 'max:1000'],
            'installments'          => ['required', 'array', 'min:1', 'max:24'],
            'installments.*.label'  => ['nullable', 'string', 'max:100'],
            'installments.*.amount' => ['required', 'integer', 'min:1'],
            'installments.*.due_date' => ['nullable', 'date'],
        ]);

        $plan = $order->installmentPlan()->create([
            'currency'   => $order->currency,
            'total'      => $order->total,
            'note'       => $data['note'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        foreach ($data['installments'] as $i => $row) {
            $plan->payments()->create([
                'label'     => $row['label'] ?? 'Instalment '.($i + 1),
                'amount'    => $row['amount'],
                'due_date'  => $row['due_date'] ?? null,
            ]);
        }

        $this->recompute($order->refresh());

        return response()->json(['data' => $this->shape($order)], 201);
    }

    /** Record a part-payment as received. */
    public function pay(Request $request, InstallmentPayment $installment): JsonResponse
    {
        $data = $request->validate([
            'method'    => ['nullable', Rule::in(InstallmentPayment::METHODS)],
            'reference' => ['nullable', 'string', 'max:255'],
            'paid_at'   => ['nullable', 'date'],
            'note'      => ['nullable', 'string', 'max:1000'],
        ]);

        $installment->update([
            'paid_at'     => $data['paid_at'] ?? now(),
            'method'      => $data['method'] ?? $installment->method,
            'reference'   => $data['reference'] ?? $installment->reference,
            'note'        => $data['note'] ?? $installment->note,
            'recorded_by' => $request->user()->id,
        ]);

        $order = $installment->plan->order;
        $this->recompute($order);

        return response()->json(['data' => $this->shape($order->refresh())]);
    }

    /** Reverse a recorded payment (correction). */
    public function unpay(InstallmentPayment $installment): JsonResponse
    {
        $installment->update(['paid_at' => null, 'method' => null, 'reference' => null, 'recorded_by' => null]);

        $order = $installment->plan->order;
        $this->recompute($order);

        return response()->json(['data' => $this->shape($order->refresh())]);
    }

    /** Delete the whole plan (to redo it). Leaves payment_status for manual edit. */
    public function destroy(Order $order): JsonResponse
    {
        $order->installmentPlan?->delete();

        return response()->json(['message' => 'Payment plan removed.']);
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    /** Drive the order's payment_status from how much of the plan is paid. */
    private function recompute(Order $order): void
    {
        $order->recomputeInstallmentStatus();
    }

    /** Plan + schedule + summary shape (shared by the admin endpoints). */
    private function shape(Order $order): array
    {
        $plan = $order->installmentPlan()->with('payments')->first();
        $paid = $plan ? $plan->paidAmount() : 0;

        return [
            'currency' => $order->currency,
            'total'    => (int) $order->total,
            'paid'     => $paid,
            'balance'  => max(0, (int) $order->total - $paid),
            'plan'     => $plan ? [
                'id'   => $plan->id,
                'note' => $plan->note,
                'payments' => $plan->payments->map(fn (InstallmentPayment $p) => [
                    'id'        => $p->id,
                    'label'     => $p->label,
                    'amount'    => $p->amount,
                    'due_date'  => optional($p->due_date)->toDateString(),
                    'paid'      => $p->paid_at !== null,
                    'paid_at'   => optional($p->paid_at)->toIso8601String(),
                    'method'    => $p->method,
                    'reference' => $p->reference,
                ])->all(),
            ] : null,
        ];
    }
}
