<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PaymentReceiptMail;
use App\Models\Invoice;
use App\Models\PaymentReceipt;
use App\Support\Audit;
use App\Support\BrandedDocument;
use App\Support\DocumentRecipients;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Receipts for money received against invoices. They are issued by the
 * system when a payment is approved (or settles online); here Finance lists
 * them, downloads the PDF, emails it, and exports the register to CSV.
 */
class PaymentReceiptController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data'    => $this->query($request)->limit(500)->get()->map(fn (PaymentReceipt $r) => $this->shape($r)),
            'methods' => PaymentReceipt::METHODS,
        ]);
    }

    /** The receipts issued for one invoice, oldest first. */
    public function forInvoice(Invoice $invoice): JsonResponse
    {
        $rows = $invoice->hasMany(PaymentReceipt::class)->with('invoice')->orderBy('paid_on')->orderBy('id')->get();

        return response()->json(['data' => $rows->map(fn (PaymentReceipt $r) => $this->shape($r)), 'methods' => PaymentReceipt::METHODS]);
    }

    public function pdf(PaymentReceipt $receipt): Response
    {
        return BrandedDocument::receiptPdf($receipt->load('invoice.items'))->download($receipt->number.'.pdf');
    }

    /** Email the receipt — client(s) and/or colleagues, picked as for invoices. */
    public function send(Request $request, PaymentReceipt $receipt): JsonResponse
    {
        $receipt->load('invoice.items');
        if ($receipt->status === 'void') {
            return response()->json(['message' => 'This receipt is void — its payment was reversed.'], 422);
        }

        ['team' => $team, 'clients' => $clients, 'note' => $note] = DocumentRecipients::fromRequest($request, $receipt->invoice->customer_email);

        $pdf = BrandedDocument::receiptPdf($receipt)->output();
        if ($clients) {
            Mail::to($clients)->send(new PaymentReceiptMail($receipt, $pdf, note: $note));
            $receipt->update(['emailed_at' => now()]);
        }
        if ($team->isNotEmpty()) {
            Mail::to($team)->send(new PaymentReceiptMail($receipt, $pdf, team: true, sender: $request->user(), note: $note, customerSent: (bool) $clients));
        }

        Audit::log('receipt.send', "Emailed receipt {$receipt->number}", $receipt, [
            'clients' => $clients, 'team' => $team->pluck('email')->all(),
        ]);

        return response()->json(['data' => $this->shape($receipt->fresh('invoice'))]);
    }

    /** The receipt register as CSV, for the filters on screen. */
    public function export(Request $request): StreamedResponse
    {
        $rows = $this->query($request)->get();

        return response()->stream(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Receipt No.', 'Date received', 'Invoice No.', 'Customer', 'Currency', 'Amount received', 'Paid before', 'Balance after', 'Settlement', 'Method', 'Payment reference', 'Status', 'Emailed']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r->number, $r->paid_on->toDateString(), $r->invoice?->number, $r->invoice?->customer_name, $r->currency,
                    BrandedDocument::major($r->currency, $r->amount),
                    BrandedDocument::major($r->currency, $r->paid_before),
                    BrandedDocument::major($r->currency, $r->balance_after),
                    $r->isFullySettled() ? 'Paid in full' : 'Part payment',
                    $r->methodLabel(), $r->payment_reference, $r->status, $r->emailed_at?->toDateTimeString(),
                ]);
            }
            fclose($out);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="vitorra-receipts-'.now()->format('Y-m-d').'.csv"',
            'Cache-Control'       => 'no-cache, no-store',
        ]);
    }

    private function query(Request $request): Builder
    {
        $f = $request->validate([
            'from'   => ['nullable', 'date'],
            'to'     => ['nullable', 'date'],
            'status' => ['nullable', 'in:issued,void'],
            'q'      => ['nullable', 'string', 'max:100'],
        ]);

        return PaymentReceipt::with('invoice')
            ->when($f['from'] ?? null, fn ($q, $d) => $q->whereDate('paid_on', '>=', $d))
            ->when($f['to'] ?? null, fn ($q, $d) => $q->whereDate('paid_on', '<=', $d))
            ->when($f['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($f['q'] ?? null, fn ($q, $term) => $q->where(fn ($w) => $w
                ->where('number', 'like', "%{$term}%")
                ->orWhereHas('invoice', fn ($i) => $i->where('number', 'like', "%{$term}%")->orWhere('customer_name', 'like', "%{$term}%"))))
            ->latest('paid_on')->latest('id');
    }

    private function shape(PaymentReceipt $r): array
    {
        return [
            'id'                => $r->id,
            'number'            => $r->number,
            'invoice_id'        => $r->invoice_id,
            'invoice_number'    => $r->invoice?->number,
            'customer_name'     => $r->invoice?->customer_name,
            'customer_email'    => $r->invoice?->customer_email,
            'currency'          => $r->currency,
            'amount'            => $r->amount,
            'paid_before'       => $r->paid_before,
            'balance_after'     => $r->balance_after,
            'fully_settled'     => $r->isFullySettled(),
            'payment_method'    => $r->payment_method,
            'method_label'      => $r->methodLabel(),
            'payment_reference' => $r->payment_reference,
            'paid_on'           => $r->paid_on->toDateString(),
            'status'            => $r->status,
            'emailed_at'        => $r->emailed_at?->toIso8601String(),
        ];
    }
}
