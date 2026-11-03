<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A stretch of on-air time when the street screen was not playing. */
class ScreenDowntime extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['started_at' => 'datetime', 'ended_at' => 'datetime', 'alerted' => 'boolean'];
    }

    public function minutes(): int
    {
        return (int) round($this->started_at->diffInMinutes($this->ended_at ?? now(), true));
    }
}
