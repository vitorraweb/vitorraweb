<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Communication extends Model
{
    public const DIRECTIONS = ['inbound', 'outbound'];
    public const CHANNELS = ['email', 'portal'];

    protected $fillable = [
        'email',
        'direction',
        'channel',
        'subject',
        'body',
        'cc',
        'attachments',
        'sent_by',
        'related_type',
        'related_id',
        'message_id',
        'in_reply_to',
        'staff_read_at',
        'customer_read_at',
    ];

    protected function casts(): array
    {
        return [
            'cc'               => 'array',
            'attachments'      => 'array',
            'staff_read_at'    => 'datetime',
            'customer_read_at' => 'datetime',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
