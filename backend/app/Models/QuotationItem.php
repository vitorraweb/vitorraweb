<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends Model
{
    protected $fillable = ['quotation_id', 'position', 'name', 'details', 'quantity', 'unit', 'unit_price', 'line_total'];

    protected $casts = ['quantity' => 'integer', 'unit_price' => 'integer', 'line_total' => 'integer', 'position' => 'integer'];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }
}
