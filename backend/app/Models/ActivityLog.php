<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per sensitive action. Append-only — never updated, so it carries a
 * created_at but no updated_at.
 */
class ActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'description',
        'ip',
        'metadata',
    ];

    protected $casts = [
        'metadata'   => 'array',
        'created_at' => 'datetime',
    ];

    /** The staff member who performed the action. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
