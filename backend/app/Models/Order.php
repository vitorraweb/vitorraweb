<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'reference',
        'user_id',
        'enquiry_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'currency',
        'subtotal',
        'total',
        'status',
        'payment_method',
        'payment_status',
        'payment_reference',
        'shipping_address',
        'preferred_installation_date',
        'installation_location',
        'tracking_number',
        'notes',
        'invoice_url',
        'delivered_at',
    ];

    protected $casts = [
        'shipping_address'             => 'array',
        'subtotal'                     => 'integer',
        'total'                        => 'integer',
        'preferred_installation_date'  => 'date',
        'delivered_at'                 => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(Enquiry::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Format an amount stored in this order's currency unit
     * (UGX whole shillings, USD cents) as a display string.
     */
    public function money(int $amount): string
    {
        return $this->currency === 'USD'
            ? '$' . number_format($amount / 100, 2)
            : 'UGX ' . number_format($amount);
    }

    /** The unit price of a line item expressed in this order's currency. */
    public function unitPrice(OrderItem $item): int
    {
        return $this->currency === 'USD'
            ? $item->unit_price_usd_cents
            : $item->unit_price_ugx;
    }
}
