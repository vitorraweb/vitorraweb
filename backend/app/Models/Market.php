<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** A named audience Marketing sends campaigns to ("Kampala fleets", "Hospitals"). */
class Market extends Model
{
    protected $fillable = ['name', 'description', 'product', 'color', 'created_by'];

    public function prospects(): BelongsToMany
    {
        return $this->belongsToMany(Prospect::class, 'market_members')->withPivot('added_by')->withTimestamps();
    }
}
