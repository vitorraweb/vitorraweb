<?php

namespace App\Services;

use App\Models\FetFuelLog;
use App\Models\FetInstallation;
use Illuminate\Support\Collection;

/**
 * Turns an installation's fuel logs into measured savings — the heart of the
 * FET "proven savings" loop. Consumption is computed brim-to-brim: over a set
 * of fill-ups ordered by odometer, distance = last − first odometer, and the
 * fuel used over that distance is the sum of litres from every fill EXCEPT the
 * first (the first fill only establishes a full tank at the start odometer).
 *
 * Everything here is attributable to the customer's own readings — we present
 * it as measured fact, never as a Vitorra guarantee.
 */
class FetSavingsService
{
    /**
     * Brim-to-brim consumption (l/100km) for a set of logs, or null when there
     * isn't enough data (need ≥2 odometer readings spanning real distance).
     *
     * @param  Collection<int, FetFuelLog>  $logs
     */
    public function consumption(Collection $logs): ?float
    {
        $withOdo = $logs->whereNotNull('odometer_km')
            ->sortBy('odometer_km')
            ->values();

        if ($withOdo->count() < 2) {
            return null;
        }

        $distance = (int) $withOdo->last()->odometer_km - (int) $withOdo->first()->odometer_km;
        if ($distance <= 0) {
            return null;
        }

        // Fuel used across the distance excludes the first fill (start-of-window full tank).
        $litres = (float) $withOdo->slice(1)->sum(fn (FetFuelLog $l) => (float) $l->litres);
        if ($litres <= 0) {
            return null;
        }

        return round($litres / $distance * 100, 2);
    }

    /** Distance covered (km) by the post-install readings, or 0. */
    private function distance(Collection $logs): int
    {
        $withOdo = $logs->whereNotNull('odometer_km')->sortBy('odometer_km')->values();
        if ($withOdo->count() < 2) {
            return 0;
        }

        return max(0, (int) $withOdo->last()->odometer_km - (int) $withOdo->first()->odometer_km);
    }

    /**
     * Average fuel price (per litre, in the installation's currency unit) from
     * the post-install fills that recorded a cost, or null if none did.
     *
     * @param  Collection<int, FetFuelLog>  $logs
     */
    private function averagePrice(Collection $logs): ?float
    {
        $priced = $logs->filter(fn (FetFuelLog $l) => $l->cost !== null && (float) $l->litres > 0);
        $litres = (float) $priced->sum(fn (FetFuelLog $l) => (float) $l->litres);
        if ($litres <= 0) {
            return null;
        }

        return (float) $priced->sum(fn (FetFuelLog $l) => (int) $l->cost) / $litres;
    }

    /**
     * Full savings summary for an installation. Returns measured consumption,
     * the percentage reduction vs the baseline, and litres / money / CO₂ saved
     * over the measured distance — plus a flag for whether there's enough data.
     *
     * @return array<string, mixed>
     */
    public function summary(FetInstallation $installation): array
    {
        $logs   = $installation->fuelLogs()->get();
        $before = $logs->where('phase', 'before')->values();
        $after  = $logs->where('phase', 'after')->values();

        // A measured pre-install period wins over the stored/segment baseline.
        $measuredBaseline = $this->consumption($before);
        $baseline = $measuredBaseline ?? $installation->effectiveBaseline();
        $baselineSource = $measuredBaseline !== null ? 'measured' : ($installation->baseline_source ?? 'segment');

        $measured = $this->consumption($after);
        $distanceKm = $this->distance($after);

        $verifiedPct = (float) config('fet.verified_pct', 13.9);
        $co2PerLitre = (float) config('fet.co2_kg_per_litre', 2.64);

        $hasData = $baseline !== null && $measured !== null && $distanceKm > 0;

        $reductionPct = null;
        $litresSaved = null;
        $moneySaved = null;
        $co2Saved = null;
        $avgPrice = $this->averagePrice($after);

        if ($hasData) {
            $reductionPct = round(($baseline - $measured) / $baseline * 100, 1);
            // Fuel that would have been burned at baseline minus what was actually used.
            $litresSaved = round(($baseline - $measured) / 100 * $distanceKm, 1);
            $co2Saved = round($litresSaved * $co2PerLitre, 1);
            if ($avgPrice !== null) {
                $moneySaved = (int) round($litresSaved * $avgPrice);
            }
        }

        return [
            'currency'          => $installation->currency,
            'baseline_l_per_100' => $baseline,
            'baseline_source'   => $baselineSource,
            'measured_l_per_100' => $measured,
            'distance_km'       => $distanceKm,
            'reduction_pct'     => $reductionPct,
            'litres_saved'      => $litresSaved,
            'money_saved'       => $moneySaved,         // null when no cost data; in currency unit
            'co2_saved_kg'      => $co2Saved,
            'verified_pct'      => $verifiedPct,         // CTI VW T5 anchor for comparison
            'after_log_count'   => $after->count(),
            'before_log_count'  => $before->count(),
            'has_enough_data'   => $hasData,
        ];
    }
}
