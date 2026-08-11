<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A data-quality finding raised against a trial or one of its trips. */
class FetTrialFlag extends Model
{
    public const SEVERITIES = ['info', 'warn', 'error'];

    public const RESOLUTIONS = ['accepted', 'corrected', 'excluded'];

    protected $fillable = [
        'fet_trial_id', 'fet_trial_trip_id',
        'code', 'severity', 'field', 'message', 'suggested_action', 'context',
        'resolution', 'resolution_note', 'resolved_by', 'resolved_at',
    ];

    protected $casts = [
        'context' => 'array',
        'resolved_at' => 'datetime',
    ];

    public function trial(): BelongsTo
    {
        return $this->belongsTo(FetTrial::class, 'fet_trial_id');
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(FetTrialTrip::class, 'fet_trial_trip_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function isOutstanding(): bool
    {
        return $this->resolution === null;
    }

    /** An outstanding error blocks a verdict; a resolved one no longer does. */
    public function blocksVerdict(): bool
    {
        return $this->severity === 'error' && $this->isOutstanding();
    }
}
