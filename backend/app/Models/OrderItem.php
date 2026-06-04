<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'product_slug',
        'options',
        'quantity',
        'unit_price_ugx',
        'unit_price_usd_cents',
        'line_total',
    ];

    protected $casts = [
        'options'              => 'array',
        'quantity'             => 'integer',
        'unit_price_ugx'       => 'integer',
        'unit_price_usd_cents' => 'integer',
        'line_total'           => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
