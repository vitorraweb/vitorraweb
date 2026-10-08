<?php

namespace App\Models;

use App\Models\Concerns\HasBrandedFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quotation extends Model
{
    use HasBrandedFields;

    public const STATUSES = ['draft', 'sent', 'accepted', 'declined', 'void'];

    protected $fillable = [
        'number', 'status', 'customer_name', 'customer_email', 'customer_address', 'currency',
        'issue_date', 'valid_until', 'business', 'customer_attention', 'customer_tax_id', 'customer_phone',
        'sales_contact', 'reference', 'incoterms', 'port_of_loading', 'payment_terms', 'payment_schedule',
        'inspection', 'shipment_schedule', 'deposit_percent', 'tax_rate', 'tax_label', 'total_label',
        'subtotal', 'tax_total', 'total', 'notes', 'sent_at', 'created_by',
    ];

    protected $casts = [
        'issue_date'      => 'date',
        'valid_until'     => 'date',
        'subtotal'        => 'integer',
        'tax_total'       => 'integer',
        'total'           => 'integer',
        'tax_rate'        => 'integer',
        'deposit_percent' => 'integer',
        'sent_at'         => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class)->orderBy('position')->orderBy('id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** A sent quotation past its validity date. Shown, not stored. */
    public function isExpired(): bool
    {
        return $this->status === 'sent' && $this->valid_until !== null && $this->valid_until->endOfDay()->isPast();
    }

    public function recalcTotals(): void
    {
        $this->subtotal = (int) $this->items()->sum('line_total');
        $this->tax_total = (int) round($this->subtotal * ((int) $this->tax_rate) / 100);
        $this->total = $this->subtotal + $this->tax_total;
        $this->save();
    }

    /** VHL-CF-Q-2026-0001 / VHL-FET-Q-2026-0001 / Q-2026-0001 (general). */
    public static function nextNumber(?string $business): string
    {
        $year = now()->year;
        $prefix = match ($business) {
            'coffee' => "VHL-CF-Q-{$year}-",
            'fet'    => "VHL-FET-Q-{$year}-",
            default  => "Q-{$year}-",
        };
        $last = static::where('number', 'like', $prefix.'%')->orderByDesc('number')->value('number');
        $seq = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
