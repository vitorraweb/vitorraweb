<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProspectCampaignRecipient extends Model
{
    protected $fillable = [
        'campaign_id', 'prospect_id', 'email', 'name', 'status', 'error', 'sent_at',
        'token', 'market_id', 'opened_at', 'open_count', 'clicked_at', 'click_count', 'unsubscribed_at',
    ];

    protected $casts = [
        'sent_at'         => 'datetime',
        'opened_at'       => 'datetime',
        'clicked_at'      => 'datetime',
        'unsubscribed_at' => 'datetime',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(ProspectCampaign::class, 'campaign_id');
    }

    public function prospect(): BelongsTo
    {
        return $this->belongsTo(Prospect::class);
    }
}
