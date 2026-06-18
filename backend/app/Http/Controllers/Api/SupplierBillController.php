<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use App\Models\Supplier;
use App\Models\SupplierBill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SupplierBillController extends Controller
{
    /** Payables list — what the business owes, with supplier picker data. */
    public function index(Request $request): JsonResponse
    {
        $q = SupplierBill::with(['supplier:id,company_name', 'category:id,name'])->latest('due_date');
        if ($request->filled('status')) {
            $q->where('status', $request->query('status'));
        }

        return response()->json([
            'data'       => $q->limit(500)->get()->map(fn (SupplierBill $b) => $this->shape($b)),
            'statuses'   => SupplierBill::STATUSES,
            'suppliers'  => Supplier::where('status', 'approved')->orderBy('company_name')->get(['id', 'company_name']),
            'categories' => FinanceCategory::where('kind', 'expense')->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /** Record a new bill owed. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id'         => ['nullable', Rule::exists('suppliers', 'id')],
            'vendor_name'         => ['nullable', 'string', 'max:255'],
            'finance_category_id' => ['nullable', Rule::exists('finance_categories', 'id')],
            'sector'              => ['nullable', Rule::in(FinanceTransaction::SECTORS)],
            'currency'            => ['required', Rule::in(['UGX', 'USD', 'EUR'])],
            'amount'              => ['required', 'integer', 'min:1'],
            'due_date'            => ['nullable', 'date'],
            'description'         => ['nullable', 'string', 'max:500'],
            'reference'           => ['nullable', 'string', 'max:255'],
        ]);

        if (empty($data['supplier_id']) && empty($data['vendor_name'])) {
            throw ValidationException::withMessages(['vendor_name' => ['Choose a supplier or enter a vendor name.']]);
        }

        $bill = SupplierBill::create($data + ['status' => 'unpaid', 'created_by' => $request->user()->id]);

        return response()->json(['data' => $this->shape($bill->fresh(['supplier', 'category']))], 201);
    }

    /**
     * Record a payment against a bill — creates a DRAFT expense transaction
     * from the chosen account. Senior approval of that transaction marks the
     * bill paid (maker–checker).
     */
    public function pay(Request $request, SupplierBill $bill): JsonResponse
    {
        if ($bill->status !== 'unpaid') {
            return response()->json(['message' => 'This bill is not awaiting payment.'], 422);
        }

        $data = $request->validate([
            'finance_account_id' => ['required', Rule::exists('finance_accounts', 'id')],
            'occurred_on'        => ['nullable', 'date'],
        ]);

        $account = FinanceAccount::findOrFail($data['finance_account_id']);
        if ($account->currency !== $bill->currency) {
            throw ValidationException::withMessages(['finance_account_id' => ["Pay this {$bill->currency} bill from a {$bill->currency} account."]]);
        }

        $tx = FinanceTransaction::create([
            'type'                => 'expense',
            'finance_account_id'  => $account->id,
            'finance_category_id' => $bill->finance_category_id,
            'sector'              => $bill->sector,
            'currency'            => $bill->currency,
            'amount'              => $bill->amount,
            'occurred_on'         => $data['occurred_on'] ?? now()->toDateString(),
            'description'         => 'Payment: '.$bill->vendorLabel().($bill->description ? ' — '.$bill->description : ''),
            'reference'           => $bill->reference,
            'status'              => 'draft',
            'source'              => 'bill',
            'source_id'           => $bill->id,
            'recorded_by'         => $request->user()->id,
        ]);

        return response()->json(['message' => 'Payment recorded — awaiting approval.', 'transaction_id' => $tx->id]);
    }

    public function void(SupplierBill $bill): JsonResponse
    {
        $bill->update(['status' => 'void']);

        return response()->json(['data' => $this->shape($bill)]);
    }

    private function shape(SupplierBill $b): array
    {
        return [
            'id'        => $b->id,
            'vendor'    => $b->vendorLabel(),
            'category'  => $b->category?->name,
            'sector'    => $b->sector,
            'currency'  => $b->currency,
            'amount'    => $b->amount,
            'due_date'  => optional($b->due_date)->toDateString(),
            'status'    => $b->status,
            'description' => $b->description,
        ];
    }
}
