<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FetStockMovement;
use App\Models\Product;
use App\Support\Audit;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * FET stock overview for Finance: devices received, sold, returned and
 * corrected per model, rolled up week by week (Monday–Sunday), and who is
 * holding them (the Operations office is the main store). Stock levels are
 * always derived from the movements, never stored, so a late entry or a
 * deletion re-flows every week after it.
 */
class FetStockController extends Controller
{
    /** Current stock per model, the weekly overview, and recent movements. */
    public function index(Request $request): JsonResponse
    {
        $weeks = (int) ($request->validate(['weeks' => ['sometimes', 'integer', 'min:1', 'max:52']])['weeks'] ?? 8);

        $prices = Product::whereIn('slug', array_filter(array_column(FetStockMovement::MODELS, 'slug')))->pluck('price_ugx', 'slug');

        $onHand = FetStockMovement::selectRaw('model, SUM(quantity) q')->groupBy('model')->pluck('q', 'model');
        $models = collect(FetStockMovement::MODELS)->map(function (array $m, string $code) use ($onHand, $prices) {
            $qty   = (int) ($onHand[$code] ?? 0);
            $price = $m['slug'] ? ($prices[$m['slug']] ?? null) : null;

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
            'holders'   => $this->holders(),
            'holder_names' => FetStockMovement::whereNotNull('holder')->distinct()->orderBy('holder')->pluck('holder')
                ->prepend(FetStockMovement::MAIN_HOLDER)->unique()->values(),
            'main_holder' => FetStockMovement::MAIN_HOLDER,
            // A hand-over is two rows; the list shows it once, from the giver's side.
            'movements' => $this->withPartners(FetStockMovement::with('creator:id,name')
                ->where(fn ($q) => $q->where('type', '!=', 'transfer')->orWhere('quantity', '<', 0))
                ->orderByDesc('moved_on')->orderByDesc('id')->limit(100)->get())
                ->map(fn (FetStockMovement $m) => $this->present($m)),
            'types'     => FetStockMovement::TYPES,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $rows = $this->rowsFrom($this->validated($request));

        $created = $this->guarded($rows, [], function () use ($rows, $request) {
            $first = null;
            foreach ($rows as $row) {
                $m = FetStockMovement::create([...$row, 'created_by' => $request->user()->id]);
                $first ??= $m;
            }

            return $first;
        });

        return response()->json(['data' => $this->present($created->load('creator:id,name'))], 201);
    }

    /**
     * Correct an entry (Finance). A hand-over is edited as one entry — both of
     * its rows change together. Every edit is kept in the activity log with
     * what it said before.
     */
    public function update(Request $request, FetStockMovement $movement): JsonResponse
    {
        $old  = $movement->transfer_id ? FetStockMovement::where('transfer_id', $movement->transfer_id)->orderBy('quantity')->get() : collect([$movement]);
        $rows = $this->rowsFrom($this->validated($request));
        $before = $this->present($movement);

        $saved = $this->guarded($rows, $old->all(), function () use ($rows, $old, $movement) {
            // Same shape (one plain row → one plain row): change it in place.
            if (count($rows) === 1 && $old->count() === 1 && ! $movement->transfer_id) {
                $movement->update([...$rows[0], 'transfer_id' => null]);

                return $movement;
            }
            // A hand-over on either side: replace the rows, keeping who first recorded it.
            $by = $movement->created_by;
            $old->each->delete();
            $first = null;
            foreach ($rows as $row) {
                $m = FetStockMovement::create([...$row, 'created_by' => $by]);
                $first ??= $m;
            }

            return $first;
        });

        $after = $this->present($saved->fresh()->load('creator:id,name'));
        Audit::log('fet_stock.update', "Corrected FET stock entry #{$movement->id} ({$before['type']} {$before['quantity']} × {$before['model']} on {$before['moved_on']})", $saved, [
            'before' => $before, 'after' => $after,
        ]);

        return response()->json(['data' => $after]);
    }

    /** Remove a mistaken entry — senior finance only, recorded in the activity log. */
    public function destroy(FetStockMovement $movement): JsonResponse
    {
        $rows = $movement->transfer_id ? FetStockMovement::where('transfer_id', $movement->transfer_id)->get() : collect([$movement]);

        // Removing a delivery that devices were later sold out of would leave stock negative.
        $this->guarded([], $rows->all(), fn () => $rows->each->delete());

        Audit::log('fet_stock.delete', "Removed FET stock entry: {$movement->type} {$movement->quantity} × {$movement->model} on {$movement->moved_on->toDateString()}", $movement, [
            'model' => $movement->model, 'type' => $movement->type, 'quantity' => $movement->quantity,
            'moved_on' => $movement->moved_on->toDateString(), 'reference' => $movement->reference,
            'holder' => $movement->holder, 'rows' => $rows->count(),
        ]);

        return response()->json(['message' => 'Stock entry removed.']);
    }

    /**
     * Where the devices are right now, as a printable PDF: each person or
     * office holding FET, how many of each model, with a line for each holder
     * to sign that the count is right.
     */
    public function holdersPdf(Request $request): Response
    {
        $pdf = Pdf::loadView('documents.fet-stock-holders', [
            'holders'   => $this->holders(),
            'models'    => FetStockMovement::MODELS,
            'asAt'      => CarbonImmutable::now(),
            'printedBy' => $request->user()?->name,
        ])->setPaper('a4');

        return $pdf->download('vitorra-fet-where-kept-'.now()->toDateString().'.pdf');
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
     * One week's FET status, as a printable PDF: every device that left stock
     * (date, model, quantity, who picked it up, reference), then the week's
     * opening and closing stock per model, with lines to sign.
     */
    public function weekPdf(Request $request): Response
    {
        $day   = $request->validate(['week' => ['required', 'date']])['week'];
        $start = CarbonImmutable::parse($day)->startOfWeek(CarbonImmutable::MONDAY);
        $end   = $start->addDays(6);

        $inWeek = FetStockMovement::with('creator:id,name')
            ->whereBetween('moved_on', [$start->toDateString(), $end->toDateString()])
            ->orderBy('moved_on')->orderBy('id')->get();
        $opening = FetStockMovement::where('moved_on', '<', $start->toDateString())
            ->selectRaw('model, SUM(quantity) q')->groupBy('model')->pluck('q', 'model');

        $summary = [];
        foreach (FetStockMovement::MODELS as $code => $m) {
            $mine = $inWeek->where('model', $code);
            $row  = [
                'label'    => $m['label'],
                'opening'  => (int) ($opening[$code] ?? 0),
                'received' => (int) $mine->where('type', 'received')->sum('quantity'),
                'out'      => (int) -$mine->where('type', 'sold')->sum('quantity'),
                'returned' => (int) $mine->where('type', 'returned')->sum('quantity'),
                'adjusted' => (int) $mine->where('type', 'adjustment')->sum('quantity'),
            ];
            $row['closing'] = $row['opening'] + $row['received'] - $row['out'] + $row['returned'] + $row['adjusted'];
            $summary[$code] = $row;
        }

        // A hand-over between holders moves devices but none leave the company.
        $out = $inWeek->filter(fn (FetStockMovement $m) => $m->quantity < 0 && $m->type !== 'transfer')->values();

        $pdf = Pdf::loadView('documents.fet-stock-week', [
            'start'   => $start,
            'end'     => $end,
            'out'     => $out,
            'summary' => $summary,
            'models'  => FetStockMovement::MODELS,
            'printedBy' => $request->user()?->name,
        ])->setPaper('a4');

        return $pdf->download('vitorra-fet-status-'.$start->toDateString().'.pdf');
    }

    /**
     * Opening, movements and closing per model, week by week in date order
     * (oldest first, the current week last). The list starts at the first week
     * anything was recorded, so a new row appears only when a new week begins;
     * at most the last $weeks weeks. Weeks run Monday to Sunday.
     */
    private function weekly(int $weeks): array
    {
        $thisWeek = CarbonImmutable::today()->startOfWeek(CarbonImmutable::MONDAY);
        $first    = $thisWeek->subWeeks($weeks - 1);
        $started  = FetStockMovement::min('moved_on');
        if ($started !== null) {
            $first = max($first, CarbonImmutable::parse($started)->startOfWeek(CarbonImmutable::MONDAY));
        } else {
            $first = $thisWeek;
        }

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

        return $rows;
    }

    /** The request, checked. Shared by recording and correcting an entry. */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'model'     => ['required', Rule::in(array_keys(FetStockMovement::MODELS))],
            'type'      => ['required', Rule::in(FetStockMovement::TYPES)],
            // Adjustments are signed (a count found 2 fewer → −2); the others are a plain count.
            'quantity'  => ['required', 'integer', 'not_in:0', 'between:-10000,10000'],
            'moved_on'  => ['required', 'date', 'before_or_equal:today'],
            'reference' => ['nullable', 'string', 'max:255'],
            // The person who collected the devices from stock signs for them.
            'picked_by' => ['nullable', 'required_if:type,sold', 'string', 'max:255'],
            // Who keeps them: "received by" for a delivery, "taken from" otherwise. Blank = the main store.
            'holder'    => ['nullable', 'string', 'max:255'],
            'to_holder' => ['nullable', 'required_if:type,transfer', 'string', 'max:255'],
            'note'      => ['nullable', 'string', 'max:2000'],
        ], [
            'picked_by.required_if' => 'Enter the name of the person who picked up the devices.',
            'to_holder.required_if' => 'Enter the person or office the devices were handed to.',
        ]);

        $data['moved_on'] = CarbonImmutable::parse($data['moved_on'])->toDateString();
        if ($data['type'] !== 'adjustment' && (int) $data['quantity'] < 0) {
            throw ValidationException::withMessages(['quantity' => 'Enter how many devices — the type decides whether stock goes up or down.']);
        }
        if ($data['type'] === 'adjustment' && blank($data['note'] ?? null)) {
            throw ValidationException::withMessages(['note' => 'Say why the stock is being corrected (e.g. "stock count 24 Oct").']);
        }

        return $data;
    }

    /** The row(s) an entry is stored as: one, or two linked rows for a hand-over. */
    private function rowsFrom(array $data): array
    {
        $qty    = (int) $data['quantity'];
        $holder = FetStockMovement::normaliseHolder($data['holder'] ?? null);
        $base   = [
            'model' => $data['model'], 'type' => $data['type'], 'moved_on' => $data['moved_on'],
            'reference' => $data['reference'] ?? null, 'note' => $data['note'] ?? null,
            'picked_by' => $data['picked_by'] ?? null, 'holder' => $holder,
        ];

        if ($data['type'] !== 'transfer') {
            return [[...$base, 'quantity' => $data['type'] === 'sold' ? -$qty : $qty, 'transfer_id' => null]];
        }

        $to = FetStockMovement::normaliseHolder($data['to_holder']);
        if (mb_strtolower($to) === mb_strtolower($holder)) {
            throw ValidationException::withMessages(['to_holder' => 'The devices are already with '.$holder.'. Pick who they were handed to.']);
        }
        $id = (string) Str::uuid();

        return [
            [...$base, 'quantity' => -$qty, 'transfer_id' => $id],
            [...$base, 'holder' => $to, 'quantity' => $qty, 'transfer_id' => $id],
        ];
    }

    /**
     * Run a change, then refuse it (rolling it back) if it leaves fewer than
     * zero of a model in the company, or with any one holder, on any day from
     * the change onward. Selling devices we never recorded receiving means a
     * delivery is missing; taking them from someone who doesn't have them means
     * a hand-over is missing. A holder already below zero from older entries
     * can still be corrected, as long as the change doesn't make it worse.
     */
    private function guarded(array $newRows, array $oldRows, callable $write): mixed
    {
        $checks = [];
        foreach ([...$newRows, ...array_map(fn (FetStockMovement $m) => [
            'model' => $m->model, 'holder' => $m->holder, 'moved_on' => $m->moved_on->toDateString(),
        ], $oldRows)] as $r) {
            foreach ([null, $r['holder'] ?? null] as $holder) {
                $key = $r['model'].'|'.($holder ?? '*');
                $checks[$key] = ['model' => $r['model'], 'holder' => $holder, 'from' => min($checks[$key]['from'] ?? $r['moved_on'], $r['moved_on'])];
            }
        }
        if ($oldRows === [] && array_sum(array_column($newRows, 'quantity')) >= 0 && count($newRows) === 1) {
            $checks = []; // a plain addition can't take anything below zero
        }

        $before = [];
        foreach ($checks as $key => $c) {
            $before[$key] = $this->lowest($c['model'], $c['holder'], $c['from']);
        }

        return DB::transaction(function () use ($write, $checks, $before) {
            $result = $write();
            foreach ($checks as $key => $c) {
                $after = $this->lowest($c['model'], $c['holder'], $c['from']);
                if ($after >= 0 || $after >= $before[$key]) {
                    continue;
                }
                $label = FetStockMovement::MODELS[$c['model']]['label'];
                throw ValidationException::withMessages($c['holder'] === null
                    ? ['quantity' => "That would leave {$label} stock below zero. Record the delivery these devices came from first."]
                    : ['holder' => "{$c['holder']} would be left holding fewer than zero {$label}. Check who has these devices, or record the hand-over to {$c['holder']} first."]);
            }

            return $result;
        });
    }

    /** The lowest level a model reaches (company-wide, or with one holder) on any day from $from on. */
    private function lowest(string $model, ?string $holder, string $from): int
    {
        $q = fn () => FetStockMovement::where('model', $model)->when($holder !== null, fn ($w) => $w->where('holder', $holder));
        $level = (int) $q()->where('moved_on', '<', $from)->sum('quantity');
        // Days are the finest grain recorded, so a delivery and a sale on the
        // same day net off before the floor is checked.
        $lowest = $level;
        foreach ($q()->where('moved_on', '>=', $from)->selectRaw('moved_on, SUM(quantity) q')->groupBy('moved_on')->orderBy('moved_on')->pluck('q') as $day) {
            $level += (int) $day;
            $lowest = min($lowest, $level);
        }

        return $lowest;
    }

    /**
     * Devices per holder right now: the main store first, then whoever holds
     * the most. Holders who have handed everything back drop off the list.
     */
    private function holders(): array
    {
        $rows = FetStockMovement::selectRaw('holder, model, SUM(quantity) q, MAX(moved_on) last_on')->groupBy('holder', 'model')->get();

        $out = [];
        foreach ($rows->groupBy(fn ($r) => $r->holder ?? FetStockMovement::MAIN_HOLDER) as $name => $mine) {
            $models = [];
            foreach (array_keys(FetStockMovement::MODELS) as $code) {
                $models[$code] = (int) ($mine->where('model', $code)->sum('q'));
            }
            $main = $name === FetStockMovement::MAIN_HOLDER;
            if (! $main && ! array_filter($models)) {
                continue;
            }
            $out[] = [
                'holder' => $name, 'main' => $main, 'models' => $models, 'total' => array_sum($models),
                'last_moved_on' => substr((string) $mine->max('last_on'), 0, 10),
            ];
        }
        if (! collect($out)->firstWhere('main', true)) {
            $out[] = ['holder' => FetStockMovement::MAIN_HOLDER, 'main' => true, 'models' => array_fill_keys(array_keys(FetStockMovement::MODELS), 0), 'total' => 0, 'last_moved_on' => null];
        }

        usort($out, fn ($a, $b) => [$b['main'], $b['total'], $a['holder']] <=> [$a['main'], $a['total'], $b['holder']]);

        return $out;
    }

    /** Attach the receiving side to each hand-over row. */
    private function withPartners(Collection $movements): Collection
    {
        $ids = $movements->pluck('transfer_id')->filter()->all();
        $to  = $ids ? FetStockMovement::whereIn('transfer_id', $ids)->where('quantity', '>', 0)->pluck('holder', 'transfer_id') : collect();
        $movements->each(fn (FetStockMovement $m) => $m->setAttribute('to_holder', $m->transfer_id ? ($to[$m->transfer_id] ?? null) : null));

        return $movements;
    }

    private function present(FetStockMovement $m): array
    {
        $to = $m->transfer_id && $m->getAttribute('to_holder') === null
            ? FetStockMovement::where('transfer_id', $m->transfer_id)->where('quantity', '>', 0)->value('holder')
            : $m->getAttribute('to_holder');

        return [
            'id'         => $m->id,
            'model'      => $m->model,
            'type'       => $m->type,
            // A hand-over reads as the number of devices handed over.
            'quantity'   => $m->type === 'transfer' ? abs($m->quantity) : $m->quantity,
            'moved_on'   => $m->moved_on->toDateString(),
            'reference'  => $m->reference,
            'picked_by'  => $m->picked_by,
            'holder'     => $m->holder ?? FetStockMovement::MAIN_HOLDER,
            'to_holder'  => $to,
            'note'       => $m->note,
            'created_by' => $m->creator?->name,
        ];
    }
}
