<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class BlogPost extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'cover_image',
        'status',
        'published_at',
        'seo_title',
        'seo_description',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                     ->whereNotNull('published_at')
                     ->where('published_at', '<=', now());
    }

    /**
     * Content rendered to SAFE HTML from Markdown. Raw HTML is stripped and
     * unsafe links (javascript:) are neutralised — this is the only form that
     * should ever be rendered on the public site (fixes the blog XSS gap).
     * Appended explicitly where needed (see BlogController::show).
     */
    public function getContentHtmlAttribute(): string
    {
        return Str::markdown($this->content ?? '', [
            'html_input'        => 'strip',
            'allow_unsafe_links' => false,
        ]);
    }
}
