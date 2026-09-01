<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enquiry extends Model
{
    protected $fillable = [
        'product_category',
        'name',
        'email',
        'company',
        'phone',
        'country',
        'message',
        'requirements',
        'status',
        'assigned_to',
        'assigned_user_id',
        'replied_at',
        'lead_source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'attribution',
    ];

    protected $casts = [
        'requirements'     => 'array',
        'attribution'      => 'array',
        'replied_at'       => 'datetime',
        'sla_notified_at'  => 'datetime',
        'sla_escalated_at' => 'datetime',
    ];

    public function isNew(): bool
    {
        return $this->status === 'new';
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** The specific staff member this enquiry is assigned to, if any (vs. just a team). */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
