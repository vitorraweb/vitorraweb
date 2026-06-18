<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierBill extends Model
{
    public const STATUSES = ['unpaid', 'paid', 'void'];

    protected $fillable = [
        'supplier_id', 'vendor_name', 'finance_category_id', 'sector', 'currency',
        'amount', 'due_date', 'status', 'description', 'reference', 'paid_transaction_id', 'created_by',
    ];

    protected $casts = [
        'amount'   => 'integer',
        'due_date' => 'date',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinanceCategory::class, 'finance_category_id');
    }

    public function vendorLabel(): string
    {
        return $this->supplier?->company_name ?? $this->vendor_name ?? 'Vendor';
    }
}
