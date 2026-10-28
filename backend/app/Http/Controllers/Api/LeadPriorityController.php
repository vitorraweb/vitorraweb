<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prospect;
use App\Services\Marketing\LeadScorer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** The decision engine's output: who to focus on, and who to leave alone. */
class LeadPriorityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'tier'    => ['nullable', Rule::in(Prospect::TIERS)],
            'product' => ['nullable', Rule::in(Prospect::PRODUCTS)],
            'market'  => ['nullable', 'integer'],
        ]);

        $base = Prospect::query()
            ->where('category', '!=', 'INTERNAL_TEST')
            ->when($request->filled('product'), fn ($q) => $q->where('product', $request->query('product')))
            ->when($request->filled('market'), fn ($q) => $q->whereHas('markets', fn ($m) => $m->where('markets.id', $request->integer('market'))));

        $counts = (clone $base)->selectRaw("COALESCE(lead_tier, 'unscored') t, COUNT(*) n")->groupBy('t')->pluck('n', 't');

        $page = (clone $base)
            ->where('lead_tier', $request->query('tier', 'hot'))
            ->orderByDesc('lead_score')->orderBy('name')
            ->paginate(50, ['id', 'name', 'email', 'phone', 'product', 'category', 'location', 'outreach_status', 'assigned_to', 'follow_up_on', 'lead_score', 'lead_tier', 'lead_reasons', 'lead_action', 'lead_scored_at']);

        return response()->json([
            ...$page->toArray(),
            'counts'    => $counts,
            // As ISO with its offset, so the browser shows the right "x ago".
            'scored_at' => ($at = Prospect::max('lead_scored_at')) ? \Illuminate\Support\Carbon::parse($at)->toIso8601String() : null,
        ]);
    }

    /** Re-score everyone now (normally hourly). */
    public function recalculate(): JsonResponse
    {
        $changed = LeadScorer::forAll()->scoreAndStore();

        return response()->json(['message' => "Leads re-scored. {$changed} changed priority."]);
    }
}
