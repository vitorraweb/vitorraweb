<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Prospect extends Model
{
    protected $fillable = [
        'name',
        'category',
        'product',
        'location',
        'phone',
        'email',
        'outreach_status',
        'feedback',
        'follow_up',
        'follow_up_on',
        'assigned_to',
        'flags',
        'source',
    ];

    protected $casts = [
        'flags'        => 'array',
        'follow_up_on' => 'date:Y-m-d',
    ];

    /**
     * Industry verticals per product line. Each product's outreach list is
     * segmented differently — FET sells to fuel-burning fleets, SEAL to medical
     * and high-injury-risk settings — so the two share only MANUFACTURING.
     */
    public const CATEGORIES_BY_PRODUCT = [
        'FET' => [
            'CARGO', 'DISTRIBUTOR', 'CONSTRUCTION', 'MANUFACTURING', 'PUBLIC_TRANSPORT',
            'SCHOOL', 'FARMER', 'SPARE_PARTS', 'CAR_BOND', 'FUNERAL', 'INTERNAL_TEST',
        ],
        'SEAL' => [
            'HOSPITAL', 'PHARMACY', 'FIRST_RESPONDER', 'MANUFACTURING', 'MINING_QUARRY',
            'SPORTS_ASSOCIATION', 'BODA_BODA', 'BIKER_ASSOCIATION', 'TRAVEL_COMPANY',
            'INTERNAL_TEST',
        ],
        // Coffee buyers — retail/hospitality at home, wholesale and export abroad.
        // GO4WORLD: buyers who reached us through our go4WorldBusiness listing,
        // where most coffee buyers come from.
        'COFFEE' => [
            'GO4WORLD', 'CAFE_RESTAURANT', 'HOTEL', 'SUPERMARKET', 'CORPORATE_OFFICE', 'DISTRIBUTOR',
            'EXPORT_BUYER', 'INDIVIDUAL', 'INTERNAL_TEST',
        ],
    ];

    /** Product lines with a prospect list. */
    public const PRODUCTS = ['FET', 'SEAL', 'COFFEE'];

    /** Every vertical across all products (validation / legacy callers). */
    public const CATEGORIES = [
        'CARGO', 'DISTRIBUTOR', 'CONSTRUCTION', 'MANUFACTURING', 'PUBLIC_TRANSPORT',
        'SCHOOL', 'FARMER', 'SPARE_PARTS', 'CAR_BOND', 'FUNERAL',
        'HOSPITAL', 'PHARMACY', 'FIRST_RESPONDER', 'MINING_QUARRY',
        'SPORTS_ASSOCIATION', 'BODA_BODA', 'BIKER_ASSOCIATION', 'TRAVEL_COMPANY',
        'GO4WORLD', 'CAFE_RESTAURANT', 'HOTEL', 'SUPERMARKET', 'CORPORATE_OFFICE', 'EXPORT_BUYER', 'INDIVIDUAL',
        // Our own addresses, for previewing a campaign before it goes to real
        // prospects. Kept out of the real verticals so test rows never inflate
        // an industry's count or get swept into a live send.
        'INTERNAL_TEST',
    ];

    /** Outreach pipeline stages. */
    public const STATUSES = [
        'not_contacted', 'contacted', 'delivered', 'bounced',
        'responded', 'qualified', 'quoted', 'converted', 'not_interested',
    ];

    /**
     * The list screen's filters, shared by the list itself, bulk edits and
     * "email everyone on this list" — so a campaign reaches exactly the rows
     * the screen was showing, across every page.
     *
     * @param  array<string, mixed>  $f  product, category, status, assigned, q, due
     */
    public function scopeFiltered(Builder $query, array $f): Builder
    {
        return $query
            ->when($f['product'] ?? null, fn ($q, $v) => $q->where('product', strtoupper($v)))
            ->when($f['category'] ?? null, fn ($q, $v) => $q->where('category', strtoupper($v)))
            ->when($f['status'] ?? null, fn ($q, $v) => $q->where('outreach_status', $v))
            ->when($f['assigned'] ?? null, fn ($q, $v) => $q->where('assigned_to', $v))
            // Follow-ups due today or overdue.
            ->when(! empty($f['due']), fn ($q) => $q->whereNotNull('follow_up_on')->whereDate('follow_up_on', '<=', today()))
            ->when($f['q'] ?? null, fn ($q, $v) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$v}%")
                ->orWhere('email', 'like', "%{$v}%")
                ->orWhere('location', 'like', "%{$v}%")));
    }

    /** Verticals valid for a product (falls back to the full list). */
    public static function categoriesFor(?string $product): array
    {
        return self::CATEGORIES_BY_PRODUCT[$product] ?? self::CATEGORIES;
    }
}
