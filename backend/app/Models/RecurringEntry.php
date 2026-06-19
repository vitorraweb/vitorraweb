<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecurringEntry extends Model
{
    protected $fillable = [
        'type', 'finance_account_id', 'finance_category_id', 'sector', 'currency',
        'amount', 'vat_rate', 'description', 'day_of_month', 'is_active', 'last_run_period', 'created_by',
    ];

    protected $casts = [
        'amount'       => 'integer',
        'vat_rate'     => 'integer',
        'day_of_month' => 'integer',
        'is_active'    => 'boolean',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinanceAccount::class, 'finance_account_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinanceCategory::class, 'finance_category_id');
    }
}
