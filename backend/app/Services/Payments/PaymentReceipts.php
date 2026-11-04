<?php

namespace App\Services\Payments;

use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Models\PaymentReceipt;
use App\Models\Quotation;
use App\Support\Audit;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Issues a receipt for every customer payment, and voids it if the payment
 * is voided.
 *
 *  - Against an order confirmation / quotation (Sales): issued the moment
 *    Finance records the payment — typically the deposit, before any invoice
 *    exists. The money still goes to the books as a draft for approval.
 *  - Against an invoice: issued when a senior approves the payment, or when
 *    an online payment settles itself.
 *
 * When an order becomes an invoice, its receipts are linked to that invoice
 * and the amount counts as already paid on it.
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

    /** What is still owed on an order, after the receipts already issued. */
    public function orderBalance(Quotation $order): int
    {
        return max(0, (int) $order->total - (int) PaymentReceipt::where('quotation_id', $order->id)->where('status', 'issued')->sum('amount'));
    }

    /** Receipt for money received against an order confirmation / quotation. */
    public function issueForOrder(
        Quotation $order,
        int $amount,
        ?string $method,
        ?string $reference,
        mixed $paidOn = null,
        ?FinanceTransaction $tx = null,
        ?int $issuedBy = null,
    ): PaymentReceipt {
        return DB::transaction(function () use ($order, $amount, $method, $reference, $paidOn, $tx, $issuedBy) {
            $before = (int) PaymentReceipt::where('quotation_id', $order->id)->where('status', 'issued')->lockForUpdate()->sum('amount');

            // If the order has already been invoiced, the money lands on that
            // invoice as well, so the invoice never asks for it again.
            $invoice = $order->invoices()->whereNotIn('status', ['void'])->orderBy('id')->first();

            $receipt = PaymentReceipt::create([
                'number'                 => PaymentReceipt::nextNumber(),
                'quotation_id'           => $order->id,
                'invoice_id'             => $invoice?->id,
                'finance_transaction_id' => $tx?->id,
                'currency'               => $order->currency,
                'amount'                 => $amount,
                'paid_before'            => $before,
                'balance_after'          => max(0, (int) $order->total - $before - $amount),
                'payment_method'         => $method,
                'payment_reference'      => $reference,
                'paid_on'                => $paidOn ? Carbon::parse($paidOn)->toDateString() : now()->toDateString(),
                'status'                 => 'issued',
                'issued_by'              => $issuedBy,
            ]);
            if ($invoice) {
                $this->adjustInvoicePaid($invoice, $amount);
            }

            Audit::log('receipt.issue', "Issued receipt {$receipt->number} for {$order->number} ({$order->currency} {$amount})", $receipt);

            return $receipt;
        });
    }

    /**
     * An order has just become an invoice: link the order's receipts that
     * are not on an invoice yet, and count them as paid on it.
     */
    public function carryToInvoice(Quotation $order, Invoice $invoice): int
    {
        $receipts = PaymentReceipt::where('quotation_id', $order->id)->whereNull('invoice_id')->where('status', 'issued')->get();
        if ($receipts->isEmpty()) {
            return 0;
        }
        PaymentReceipt::whereIn('id', $receipts->pluck('id'))->update(['invoice_id' => $invoice->id]);
        $sum = (int) $receipts->sum('amount');
        $this->adjustInvoicePaid($invoice, $sum);

        return $sum;
    }

    /**
     * The payment behind a receipt was voided — so is the receipt. An order
     * receipt that had been carried onto an invoice is taken off it again
     * (invoice payments are reversed by the books themselves).
     */
    public function voidFor(FinanceTransaction $tx): void
    {
        PaymentReceipt::where('finance_transaction_id', $tx->id)->where('status', 'issued')->get()
            ->each(function (PaymentReceipt $r) {
                $r->update(['status' => 'void']);
                if ($r->quotation_id && $r->invoice) {
                    $this->adjustInvoicePaid($r->invoice, -$r->amount);
                }
                Audit::log('receipt.void', "Voided receipt {$r->number} (its payment was voided)", $r);
            });
    }

    private function adjustInvoicePaid(Invoice $invoice, int $delta): void
    {
        $invoice->refresh();
        $paid = max(0, min((int) $invoice->total, (int) $invoice->amount_paid + $delta));
        $status = $invoice->status;
        if (! in_array($status, ['draft', 'void'], true)) {
            $status = $paid >= $invoice->total ? 'paid' : ($paid > 0 ? 'partial' : 'sent');
        }
        $invoice->update(['amount_paid' => $paid, 'status' => $status]);
    }
}
