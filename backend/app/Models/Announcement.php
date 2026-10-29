<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A company notice to staff — everyone, or one department. */
class Announcement extends Model
{
    protected $fillable = ['title', 'body', 'department', 'pinned', 'expires_at', 'created_by'];

    protected $casts = ['pinned' => 'boolean', 'expires_at' => 'datetime', 'created_by' => 'integer'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Current notices this person should see (theirs + company-wide), pinned first. */
    public function scopeVisibleTo(Builder $q, User $user): Builder
    {
        return $q->where(fn ($w) => $w->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->where(fn ($w) => $w->whereNull('department')->orWhere('department', $user->department))
            ->orderByDesc('pinned')->latest();
    }
}
