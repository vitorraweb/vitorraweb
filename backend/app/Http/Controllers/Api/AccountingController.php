<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\SupplierBill;
use App\Services\FinanceReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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

        $tx = FinanceTransaction::create([
            'type'                   => $data['type'],
            'finance_account_id'     => $account->id,
            'transfer_to_account_id' => $data['type'] === 'transfer' ? $data['transfer_to_account_id'] : null,
            'finance_category_id'    => $data['type'] === 'transfer' ? null : $data['finance_category_id'],
            'sector'                 => $data['sector'] ?? null,
            'currency'               => $account->currency,
            'amount'                 => $data['amount'],
            'occurred_on'            => $data['occurred_on'],
            'description'            => $data['description'] ?? null,
            'reference'              => $data['reference'] ?? null,
            'status'                 => 'draft',
            'recorded_by'            => $request->user()->id,
            'receipt_path'           => $request->hasFile('receipt') ? $request->file('receipt')->store('finance/receipts', 'local') : null,
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

        // A bill payment becomes "paid" once its transaction is approved.
        if ($transaction->source === 'bill' && $transaction->source_id) {
            SupplierBill::where('id', $transaction->source_id)->update(['status' => 'paid', 'paid_transaction_id' => $transaction->id]);
        }

        return response()->json(['data' => $this->shape($transaction->fresh(['account', 'toAccount', 'category']))]);
    }

    /** Void a transaction (correction). Reverts a linked bill to unpaid. */
    public function voidTransaction(FinanceTransaction $transaction): JsonResponse
    {
        if ($transaction->source === 'bill' && $transaction->source_id) {
            SupplierBill::where('id', $transaction->source_id)->update(['status' => 'unpaid', 'paid_transaction_id' => null]);
        }
        $transaction->update(['status' => 'void']);

        return response()->json(['data' => $this->shape($transaction->fresh(['account', 'toAccount', 'category']))]);
    }

    public function downloadReceipt(FinanceTransaction $transaction): StreamedResponse|JsonResponse
    {
        if (! $transaction->receipt_path || ! Storage::disk('local')->exists($transaction->receipt_path)) {
            return response()->json(['message' => 'No receipt on file.'], 404);
        }

        return Storage::disk('local')->download($transaction->receipt_path);
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
