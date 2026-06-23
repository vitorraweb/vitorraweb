<?php

namespace App\Http\Controllers\Api;

use App\Contracts\PaymentGateway;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;

/**
 * Public, token-gated "view & pay your invoice" flow. The link lives in the
 * invoice email; no login needed. Online payment is offered only for UGX/USD
 * invoices that are still owing (Pesapal can't settle EUR).
 */
class InvoicePaymentController extends Controller
{
    public function __construct(private readonly PaymentGateway $gateway) {}

    /** The invoice behind a public pay link (for the customer-facing pay page). */
    public function show(string $token): JsonResponse
    {
        $invoice = Invoice::with('items')->where('public_token', $token)->firstOrFail();

        return response()->json(['data' => $this->shape($invoice)]);
    }

    /** Start an online payment for this invoice → returns a Pesapal redirect URL. */
    public function pay(string $token): JsonResponse
    {
        $invoice = Invoice::where('public_token', $token)->firstOrFail();

        if ($invoice->payableIsPaid()) {
            return response()->json(['data' => ['status' => 'paid', 'redirect_url' => null], 'message' => 'This invoice is already paid.']);
        }

        if (! $invoice->isOnlinePayable()) {
            return response()->json([
                'message' => 'This invoice can’t be paid online. Please contact us to settle it.',
            ], 422);
        }

        $result = $this->gateway->initiate($invoice);

        // Only a redirect means online payment actually started (e.g. driver=pesapal);
        // the manual driver returns "pending" — treat that as unavailable here.
        if (($result['status'] ?? null) !== 'redirect') {
            return response()->json([
                'message' => 'Online payment isn’t available right now. Please contact us to pay another way.',
            ], 422);
        }

        return response()->json(['data' => $result, 'message' => $result['message'] ?? 'Payment initiated.']);
    }

    /** Reconcile with the provider on demand (polled by the pay page after return). */
    public function status(string $token): JsonResponse
    {
        $invoice = Invoice::where('public_token', $token)->firstOrFail();

        if (! $invoice->payableIsPaid()) {
            $this->gateway->verify($invoice->number);
            $invoice->refresh();
        }

        return response()->json([
            'data' => [
                'number'         => $invoice->number,
                'status'         => $invoice->status,
                'payment_status' => $invoice->payableIsPaid() ? 'paid' : 'pending',
                'balance'        => $invoice->balance(),
            ],
        ]);
    }

    /** Public projection of an invoice — the customer's own data, no internal fields. */
    private function shape(Invoice $i): array
    {
        return [
            'number'         => $i->number,
            'customer_name'  => $i->customer_name,
            'currency'       => $i->currency,
            'issue_date'     => optional($i->issue_date)->toDateString(),
            'due_date'       => optional($i->due_date)->toDateString(),
            'subtotal'       => $i->subtotal,
            'vat_total'      => $i->vat_total,
            'total'          => $i->total,
            'amount_paid'    => $i->amount_paid,
            'balance'        => $i->balance(),
            'status'         => $i->status,
            'is_overdue'     => $i->isOverdue(),
            'online_payable' => $i->isOnlinePayable(),
            'notes'          => $i->notes,
            'terms'          => $i->terms,
            'items'          => $i->items->map(fn ($it) => [
                'description'   => $it->description,
                'quantity'      => $it->quantity,
                'unit_price'    => $it->unit_price,
                'vat_rate'      => $it->vat_rate,
                'line_subtotal' => $it->line_subtotal,
                'vat_amount'    => $it->vat_amount,
                'line_total'    => $it->line_total,
            ])->all(),
        ];
    }
}
