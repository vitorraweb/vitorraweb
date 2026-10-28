<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProspectCampaign extends Model
{
    protected $fillable = [
        'name', 'subject', 'preheader', 'body', 'design', 'product', 'market_ids', 'skip_avoid', 'attachments',
        'status', 'total', 'sent_count', 'failed_count', 'created_by', 'completed_at',
        'tested_at', 'tested_by', 'test_hash', 'started_at',
    ];

    protected $casts = [
        'attachments'  => 'array',
        'design'       => 'array',
        'market_ids'   => 'array',
        'skip_avoid'   => 'boolean',
        'completed_at' => 'datetime',
        'tested_at'    => 'datetime',
        'started_at'   => 'datetime',
    ];

    /** Built in the designer (blocks), as opposed to the quick text composer. */
    public function isDesigned(): bool
    {
        return is_array($this->design) && $this->design !== [];
    }

    /**
     * Fingerprint of everything a recipient will see. A test is valid only
     * for the content it was sent with: change a word and it must be re-tested.
     */
    public function contentHash(): string
    {
        return hash('sha256', json_encode([$this->subject, $this->preheader, $this->design, $this->body]));
    }

    /** Tested, and nothing has changed since. */
    public function testIsCurrent(): bool
    {
        return $this->tested_at !== null && hash_equals((string) $this->test_hash, $this->contentHash());
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(ProspectCampaignRecipient::class, 'campaign_id');
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(CampaignClick::class, 'campaign_id');
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
