<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A paid advert on the street screen.
 *
 * Paid first, reviewed second, so a refused advert owes a refund:
 * awaiting_payment → payment_submitted → payment_confirmed → approved
 *                                                          → rejected → refunded
 * Only `approved` ever reaches the screen.
 */
class ScreenAdBooking extends Model
{
    public const AWAITING_PAYMENT  = 'awaiting_payment';
    public const PAYMENT_SUBMITTED = 'payment_submitted';
    public const PAYMENT_CONFIRMED = 'payment_confirmed';
    public const APPROVED          = 'approved';
    public const REJECTED          = 'rejected';
    public const REFUNDED          = 'refunded';
    public const CANCELLED         = 'cancelled';

    public const STATUSES = [
        self::AWAITING_PAYMENT, self::PAYMENT_SUBMITTED, self::PAYMENT_CONFIRMED,
        self::APPROVED, self::REJECTED, self::REFUNDED, self::CANCELLED,
    ];

    protected $guarded = ['id'];

    protected $hidden = ['access_token_hash', 'proof_path'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date', 'end_date' => 'date',
            'proof_at' => 'datetime', 'payment_confirmed_at' => 'datetime',
            'reviewed_at' => 'datetime', 'refunded_at' => 'datetime',
            'video_seconds' => 'float',
        ];
    }

    public function paymentConfirmer(): BelongsTo { return $this->belongsTo(User::class, 'payment_confirmed_by'); }
    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewed_by'); }

    public static function findByToken(string $token): ?self
    {
        return static::where('access_token_hash', hash('sha256', $token))->first();
    }

    public static function nextReference(): string
    {
        $year = now()->year;
        $last = static::where('reference', 'like', "VHL-SA-{$year}-%")->orderByDesc('id')->value('reference');
        $n = $last ? ((int) substr($last, -4)) + 1 : 1;

        return sprintf('VHL-SA-%d-%04d', $year, $n);
    }

    /** Whether the advert should be on screen at this moment, by Kampala's clock. */
    public function isOnAirAt(\DateTimeInterface $at): bool
    {
        $now = \Illuminate\Support\Carbon::instance(\DateTime::createFromInterface($at))->setTimezone('Africa/Kampala');
        if ($this->status !== self::APPROVED) return false;
        if ($now->toDateString() < $this->start_date->toDateString() || $now->toDateString() > $this->end_date->toDateString()) return false;

        return $now->hour >= config('screen_ads.on_air.from') && $now->hour < config('screen_ads.on_air.to');
    }
}
