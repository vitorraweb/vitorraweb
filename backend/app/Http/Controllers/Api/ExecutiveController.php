<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExecutiveReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExecutiveController extends Controller
{
    /** CEO business summary for the chosen period. */
    public function summary(Request $request, ExecutiveReportService $service): JsonResponse
    {
        $period = $request->validate([
            'period' => ['sometimes', Rule::in(['mtd', 'last_month', 'week'])],
        ])['period'] ?? 'mtd';

        return response()->json(['data' => $service->summary($period)]);
    }
}
