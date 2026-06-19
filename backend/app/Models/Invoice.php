<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    public const STATUSES = ['draft', 'sent', 'partial', 'paid', 'void'];

    protected $fillable = [
        'number', 'customer_user_id', 'customer_name', 'customer_email', 'customer_address',
        'currency', 'sector', 'issue_date', 'due_date',
        'subtotal', 'vat_total', 'total', 'amount_paid', 'status',
        'notes', 'terms', 'source', 'source_id', 'sent_at', 'last_reminded_at', 'created_by',
    ];

    protected $casts = [
        'issue_date'       => 'date',
        'due_date'         => 'date',
        'subtotal'         => 'integer',
        'vat_total'        => 'integer',
        'total'            => 'integer',
        'amount_paid'      => 'integer',
        'sent_at'          => 'datetime',
        'last_reminded_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function balance(): int
    {
        return max(0, (int) $this->total - (int) $this->amount_paid);
    }

    public function isOverdue(): bool
    {
        return in_array($this->status, ['sent', 'partial'], true)
            && $this->due_date !== null
            && $this->due_date->isPast()
            && $this->balance() > 0;
    }

    /** Recompute header totals from line items. */
    public function recalcTotals(): void
    {
        $items = $this->items()->get();
        $this->subtotal  = (int) $items->sum('line_subtotal');
        $this->vat_total = (int) $items->sum('vat_amount');
        $this->total     = (int) $items->sum('line_total');
        $this->save();
    }

    /** Next sequential invoice number for the current year, e.g. INV-2026-0007. */
    public static function nextNumber(): string
    {
        $year = now()->year;
        $prefix = "INV-{$year}-";
        $last = static::where('number', 'like', $prefix.'%')->orderByDesc('number')->value('number');
        $seq = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
