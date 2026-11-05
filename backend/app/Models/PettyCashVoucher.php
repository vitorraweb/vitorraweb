<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A petty cash voucher: cash paid out for small expenses, itemised, numbered and signed. */
class PettyCashVoucher extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['voucher_date' => 'date', 'items' => 'array', 'total' => 'integer'];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** PCV-2026-0001, -0002, … numbered by year. */
    public static function nextNumber(): string
    {
        $prefix = 'PCV-'.now()->year.'-';
        $last = static::where('number', 'like', $prefix.'%')->orderByDesc('number')->value('number');
        $seq = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
