<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\Invoice;
use App\Models\RecurringEntry;
use App\Models\SupplierBill;
use App\Services\FinanceReportService;
use App\Services\ReceiptExtractionService;
use App\Support\Audit;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Money ledger for finance. Junior finance records transactions (draft);
 * senior finance (perm:accounting_approve) approves them — only approved
 * transactions move balances and hit the P&L. Maker–checker on a 2-person team.
 */
class AccountingController extends Controller
{
    /** Profit & loss, cash position and payables for a period. */
    public function reports(Request $request, FinanceReportService $reports): JsonResponse
    {
        $period = $request->validate(['period' => ['sometimes', Rule::in(['mtd', 'last_month', 'week'])]])['period'] ?? 'mtd';

        return response()->json(['data' => $reports->report($period)]);
    }

    /** VAT summary — output VAT (invoices) minus input VAT (expenses), per currency. */
    public function vatReport(Request $request, FinanceReportService $reports): JsonResponse
    {
        $period = $request->validate(['period' => ['sometimes', Rule::in(['mtd', 'last_month', 'week'])]])['period'] ?? 'mtd';

        return response()->json(['data' => $reports->vatReport($period)]);
    }

    /** Stream all transactions as a CSV for the accountant. */
    public function exportTransactions(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $rows = FinanceTransaction::with(['account:id,name', 'toAccount:id,name', 'category:id,name'])
            ->orderBy('occurred_on')->orderBy('id')->get();

        return response()->stream(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Date', 'Type', 'Status', 'Account', 'To account', 'Category', 'Sector', 'Description', 'Reference', 'Currency', 'Amount', 'VAT rate %', 'VAT amount']);
            foreach ($rows as $t) {
                fputcsv($out, [
                    $t->occurred_on->toDateString(), $t->type, $t->status,
                    $t->account?->name, $t->toAccount?->name, $t->category?->name, $t->sector,
                    $t->description, $t->reference, $t->currency, $t->amount, $t->vat_rate, $t->vat_amount,
                ]);
            }
            fclose($out);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="vitorra-transactions-'.now()->format('Y-m-d').'.csv"',
            'Cache-Control'       => 'no-cache, no-store',
        ]);
    }

    /* ── Accounts ────────────────────────────────────────────────────────── */

    public function accounts(): JsonResponse
    {
        $accounts = FinanceAccount::orderBy('name')->get()
            ->map(fn (FinanceAccount $a) => array_merge(
                $a->only(['id', 'name', 'type', 'currency', 'opening_balance', 'is_active']),
                ['balance' => $a->balance()],
            ));

        return response()->json(['data' => $accounts, 'types' => FinanceAccount::TYPES]);
    }

    public function storeAccount(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'type'            => ['required', Rule::in(FinanceAccount::TYPES)],
            'currency'        => ['required', Rule::in(['UGX', 'USD', 'EUR'])],
            'opening_balance' => ['nullable', 'integer'],
        ]);

        $account = FinanceAccount::create($data + ['opening_balance' => $data['opening_balance'] ?? 0, 'created_by' => $request->user()->id]);

        return response()->json(['data' => $account], 201);
    }

    public function updateAccount(Request $request, FinanceAccount $account): JsonResponse
    {
        $data = $request->validate([
            'name'            => ['sometimes', 'string', 'max:255'],
            'type'            => ['sometimes', Rule::in(FinanceAccount::TYPES)],
            'opening_balance' => ['sometimes', 'integer'],
            'is_active'       => ['sometimes', 'boolean'],
        ]);
        $account->update($data);

        return response()->json(['data' => $account]);
    }

    /* ── Categories ──────────────────────────────────────────────────────── */

    public function categories(): JsonResponse
    {
        return response()->json(['data' => FinanceCategory::orderBy('kind')->orderBy('name')->get()]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'kind' => ['required', Rule::in(FinanceCategory::KINDS)],
        ]);

        return response()->json(['data' => FinanceCategory::create($data)], 201);
    }

    public function updateCategory(Request $request, FinanceCategory $category): JsonResponse
    {
        $category->update($request->validate([
            'name'      => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]));

        return response()->json(['data' => $category]);
    }

    /* ── Transactions ────────────────────────────────────────────────────── */

    public function transactions(Request $request): JsonResponse
    {
        $q = FinanceTransaction::with(['account:id,name,currency', 'toAccount:id,name', 'category:id,name,kind'])
            ->latest('occurred_on')->latest('id');

        foreach (['status' => 'status', 'type' => 'type', 'sector' => 'sector'] as $param => $col) {
            if ($request->filled($param)) {
                $q->where($col, $request->query($param));
            }
        }
        if ($request->filled('account')) {
            $q->where('finance_account_id', (int) $request->query('account'));
        }
        if ($request->filled('from')) {
            $q->whereDate('occurred_on', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $q->whereDate('occurred_on', '<=', $request->query('to'));
        }

        return response()->json([
            'data'       => $q->limit(500)->get()->map(fn ($t) => $this->shape($t)),
            'types'      => FinanceTransaction::TYPES,
            'statuses'   => FinanceTransaction::STATUSES,
            'sectors'    => FinanceTransaction::SECTORS,
        ]);
    }

    /** Record a transaction (draft — pending senior approval). */
    public function storeTransaction(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'                   => ['required', Rule::in(FinanceTransaction::TYPES)],
            'finance_account_id'     => ['required', Rule::exists('finance_accounts', 'id')],
            'transfer_to_account_id' => ['nullable', 'required_if:type,transfer', 'different:finance_account_id', Rule::exists('finance_accounts', 'id')],
            'finance_category_id'    => ['nullable', 'required_unless:type,transfer', Rule::exists('finance_categories', 'id')],
            'sector'                 => ['nullable', Rule::in(FinanceTransaction::SECTORS)],
            'amount'                 => ['required', 'integer', 'min:1'],
            'vat_rate'               => ['nullable', 'integer', 'min:0', 'max:100'],
            'occurred_on'            => ['required', 'date'],
            'description'            => ['nullable', 'string', 'max:500'],
            'reference'              => ['nullable', 'string', 'max:255'],
            'receipt'                => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:8192'],
        ]);

        $account = FinanceAccount::findOrFail($data['finance_account_id']);

        if ($data['type'] === 'transfer') {
            $to = FinanceAccount::findOrFail($data['transfer_to_account_id']);
            if ($to->currency !== $account->currency) {
                throw ValidationException::withMessages(['transfer_to_account_id' => ['Transfers must be between accounts of the same currency.']]);
            }
        }

        // Category must match the transaction kind (income vs expense).
        if (in_array($data['type'], ['income', 'expense'], true)) {
            $cat = FinanceCategory::find($data['finance_category_id']);
            $wantKind = $data['type'] === 'income' ? 'income' : 'expense';
            if ($cat && $cat->kind !== $wantKind) {
                throw ValidationException::withMessages(['finance_category_id' => ["Choose a {$wantKind} category for a {$data['type']} transaction."]]);
            }
        }

        // VAT carried within the (gross) amount — input VAT on expenses, output on income.
        $vatRate = $data['type'] === 'transfer' ? 0 : (int) ($data['vat_rate'] ?? 0);
        $vatAmount = $vatRate > 0 ? (int) round($data['amount'] * $vatRate / (100 + $vatRate)) : 0;

        $tx = FinanceTransaction::create([
            'type'                   => $data['type'],
            'finance_account_id'     => $account->id,
            'transfer_to_account_id' => $data['type'] === 'transfer' ? $data['transfer_to_account_id'] : null,
            'finance_category_id'    => $data['type'] === 'transfer' ? null : $data['finance_category_id'],
            'sector'                 => $data['sector'] ?? null,
            'currency'               => $account->currency,
            'amount'                 => $data['amount'],
            'vat_rate'               => $vatRate,
            'vat_amount'             => $vatAmount,
            'occurred_on'            => $data['occurred_on'],
            'description'            => $data['description'] ?? null,
            'reference'              => $data['reference'] ?? null,
            'status'                 => 'draft',
            'recorded_by'            => $request->user()->id,
            'receipt_path'           => $request->hasFile('receipt') ? SecureFile::storeUpload($request->file('receipt'), 'finance/receipts') : null,
        ]);

        return response()->json(['data' => $this->shape($tx->fresh(['account', 'toAccount', 'category']))], 201);
    }

    /** Approve a draft transaction (senior finance). Posts it to balances/P&L. */
    public function approveTransaction(Request $request, FinanceTransaction $transaction): JsonResponse
    {
        if ($transaction->status !== 'draft') {
            return response()->json(['message' => 'Only draft transactions can be approved.'], 422);
        }

        $transaction->update(['status' => 'approved', 'approved_by' => $request->user()->id, 'approved_at' => now()]);

        Audit::log('transaction.approve', 'Approved '.$transaction->type.' of '.$transaction->currency.' '.$transaction->amount, $transaction);

        // A bill payment becomes "paid" once its transaction is approved.
        if ($transaction->source === 'bill' && $transaction->source_id) {
            SupplierBill::where('id', $transaction->source_id)->update(['status' => 'paid', 'paid_transaction_id' => $transaction->id]);
        }
        // An invoice receipt settles the invoice (partial or paid).
        if ($transaction->source === 'invoice' && $transaction->source_id) {
            $this->settleInvoice($transaction->source_id, $transaction->amount);
        }

        return response()->json(['data' => $this->shape($transaction->fresh(['account', 'toAccount', 'category']))]);
    }

    /** Void a transaction (correction). Reverses any linked bill/invoice settlement. */
    public function voidTransaction(FinanceTransaction $transaction): JsonResponse
    {
        $wasApproved = $transaction->status === 'approved';

        if ($transaction->source === 'bill' && $transaction->source_id) {
            SupplierBill::where('id', $transaction->source_id)->update(['status' => 'unpaid', 'paid_transaction_id' => null]);
        }
        if ($wasApproved && $transaction->source === 'invoice' && $transaction->source_id) {
            $this->settleInvoice($transaction->source_id, -$transaction->amount);
        }
        $transaction->update(['status' => 'void']);

        Audit::log('transaction.void', 'Voided '.$transaction->type.' of '.$transaction->currency.' '.$transaction->amount, $transaction);

        return response()->json(['data' => $this->shape($transaction->fresh(['account', 'toAccount', 'category']))]);
    }

    /** AI-read an uploaded receipt to pre-fill the transaction form (best-effort). */
    public function extractReceipt(Request $request, ReceiptExtractionService $service): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:8192']]);

        return response()->json(['data' => $service->extract($request->file('file'))]);
    }

    /* ── Recurring entries ───────────────────────────────────────────────── */

    public function recurring(): JsonResponse
    {
        $rows = RecurringEntry::with(['account:id,name,currency', 'category:id,name'])->latest()->get()
            ->map(fn (RecurringEntry $r) => [
                'id' => $r->id, 'type' => $r->type, 'account' => $r->account?->name, 'category' => $r->category?->name,
                'sector' => $r->sector, 'currency' => $r->currency, 'amount' => $r->amount, 'vat_rate' => $r->vat_rate,
                'description' => $r->description, 'day_of_month' => $r->day_of_month, 'is_active' => $r->is_active,
                'last_run_period' => $r->last_run_period,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function storeRecurring(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'                => ['required', Rule::in(['income', 'expense'])],
            'finance_account_id'  => ['required', Rule::exists('finance_accounts', 'id')],
            'finance_category_id' => ['nullable', Rule::exists('finance_categories', 'id')],
            'sector'              => ['nullable', Rule::in(FinanceTransaction::SECTORS)],
            'amount'              => ['required', 'integer', 'min:1'],
            'vat_rate'            => ['nullable', 'integer', 'min:0', 'max:100'],
            'description'         => ['nullable', 'string', 'max:255'],
            'day_of_month'        => ['required', 'integer', 'min:1', 'max:28'],
        ]);

        $account = FinanceAccount::findOrFail($data['finance_account_id']);
        $entry = RecurringEntry::create($data + ['currency' => $account->currency, 'created_by' => $request->user()->id]);

        return response()->json(['data' => $entry], 201);
    }

    public function updateRecurring(Request $request, RecurringEntry $recurring): JsonResponse
    {
        $recurring->update($request->validate([
            'amount'       => ['sometimes', 'integer', 'min:1'],
            'day_of_month' => ['sometimes', 'integer', 'min:1', 'max:28'],
            'is_active'    => ['sometimes', 'boolean'],
            'description'  => ['sometimes', 'nullable', 'string', 'max:255'],
        ]));

        return response()->json(['data' => $recurring]);
    }

    public function destroyRecurring(RecurringEntry $recurring): JsonResponse
    {
        $recurring->delete();

        return response()->json(['message' => 'Recurring entry removed.']);
    }

    public function downloadReceipt(FinanceTransaction $transaction): Response
    {
        if (! $transaction->receipt_path || ! Storage::disk('local')->exists($transaction->receipt_path)) {
            return response()->json(['message' => 'No receipt on file.'], 404);
        }

        $ext = pathinfo($transaction->receipt_path, PATHINFO_EXTENSION) ?: 'pdf';

        return SecureFile::download($transaction->receipt_path, "receipt-{$transaction->id}.{$ext}");
    }

    /** Apply (or reverse, with a negative delta) a payment against an invoice. */
    private function settleInvoice(int $invoiceId, int $delta): void
    {
        $invoice = Invoice::find($invoiceId);
        if (! $invoice) {
            return;
        }
        $paid = max(0, min($invoice->total, $invoice->amount_paid + $delta));
        $invoice->update([
            'amount_paid' => $paid,
            'status'      => $paid >= $invoice->total ? 'paid' : ($paid > 0 ? 'partial' : 'sent'),
        ]);
    }

    private function shape(FinanceTransaction $t): array
    {
        return [
            'id'          => $t->id,
            'type'        => $t->type,
            'account'     => $t->account?->name,
            'to_account'  => $t->toAccount?->name,
            'category'    => $t->category?->name,
            'sector'      => $t->sector,
            'currency'    => $t->currency,
            'amount'      => $t->amount,
            'occurred_on' => $t->occurred_on->toDateString(),
            'description' => $t->description,
            'reference'   => $t->reference,
            'status'      => $t->status,
            'source'      => $t->source,
            'has_receipt' => (bool) $t->receipt_path,
        ];
    }
}
