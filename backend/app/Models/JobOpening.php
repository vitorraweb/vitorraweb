<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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

    /**
     * The single definition of "currently accepting applications" — status is
     * "open" AND the closing date (if any) hasn't passed. Used everywhere a role
     * is looked up publicly (listing, single-role page, apply) so a posting can't
     * silently keep accepting applications via a direct link after it's expired
     * off the public list.
     */
    public function scopeOpenNow(Builder $query): Builder
    {
        return $query->where('status', 'open')
            ->where(fn ($q) => $q->whereNull('closes_at')->orWhere('closes_at', '>=', now()->toDateString()));
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
