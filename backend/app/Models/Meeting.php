<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A Teams meeting (created in Teams/Outlook) whose join link is shared with staff. */
class Meeting extends Model
{
    protected $fillable = ['title', 'starts_at', 'ends_at', 'join_url', 'notes', 'department', 'created_by'];

    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Admins and ops see every meeting; employees see company-wide ones and their department's. */
    public function scopeVisibleTo(Builder $q, User $user): Builder
    {
        return $user->isOps()
            ? $q
            : $q->where(fn ($w) => $w->whereNull('department')->orWhere('department', $user->department));
    }

    /** Admins edit anything; ops edit what they created. */
    public function editableBy(User $user): bool
    {
        return $user->isAdmin() || ($user->isOps() && $this->created_by === $user->id);
    }
}
