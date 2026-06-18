<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierDocument extends Model
{
    public const TYPES = ['registration', 'contract', 'tax', 'other'];

    protected $fillable = [
        'supplier_id', 'type', 'title', 'path', 'original_name', 'size', 'uploaded_by',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
