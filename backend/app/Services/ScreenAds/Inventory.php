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

    /** Units taken in each slot on each day of a date range: [Y-m-d][slot] => units. */
    public function soldBySlot(Carbon $from, Carbon $to, ?Collection $bookings = null): array
    {
        $bookings ??= $this->holding();
        $days = [];
        for ($d = $from->copy()->startOfDay(); $d->lte($to); $d->addDay()) {
            $key = $d->toDateString();
            $live = $bookings->filter(fn (Booking $b) => $b->start_date->toDateString() <= $key && $b->end_date->toDateString() >= $key);
            foreach (array_keys(config('screen_ads.slots')) as $slot) {
                $days[$key][$slot] = round($live->filter(fn (Booking $b) => in_array($slot, $b->slotKeys(), true))->sum(fn (Booking $b) => $b->unitsInSlot()), 2);
            }
        }

        return $days;
    }

    /** The fullest slot's units on each day, for the calendar. */
    public function soldByDay(Carbon $from, Carbon $to, ?Collection $bookings = null): array
    {
        return array_map(fn ($slots) => round(max($slots), 1), $this->soldBySlot($from, $to, $bookings));
    }

    /** The fewest units free in any of the chosen slots on any day of a campaign. */
    public function freeUnits(Carbon $from, Carbon $to, ?array $slots = null): float
    {
        $slots = $slots ?: array_keys(config('screen_ads.slots'));
        $taken = 0.0;
        foreach ($this->soldBySlot($from, $to) as $day) {
            foreach ($slots as $s) $taken = max($taken, $day[$s] ?? 0);
        }

        return config('screen_ads.programme.units') - $taken;
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
        // Plays an hour inside its slots; the day's total is the same whichever slots it chose.
        $perHour = (3600 / config('screen_ads.programme.cycle_seconds')) * $b->unitsInSlot();
        $slots = collect($b->slotKeys())->map(fn ($k) => [config("screen_ads.slots.$k.from"), config("screen_ads.slots.$k.to")]);
        $hours = fn (float $upTo) => $slots->sum(fn ($w) => max(0, min($w[1], $upTo) - $w[0]));
        $now = now($tz);

        $plays = ScreenPlay::where('screen_ad_booking_id', $b->id)->where('completed', true)->get()
            ->groupBy(fn (ScreenPlay $p) => $p->played_at->copy()->setTimezone($tz)->toDateString())
            ->map->count();

        $rows = [];
        $campaign = 0;
        for ($d = Carbon::parse($b->start_date->toDateString(), $tz); $d->toDateString() <= $b->end_date->toDateString(); $d->addDay()) {
            $campaign += (int) round($perHour * $hours(24));
            if ($d->toDateString() > $now->toDateString()) continue;
            $elapsed = $d->toDateString() < $now->toDateString() ? $hours(24) : $hours($now->hour + $now->minute / 60);
            $rows[] = ['date' => $d->toDateString(), 'expected' => (int) floor($perHour * $elapsed), 'delivered' => (int) ($plays[$d->toDateString()] ?? 0)];
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
