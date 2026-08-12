<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * One journey in a trial, normalised from whatever shape the client sent.
 *
 * Distance and fuel are derived here — once — and persisted, so a figure shown
 * on a dashboard, a PDF and a client's share link is always the same figure,
 * and so it can be traced back to the source row it came from.
 */
class FetTrialTrip extends Model
{
    protected $fillable = [
        'fet_trial_id', 'sequence',
        'trip_date', 'return_date', 'departed_at', 'returned_at',
        'route_label', 'route_key', 'region',
        'distance_km', 'distance_source', 'odo_out_km', 'odo_in_km',
        'fuel_opening_l', 'fuel_issued_l', 'fuel_topup_l', 'fuel_closing_l',
        'fuel_used_l', 'fuel_method', 'fuel_used_ivms_l',
        'load_out_kg', 'load_in_kg', 'return_loaded',
        'avg_speed_kmh', 'driver_name', 'conditions',
        'phase', 'phase_override', 'phase_override_reason',
        'status', 'exclusion_reason',
        'source', 'fet_trial_import_id', 'source_row_ref', 'notes',
    ];

    protected $casts = [
        'trip_date' => 'date:Y-m-d',
        'return_date' => 'date:Y-m-d',
        'departed_at' => 'datetime',
        'returned_at' => 'datetime',
        'distance_km' => 'decimal:2',
        'fuel_opening_l' => 'decimal:2',
        'fuel_issued_l' => 'decimal:2',
        'fuel_topup_l' => 'decimal:2',
        'fuel_closing_l' => 'decimal:2',
        'fuel_used_l' => 'decimal:2',
        'fuel_used_ivms_l' => 'decimal:2',
        'avg_speed_kmh' => 'decimal:2',
        'odo_out_km' => 'integer',
        'odo_in_km' => 'integer',
        'load_out_kg' => 'integer',
        'load_in_kg' => 'integer',
        'return_loaded' => 'boolean',
        'conditions' => 'array',
    ];

    protected static function booted(): void
    {
        // Derive everything that can be derived, every time, so a hand edit in
        // the admin panel and a bulk import land in exactly the same state.
        static::saving(function (self $trip) {
            $trip->route_key = self::normaliseRoute($trip->route_label);
            $trip->distance_km = $trip->deriveDistance() ?? $trip->distance_km;
            $trip->fuel_used_l = $trip->deriveFuelUsed() ?? $trip->fuel_used_l;
        });
    }

    public function trial(): BelongsTo
    {
        return $this->belongsTo(FetTrial::class, 'fet_trial_id');
    }

    public function flags(): HasMany
    {
        return $this->hasMany(FetTrialFlag::class);
    }

    /**
     * Routes are grouped on this. Clients write "Mpondwe", "MPONDWE" and
     * "Mpondwe " for the same destination; all three must group together or
     * route matching silently fails and the headline reverts to comparing
     * unlike journeys.
     */
    public static function normaliseRoute(?string $label): ?string
    {
        if ($label === null || trim($label) === '') {
            return null;
        }

        $key = Str::upper(trim($label));
        $key = preg_replace('/[^A-Z0-9]+/', ' ', $key) ?? $key;

        return trim(preg_replace('/\s+/', ' ', $key) ?? $key) ?: null;
    }

    /**
     * Distance actually driven. A tracker or odometer figure is a measurement;
     * a planned figure is an intention (Hariss's planned distances differ from
     * their tracker actuals by up to 10%) and is only used if nothing else exists.
     */
    public function deriveDistance(): ?float
    {
        if ($this->odo_out_km !== null && $this->odo_in_km !== null) {
            $d = (int) $this->odo_in_km - (int) $this->odo_out_km;
            if ($d > 0) {
                return round((float) $d, 2);
            }
        }

        return $this->distance_km !== null ? (float) $this->distance_km : null;
    }

    /**
     * Fuel burned on this trip, by whichever method the client's data supports:
     *
     *   tank_dip    opening stock + issued + en-route top-up - closing stock
     *   odometer    fuel put in between two full-tank readings
     *   issued_only everything drawn was burned — the weakest reading, and
     *               flagged, because it ignores what was left in the tank
     */
    public function deriveFuelUsed(): ?float
    {
        $issued = (float) ($this->fuel_issued_l ?? 0);
        $topup = (float) ($this->fuel_topup_l ?? 0);

        if ($this->fuel_opening_l !== null && $this->fuel_closing_l !== null) {
            $this->fuel_method = 'tank_dip';

            return round((float) $this->fuel_opening_l + $issued + $topup - (float) $this->fuel_closing_l, 2);
        }

        if ($issued > 0 || $topup > 0) {
            $this->fuel_method = $this->fuel_method === 'odometer' ? 'odometer' : 'issued_only';

            return round($issued + $topup, 2);
        }

        return null;
    }

    /** Fuel use in l/100km, or null when distance or fuel is missing. */
    public function litresPer100Km(): ?float
    {
        $d = (float) ($this->distance_km ?? 0);
        $f = (float) ($this->fuel_used_l ?? 0);

        return ($d > 0 && $f > 0) ? round($f / $d * 100, 2) : null;
    }

    /** Fuel use in km/L — the unit Ugandan fleets actually talk in. */
    public function kmPerLitre(): ?float
    {
        $d = (float) ($this->distance_km ?? 0);
        $f = (float) ($this->fuel_used_l ?? 0);

        return ($d > 0 && $f > 0) ? round($d / $f, 3) : null;
    }

    /** Share of rated capacity carried out, as a percentage. */
    public function utilisationPct(?int $ratedCapacityKg): ?float
    {
        if (! $ratedCapacityKg || $this->load_out_kg === null) {
            return null;
        }

        return round((int) $this->load_out_kg / $ratedCapacityKg * 100, 1);
    }

    /** Difference between the manual and tracker fuel figures, in litres. */
    public function fuelVarianceL(): ?float
    {
        if ($this->fuel_used_l === null || $this->fuel_used_ivms_l === null) {
            return null;
        }

        return round((float) $this->fuel_used_l - (float) $this->fuel_used_ivms_l, 2);
    }

    /* ── transport work ───────────────────────────────────────────────────── */

    /*
     * The second lens, from S-Line Motors' independent assessment (11 Aug 2026).
     *
     * Distance efficiency (km/L) asks "how far per litre". It penalises a truck
     * that carried freight home instead of running back empty, because the extra
     * tonnes burn fuel over the same road. Transport-work efficiency asks the
     * haulier's question instead — "how much cargo moved per litre" — and on the
     * loaded-return Masindi trip the two answers point in opposite directions:
     * 19.9% worse on km/L, 57.6% better on tonne-km/L.
     *
     * Neither measure alone settles whether the device works. Reported together
     * they explain a figure that otherwise looks like a straight failure.
     */

    /** Cargo carried outbound, in tonnes. */
    public function payloadOutT(): ?float
    {
        return $this->load_out_kg !== null ? round((int) $this->load_out_kg / 1000, 3) : null;
    }

    /**
     * Cargo carried on the return leg, in tonnes. The recorded return weight is
     * the whole vehicle, so the empty weight comes off to leave the freight.
     */
    public function payloadInT(?int $tareKg): ?float
    {
        if ($this->load_in_kg === null || $tareKg === null) {
            return null;
        }

        return round(max(0, (int) $this->load_in_kg - $tareKg) / 1000, 3);
    }

    /**
     * Cargo tonne-kilometres. Each leg is taken as half the route distance —
     * a screening assumption, and one to replace with leg-level records once a
     * client supplies them.
     */
    public function cargoTonneKm(?int $tareKg): ?float
    {
        $km = (float) ($this->distance_km ?? 0);
        $out = $this->payloadOutT();

        if ($km <= 0 || $out === null) {
            return null;
        }

        $in = $this->payloadInT($tareKg) ?? 0.0;

        return round(0.5 * $km * $out + 0.5 * $km * $in, 2);
    }

    /** Cargo moved per litre burned — the haulier's measure of efficiency. */
    public function tonneKmPerLitre(?int $tareKg): ?float
    {
        $work = $this->cargoTonneKm($tareKg);
        $fuel = (float) ($this->fuel_used_l ?? 0);

        return ($work !== null && $fuel > 0) ? round($work / $fuel, 2) : null;
    }

    /**
     * Mean gross mass hauled over the route, in tonnes: the empty vehicle plus
     * the average of what it carried out and back. This is what a
     * payload-normalised comparison is scaled against.
     */
    public function averageGrossMassT(?int $tareKg): ?float
    {
        if ($tareKg === null) {
            return null;
        }
        $out = $this->payloadOutT();
        if ($out === null) {
            return null;
        }

        return round($tareKg / 1000 + 0.5 * $out + 0.5 * ($this->payloadInT($tareKg) ?? 0.0), 2);
    }

    /** Fuel use measured from the client's tracker rather than the tank. */
    public function secondaryLitresPer100Km(): ?float
    {
        $d = (float) ($this->distance_km ?? 0);
        $f = (float) ($this->fuel_used_ivms_l ?? 0);

        return ($d > 0 && $f > 0) ? round($f / $d * 100, 2) : null;
    }

    /** The phase to calculate with — a human override wins over the date. */
    public function effectivePhase(): string
    {
        return $this->phase_override ?: $this->phase;
    }

    /** Only valid trips with a usable distance and fuel figure reach the maths. */
    public function isMeasurable(): bool
    {
        return $this->status === 'valid' && $this->litresPer100Km() !== null;
    }
}
