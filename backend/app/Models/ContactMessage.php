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
    ];
}
