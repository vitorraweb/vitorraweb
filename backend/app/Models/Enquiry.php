<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
        'replied_at',
    ];

    protected $casts = [
        'requirements' => 'array',
        'replied_at'   => 'datetime',
    ];

    public function isNew(): bool
    {
        return $this->status === 'new';
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
