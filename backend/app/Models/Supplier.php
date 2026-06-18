<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    public const STATUSES = ['pending', 'approved', 'rejected', 'info_requested'];

    protected $fillable = [
        'company_name', 'contact_name', 'email', 'phone', 'country', 'address',
        'category', 'description',
        'bank_name', 'bank_account_name', 'bank_account_number', 'bank_branch', 'bank_swift',
        'status', 'review_note', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        // Bank details encrypted at rest — transparently decrypted on read.
        'bank_name'           => 'encrypted',
        'bank_account_name'   => 'encrypted',
        'bank_account_number' => 'encrypted',
        'bank_branch'         => 'encrypted',
        'bank_swift'          => 'encrypted',
        'reviewed_at'         => 'datetime',
    ];

    public function documents(): HasMany
    {
        return $this->hasMany(SupplierDocument::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** The bank block, for admin/finance display. */
    public function bankDetails(): array
    {
        return [
            'bank_name'      => $this->bank_name,
            'account_name'   => $this->bank_account_name,
            'account_number' => $this->bank_account_number,
            'branch'         => $this->bank_branch,
            'swift'          => $this->bank_swift,
        ];
    }
}
