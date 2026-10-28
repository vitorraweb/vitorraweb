<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/** One campaign's Google Ads numbers for one day (cost in micros of the account currency). */
class GoogleAdsCampaignDay extends Model
{
    protected $fillable = [
        'date', 'campaign_id', 'campaign_name', 'campaign_status', 'channel_type',
        'impressions', 'clicks', 'cost_micros', 'conversions', 'conversions_value', 'currency_code',
    ];

    protected $casts = [
        'date'              => 'date',
        'impressions'       => 'integer',
        'clicks'            => 'integer',
        'cost_micros'       => 'integer',
        'conversions'       => 'float',
        'conversions_value' => 'float',
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
