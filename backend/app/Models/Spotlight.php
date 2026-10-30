<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Spotlight extends Model
{
    /** Where a spotlight can appear. */
    public const PAGES = ['home', 'fet'];

    protected $fillable = [
        'eyebrow', 'title', 'body', 'title_sw', 'body_sw', 'cta_label', 'cta_label_sw', 'cta_url',
        'pages', 'starts_on', 'ends_on', 'is_active', 'priority', 'created_by',
    ];

    protected $casts = [
        'pages'     => 'array',
        'starts_on' => 'date:Y-m-d',
        'ends_on'   => 'date:Y-m-d',
        'is_active' => 'boolean',
        'priority'  => 'integer',
    ];

    /** Switched on and inside its dates today (Kampala time). */
    public function scopeLive(Builder $q): Builder
    {
        $today = now('Africa/Kampala')->toDateString();

        return $q->where('is_active', true)
            ->where(fn ($w) => $w->whereNull('starts_on')->orWhere('starts_on', '<=', $today))
            ->where(fn ($w) => $w->whereNull('ends_on')->orWhere('ends_on', '>=', $today));
    }
}
