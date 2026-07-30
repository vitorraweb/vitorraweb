<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProspectCampaign extends Model
{
    protected $fillable = [
        'name', 'subject', 'body', 'product', 'attachments',
        'status', 'total', 'sent_count', 'failed_count', 'created_by', 'completed_at',
    ];

    protected $casts = [
        'attachments'  => 'array',
        'completed_at' => 'datetime',
    ];

    public function recipients(): HasMany
    {
        return $this->hasMany(ProspectCampaignRecipient::class, 'campaign_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Campaigns still owing sends, oldest first. */
    public function scopeSending($query)
    {
        return $query->where('status', 'sending');
    }
}
