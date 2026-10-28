<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A short-lived "scan with your phone" link. Only the token's hash is stored. */
class ReceiptScanLink extends Model
{
    public const MAX_UPLOADS = 60;

    protected $fillable = ['token_hash', 'user_id', 'expires_at', 'uploads'];

    protected $casts = ['expires_at' => 'datetime'];

    public static function findByToken(string $token): ?self
    {
        $link = static::where('token_hash', hash('sha256', $token))->first();

        return $link && $link->expires_at->isFuture() && $link->uploads < self::MAX_UPLOADS ? $link : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
