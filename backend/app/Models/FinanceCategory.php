<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinanceCategory extends Model
{
    public const KINDS = ['income', 'expense'];

    protected $fillable = ['name', 'kind', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];
}
