<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    public const STATUSES = ['todo', 'in_progress', 'blocked', 'done'];

    public const PRIORITIES = ['low', 'normal', 'high'];

    protected $fillable = [
        'title',
        'description',
        'assigned_to',
        'created_by',
        'status',
        'priority',
        'due_date',
        'department',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
