<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = [
        'name',
        'email',
        'subject',
        'message',
        'status',
        'read_at',
        'lead_source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'attribution',
    ];

    protected $casts = [
        'read_at'     => 'datetime',
        'attribution' => 'array',
        'ads_click_checked_at' => 'datetime',
    ];

    /** The Google click id this lead arrived with, if any. */
    public function googleClickId(): ?string
    {
        return $this->attribution['gclid'] ?? null;
    }
}
