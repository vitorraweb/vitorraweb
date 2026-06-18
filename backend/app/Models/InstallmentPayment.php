<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstallmentPayment extends Model
{
    public const METHODS = ['cash', 'bank', 'mobile_money', 'other'];

    protected $fillable = [
        'installment_plan_id', 'label', 'amount', 'due_date',
        'paid_at', 'method', 'reference', 'recorded_by', 'note',
    ];

    protected $casts = [
        'amount'   => 'integer',
        'due_date' => 'date',
        'paid_at'  => 'datetime',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(InstallmentPlan::class, 'installment_plan_id');
    }
}
