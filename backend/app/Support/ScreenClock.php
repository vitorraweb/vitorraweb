<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * The street screen's day, to the minute, by Kampala's clock. On-air hours and
 * slots are in hours that may be fractional (6.5 = 6:30am, 19.5 = 7:30pm), so
 * every check compares the time of day as a fraction, never the whole hour.
 */
class ScreenClock
{
    /** 6:45pm → 18.75. */
    public static function hourOf(\DateTimeInterface $at): float
    {
        $t = Carbon::instance(\DateTime::createFromInterface($at))->setTimezone('Africa/Kampala');

        return $t->hour + $t->minute / 60 + $t->second / 3600;
    }

    /** Whether the screen is in its on-air day at this moment. */
    public static function onAir(?\DateTimeInterface $at = null): bool
    {
        $h = self::hourOf($at ?? now());

        return $h >= (float) config('screen_ads.on_air.from') && $h < (float) config('screen_ads.on_air.to');
    }

    /** Length of the on-air day, in hours (13 for 6:30am to 7:30pm). */
    public static function dayHours(): float
    {
        return (float) config('screen_ads.on_air.to') - (float) config('screen_ads.on_air.from');
    }
}
