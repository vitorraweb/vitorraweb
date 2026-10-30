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
    /**
     * Catalogue models, in price order, with the product slug that carries each
     * price, then sample units (demo / trial devices), which have no catalogue price.
     */
    public const MODELS = [
        'FI'   => ['label' => 'FET-PRO-FI',   'slug' => 'fet-car'],
        'FII'  => ['label' => 'FET-PRO-FII',  'slug' => 'fet-suv'],
        'FIII' => ['label' => 'FET-PRO-FIII', 'slug' => 'fet-lighttruck'],
        'FIV'  => ['label' => 'FET-PRO-FIV',  'slug' => 'fet-heavytruck'],
        'SAMPLE' => ['label' => 'FET sample', 'slug' => null],
    ];

    /**
     * received/returned add stock, sold removes it, an adjustment can go either
     * way, and a transfer hands devices from one holder to another (two linked
     * rows, − at the giver and + at the receiver, so company stock is unchanged).
     * A trial is a hand-over to a client trying the device: still our stock,
     * held by "On trial: <client>" until it is sold or handed back.
     */
    public const TYPES = ['received', 'sold', 'returned', 'adjustment', 'transfer', 'trial'];

    /** Hand-overs: two linked rows that move devices between holders. */
    public const HANDOVERS = ['transfer', 'trial'];

    public const TRIAL_PREFIX = 'On trial: ';

    /** The main store: Operations keeps the devices unless an entry says otherwise. */
    public const MAIN_HOLDER = 'Operations office (Victor Lojum)';

    /** Ways people have written the main store, folded into one holder. */
    private const MAIN_ALIASES = ['operations', 'operations office', 'ops', 'ops office', 'victor', 'victor lojum', "victor's office", 'victor lojum office', 'head of operations', 'main store', 'store'];

    protected $fillable = ['model', 'type', 'quantity', 'moved_on', 'reference', 'picked_by', 'holder', 'transfer_id', 'note', 'created_by'];

    protected $casts = [
        'moved_on' => 'date:Y-m-d',
        'quantity' => 'integer',
    ];

    /**
     * One spelling per holder: blank or any name for the main store becomes the
     * main store, and a name already on the book keeps its first spelling.
     */
    public static function normaliseHolder(?string $name): string
    {
        $name = trim(preg_replace('/\s+/', ' ', (string) $name));
        if ($name === '' || in_array(mb_strtolower(rtrim($name, '.')), self::MAIN_ALIASES, true) || mb_strtolower($name) === mb_strtolower(self::MAIN_HOLDER)) {
            return self::MAIN_HOLDER;
        }

        return static::query()->whereRaw('LOWER(holder) = ?', [mb_strtolower($name)])->value('holder') ?? $name;
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
