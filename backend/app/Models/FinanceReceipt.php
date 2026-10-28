<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A scanned or uploaded receipt in Finance's inbox (file encrypted at rest). */
class FinanceReceipt extends Model
{
    protected $fillable = [
        'path', 'original_name', 'mime', 'size', 'source', 'uploaded_by', 'status',
        'vendor', 'receipt_date', 'currency', 'amount_minor', 'vat_rate', 'description', 'note',
        'read_at', 'read_attempts', 'finance_transaction_id',
    ];

    protected $casts = [
        'receipt_date' => 'date:Y-m-d',
        'read_at'      => 'datetime',
        'amount_minor' => 'integer',
        'vat_rate'     => 'integer',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(FinanceTransaction::class, 'finance_transaction_id');
    }
}
