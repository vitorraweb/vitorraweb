<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobOpening extends Model
{
    public const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship'];

    protected $fillable = [
        'title', 'slug', 'department', 'location', 'employment_type',
        'description', 'status', 'closes_at', 'created_by',
    ];

    protected $casts = [
        'closes_at' => 'date',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
