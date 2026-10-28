<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One message in the Teams webhook outbox (see App\Services\Teams\TeamsNotifier). */
class TeamsNotification extends Model
{
    protected $fillable = ['event', 'dedupe_key', 'title', 'payload', 'status', 'attempts', 'last_error', 'next_attempt_at', 'sent_at'];

    protected $casts = ['payload' => 'array', 'next_attempt_at' => 'datetime', 'sent_at' => 'datetime'];
}
