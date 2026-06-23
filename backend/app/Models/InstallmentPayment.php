<?php

namespace App\Models;

use App\Contracts\Payable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class InstallmentPayment extends Model implements Payable
{
    public const METHODS = ['cash', 'bank', 'mobile_money', 'other'];

    protected $fillable = [
        'installment_plan_id', 'label', 'amount', 'due_date',
        'paid_at', 'method', 'reference', 'payment_reference', 'recorded_by', 'note',
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

    /* ── Payable ─────────────────────────────────────────────────────────── */

    public function payableReference(): string
    {
        return 'INST-'.$this->id;
    }

    public function payableAmountMajor(): float
    {
        return $this->plan->currency === 'USD' ? round($this->amount / 100, 2) : (float) $this->amount;
    }

    public function payableCurrency(): string
    {
        return $this->plan->currency;
    }

    public function payableDescription(): string
    {
        return 'Vitorra order '.$this->plan->order->reference.' — '.($this->label ?: 'instalment');
    }

    public function payableBilling(): array
    {
        $order = $this->plan->order;

        return [
            'email_address' => $order->customer_email,
            'phone_number'  => $order->customer_phone ?? '',
            'first_name'    => Str::before($order->customer_name, ' ') ?: $order->customer_name,
            'last_name'     => Str::contains($order->customer_name, ' ') ? Str::after($order->customer_name, ' ') : '',
        ];
    }

    public function payableTrackingId(): ?string
    {
        return $this->payment_reference;
    }

    public function attachPaymentInitiation(string $trackingId, string $method): void
    {
        $this->update(['payment_reference' => $trackingId, 'method' => 'mobile_money']);
    }

    public function payableIsPaid(): bool
    {
        return $this->paid_at !== null;
    }

    public function markPayablePaid(): void
    {
        if ($this->paid_at !== null) {
            return; // idempotent — a duplicate webhook is a no-op
        }

        $this->update(['paid_at' => now(), 'method' => 'mobile_money']);
        $this->plan->order->recomputeInstallmentStatus();
    }

    public function payableReturnPath(): string
    {
        return '/account/orders/'.$this->plan->order->reference.'?paid=1';
    }
}
