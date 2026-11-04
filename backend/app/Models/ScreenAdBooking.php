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
            'start_date' => 'date', 'end_date' => 'date', 'slots' => 'array',
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

    /** The slots this campaign plays in; all of them when none were chosen. */
    public function slotKeys(): array
    {
        return $this->slots ?: array_keys(config('screen_ads.slots'));
    }

    /** On-air hours a day across its slots. */
    public function hours(): int
    {
        return (int) collect($this->slotKeys())->sum(fn ($k) => config("screen_ads.slots.$k.to") - config("screen_ads.slots.$k.from"));
    }

    /**
     * Units it takes in each of its slots. The airtime bought is the same all day or
     * in part of it, so a Standard unit squeezed into the 4 morning hours takes 4 units
     * there. May be fractional (the screen spreads it across cycles).
     */
    public function unitsInSlot(): float
    {
        $day = config('screen_ads.on_air.to') - config('screen_ads.on_air.from');

        return $this->units * $day / max(1, $this->hours());
    }

    /** Plays an hour while it is on air. */
    public function playsPerHourOnAir(): int
    {
        return (int) round(3600 / config('screen_ads.programme.cycle_seconds') * $this->unitsInSlot());
    }

    /** Whether the advert should be on screen at this moment, by Kampala's clock. */
    public function isOnAirAt(\DateTimeInterface $at): bool
    {
        $now = \Illuminate\Support\Carbon::instance(\DateTime::createFromInterface($at))->setTimezone('Africa/Kampala');
        if ($this->status !== self::APPROVED) return false;
        if ($now->toDateString() < $this->start_date->toDateString() || $now->toDateString() > $this->end_date->toDateString()) return false;

        foreach ($this->slotKeys() as $k) {
            if ($now->hour >= config("screen_ads.slots.$k.from") && $now->hour < config("screen_ads.slots.$k.to")) return true;
        }

        return false;
    }
}
