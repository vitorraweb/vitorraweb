<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Market;
use App\Models\Prospect;
use App\Support\Audit;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Markets: named audiences Marketing sends to repeatedly. Members are
 * prospects (the CRM's contact record); a contact can belong to several
 * markets, and "move" takes them out of one and into another.
 */
class MarketController extends Controller
{
    public function index(): JsonResponse
    {
        $markets = Market::query()->withCount('prospects')->orderBy('name')->get();

        // Tier mix per market, so the list shows quality as well as size.
        $tiers = DB::table('market_members')->join('prospects', 'prospects.id', '=', 'market_members.prospect_id')
            ->selectRaw("market_id, COALESCE(prospects.lead_tier, 'unscored') tier, COUNT(*) n")
            ->groupBy('market_id', 'tier')->get()->groupBy('market_id');
        $emailable = DB::table('market_members')->join('prospects', 'prospects.id', '=', 'market_members.prospect_id')
            ->whereNotNull('prospects.email')->where('prospects.email', '!=', '')->whereNull('prospects.unsubscribed_at')
            ->selectRaw('market_id, COUNT(*) n')->groupBy('market_id')->pluck('n', 'market_id');

        return response()->json(['data' => $markets->map(fn ($m) => [
            ...$m->only(['id', 'name', 'description', 'product', 'color', 'created_at']),
            'members'   => $m->prospects_count,
            'emailable' => (int) ($emailable[$m->id] ?? 0),
            'tiers'     => collect($tiers[$m->id] ?? [])->mapWithKeys(fn ($r) => [$r->tier => (int) $r->n]),
        ])]);
    }

    public function store(Request $request): JsonResponse
    {
        $market = Market::create($this->validated($request) + ['created_by' => $request->user()->id]);
        Audit::log('market.created', "Market \"{$market->name}\" created", $market);

        return response()->json(['data' => $market], 201);
    }

    public function update(Request $request, Market $market): JsonResponse
    {
        $market->update($this->validated($request, partial: true));

        return response()->json(['data' => $market]);
    }

    public function destroy(Market $market): JsonResponse
    {
        Audit::log('market.deleted', "Market \"{$market->name}\" deleted ({$market->prospects()->count()} members; the contacts themselves are kept)", $market);
        $market->delete();

        return response()->json(['message' => 'Market deleted. The contacts are still in Prospects.']);
    }

    /** Members, searchable, best leads first. */
    public function members(Request $request, Market $market): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        $page = $market->prospects()
            ->when($q !== '', fn ($w) => $w->where(fn ($x) => $x->where('name', 'like', '%'.addcslashes($q, '%_').'%')
                ->orWhere('email', 'like', '%'.addcslashes($q, '%_').'%')))
            ->when($request->filled('tier'), fn ($w) => $w->where('lead_tier', $request->query('tier')))
            ->orderByRaw('lead_score IS NULL, lead_score DESC')->orderBy('name')
            ->paginate(50, ['prospects.id', 'name', 'email', 'phone', 'product', 'category', 'outreach_status', 'lead_score', 'lead_tier', 'lead_reasons', 'lead_action', 'unsubscribed_at']);

        return response()->json($page);
    }

    /** Add existing prospects (by id, or every row the Prospects screen's filters match). */
    public function addMembers(Request $request, Market $market): JsonResponse
    {
        $data = $request->validate([
            'ids'          => ['required_without:all_matching', 'array', 'max:5000'],
            'ids.*'        => ['integer'],
            'all_matching' => ['nullable', 'boolean'],
        ]);
        $ids = $request->boolean('all_matching')
            ? Prospect::query()->filtered(ProspectController::filtersFrom($request))->pluck('id')
            : Prospect::whereIn('id', $data['ids'])->pluck('id');

        $before = $market->prospects()->count();
        $market->prospects()->syncWithoutDetaching($ids->mapWithKeys(fn ($id) => [$id => ['added_by' => $request->user()->id]])->all());
        $added = $market->prospects()->count() - $before;

        return response()->json(['added' => $added, 'message' => "{$added} added to {$market->name}."]);
    }

    /** Create a brand-new contact and put them straight into this market. */
    public function addContact(Request $request, Market $market): JsonResponse
    {
        $product = $market->product ?? $request->input('product', 'FET');
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['nullable', 'email', 'max:255', 'required_without:phone'],
            'phone'    => ['nullable', 'string', 'max:40'],
            'location' => ['nullable', 'string', 'max:255'],
            'category' => ['required', Rule::in(Prospect::CATEGORIES_BY_PRODUCT[$product] ?? Prospect::CATEGORIES)],
            'product'  => ['nullable', Rule::in(Prospect::PRODUCTS)],
        ]);

        $prospect = Prospect::firstOrCreate(
            ['name' => $data['name'], 'category' => $data['category'], 'product' => $product],
            [
                'email'    => $data['email'] ?? null,
                'phone'    => isset($data['phone']) ? (Phone::e164($data['phone']) ?? $data['phone']) : null,
                'location' => $data['location'] ?? null,
                'source'   => 'added to market: '.$market->name,
            ]
        );
        $market->prospects()->syncWithoutDetaching([$prospect->id => ['added_by' => $request->user()->id]]);

        return response()->json(['data' => $prospect, 'message' => "{$prospect->name} added to {$market->name}."], 201);
    }

    public function removeMembers(Request $request, Market $market): JsonResponse
    {
        $data = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer']]);
        $n = $market->prospects()->detach($data['ids']);

        return response()->json(['removed' => $n, 'message' => "{$n} removed from {$market->name}."]);
    }

    /** Move contacts from this market to another (remove here, add there). */
    public function move(Request $request, Market $market): JsonResponse
    {
        $data = $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
            'to'    => ['required', 'integer', 'exists:markets,id', Rule::notIn([$market->id])],
        ]);
        $to = Market::findOrFail($data['to']);
        $ids = $market->prospects()->whereIn('prospects.id', $data['ids'])->pluck('prospects.id');

        DB::transaction(function () use ($market, $to, $ids, $request) {
            $to->prospects()->syncWithoutDetaching($ids->mapWithKeys(fn ($id) => [$id => ['added_by' => $request->user()->id]])->all());
            $market->prospects()->detach($ids);
        });

        return response()->json(['moved' => $ids->count(), 'message' => "{$ids->count()} moved to {$to->name}."]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name'        => [$req, 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'product'     => ['nullable', Rule::in(Prospect::PRODUCTS)],
            'color'       => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);
    }
}
