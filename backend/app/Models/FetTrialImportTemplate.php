<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * A remembered column mapping for a client's export layout, so the second and
 * every later upload from the same client needs no mapping work.
 */
class FetTrialImportTemplate extends Model
{
    protected $fillable = [
        'name', 'client_key', 'sheet_hint', 'mapping', 'unit_hints', 'created_by',
    ];

    protected $casts = [
        'mapping' => 'array',
        'unit_hints' => 'array',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Normalised company name, so "Hariss International Ltd." matches "hariss international ltd". */
    public static function clientKey(?string $company): ?string
    {
        if ($company === null || trim($company) === '') {
            return null;
        }

        $key = Str::lower(trim($company));
        $key = preg_replace('/\b(ltd|limited|plc|inc|co|company)\b/', '', $key) ?? $key;
        $key = preg_replace('/[^a-z0-9]+/', ' ', $key) ?? $key;

        return trim(preg_replace('/\s+/', ' ', $key) ?? $key) ?: null;
    }
}
