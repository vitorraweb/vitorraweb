<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinanceBudget;
use App\Models\FinanceCategory;
use App\Models\FinanceTransaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BudgetController extends Controller
{
    /** Budgets for a month with actual spend vs the cap, per expense category. */
    public function index(Request $request): JsonResponse
    {
        $period = $request->validate(['period' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/']])['period'] ?? now()->format('Y-m');

        $budgets = FinanceBudget::with('category:id,name')->where('period', $period)->get();

        // Actual approved expense per category for the month, per currency.
        // Use a date range (not strftime) so it works on both SQLite and MySQL.
        // '!' resets all fields so no current day/time bleeds in (which could
        // overflow for short months, e.g. Feb on the 30th).
        $start = Carbon::createFromFormat('!Y-m-d', $period.'-01');
        $next  = $start->copy()->addMonth();
        $actuals = FinanceTransaction::where('type', 'expense')->where('status', 'approved')
            ->where('occurred_on', '>=', $start->toDateString())
            ->where('occurred_on', '<', $next->toDateString())
            ->selectRaw('finance_category_id, currency, SUM(amount) s')
            ->groupBy('finance_category_id', 'currency')->get();

        $rows = $budgets->map(function (FinanceBudget $b) use ($actuals) {
            $actual = (int) $actuals->where('finance_category_id', $b->finance_category_id)->where('currency', $b->currency)->sum('s');
            return [
                'id'       => $b->id,
                'category' => $b->category?->name,
                'category_id' => $b->finance_category_id,
                'currency' => $b->currency,
                'budget'   => $b->amount,
                'actual'   => $actual,
                'remaining' => $b->amount - $actual,
                'over'     => $actual > $b->amount,
            ];
        });

        return response()->json([
            'data'       => $rows,
            'period'     => $period,
            'categories' => FinanceCategory::where('kind', 'expense')->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /** Set (or update) a category's budget for a month. */
    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'finance_category_id' => ['required', Rule::exists('finance_categories', 'id')],
            'period'              => ['required', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'currency'            => ['required', Rule::in(['UGX', 'USD', 'EUR'])],
            'amount'              => ['required', 'integer', 'min:0'],
        ]);

        $budget = FinanceBudget::updateOrCreate(
            ['finance_category_id' => $data['finance_category_id'], 'period' => $data['period'], 'currency' => $data['currency']],
            ['amount' => $data['amount']],
        );

        return response()->json(['data' => $budget], $budget->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(FinanceBudget $budget): JsonResponse
    {
        $budget->delete();

        return response()->json(['message' => 'Budget removed.']);
    }
}
