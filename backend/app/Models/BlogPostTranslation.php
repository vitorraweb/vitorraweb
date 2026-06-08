<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A blog post's translated fields for a single locale (see BlogPost). */
class BlogPostTranslation extends Model
{
    protected $fillable = [
        'blog_post_id',
        'locale',
        'title',
        'excerpt',
        'content',
        'seo_title',
        'seo_description',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(BlogPost::class, 'blog_post_id');
    }
}
