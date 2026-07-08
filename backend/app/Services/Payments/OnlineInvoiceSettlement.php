<?php

namespace App\Services\Payments;

use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Settles a B2B invoice paid online via the gateway.
 *
 * Business decision (June 2026): an online payment is gateway-verified money, so
 * it BYPASSES the maker–checker gate — the invoice is marked paid immediately and
 * an APPROVED income entry posts straight to Vitorra Books. The audit log records
 * it for after-the-fact review. (Offline payments still go draft → senior approve.)
 *
 * Idempotent: a repeated gateway webhook for an already-paid invoice is a no-op.
 */
class OnlineInvoiceSettlement
{
    public function settle(Invoice $invoice): void
    {
        if ($invoice->status === 'paid' || $invoice->status === 'void') {
            return; // already settled (or voided) — nothing to do
        }

        DB::transaction(function () use ($invoice) {
            $invoice->refresh();
            if ($invoice->status === 'paid' || $invoice->status === 'void') {
                return;
            }

            $amount = $invoice->balance();

            // Post the receipt to the books as an already-approved income entry,
            // into a currency-matched account. If none exists yet, we still settle
            // the invoice (the customer paid) and flag it for finance to reconcile.
            $account = FinanceAccount::where('currency', $invoice->currency)
                ->where('is_active', true)
                ->orderBy('id')
                ->first();

            if ($account) {
                $tx = FinanceTransaction::create([
                    'type'                => 'income',
                    'finance_account_id'  => $account->id,
                    'finance_category_id' => FinanceCategory::where('kind', 'income')->where('is_active', true)->value('id'),
                    'sector'              => $invoice->sector,
                    'currency'            => $invoice->currency,
                    'amount'              => $amount,
                    'occurred_on'         => now()->toDateString(),
                    'description'         => 'Invoice '.$invoice->number.' — '.$invoice->customer_name.' (paid online)',
                    'reference'           => $invoice->number,
                    'status'              => 'approved',
                    'approved_at'         => now(),
                    'source'              => 'invoice',
                    'source_id'           => $invoice->id,
                ]);

                Audit::log(
                    'transaction.approve',
                    'Auto-approved online income of '.$invoice->currency.' '.$amount.' for invoice '.$invoice->number,
                    $tx,
                );
            } else {
                Log::warning('Online invoice payment with no matching finance account to post to', [
                    'invoice'  => $invoice->number,
                    'currency' => $invoice->currency,
                    'amount'   => $amount,
                ]);
            }

            $paid = min((int) $invoice->total, (int) $invoice->amount_paid + $amount);
            $invoice->update([
                'amount_paid'    => $paid,
                'status'         => $paid >= $invoice->total ? 'paid' : 'partial',
                'payment_method' => 'flutterwave',
            ]);

            Audit::log(
                'invoice.paid',
                'Invoice '.$invoice->number.' settled online ('.$invoice->currency.' '.$amount.')',
                $invoice,
            );
        });
    }
}
