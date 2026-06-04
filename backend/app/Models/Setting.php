<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    /**
     * Default values + the canonical list of editable keys. Anything not stored
     * falls back to its default, so the app always has a complete config.
     */
    public const DEFAULTS = [
        // Tax (Uganda VAT — dormant until registration completes)
        'vat_enabled'  => false,
        'vat_rate'     => 18,
        'vat_notice'   => 'VAT registration in progress',
        // Currency / exchange rate
        'exchange_rate_mode'   => 'live',   // live | manual
        'exchange_rate_manual' => 3800,     // UGX per 1 USD when mode = manual
        // Shipping (coffee) — amounts in UGX
        'shipping_kampala_ugx'        => 10000,
        'shipping_national_ugx'       => 25000,
        'shipping_international_note'  => 'Calculated at checkout via DHL Express',
        // Notifications
        'notify_email'    => 'support@vitorra.org',
        'notify_whatsapp' => '',
    ];

    /** Stored settings as key => decoded value (cached). */
    public static function stored(): array
    {
        return Cache::rememberForever('settings_map', function () {
            return static::all()->mapWithKeys(fn ($s) => [$s->key => json_decode($s->value, true)])->all();
        });
    }

    /** Defaults merged with stored — the complete, current config. */
    public static function resolved(): array
    {
        return array_merge(static::DEFAULTS, static::stored());
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $all = static::resolved();
        return array_key_exists($key, $all) ? $all[$key] : $default;
    }

    /** Persist a batch of key => value pairs and bust the cache. */
    public static function put(array $pairs): void
    {
        foreach ($pairs as $key => $value) {
            static::updateOrCreate(['key' => $key], ['value' => json_encode($value)]);
        }
        Cache::forget('settings_map');
    }
}
