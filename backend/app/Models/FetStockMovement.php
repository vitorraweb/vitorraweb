<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One FET device movement in or out of stock. Quantity is signed (+ in, − out)
 * so on-hand stock is simply the sum up to a date.
 */
class FetStockMovement extends Model
{
    /** Catalogue models, in price order, with the product slug that carries each price. */
    public const MODELS = [
        'FI'   => ['label' => 'FET-PRO-FI',   'slug' => 'fet-car'],
        'FII'  => ['label' => 'FET-PRO-FII',  'slug' => 'fet-suv'],
        'FIII' => ['label' => 'FET-PRO-FIII', 'slug' => 'fet-lighttruck'],
        'FIV'  => ['label' => 'FET-PRO-FIV',  'slug' => 'fet-heavytruck'],
    ];

    /** received/returned add stock, sold removes it, an adjustment can go either way. */
    public const TYPES = ['received', 'sold', 'returned', 'adjustment'];

    protected $fillable = ['model', 'type', 'quantity', 'moved_on', 'reference', 'note', 'created_by'];

    protected $casts = [
        'moved_on' => 'date:Y-m-d',
        'quantity' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
