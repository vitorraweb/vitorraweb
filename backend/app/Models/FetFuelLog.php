<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One fill-up reading against an installation (odometer + litres). */
class FetFuelLog extends Model
{
    protected $fillable = [
        'fet_installation_id', 'logged_on', 'odometer_km', 'litres',
        'cost', 'phase', 'source', 'note', 'logged_by',
    ];

    protected $casts = [
        'logged_on'   => 'date:Y-m-d',
        'odometer_km' => 'integer',
        'litres'      => 'decimal:2',
        'cost'        => 'integer',
    ];

    public function installation(): BelongsTo
    {
        return $this->belongsTo(FetInstallation::class, 'fet_installation_id');
    }
}
