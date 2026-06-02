<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'category',
        'description',
        'price_ugx',
        'price_usd_cents',
        'stock_quantity',
        'is_published',
        'images',
        'meta',
    ];

    protected $casts = [
        'is_published'    => 'boolean',
        'images'          => 'array',
        'meta'            => 'array',
        'price_ugx'       => 'integer',
        'price_usd_cents' => 'integer',
        'stock_quantity'  => 'integer',
    ];

    // Computed USD price in dollars (for API responses)
    public function getPriceUsdAttribute(): ?float
    {
        return $this->price_usd_cents ? round($this->price_usd_cents / 100, 2) : null;
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeCategory($query, string $category)
    {
        return $query->where('category', strtoupper($category));
    }
}
