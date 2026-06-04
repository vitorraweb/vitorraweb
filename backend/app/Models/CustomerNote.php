<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerNote extends Model
{
    protected $fillable = ['email', 'note', 'updated_by'];
}
