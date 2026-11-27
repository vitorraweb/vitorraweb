<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class NewsletterSubscriber extends Model
{
    protected $fillable = [
        'email',
        'status',
        'token',
        'source',
        'locale',
        'consent_ip',
        'consent_at',
        'unsubscribed_at',
        'lead_source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'attribution',
    ];

    protected $casts = [
        'attribution'     => 'array',
        'consent_at'      => 'datetime',
        'unsubscribed_at' => 'datetime',
    ];

    /** A unique, URL-safe token used in unsubscribe links. */
    public static function freshToken(): string
    {
        do {
            $token = Str::random(48);
        } while (static::where('token', $token)->exists());

        return $token;
    }
}
