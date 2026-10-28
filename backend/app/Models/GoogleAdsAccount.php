<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * The connected Google Ads account — one row at most. See
 * App\Services\GoogleAds\GoogleAdsClient.
 */
class GoogleAdsAccount extends Model
{
    protected $fillable = [
        'refresh_token',
        'connected_email',
        'connected_by',
        'customer_id',
        'login_customer_id',
        'descriptive_name',
        'currency_code',
        'time_zone',
        'conversion_action_id',
        'conversion_action_name',
        'last_synced_at',
        'last_error',
        'last_error_at',
    ];

    protected $hidden = ['refresh_token'];

    protected $casts = [
        'refresh_token'  => 'encrypted',
        'last_synced_at' => 'datetime',
        'last_error_at'  => 'datetime',
    ];

    /** The account, if one has been connected. */
    public static function current(): ?self
    {
        return static::query()->latest('id')->first();
    }

    /** Connected and pointed at an ad account — enough to sync. */
    public function isReady(): bool
    {
        return filled($this->refresh_token) && filled($this->customer_id);
    }
}
