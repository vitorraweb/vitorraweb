<?php

namespace App\Models;

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
        'assigned_to',
        'flags',
        'source',
    ];

    protected $casts = [
        'flags' => 'array',
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
    ];

    /** Product lines with a prospect list. */
    public const PRODUCTS = ['FET', 'SEAL'];

    /** Every vertical across all products (validation / legacy callers). */
    public const CATEGORIES = [
        'CARGO', 'DISTRIBUTOR', 'CONSTRUCTION', 'MANUFACTURING', 'PUBLIC_TRANSPORT',
        'SCHOOL', 'FARMER', 'SPARE_PARTS', 'CAR_BOND', 'FUNERAL',
        'HOSPITAL', 'PHARMACY', 'FIRST_RESPONDER', 'MINING_QUARRY',
        'SPORTS_ASSOCIATION', 'BODA_BODA', 'BIKER_ASSOCIATION', 'TRAVEL_COMPANY',
        // Our own addresses, for previewing a campaign before it goes to real
        // prospects. Kept out of the real verticals so test rows never inflate
        // an industry's count or get swept into a live send.
        'INTERNAL_TEST',
    ];

    /** Outreach pipeline stages. */
    public const STATUSES = [
        'not_contacted', 'contacted', 'delivered', 'bounced',
        'responded', 'qualified', 'converted', 'not_interested',
    ];

    /** Verticals valid for a product (falls back to the full list). */
    public static function categoriesFor(?string $product): array
    {
        return self::CATEGORIES_BY_PRODUCT[$product] ?? self::CATEGORIES;
    }
}
