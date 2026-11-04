<?php

namespace App\Services\Payments;

use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Models\PaymentReceipt;
use App\Support\Audit;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Issues a receipt for every payment that lands on an invoice — when a senior
 * approves an offline payment, or when an online payment settles itself — and
 * voids it if that payment is later voided. A receipt is only ever issued for
 * money the books have accepted, never for a payment still awaiting approval.
 */
class PaymentReceipts
{
    /** Receipt for an approved invoice payment. Safe to call twice. */
    public function issueFor(FinanceTransaction $tx, bool $backfill = false): ?PaymentReceipt
    {
        if ($tx->source !== 'invoice' || ! $tx->source_id || $tx->status !== 'approved' || $tx->type !== 'income') {
            return null;
        }
        if ($existing = PaymentReceipt::where('finance_transaction_id', $tx->id)->first()) {
            return $existing;
        }
        $invoice = Invoice::find($tx->source_id);
        if (! $invoice) {
            return null;
        }

        return $this->issue(
            $invoice,
            (int) $tx->amount,
            $tx->payment_method,
            $tx->payment_reference,
            $tx->occurred_on,
            $tx,
            $backfill ? null : ($tx->approved_by ?? $tx->recorded_by),
        );
    }

    public function issue(
        Invoice $invoice,
        int $amount,
        ?string $method,
        ?string $reference,
        mixed $paidOn = null,
        ?FinanceTransaction $tx = null,
        ?int $issuedBy = null,
    ): PaymentReceipt {
        return DB::transaction(function () use ($invoice, $amount, $method, $reference, $paidOn, $tx, $issuedBy) {
            // What was paid before is what earlier, still-valid receipts say —
            // so a run of part payments always adds up on paper.
            $before = (int) PaymentReceipt::where('invoice_id', $invoice->id)->where('status', 'issued')->lockForUpdate()->sum('amount');

            $receipt = PaymentReceipt::create([
                'number'                 => PaymentReceipt::nextNumber(),
                'invoice_id'             => $invoice->id,
                'finance_transaction_id' => $tx?->id,
                'currency'               => $invoice->currency,
                'amount'                 => $amount,
                'paid_before'            => $before,
                'balance_after'          => max(0, (int) $invoice->total - $before - $amount),
                'payment_method'         => $method,
                'payment_reference'      => $reference,
                'paid_on'                => $paidOn ? Carbon::parse($paidOn)->toDateString() : now()->toDateString(),
                'status'                 => 'issued',
                'issued_by'              => $issuedBy,
            ]);

            Audit::log('receipt.issue', "Issued receipt {$receipt->number} for {$invoice->number} ({$invoice->currency} {$amount})", $receipt);

            return $receipt;
        });
    }

    /** The payment behind a receipt was voided — so is the receipt. */
    public function voidFor(FinanceTransaction $tx): void
    {
        PaymentReceipt::where('finance_transaction_id', $tx->id)->where('status', 'issued')->get()
            ->each(function (PaymentReceipt $r) {
                $r->update(['status' => 'void']);
                Audit::log('receipt.void', "Voided receipt {$r->number} (its payment was voided)", $r);
            });
    }
}
