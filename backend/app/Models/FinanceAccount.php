<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinanceAccount extends Model
{
    public const TYPES = ['bank', 'cash', 'mobile_money'];

    protected $fillable = ['name', 'type', 'currency', 'opening_balance', 'is_active', 'created_by'];

    protected $casts = [
        'opening_balance' => 'integer',
        'is_active'       => 'boolean',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class);
    }

    /** Current balance = opening + approved money in − approved money out. */
    public function balance(): int
    {
        $approved = FinanceTransaction::where('status', 'approved');

        $in = (clone $approved)->where('type', 'income')->where('finance_account_id', $this->id)->sum('amount')
            + (clone $approved)->where('type', 'transfer')->where('transfer_to_account_id', $this->id)->sum('amount');

        $out = (clone $approved)->where('type', 'expense')->where('finance_account_id', $this->id)->sum('amount')
            + (clone $approved)->where('type', 'transfer')->where('finance_account_id', $this->id)->sum('amount');

        return (int) ($this->opening_balance + $in - $out);
    }
}
