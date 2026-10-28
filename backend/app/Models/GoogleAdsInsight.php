<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A rolling-window snapshot row: where a Display ad showed (`placement`) or
 * a search category Performance Max matched (`search_theme`).
 */
class GoogleAdsInsight extends Model
{
    public const PLACEMENT = 'placement';
    public const SEARCH_THEME = 'search_theme';

    protected $fillable = [
        'kind', 'campaign_id', 'label', 'detail', 'url',
        'impressions', 'clicks', 'cost_micros', 'conversions', 'window_from', 'window_to',
    ];

    protected $casts = [
        'impressions' => 'integer',
        'clicks'      => 'integer',
        'cost_micros' => 'integer',
        'conversions' => 'float',
        'window_from' => 'date',
        'window_to'   => 'date',
    ];
}
