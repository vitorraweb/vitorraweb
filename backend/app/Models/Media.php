<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $table = 'media';

    protected $fillable = [
        'filename', 'original_name', 'path', 'url', 'type', 'mime', 'size', 'uploaded_by',
    ];

    protected $casts = [
        'size' => 'integer',
    ];
}
