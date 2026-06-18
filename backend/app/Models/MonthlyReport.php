<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyReport extends Model
{
    public const STATUSES = ['draft', 'submitted', 'reviewed'];

    protected $fillable = [
        'user_id',
        'period',
        'items',
        'summary',
        'status',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'supervisor_comment',
        'rating',
    ];

    protected $casts = [
        'items'        => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at'  => 'datetime',
        'rating'       => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
