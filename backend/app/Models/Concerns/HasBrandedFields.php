<?php

namespace App\Models\Concerns;

/**
 * Fields shared by quotations and invoices that print on the Finance team's
 * branded Coffee / FET templates (see App\Support\BrandedDocument).
 */
trait HasBrandedFields
{
    public const BUSINESSES = ['coffee', 'fet'];

    /** Columns that copy across verbatim when a quotation becomes an invoice. */
    public const BRANDED_FIELDS = [
        'business', 'customer_name', 'customer_email', 'customer_address', 'customer_attention',
        'customer_tax_id', 'customer_phone', 'currency', 'sales_contact', 'reference', 'incoterms',
        'port_of_loading', 'payment_terms', 'payment_schedule', 'inspection', 'shipment_schedule',
        'deposit_percent', 'tax_rate', 'tax_label', 'total_label',
    ];

    public function isBranded(): bool
    {
        return in_array($this->business, self::BUSINESSES, true);
    }
}
