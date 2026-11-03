<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One play of a paid advert on the street screen: the evidence behind a delivery report. */
class ScreenPlay extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['played_at' => 'datetime', 'completed' => 'boolean', 'seconds' => 'float'];
    }
}
