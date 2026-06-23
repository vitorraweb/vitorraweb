<?php

namespace App\Models;

use App\Contracts\Payable;
use App\Services\DocumentService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class Order extends Model implements Payable
{
    protected $fillable = [
        'reference',
        'user_id',
        'enquiry_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'currency',
        'subtotal',
        'total',
        'status',
        'payment_method',
        'payment_status',
        'payment_reference',
        'shipping_address',
        'preferred_installation_date',
        'installation_location',
        'tracking_number',
        'notes',
        'invoice_url',
        'delivered_at',
    ];

    protected $casts = [
        'shipping_address'             => 'array',
        'subtotal'                     => 'integer',
        'total'                        => 'integer',
        'preferred_installation_date'  => 'date',
        'delivered_at'                 => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(Enquiry::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function installmentPlan(): HasOne
    {
        return $this->hasOne(InstallmentPlan::class);
    }

    /**
     * Format an amount stored in this order's currency unit
     * (UGX whole shillings, USD cents) as a display string.
     */
    public function money(int $amount): string
    {
        return $this->currency === 'USD'
            ? '$' . number_format($amount / 100, 2)
            : 'UGX ' . number_format($amount);
    }

    /** The unit price of a line item expressed in this order's currency. */
    public function unitPrice(OrderItem $item): int
    {
        return $this->currency === 'USD'
            ? $item->unit_price_usd_cents
            : $item->unit_price_ugx;
    }

    /* ── Payable ─────────────────────────────────────────────────────────── */

    public function payableReference(): string
    {
        return $this->reference;
    }

    public function payableAmountMajor(): float
    {
        return $this->currency === 'USD' ? round($this->total / 100, 2) : (float) $this->total;
    }

    public function payableCurrency(): string
    {
        return $this->currency;
    }

    public function payableDescription(): string
    {
        return "Vitorra order {$this->reference}";
    }

    public function payableBilling(): array
    {
        return [
            'email_address' => $this->customer_email,
            'phone_number'  => $this->customer_phone ?? '',
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
        return $this->payment_status === 'paid';
    }

    public function markPayablePaid(): void
    {
        if ($this->payment_status === 'paid') {
            return; // idempotent — a duplicate webhook is a no-op
        }

        $this->update(['payment_status' => 'paid']);

        try {
            app(DocumentService::class)->generatePaymentReceipt($this->fresh());
        } catch (\Throwable $e) {
            Log::warning('Failed to generate payment receipt after online payment', [
                'order_id' => $this->id,
                'error'    => $e->getMessage(),
            ]);
        }
    }

    public function payableReturnPath(): string
    {
        return '/pay/return?reference='.$this->reference;
    }
}
