<?php

namespace App\Services\ScreenAds;

use InvalidArgumentException;

/** Monthly price = base × duration × visibility × days, to the nearest UGX 1,000. */
class Pricing
{
    /** @return array{monthly_ugx:int, plays_per_hour:int, factors:array<string,float>, base_ugx:int} */
    public function quote(int $seconds, string $visibility, int $daysPerWeek): array
    {
        $c = config('screen_ads');
        $duration = $c['durations'][$seconds] ?? null;
        $level = $c['visibility'][$visibility] ?? null;
        $days = $c['day_factors'][$daysPerWeek] ?? null;
        if ($duration === null || $level === null || $days === null) {
            throw new InvalidArgumentException('That combination cannot be priced.');
        }

        return [
            'base_ugx'       => $c['base_ugx'],
            'factors'        => ['duration' => $duration, 'visibility' => $level['factor'], 'days' => $days],
            'plays_per_hour' => $level['plays_per_hour'],
            'monthly_ugx'    => (int) (round($c['base_ugx'] * $duration * $level['factor'] * $days / 1000) * 1000),
        ];
    }

    /** What the website needs to price a campaign as the customer builds it. */
    public function forWebsite(): array
    {
        $c = config('screen_ads');

        return [
            'base_ugx'      => $c['base_ugx'],
            'campaign_days' => $c['campaign_days'],
            'lead_days'     => $c['lead_days'],
            'durations'     => collect($c['durations'])->map(fn ($f, $s) => ['seconds' => (int) $s, 'factor' => $f])->values(),
            'visibility'    => collect($c['visibility'])->map(fn ($v, $k) => ['id' => $k] + $v)->values(),
            'day_factors'   => $c['day_factors'],
            'periods'       => collect($c['periods'])->map(fn ($p, $k) => ['id' => $k, 'label' => $p['label'], 'hours' => $p['hours']])->values(),
            'video'         => $c['video'],
        ];
    }
}
