<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ValidatesBrandedDocument;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Support\BrandedDocument;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Live preview for the quotation / invoice editor: renders the exact PDF the
 * customer would receive from the unsaved form, without storing anything.
 */
class DocumentPreviewController extends Controller
{
    use ValidatesBrandedDocument;

    public function __invoke(Request $request): Response
    {
        $rules = $this->brandedRules() + $this->itemRules('name') + [
            'type'        => ['required', Rule::in(['quotation', 'invoice'])],
            'kind'        => ['nullable', Rule::in(Invoice::KINDS)],
            'number'      => ['nullable', 'string', 'max:40'],
            'valid_until' => ['nullable', 'date'],
            'due_date'    => ['nullable', 'date'],
            'terms'       => ['nullable', 'string', 'max:2000'],
        ];
        // A preview of a half-typed form should still render.
        $rules['customer_name'] = ['nullable', 'string', 'max:255'];
        $rules['items'] = ['present', 'array', 'max:60'];
        $rules['items.*.name'] = ['nullable', 'string', 'max:500'];
        $data = $request->validate($rules);

        $fields = collect($data)->except(['items', 'type'])->all();
        $fields['business'] ??= 'coffee';
        $fields['tax_rate'] ??= 0;
        $doc = $data['type'] === 'quotation' ? new Quotation($fields) : new Invoice($fields + ['kind' => $data['kind'] ?? 'standard']);
        $doc->number = $data['number'] ?? null;
        $doc->business = $fields['business'];

        $pdf = BrandedDocument::pdf($doc, $data['items'])->output();

        return response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="preview.pdf"',
            'Cache-Control'       => 'no-store',
        ]);
    }
}
