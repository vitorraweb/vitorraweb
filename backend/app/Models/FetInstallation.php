<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A Fuel Eco Tech device fitted to a customer's vehicle. The basis of the
 * "proven savings" loop: a real install + its fuel logs let us show measured
 * savings instead of a quoted estimate.
 */
class FetInstallation extends Model
{
    protected $fillable = [
        'reference', 'user_id', 'enquiry_id', 'order_id',
        'customer_name', 'customer_email', 'customer_phone', 'company',
        'tier', 'device_model', 'vehicle', 'registration', 'fuel_type', 'currency',
        'baseline_l_per_100', 'baseline_source',
        'installed_on', 'installed_by', 'status', 'consent_to_publish', 'notes',
    ];

    protected $casts = [
        'installed_on'         => 'date:Y-m-d',
        'baseline_l_per_100'   => 'decimal:2',
        'consent_to_publish'   => 'boolean',
        'registration'         => 'encrypted', // number plate is PII — never at rest in plaintext
    ];

    public function fuelLogs(): HasMany
    {
        return $this->hasMany(FetFuelLog::class)->orderBy('odometer_km')->orderBy('logged_on');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(Enquiry::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installed_by');
    }

    /**
     * The fuel use (l/100km) this installation's savings are measured against:
     * a recorded baseline if present, otherwise the representative figure for
     * the vehicle tier (config/fet.php).
     */
    public function effectiveBaseline(): ?float
    {
        if ($this->baseline_l_per_100 !== null) {
            return (float) $this->baseline_l_per_100;
        }

        $fallback = config("fet.tiers.{$this->tier}.baseline_l_per_100");

        return $fallback !== null ? (float) $fallback : null;
    }
}
