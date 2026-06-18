<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstallmentPlan extends Model
{
    protected $fillable = ['order_id', 'currency', 'total', 'note', 'created_by'];

    protected $casts = [
        'total' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InstallmentPayment::class)->orderBy('due_date')->orderBy('id');
    }

    /** Total received so far (in the order currency unit). */
    public function paidAmount(): int
    {
        return (int) $this->payments()->whereNotNull('paid_at')->sum('amount');
    }
}
