<?php

namespace App\Support;

use App\Contracts\Payable;
use App\Models\Invoice;
use App\Models\Order;

/**
 * Finds the {@see Payable} behind a payment, across every payable type, by either
 * its reference (provider merchant ref) or the provider tracking id we stored.
 * Order references (VIT-…) and invoice numbers (INV-…) never collide.
 */
class PayableResolver
{
    public function byReference(string $reference): ?Payable
    {
        return Order::where('reference', $reference)->first()
            ?? Invoice::where('number', $reference)->first();
    }

    public function byTrackingId(string $trackingId): ?Payable
    {
        return Order::where('payment_reference', $trackingId)->first()
            ?? Invoice::where('payment_reference', $trackingId)->first();
    }
}
