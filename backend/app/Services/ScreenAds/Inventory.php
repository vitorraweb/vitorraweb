<?php

namespace App\Services\ScreenAds;

use App\Models\ScreenAdBooking as Booking;
use App\Models\ScreenPlay;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * The street screen's 12 paid units: what is sold on each day, whether a new
 * booking fits, and what each campaign was actually given.
 */
class Inventory
{
    /** Bookings that hold units: paid or approved, or unpaid but still within their hold. */
    public function holding(): Collection
    {
        $hold = now()->subHours((int) config('screen_ads.hold_hours'));

        return Booking::query()
            ->whereIn('status', [Booking::PAYMENT_SUBMITTED, Booking::PAYMENT_CONFIRMED, Booking::APPROVED])
            ->orWhere(fn ($q) => $q->where('status', Booking::AWAITING_PAYMENT)->where('created_at', '>=', $hold))
            ->get();
    }

    /** Units already taken on each day of a date range, keyed Y-m-d. */
    public function soldByDay(Carbon $from, Carbon $to, ?Collection $bookings = null): array
    {
        $bookings ??= $this->holding();
        $days = [];
        for ($d = $from->copy()->startOfDay(); $d->lte($to); $d->addDay()) {
            $key = $d->toDateString();
            $days[$key] = (int) $bookings->filter(fn (Booking $b) => $b->start_date->toDateString() <= $key && $b->end_date->toDateString() >= $key)->sum('units');
        }

        return $days;
    }

    /** The busiest day's free units across a campaign. */
    public function freeUnits(Carbon $from, Carbon $to): int
    {
        $sold = $this->soldByDay($from, $to);

        return (int) config('screen_ads.programme.units') - (empty($sold) ? 0 : max($sold));
    }

    /**
     * Booked against delivered, day by day. Expected plays are the booking's units
     * times 15 an hour across the on-air hours, counted up to now.
     *
     * @return array{days: array<int, array{date:string, expected:int, delivered:int}>, expected:int, delivered:int, missed:int, delivery:float|null, owed:bool, missed_value_ugx:int, campaign_expected:int}
     */
    public function delivery(Booking $b): array
    {
        $tz = 'Africa/Kampala';
        $perHour = (int) (3600 / config('screen_ads.programme.cycle_seconds')) * $b->units;
        $from = (int) config('screen_ads.on_air.from');
        $to = (int) config('screen_ads.on_air.to');
        $now = now($tz);

        $plays = ScreenPlay::where('screen_ad_booking_id', $b->id)->where('completed', true)->get()
            ->groupBy(fn (ScreenPlay $p) => $p->played_at->copy()->setTimezone($tz)->toDateString())
            ->map->count();

        $rows = [];
        $campaign = 0;
        for ($d = Carbon::parse($b->start_date->toDateString(), $tz); $d->toDateString() <= $b->end_date->toDateString(); $d->addDay()) {
            $full = $perHour * ($to - $from);
            $campaign += $full;
            if ($d->toDateString() > $now->toDateString()) continue;
            $hours = $d->toDateString() < $now->toDateString() ? ($to - $from) : max(0, min($to, $now->hour + $now->minute / 60) - $from);
            $rows[] = ['date' => $d->toDateString(), 'expected' => (int) floor($perHour * $hours), 'delivered' => (int) ($plays[$d->toDateString()] ?? 0)];
        }

        $expected = array_sum(array_column($rows, 'expected'));
        $delivered = array_sum(array_column($rows, 'delivered'));
        $missed = max(0, $expected - $delivered);
        $share = $expected > 0 ? $delivered / $expected : null;

        return [
            'days' => $rows,
            'expected' => $expected,
            'delivered' => $delivered,
            'missed' => $missed,
            'delivery' => $share,
            'owed' => $share !== null && $share < (float) config('screen_ads.delivery_threshold'),
            'missed_value_ugx' => $campaign > 0 ? (int) round($b->price_ugx * $missed / $campaign) : 0,
            'campaign_expected' => $campaign,
        ];
    }
}
