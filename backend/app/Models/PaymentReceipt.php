<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A receipt for money received against an invoice — one per approved
 * payment, whether it settles the invoice or only part of it. Issued by
 * App\Services\Payments\PaymentReceipts; printed on the branded invoice
 * template (App\Support\BrandedDocument::receipt).
 */
class PaymentReceipt extends Model
{
    public const METHODS = [
        'bank_transfer' => 'Bank transfer',
        'mobile_money'  => 'Mobile Money',
        'cash'          => 'Cash',
        'cheque'        => 'Cheque',
        'card'          => 'Card',
        'online'        => 'Online (card / Mobile Money)',
    ];

    protected $fillable = [
        'number', 'invoice_id', 'finance_transaction_id', 'currency', 'amount', 'paid_before', 'balance_after',
        'payment_method', 'payment_reference', 'paid_on', 'status', 'emailed_at', 'issued_by',
    ];

    protected $casts = [
        'amount'        => 'integer',
        'paid_before'   => 'integer',
        'balance_after' => 'integer',
        'paid_on'       => 'date',
        'emailed_at'    => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(FinanceTransaction::class, 'finance_transaction_id');
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function isFullySettled(): bool
    {
        return $this->balance_after <= 0;
    }

    public function paidToDate(): int
    {
        return $this->paid_before + $this->amount;
    }

    public function methodLabel(): ?string
    {
        return $this->payment_method ? (self::METHODS[$this->payment_method] ?? ucfirst(str_replace('_', ' ', $this->payment_method))) : null;
    }

    public static function nextNumber(): string
    {
        $prefix = 'VHL-RCT-'.now()->year.'-';
        $last = static::where('number', 'like', $prefix.'%')->orderByDesc('number')->value('number');
        $seq = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
