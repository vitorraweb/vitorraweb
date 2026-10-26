<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FetStockMovement;
use App\Models\Product;
use App\Support\Audit;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * FET stock overview for Finance: devices received, sold, returned and
 * corrected per model, rolled up week by week (Monday–Sunday). Stock levels are
 * always derived from the movements, never stored, so a late entry or a
 * deletion re-flows every week after it.
 */
class FetStockController extends Controller
{
    /** Current stock per model, the weekly overview, and recent movements. */
    public function index(Request $request): JsonResponse
    {
        $weeks = (int) ($request->validate(['weeks' => ['sometimes', 'integer', 'min:1', 'max:52']])['weeks'] ?? 8);

        $prices = Product::whereIn('slug', array_column(FetStockMovement::MODELS, 'slug'))->pluck('price_ugx', 'slug');

        $onHand = FetStockMovement::selectRaw('model, SUM(quantity) q')->groupBy('model')->pluck('q', 'model');
        $models = collect(FetStockMovement::MODELS)->map(function (array $m, string $code) use ($onHand, $prices) {
            $qty   = (int) ($onHand[$code] ?? 0);
            $price = $prices[$m['slug']] ?? null;

            return [
                'code'      => $code,
                'label'     => $m['label'],
                'on_hand'   => $qty,
                'price_ugx' => $price !== null ? (int) $price : null,
                'value_ugx' => $price !== null ? $qty * (int) $price : null,
            ];
        })->values();

        return response()->json([
            'models'    => $models,
            'weeks'     => $this->weekly($weeks),
            'movements' => FetStockMovement::with('creator:id,name')
                ->orderByDesc('moved_on')->orderByDesc('id')->limit(100)->get()
                ->map(fn (FetStockMovement $m) => $this->present($m)),
            'types'     => FetStockMovement::TYPES,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'model'     => ['required', Rule::in(array_keys(FetStockMovement::MODELS))],
            'type'      => ['required', Rule::in(FetStockMovement::TYPES)],
            // Adjustments are signed (a count found 2 fewer → −2); the others are a plain count.
            'quantity'  => ['required', 'integer', 'not_in:0', 'between:-10000,10000'],
            'moved_on'  => ['required', 'date', 'before_or_equal:today'],
            'reference' => ['nullable', 'string', 'max:255'],
            'note'      => ['nullable', 'string', 'max:2000'],
        ]);

        $data['moved_on'] = CarbonImmutable::parse($data['moved_on'])->toDateString();
        $qty = (int) $data['quantity'];
        if ($data['type'] !== 'adjustment') {
            if ($qty < 0) {
                throw ValidationException::withMessages(['quantity' => 'Enter how many devices — the type decides whether stock goes up or down.']);
            }
            $qty = $data['type'] === 'sold' ? -$qty : $qty;
        } elseif (blank($data['note'] ?? null)) {
            throw ValidationException::withMessages(['note' => 'Say why the stock is being corrected (e.g. "stock count 24 Oct").']);
        }

        $this->guardNoNegativeStock($data['model'], $data['moved_on'], $qty);

        $movement = FetStockMovement::create([
            ...$data,
            'quantity'   => $qty,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $this->present($movement->load('creator:id,name'))], 201);
    }

    /** Remove a mistaken entry — senior finance only, recorded in the activity log. */
    public function destroy(FetStockMovement $movement): JsonResponse
    {
        // Removing a delivery that devices were later sold out of would leave stock negative.
        $this->guardNoNegativeStock($movement->model, $movement->moved_on->toDateString(), -$movement->quantity);

        Audit::log('fet_stock.delete', "Removed FET stock entry: {$movement->type} {$movement->quantity} × {$movement->model} on {$movement->moved_on->toDateString()}", $movement, [
            'model' => $movement->model, 'type' => $movement->type, 'quantity' => $movement->quantity,
            'moved_on' => $movement->moved_on->toDateString(), 'reference' => $movement->reference,
        ]);
        $movement->delete();

        return response()->json(['message' => 'Stock entry removed.']);
    }

    /** The weekly overview as a CSV for the accountant. */
    public function export(Request $request): StreamedResponse
    {
        $weeks = (int) ($request->validate(['weeks' => ['sometimes', 'integer', 'min:1', 'max:52']])['weeks'] ?? 8);
        $rows  = $this->weekly($weeks);

        return response()->stream(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Week starting', 'Week ending', 'Model', 'Opening', 'Received', 'Sold', 'Returned', 'Adjusted', 'Closing']);
            foreach ($rows as $w) {
                foreach ($w['models'] as $code => $m) {
                    fputcsv($out, [$w['start'], $w['end'], FetStockMovement::MODELS[$code]['label'], $m['opening'], $m['received'], $m['sold'], $m['returned'], $m['adjusted'], $m['closing']]);
                }
            }
            fclose($out);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="vitorra-fet-stock-'.now()->format('Y-m-d').'.csv"',
            'Cache-Control'       => 'no-cache, no-store',
        ]);
    }

    /**
     * Opening, movements and closing per model for the last $weeks weeks,
     * newest first. Weeks run Monday to Sunday.
     */
    private function weekly(int $weeks): array
    {
        $thisWeek = CarbonImmutable::today()->startOfWeek(CarbonImmutable::MONDAY);
        $first    = $thisWeek->subWeeks($weeks - 1);

        // Stock carried into the first week shown.
        $opening = FetStockMovement::where('moved_on', '<', $first->toDateString())
            ->selectRaw('model, SUM(quantity) q')->groupBy('model')->pluck('q', 'model');

        $movements = FetStockMovement::where('moved_on', '>=', $first->toDateString())
            ->get(['model', 'type', 'quantity', 'moved_on']);

        $running = [];
        foreach (array_keys(FetStockMovement::MODELS) as $code) {
            $running[$code] = (int) ($opening[$code] ?? 0);
        }

        $rows = [];
        for ($start = $first; $start <= $thisWeek; $start = $start->addWeek()) {
            $end    = $start->addDays(6);
            $inWeek = $movements->filter(fn ($m) => $m->moved_on->betweenIncluded($start, $end));

            $models = [];
            foreach ($running as $code => $open) {
                $mine = $inWeek->where('model', $code);
                $row  = [
                    'opening'  => $open,
                    'received' => (int) $mine->where('type', 'received')->sum('quantity'),
                    'sold'     => (int) -$mine->where('type', 'sold')->sum('quantity'),
                    'returned' => (int) $mine->where('type', 'returned')->sum('quantity'),
                    'adjusted' => (int) $mine->where('type', 'adjustment')->sum('quantity'),
                ];
                $row['closing']   = $open + $row['received'] - $row['sold'] + $row['returned'] + $row['adjusted'];
                $models[$code]    = $row;
                $running[$code]   = $row['closing'];
            }

            $rows[] = ['start' => $start->toDateString(), 'end' => $end->toDateString(), 'models' => $models];
        }

        return array_reverse($rows);
    }

    /**
     * Refuse a change that would leave fewer than zero of a model in stock on
     * any day from $date onward — selling devices we never recorded receiving
     * means a delivery is missing from the book.
     */
    private function guardNoNegativeStock(string $model, string $date, int $delta): void
    {
        if ($delta >= 0) {
            return;
        }

        $before = (int) FetStockMovement::where('model', $model)->where('moved_on', '<', $date)->sum('quantity');
        $byDay  = FetStockMovement::where('model', $model)->where('moved_on', '>=', $date)
            ->selectRaw('moved_on, SUM(quantity) q')->groupBy('moved_on')->orderBy('moved_on')
            ->get()->mapWithKeys(fn ($r) => [substr((string) $r->moved_on, 0, 10) => (int) $r->q]);

        // Days are the finest grain recorded, so a delivery and a sale on the
        // same day net off before the floor is checked.
        $byDay[$date] = ($byDay[$date] ?? 0) + $delta;
        $byDay = $byDay->sortKeys();

        $level  = $before;
        $lowest = PHP_INT_MAX;
        foreach ($byDay as $q) {
            $level += $q;
            $lowest = min($lowest, $level);
        }

        if ($lowest < 0) {
            $label = FetStockMovement::MODELS[$model]['label'];
            throw ValidationException::withMessages([
                'quantity' => "That would leave {$label} stock below zero. Record the delivery these devices came from first.",
            ]);
        }
    }

    private function present(FetStockMovement $m): array
    {
        return [
            'id'         => $m->id,
            'model'      => $m->model,
            'type'       => $m->type,
            'quantity'   => $m->quantity,
            'moved_on'   => $m->moved_on->toDateString(),
            'reference'  => $m->reference,
            'note'       => $m->note,
            'created_by' => $m->creator?->name,
        ];
    }
}
