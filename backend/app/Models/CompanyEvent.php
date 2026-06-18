<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyEvent extends Model
{
    protected $fillable = ['title', 'description', 'start_date', 'end_date', 'blocks_leave', 'created_by'];

    protected $casts = [
        'start_date'   => 'date',
        'end_date'     => 'date',
        'blocks_leave' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
