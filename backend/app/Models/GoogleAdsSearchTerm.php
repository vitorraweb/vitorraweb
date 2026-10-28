<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/** What someone typed into Google before seeing our ad, per campaign per day. */
class GoogleAdsSearchTerm extends Model
{
    protected $fillable = [
        'date', 'campaign_id', 'search_term', 'impressions', 'clicks', 'cost_micros', 'conversions',
    ];

    protected $casts = [
        'date'        => 'date',
        'impressions' => 'integer',
        'clicks'      => 'integer',
        'cost_micros' => 'integer',
        'conversions' => 'float',
    ];

    /**
     * Rows for a span of days, inclusive. whereDate rather than whereBetween:
     * SQLite keeps cast dates as "Y-m-d 00:00:00", which a plain string
     * comparison against "Y-m-d" would drop on the last day.
     */
    public function scopeBetweenDates(Builder $q, string $from, string $to): Builder
    {
        return $q->whereDate('date', '>=', $from)->whereDate('date', '<=', $to);
    }
}
