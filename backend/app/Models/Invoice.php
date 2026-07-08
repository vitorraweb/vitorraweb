<?php

namespace App\Models;

use App\Contracts\Payable;
use App\Services\Payments\OnlineInvoiceSettlement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Invoice extends Model implements Payable
{
    public const STATUSES = ['draft', 'sent', 'partial', 'paid', 'void'];

    /** Flutterwave settles UGX/USD for a Ugandan merchant — EUR invoices stay offline. */
    public const ONLINE_PAYABLE_CURRENCIES = ['UGX', 'USD'];

    protected $fillable = [
        'number', 'public_token', 'customer_user_id', 'customer_name', 'customer_email', 'customer_address',
        'currency', 'sector', 'issue_date', 'due_date',
        'subtotal', 'vat_total', 'total', 'amount_paid', 'status', 'payment_method', 'payment_reference',
        'notes', 'terms', 'source', 'source_id', 'sent_at', 'last_reminded_at', 'created_by',
    ];

    protected static function booted(): void
    {
        // Every invoice gets an unguessable public token for its pay-online link.
        static::creating(function (Invoice $invoice) {
            $invoice->public_token ??= Str::random(48);
        });
    }

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

    /** Backfill a public token for invoices created before pay-online existed. */
    public function ensurePublicToken(): string
    {
        if (! $this->public_token) {
            $this->update(['public_token' => Str::random(48)]);
        }

        return $this->public_token;
    }

    /** Whether this invoice can be paid online (right currency + still owing). */
    public function isOnlinePayable(): bool
    {
        return in_array($this->currency, self::ONLINE_PAYABLE_CURRENCIES, true)
            && in_array($this->status, ['sent', 'partial'], true)
            && $this->balance() > 0;
    }

    /* ── Payable ─────────────────────────────────────────────────────────── */

    public function payableReference(): string
    {
        return $this->number;
    }

    public function payableAmountMajor(): float
    {
        return $this->currency === 'UGX' ? (float) $this->balance() : round($this->balance() / 100, 2);
    }

    public function payableCurrency(): string
    {
        return $this->currency;
    }

    public function payableDescription(): string
    {
        return 'Invoice '.$this->number;
    }

    public function payableBilling(): array
    {
        return [
            'email_address' => $this->customer_email ?? '',
            'phone_number'  => '',
            'first_name'    => Str::before($this->customer_name, ' ') ?: $this->customer_name,
            'last_name'     => Str::contains($this->customer_name, ' ') ? Str::after($this->customer_name, ' ') : '',
        ];
    }

    public function payableTrackingId(): ?string
    {
        return $this->payment_reference;
    }

    public function attachPaymentInitiation(string $trackingId, string $method): void
    {
        $this->update(['payment_method' => $method, 'payment_reference' => $trackingId]);
    }

    public function payableIsPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function markPayablePaid(): void
    {
        app(OnlineInvoiceSettlement::class)->settle($this);
    }

    public function payableReturnPath(): string
    {
        return '/invoice/'.$this->public_token.'?paid=1';
    }
}
