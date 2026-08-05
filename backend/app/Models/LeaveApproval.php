<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One signature on a leave request. Two are required — see LeaveApproval::STAGES. */
class LeaveApproval extends Model
{
    /** Both stages must approve before leave is granted. Order does not matter. */
    public const STAGES = ['operations', 'finance'];

    public const STAGE_LABELS = [
        'operations' => 'Operations',
        'finance'    => 'Finance',
    ];

    protected $fillable = ['leave_request_id', 'user_id', 'stage', 'decision', 'comment'];

    protected $casts = [
        'leave_request_id' => 'integer',
        'user_id'          => 'integer',
    ];

    public function leaveRequest(): BelongsTo
    {
        return $this->belongsTo(LeaveRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
