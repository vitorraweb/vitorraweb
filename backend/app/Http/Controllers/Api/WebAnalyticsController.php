<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Analytics\PostHogWebStats;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

/** Console → Insights → Website: visitor numbers from PostHog. */
class WebAnalyticsController extends Controller
{
    public function summary(Request $request, PostHogWebStats $stats): JsonResponse
    {
        $period = $request->validate(['period' => ['nullable', Rule::in(array_keys(PostHogWebStats::PERIODS))]])['period'] ?? '7d';

        if (! PostHogWebStats::configured()) {
            return response()->json(['data' => ['configured' => false]]);
        }

        try {
            return response()->json(['data' => ['configured' => true, 'period' => $period, 'links' => PostHogWebStats::links()] + $stats->summary($period)]);
        } catch (RuntimeException $e) {
            return response()->json(['data' => ['configured' => true, 'error' => $e->getMessage(), 'links' => PostHogWebStats::links()]]);
        }
    }

    public function insights(\App\Services\Analytics\WebInsights $insights): JsonResponse
    {
        if (! PostHogWebStats::configured()) {
            return response()->json(['data' => ['configured' => false]]);
        }

        try {
            return response()->json(['data' => ['configured' => true, 'items' => $insights->build()]]);
        } catch (RuntimeException $e) {
            return response()->json(['data' => ['configured' => true, 'items' => [], 'error' => $e->getMessage()]]);
        }
    }

    public function live(PostHogWebStats $stats): JsonResponse
    {
        if (! PostHogWebStats::configured()) {
            return response()->json(['data' => ['configured' => false]]);
        }

        try {
            return response()->json(['data' => ['configured' => true] + $stats->live()]);
        } catch (RuntimeException $e) {
            return response()->json(['data' => ['configured' => true, 'error' => $e->getMessage()]]);
        }
    }
}
