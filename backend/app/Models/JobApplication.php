<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplication extends Model
{
    public const STATUSES = ['new', 'review', 'shortlist', 'rejected', 'hired'];

    protected $fillable = [
        'job_opening_id', 'name', 'email', 'phone', 'location',
        'cv_path', 'cover_note', 'extracted', 'status', 'admin_note',
    ];

    protected $casts = [
        'extracted' => 'array',
    ];

    public function opening(): BelongsTo
    {
        return $this->belongsTo(JobOpening::class, 'job_opening_id');
    }
}
