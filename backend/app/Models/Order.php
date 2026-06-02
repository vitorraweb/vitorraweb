<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'quantity',
        'unit_price_ugx',
        'unit_price_usd_cents',
        'currency',
        'total',
        'status',
        'payment_method',
        'payment_status',
        'payment_reference',
        'shipping_address',
        'tracking_number',
        'notes',
        'invoice_url',
    ];

    protected $casts = [
        'shipping_address'    => 'array',
        'unit_price_ugx'      => 'integer',
        'unit_price_usd_cents'=> 'integer',
        'total'               => 'integer',
        'quantity'            => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
