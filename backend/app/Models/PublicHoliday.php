<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicHoliday extends Model
{
    protected $fillable = ['name', 'date', 'recurring', 'source'];

    protected $casts = [
        'date'      => 'date',
        'recurring' => 'boolean',
    ];
}
