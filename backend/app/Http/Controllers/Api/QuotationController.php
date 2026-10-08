<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ValidatesBrandedDocument;
use App\Http\Controllers\Controller;
use App\Mail\QuotationMail;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Support\BrandedDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Quotations on the Finance team's branded Coffee / FET templates.
 * draft → sent → accepted / declined (or void); an accepted quotation turns
 * into a commercial or final invoice in one step, copying every field.
 */
class QuotationController extends Controller
{
    use ValidatesBrandedDocument;

    public function index(Request $request): JsonResponse
    {
        $q = Quotation::with('invoices:id,quotation_id,number,kind,status')->latest('issue_date')->latest('id');
        if ($request->filled('status')) {
            $request->query('status') === 'expired'
                ? $q->where('status', 'sent')->whereDate('valid_until', '<', now())
                : $q->where('status', $request->query('status'));
        }
        if ($request->filled('business')) {
            $q->where('business', $request->query('business'));
        }
        if ($request->filled('q')) {
            $term = '%'.addcslashes((string) $request->query('q'), '%_\\').'%';
            $q->where(fn ($w) => $w->where('number', 'like', $term)->orWhere('customer_name', 'like', $term)->orWhere('customer_email', 'like', $term));
        }

        return response()->json([
            'data'     => $q->limit(500)->get()->map(fn (Quotation $x) => $this->shape($x)),
            'statuses' => Quotation::STATUSES,
        ]);
    }

    public function show(Quotation $quotation): JsonResponse
    {
        return response()->json(['data' => $this->shape($quotation->load('items', 'invoices'), full: true)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $quotation = DB::transaction(function () use ($data, $request) {
            $quotation = Quotation::create($this->fields($data) + [
                'number'     => Quotation::nextNumber($data['business'] ?? null),
                'status'     => 'draft',
                'created_by' => $request->user()->id,
            ]);
            $this->syncItems($quotation, $data['items']);

            return $quotation;
        });

        return response()->json(['data' => $this->shape($quotation->fresh(['items', 'invoices']), full: true)], 201);
    }

    public function update(Request $request, Quotation $quotation): JsonResponse
    {
        if (! in_array($quotation->status, ['draft', 'sent'], true)) {
            return response()->json(['message' => 'Only a draft or sent quotation can be edited.'], 422);
        }
        $data = $this->validated($request);

        DB::transaction(function () use ($quotation, $data) {
            $quotation->update($this->fields($data));
            $quotation->items()->delete();
            $this->syncItems($quotation, $data['items']);
        });

        return response()->json(['data' => $this->shape($quotation->fresh(['items', 'invoices']), full: true)]);
    }

    public function pdf(Quotation $quotation): Response
    {
        return BrandedDocument::pdf($quotation->load('items'))->download($quotation->number.'.pdf');
    }

    /** Email the quotation PDF to the customer and mark it sent. */
    public function send(Quotation $quotation): JsonResponse
    {
        if (! $quotation->customer_email) {
            return response()->json(['message' => 'Add a customer email before sending.'], 422);
        }
        if ($quotation->status === 'void') {
            return response()->json(['message' => 'This quotation is void.'], 422);
        }

        $pdf = BrandedDocument::pdf($quotation->load('items'))->output();
        Mail::to($quotation->customer_email)->send(new QuotationMail($quotation, $pdf));

        if ($quotation->status === 'draft') {
            $quotation->update(['status' => 'sent', 'sent_at' => now()]);
        }

        return response()->json(['data' => $this->shape($quotation->fresh(['items', 'invoices']), full: true)]);
    }

    /** Record the customer's answer, or withdraw the quotation. */
    public function status(Request $request, Quotation $quotation): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['sent', 'accepted', 'declined', 'void'])]]);
        if ($quotation->status === 'void') {
            return response()->json(['message' => 'This quotation is void.'], 422);
        }
        $quotation->update(['status' => $data['status']]);

        return response()->json(['data' => $this->shape($quotation->fresh(['items', 'invoices']), full: true)]);
    }

    /**
     * Turn the quotation into an invoice (commercial or final) — a new draft
     * carrying every field and line across. The quotation is marked accepted.
     */
    public function convert(Request $request, Quotation $quotation): JsonResponse
    {
        $data = $request->validate([
            'kind'     => ['required', Rule::in(Invoice::KINDS)],
            'due_date' => ['nullable', 'date'],
        ]);
        if (in_array($quotation->status, ['declined', 'void'], true)) {
            return response()->json(['message' => 'A declined or void quotation cannot be invoiced.'], 422);
        }

        $invoice = DB::transaction(function () use ($quotation, $data, $request) {
            $quotation->load('items');
            $invoice = Invoice::create($quotation->only(Quotation::BRANDED_FIELDS) + [
                'number'       => Invoice::nextNumberFor($quotation->business, $data['kind']),
                'kind'         => $data['kind'],
                'quotation_id' => $quotation->id,
                'sector'       => match ($quotation->business) { 'coffee' => 'COFFEE', 'fet' => 'FET', default => null },
                'issue_date'   => now()->toDateString(),
                'due_date'     => $data['due_date'] ?? now()->addDays(30)->toDateString(),
                'notes'        => $quotation->notes,
                'status'       => 'draft',
                'source'       => 'quotation',
                'source_id'    => $quotation->id,
                'created_by'   => $request->user()->id,
            ]);
            foreach ($quotation->items as $it) {
                $subtotal = $it->quantity * $it->unit_price;
                $vat = (int) round($subtotal * $quotation->tax_rate / 100);
                $invoice->items()->create([
                    'description'   => $it->name,
                    'details'       => $it->details,
                    'unit'          => $it->unit,
                    'quantity'      => $it->quantity,
                    'unit_price'    => $it->unit_price,
                    'vat_rate'      => $quotation->tax_rate,
                    'line_subtotal' => $subtotal,
                    'vat_amount'    => $vat,
                    'line_total'    => $subtotal + $vat,
                ]);
            }
            $invoice->recalcTotals();
            if (in_array($quotation->status, ['draft', 'sent'], true)) {
                $quotation->update(['status' => 'accepted']);
            }

            return $invoice;
        });

        return response()->json(['data' => ['id' => $invoice->id, 'number' => $invoice->number]], 201);
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    private function validated(Request $request): array
    {
        return $request->validate($this->brandedRules() + $this->itemRules('name') + [
            'valid_until' => ['nullable', 'date'],
        ]);
    }

    private function fields(array $data): array
    {
        $out = collect($data)->only([...Quotation::BRANDED_FIELDS, 'valid_until', 'notes'])->all();
        $out['issue_date'] = $data['issue_date'] ?? now()->toDateString();
        $out['tax_rate'] = $data['tax_rate'] ?? 0;

        return $out;
    }

    private function syncItems(Quotation $quotation, array $items): void
    {
        foreach (array_values($items) as $i => $row) {
            $quotation->items()->create([
                'position'   => $i,
                'name'       => $row['name'],
                'details'    => $row['details'] ?? null,
                'quantity'   => $row['quantity'],
                'unit'       => $row['unit'] ?? null,
                'unit_price' => $row['unit_price'],
                'line_total' => $row['quantity'] * $row['unit_price'],
            ]);
        }
        $quotation->recalcTotals();
    }

    private function shape(Quotation $x, bool $full = false): array
    {
        $out = [
            'id'            => $x->id,
            'number'        => $x->number,
            'business'      => $x->business,
            'status'        => $x->status,
            'is_expired'    => $x->isExpired(),
            'customer_name' => $x->customer_name,
            'customer_email' => $x->customer_email,
            'currency'      => $x->currency,
            'issue_date'    => optional($x->issue_date)->toDateString(),
            'valid_until'   => optional($x->valid_until)->toDateString(),
            'subtotal'      => $x->subtotal,
            'tax_total'     => $x->tax_total,
            'total'         => $x->total,
            'invoices'      => $x->invoices->map(fn (Invoice $i) => ['id' => $i->id, 'number' => $i->number, 'kind' => $i->kind, 'status' => $i->status])->all(),
        ];
        if ($full) {
            $out += $x->only([...Quotation::BRANDED_FIELDS, 'notes']) + [
                'items' => $x->items->map(fn ($it) => $it->only(['name', 'details', 'quantity', 'unit', 'unit_price', 'line_total']))->all(),
            ];
        }

        return $out;
    }
}
