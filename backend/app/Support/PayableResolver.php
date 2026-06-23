<?php

namespace App\Support;

use App\Contracts\Payable;
use App\Models\InstallmentPayment;
use App\Models\Invoice;
use App\Models\Order;

/**
 * Finds the {@see Payable} behind a payment, across every payable type, by either
 * its reference (provider merchant ref) or the provider tracking id we stored.
 * The reference prefixes never collide: orders VIT-…, invoices INV-…, installments INST-….
 */
class PayableResolver
{
    public function byReference(string $reference): ?Payable
    {
        if (str_starts_with($reference, 'INST-')) {
            return InstallmentPayment::find((int) substr($reference, 5));
        }

        return Order::where('reference', $reference)->first()
            ?? Invoice::where('number', $reference)->first();
    }

    public function byTrackingId(string $trackingId): ?Payable
    {
        return Order::where('payment_reference', $trackingId)->first()
            ?? Invoice::where('payment_reference', $trackingId)->first()
            ?? InstallmentPayment::where('payment_reference', $trackingId)->first();
    }
}
