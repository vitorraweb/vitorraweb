<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * A supervised FET trial on a prospect's vehicle. Holds the trial's setup and
 * the evidence rules it will be judged by; the arithmetic lives in
 * App\Services\FetTrialAnalysisService and the checks in FetTrialValidator.
 */
class FetTrial extends Model
{
    /** Statuses, in the order a trial moves through them. */
    public const STATUSES = [
        'draft', 'baseline', 'installed', 'active', 'review',
        'report_ready', 'presented', 'won', 'lost',
    ];

    public const BASELINE_METHODS = ['measured', 'declared', 'fleet'];

    protected $fillable = [
        'reference', 'client_company', 'contact_name', 'contact_email', 'contact_phone',
        'enquiry_id', 'prospect_id', 'fet_installation_id',
        'registration', 'vehicle_make', 'vehicle_type', 'rated_capacity_kg', 'tare_kg',
        'device_serial', 'device_model', 'installed_on', 'installed_by', 'trial_start', 'trial_end',
        'fuel_price', 'currency',
        'baseline_method', 'declared_baseline_l_per_100', 'fleet_standard_km_per_l',
        'required_matched_trips', 'min_baseline_trips_per_route',
        'status', 'decided_on', 'outcome_note', 'units_sold', 'deal_value',
        'share_token', 'share_expires_at', 'share_includes_driver',
        'notes', 'created_by',
    ];

    protected $casts = [
        'installed_on' => 'date:Y-m-d',
        'trial_start' => 'date:Y-m-d',
        'trial_end' => 'date:Y-m-d',
        'decided_on' => 'date:Y-m-d',
        'deal_value' => 'decimal:2',
        'units_sold' => 'integer',
        'share_expires_at' => 'datetime',
        'review_expires_at' => 'datetime',
        'share_includes_driver' => 'boolean',
        'fuel_price' => 'decimal:2',
        'declared_baseline_l_per_100' => 'decimal:2',
        'fleet_standard_km_per_l' => 'decimal:3',
        'rated_capacity_kg' => 'integer',
        'tare_kg' => 'integer',
        'registration' => 'encrypted', // number plate is PII — never at rest in plaintext
    ];

    public function trips(): HasMany
    {
        return $this->hasMany(FetTrialTrip::class)->orderBy('trip_date')->orderBy('sequence');
    }

    public function flags(): HasMany
    {
        return $this->hasMany(FetTrialFlag::class);
    }

    public function imports(): HasMany
    {
        return $this->hasMany(FetTrialImport::class)->latest();
    }

    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(Enquiry::class);
    }

    public function prospect(): BelongsTo
    {
        return $this->belongsTo(Prospect::class);
    }

    public function installation(): BelongsTo
    {
        return $this->belongsTo(FetInstallation::class, 'fet_installation_id');
    }

    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installed_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /* ── evidence rules ───────────────────────────────────────────────────── */

    /** Trial trips on matched routes needed before a verdict may be stated. */
    public function requiredMatchedTrips(): int
    {
        return (int) ($this->required_matched_trips ?? config('fet_trials.required_matched_trips', 3));
    }

    /** Pre-install trips a route needs before it can anchor a comparison. */
    public function minBaselineTripsPerRoute(): int
    {
        return (int) ($this->min_baseline_trips_per_route ?? config('fet_trials.min_baseline_trips_per_route', 2));
    }

    /**
     * The fallback fuel use (l/100km) for routes with no measured baseline —
     * a declared figure, else the client's fleet standard converted from km/L.
     * Never used for the headline: it is a planning number, not a measurement.
     */
    public function fallbackBaseline(): ?float
    {
        if ($this->declared_baseline_l_per_100 !== null) {
            return (float) $this->declared_baseline_l_per_100;
        }

        $kmPerL = (float) ($this->fleet_standard_km_per_l ?? 0);

        return $kmPerL > 0 ? round(100 / $kmPerL, 2) : null;
    }

    /**
     * The vehicle's empty weight — stated, or inferred from the trips that
     * came back unladen. Needed to spot a truck that returned loaded, which
     * did materially more work than the baseline it is compared against.
     */
    public function effectiveTareKg(): ?int
    {
        if ($this->tare_kg !== null) {
            return (int) $this->tare_kg;
        }

        $weights = $this->trips()
            ->whereNotNull('load_in_kg')
            ->pluck('load_in_kg')
            ->map(fn ($w) => (int) $w)
            ->sort()
            ->values();

        if ($weights->isEmpty()) {
            return null;
        }

        // Median: robust against the very outliers this figure is used to detect.
        $mid = intdiv($weights->count(), 2);

        return $weights->count() % 2 === 0
            ? (int) round(($weights[$mid - 1] + $weights[$mid]) / 2)
            : (int) $weights[$mid];
    }

    /** Next reference in the TRIAL-YYYY-#### series. */
    public static function nextReference(): string
    {
        $year = now()->year;
        $prefix = "TRIAL-{$year}-";
        $last = static::where('reference', 'like', $prefix.'%')->orderByDesc('reference')->value('reference');
        $n = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
    }

    /** Issue (or reissue) the read-only client link. */
    public function issueShareToken(): string
    {
        $this->forceFill(['share_token' => Str::random(48)])->save();

        return $this->share_token;
    }

    /**
     * Issue (or reissue) the INTERNAL review link — the full staff view,
     * outside staff sign-in. A separate token from the client link, so the
     * two can be issued and revoked independently and a client can never be
     * handed the internal view by mistake.
     */
    public function issueReviewToken(): string
    {
        $this->forceFill(['review_token' => Str::random(48)])->save();

        return $this->review_token;
    }
}
