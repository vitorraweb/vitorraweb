<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceTransaction extends Model
{
    public const TYPES    = ['income', 'expense', 'transfer'];
    public const STATUSES = ['draft', 'approved', 'void'];
    public const SECTORS  = ['FET', 'SEAL', 'COFFEE', 'LOGISTICS', 'GENERAL'];

    protected $fillable = [
        'type', 'finance_account_id', 'transfer_to_account_id', 'finance_category_id',
        'sector', 'currency', 'amount', 'occurred_on', 'description', 'reference',
        'status', 'source', 'source_id', 'receipt_path',
        'recorded_by', 'approved_by', 'approved_at',
    ];

    protected $casts = [
        'amount'      => 'integer',
        'occurred_on' => 'date',
        'approved_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'finance_account_id');
    }

    public function toAccount(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'transfer_to_account_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinanceCategory::class, 'finance_category_id');
    }
}
