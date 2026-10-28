<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** A saved campaign template from the designer (see App\Services\Marketing\EmailDesign). */
class EmailDesign extends Model
{
    protected $fillable = ['name', 'product', 'design', 'created_by', 'updated_by'];

    protected $casts = ['design' => 'array'];
}
