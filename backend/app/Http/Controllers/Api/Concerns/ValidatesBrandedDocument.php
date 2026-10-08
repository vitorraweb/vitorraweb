<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Quotation;
use Illuminate\Validation\Rule;

/** Validation shared by quotations, invoices and the live preview. */
trait ValidatesBrandedDocument
{
    protected function brandedRules(): array
    {
        return [
            'business'           => ['nullable', Rule::in(Quotation::BUSINESSES)],
            'customer_name'      => ['required', 'string', 'max:255'],
            'customer_email'     => ['nullable', 'email', 'max:255'],
            'customer_address'   => ['nullable', 'string', 'max:1000'],
            'customer_attention' => ['nullable', 'string', 'max:255'],
            'customer_tax_id'    => ['nullable', 'string', 'max:64'],
            'customer_phone'     => ['nullable', 'string', 'max:64'],
            'currency'           => ['required', Rule::in(['UGX', 'USD', 'EUR'])],
            'sales_contact'      => ['nullable', 'string', 'max:255'],
            'reference'          => ['nullable', 'string', 'max:255'],
            'incoterms'          => ['nullable', 'string', 'max:255'],
            'port_of_loading'    => ['nullable', 'string', 'max:255'],
            'payment_terms'      => ['nullable', 'string', 'max:255'],
            'payment_schedule'   => ['nullable', 'string', 'max:2000'],
            'inspection'         => ['nullable', 'string', 'max:2000'],
            'shipment_schedule'  => ['nullable', 'string', 'max:2000'],
            'deposit_percent'    => ['nullable', 'integer', 'min:1', 'max:100'],
            'tax_rate'           => ['nullable', 'integer', 'min:0', 'max:100'],
            'tax_label'          => ['nullable', 'string', 'max:60'],
            'total_label'        => ['nullable', 'string', 'max:60'],
            'issue_date'         => ['nullable', 'date'],
            'notes'              => ['nullable', 'string', 'max:2000'],
        ];
    }

    /** Line items: name (or legacy description), details, quantity, unit, unit_price in minor units. */
    protected function itemRules(string $nameKey = 'name'): array
    {
        return [
            'items'                => ['required', 'array', 'min:1', 'max:60'],
            "items.*.{$nameKey}"   => ['required', 'string', 'max:500'],
            'items.*.details'      => ['nullable', 'string', 'max:1000'],
            'items.*.quantity'     => ['required', 'integer', 'min:1', 'max:100000000'],
            'items.*.unit'         => ['nullable', 'string', 'max:20'],
            'items.*.unit_price'   => ['required', 'integer', 'min:0', 'max:1000000000000'],
        ];
    }
}
