<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\InvoiceMail;
use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Invoice::latest('issue_date')->latest('id');
        if ($request->filled('status')) {
            $request->query('status') === 'overdue'
                ? $q->whereIn('status', ['sent', 'partial'])->whereDate('due_date', '<', now())
                : $q->where('status', $request->query('status'));
        }

        return response()->json([
            'data'        => $q->limit(500)->get()->map(fn (Invoice $i) => $this->shape($i)),
            'statuses'    => Invoice::STATUSES,
            'default_vat' => (int) (Setting::get('vat_enabled') ? Setting::get('vat_rate', 18) : 0),
        ]);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json(['data' => $this->shape($invoice->load('items'), full: true)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateInvoice($request);

        $invoice = Invoice::create([
            'number'           => Invoice::nextNumber(),
            'customer_name'    => $data['customer_name'],
            'customer_email'   => $data['customer_email'] ?? null,
            'customer_address' => $data['customer_address'] ?? null,
            'currency'         => $data['currency'],
            'sector'           => $data['sector'] ?? null,
            'issue_date'       => $data['issue_date'] ?? now()->toDateString(),
            'due_date'         => $data['due_date'] ?? null,
            'notes'            => $data['notes'] ?? null,
            'terms'            => $data['terms'] ?? null,
            'status'           => 'draft',
            'created_by'       => $request->user()->id,
        ]);

        $this->syncItems($invoice, $data['items']);

        return response()->json(['data' => $this->shape($invoice->fresh('items'), full: true)], 201);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        if (! in_array($invoice->status, ['draft', 'sent'], true)) {
            return response()->json(['message' => 'A paid or void invoice cannot be edited.'], 422);
        }
        $data = $this->validateInvoice($request);

        $invoice->update(collect($data)->only(['customer_name', 'customer_email', 'customer_address', 'currency', 'sector', 'issue_date', 'due_date', 'notes', 'terms'])->all());
        $invoice->items()->delete();
        $this->syncItems($invoice, $data['items']);

        return response()->json(['data' => $this->shape($invoice->fresh('items'), full: true)]);
    }

    /** Email the invoice PDF to the customer and mark it sent. */
    public function send(Invoice $invoice): JsonResponse
    {
        if (! $invoice->customer_email) {
            return response()->json(['message' => 'Add a customer email before sending.'], 422);
        }
        if ($invoice->status === 'void') {
            return response()->json(['message' => 'This invoice is void.'], 422);
        }

        $pdf = Pdf::loadView('documents.invoice', ['invoice' => $invoice->load('items')]);
        Mail::to($invoice->customer_email)->send(new InvoiceMail($invoice, $pdf->output()));

        if ($invoice->status === 'draft') {
            $invoice->update(['status' => 'sent', 'sent_at' => now()]);
        }

        return response()->json(['data' => $this->shape($invoice->fresh('items'), full: true)]);
    }

    /** Record a customer payment — a DRAFT income transaction; approval settles the invoice. */
    public function recordPayment(Request $request, Invoice $invoice): JsonResponse
    {
        if (! in_array($invoice->status, ['sent', 'partial'], true)) {
            return response()->json(['message' => 'Only a sent invoice can take a payment.'], 422);
        }

        $data = $request->validate([
            'finance_account_id' => ['required', Rule::exists('finance_accounts', 'id')],
            'amount'             => ['nullable', 'integer', 'min:1'],
            'occurred_on'        => ['nullable', 'date'],
        ]);

        $account = FinanceAccount::findOrFail($data['finance_account_id']);
        if ($account->currency !== $invoice->currency) {
            throw ValidationException::withMessages(['finance_account_id' => ["Receive this {$invoice->currency} invoice into a {$invoice->currency} account."]]);
        }

        $amount = $data['amount'] ?? $invoice->balance();
        if ($amount > $invoice->balance()) {
            throw ValidationException::withMessages(['amount' => ['Amount exceeds the outstanding balance.']]);
        }

        $tx = FinanceTransaction::create([
            'type'                => 'income',
            'finance_account_id'  => $account->id,
            'finance_category_id' => FinanceCategory::where('kind', 'income')->where('is_active', true)->value('id'),
            'sector'              => $invoice->sector,
            'currency'            => $invoice->currency,
            'amount'              => $amount,
            'occurred_on'         => $data['occurred_on'] ?? now()->toDateString(),
            'description'         => 'Invoice '.$invoice->number.' — '.$invoice->customer_name,
            'reference'           => $invoice->number,
            'status'              => 'draft',
            'source'              => 'invoice',
            'source_id'           => $invoice->id,
            'recorded_by'         => $request->user()->id,
        ]);

        return response()->json(['message' => 'Payment recorded — awaiting approval.', 'transaction_id' => $tx->id]);
    }

    public function void(Invoice $invoice): JsonResponse
    {
        $invoice->update(['status' => 'void']);

        return response()->json(['data' => $this->shape($invoice)]);
    }

    public function pdf(Invoice $invoice): Response
    {
        $pdf = Pdf::loadView('documents.invoice', ['invoice' => $invoice->load('items')]);

        return $pdf->download($invoice->number.'.pdf');
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    private function validateInvoice(Request $request): array
    {
        return $request->validate([
            'customer_name'        => ['required', 'string', 'max:255'],
            'customer_email'       => ['nullable', 'email', 'max:255'],
            'customer_address'     => ['nullable', 'string', 'max:1000'],
            'currency'             => ['required', Rule::in(['UGX', 'USD', 'EUR'])],
            'sector'               => ['nullable', Rule::in(FinanceTransaction::SECTORS)],
            'issue_date'           => ['nullable', 'date'],
            'due_date'             => ['nullable', 'date'],
            'notes'                => ['nullable', 'string', 'max:2000'],
            'terms'                => ['nullable', 'string', 'max:2000'],
            'items'                => ['required', 'array', 'min:1', 'max:50'],
            'items.*.description'  => ['required', 'string', 'max:500'],
            'items.*.quantity'     => ['required', 'integer', 'min:1'],
            'items.*.unit_price'   => ['required', 'integer', 'min:0'],
            'items.*.vat_rate'     => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);
    }

    private function syncItems(Invoice $invoice, array $items): void
    {
        foreach ($items as $row) {
            $subtotal = $row['quantity'] * $row['unit_price'];
            $vat = (int) round($subtotal * ($row['vat_rate'] ?? 0) / 100);
            $invoice->items()->create([
                'description'   => $row['description'],
                'quantity'      => $row['quantity'],
                'unit_price'    => $row['unit_price'],
                'vat_rate'      => $row['vat_rate'] ?? 0,
                'line_subtotal' => $subtotal,
                'vat_amount'    => $vat,
                'line_total'    => $subtotal + $vat,
            ]);
        }
        $invoice->recalcTotals();
    }

    private function shape(Invoice $i, bool $full = false): array
    {
        $out = [
            'id'            => $i->id,
            'number'        => $i->number,
            'customer_name' => $i->customer_name,
            'customer_email' => $i->customer_email,
            'currency'      => $i->currency,
            'sector'        => $i->sector,
            'issue_date'    => optional($i->issue_date)->toDateString(),
            'due_date'      => optional($i->due_date)->toDateString(),
            'subtotal'      => $i->subtotal,
            'vat_total'     => $i->vat_total,
            'total'         => $i->total,
            'amount_paid'   => $i->amount_paid,
            'balance'       => $i->balance(),
            'status'        => $i->status,
            'is_overdue'    => $i->isOverdue(),
        ];
        if ($full) {
            $out += [
                'customer_address' => $i->customer_address,
                'notes' => $i->notes,
                'terms' => $i->terms,
                'items' => $i->items->map(fn (\App\Models\InvoiceItem $it) => [
                    'description' => $it->description, 'quantity' => $it->quantity, 'unit_price' => $it->unit_price,
                    'vat_rate' => $it->vat_rate, 'line_subtotal' => $it->line_subtotal, 'vat_amount' => $it->vat_amount, 'line_total' => $it->line_total,
                ])->all(),
            ];
        }
        return $out;
    }
}
