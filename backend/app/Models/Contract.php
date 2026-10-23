<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * A sales contract filled in by staff and signed online by the client through
 * a one-time link (see ContractSigningController). Once signed it is locked:
 * the signed PDF, the signature and a fingerprint of the exact wording signed
 * are kept with it.
 */
class Contract extends Model
{
    public const STATUSES = ['draft', 'sent', 'viewed', 'signed', 'declined', 'void'];

    /** Filled in by staff; everything else is set by the signing flow. */
    public const EDITABLE = [
        'agreement_date', 'seller_company', 'seller_address', 'seller_name', 'seller_title',
        'buyer_name', 'buyer_registration', 'buyer_address', 'buyer_contact', 'buyer_phone', 'buyer_email',
        'quantity', 'model_number', 'serial_number', 'vehicle_description', 'registration_numbers',
        'chassis_numbers', 'engine_numbers', 'installation_location', 'installation_date',
        'currency', 'unit_cost', 'total_amount', 'price_note', 'payment_option', 'instalment_amount',
        'bank_account_name', 'bank_name', 'bank_account_number', 'mobile_money', 'clauses',
    ];

    protected $guarded = ['id'];

    protected $hidden = ['sign_token_hash', 'signature_data'];

    protected $casts = [
        'agreement_date'    => 'date',
        'installation_date' => 'date',
        'clauses'           => 'array',
        'quantity'          => 'integer',
        'unit_cost'         => 'integer',
        'total_amount'      => 'integer',
        'instalment_amount' => 'integer',
        'sign_expires_at'   => 'datetime',
        'sent_at'           => 'datetime',
        'viewed_at'         => 'datetime',
        'signed_at'         => 'datetime',
        'declined_at'       => 'datetime',
        'voided_at'         => 'datetime',
    ];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Signed or void contracts are a record, not a draft. */
    public function isLocked(): bool
    {
        return in_array($this->status, ['signed', 'void'], true);
    }

    /** Waiting on the client, with a link that still works. */
    public function isAwaitingSignature(): bool
    {
        return in_array($this->status, ['sent', 'viewed'], true)
            && $this->sign_token_hash !== null
            && $this->sign_expires_at?->isFuture();
    }

    /** Sent, never answered, and the link has run out. Shown, not stored. */
    public function isExpired(): bool
    {
        return in_array($this->status, ['sent', 'viewed'], true) && ! $this->isAwaitingSignature();
    }

    /**
     * Issue a fresh signing link. Only its hash is stored, so the link is
     * shown to staff once (to copy into WhatsApp) and lives in the email;
     * issuing a new one kills the old one.
     */
    public function issueSigningToken(int $hours): string
    {
        $token = Str::random(48);
        $this->forceFill([
            'sign_token_hash' => hash('sha256', $token),
            'sign_expires_at' => now()->addHours($hours),
        ]);

        return $token;
    }

    public static function findBySigningToken(string $token): ?self
    {
        return static::where('sign_token_hash', hash('sha256', $token))->first();
    }

    public function signingUrl(string $token): string
    {
        return rtrim((string) config('services.frontend.url'), '/').'/contract/'.$token;
    }

    /** VHL-FET-C-2026-0001 */
    public static function nextNumber(): string
    {
        $prefix = 'VHL-FET-C-'.now()->year.'-';
        $last = static::where('number', 'like', $prefix.'%')->orderByDesc('number')->value('number');
        $seq = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
