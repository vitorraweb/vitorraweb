<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PettyCashVoucher;
use App\Models\Setting;
use App\Support\AmountInWords;
use App\Support\Audit;
use App\Support\BrandedDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Console → Accounting → Petty cash: Finance fills in a voucher (who was paid,
 * what for, which department, how much), the system numbers it, and it is
 * printed or downloaded for signing. A voucher can be corrected until it is
 * voided; a voided one stays on file, marked VOID.
 */
class PettyCashController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $f = $request->validate(['q' => ['nullable', 'string', 'max:100'], 'from' => ['nullable', 'date'], 'to' => ['nullable', 'date']]);

        $rows = PettyCashVoucher::query()
            ->when($f['q'] ?? null, fn ($q, $t) => $q->where(fn ($w) => $w->where('number', 'like', "%{$t}%")->orWhere('paid_to', 'like', "%{$t}%")->orWhere('purpose', 'like', "%{$t}%")))
            ->when($f['from'] ?? null, fn ($q, $d) => $q->whereDate('voucher_date', '>=', $d))
            ->when($f['to'] ?? null, fn ($q, $d) => $q->whereDate('voucher_date', '<=', $d))
            ->latest('voucher_date')->latest('id')->limit(300)->get();

        return response()->json(['data' => $rows->map(fn (PettyCashVoucher $v) => $this->shape($v))]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $v = PettyCashVoucher::create($data + [
            'number' => PettyCashVoucher::nextNumber(),
            'created_by' => $request->user()->id,
            'status' => 'issued',
        ]);
        Audit::log('petty_cash.create', "Petty cash voucher {$v->number}: {$v->currency} {$v->total} to {$v->paid_to}", $v);

        return response()->json(['data' => $this->shape($v)], 201);
    }

    public function update(Request $request, PettyCashVoucher $voucher): JsonResponse
    {
        abort_if($voucher->status === 'void', 422, 'This voucher is void.');
        $voucher->update($this->validated($request));
        Audit::log('petty_cash.update', "Changed petty cash voucher {$voucher->number}", $voucher);

        return response()->json(['data' => $this->shape($voucher->fresh())]);
    }

    public function void(PettyCashVoucher $voucher): JsonResponse
    {
        $voucher->update(['status' => 'void']);
        Audit::log('petty_cash.void', "Voided petty cash voucher {$voucher->number}", $voucher);

        return response()->json(['data' => $this->shape($voucher)]);
    }

    public function pdf(PettyCashVoucher $voucher): Response
    {
        File::ensureDirectoryExists(storage_path('fonts'));
        $c = $voucher->currency;
        $s = Setting::resolved();

        return Pdf::loadView('documents.petty-cash-voucher', ['d' => [
            'art' => resource_path('document-art'),
            'company' => BrandedDocument::COMPANY + ['email' => 'support@vitorra.org', 'tin' => $s['company_tin'] ?? ''],
            'v' => $voucher,
            'date' => $voucher->voucher_date->format('d F Y'),
            'items' => collect($voucher->items)->values()->map(fn ($it, $i) => [
                'no' => $i + 1,
                'description' => (string) ($it['description'] ?? ''),
                'department' => (string) ($it['department'] ?? ''),
                'amount' => BrandedDocument::number($c, (int) ($it['amount'] ?? 0)),
            ])->all(),
            'total' => BrandedDocument::money($c, $voucher->total),
            'words' => AmountInWords::format($voucher->total, $c),
            'void' => $voucher->status === 'void',
        ]])->setPaper('a4')->setOption('dpi', 96)->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isFontSubsettingEnabled', true)
            ->download($voucher->number.'.pdf');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'voucher_date'        => ['required', 'date'],
            'paid_to'             => ['required', 'string', 'max:120'],
            'department'          => ['nullable', 'string', 'max:60'],
            'currency'            => ['nullable', Rule::in(['UGX', 'USD', 'EUR'])],
            'items'               => ['required', 'array', 'min:1', 'max:20'],
            'items.*.description' => ['required', 'string', 'max:200'],
            'items.*.department'  => ['nullable', 'string', 'max:60'],
            'items.*.amount'      => ['required', 'integer', 'min:1'],
            'purpose'             => ['nullable', 'string', 'max:500'],
            'prepared_by'         => ['nullable', 'string', 'max:120'],
            'approved_by'         => ['nullable', 'string', 'max:120'],
            'received_by'         => ['nullable', 'string', 'max:120'],
        ]);
        $items = array_map(fn ($it) => [
            'description' => trim($it['description']),
            'department' => trim((string) ($it['department'] ?? '')) ?: null,
            'amount' => (int) $it['amount'],
        ], $data['items']);

        return [
            'voucher_date' => $data['voucher_date'],
            'paid_to' => trim($data['paid_to']),
            'department' => $data['department'] ?? null,
            'currency' => $data['currency'] ?? 'UGX',
            'items' => $items,
            'total' => array_sum(array_column($items, 'amount')),
            'purpose' => $data['purpose'] ?? null,
            'prepared_by' => $data['prepared_by'] ?? $request->user()->name,
            'approved_by' => $data['approved_by'] ?? null,
            'received_by' => $data['received_by'] ?? null,
        ];
    }

    private function shape(PettyCashVoucher $v): array
    {
        return [
            'id' => $v->id, 'number' => $v->number, 'voucher_date' => $v->voucher_date->toDateString(),
            'paid_to' => $v->paid_to, 'department' => $v->department, 'currency' => $v->currency,
            'items' => $v->items, 'total' => $v->total, 'total_words' => AmountInWords::format($v->total, $v->currency),
            'purpose' => $v->purpose, 'prepared_by' => $v->prepared_by, 'approved_by' => $v->approved_by,
            'received_by' => $v->received_by, 'status' => $v->status,
        ];
    }
}
