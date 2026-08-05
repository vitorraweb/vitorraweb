<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    public const TYPES    = ['annual', 'sick', 'unpaid', 'compassionate', 'maternity'];
    public const STATUSES = ['pending', 'approved', 'declined', 'cancelled'];

    /** Types that draw down the annual-leave entitlement. */
    public const DEDUCTS_BALANCE = ['annual'];

    protected $fillable = [
        'user_id',
        'type',
        'start_date',
        'end_date',
        'working_days',
        'reason',
        'status',
        'document_path',
        'reviewed_by',
        'reviewed_at',
        'review_comment',
    ];

    protected $casts = [
        'start_date'   => 'date',
        'end_date'     => 'date',
        'working_days' => 'integer',
        'reviewed_at'  => 'datetime',
        // Cast the keys: permission checks compare these with `===` against
        // User::$id, and an un-cast column can arrive as a string from the
        // driver, silently failing the comparison.
        'user_id'      => 'integer',
        'reviewed_by'  => 'integer',
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
