<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
