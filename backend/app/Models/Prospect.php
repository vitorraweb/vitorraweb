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

    /** Industry verticals (sheet → canonical category). */
    public const CATEGORIES = [
        'CARGO', 'DISTRIBUTOR', 'CONSTRUCTION', 'MANUFACTURING', 'PUBLIC_TRANSPORT',
        'SCHOOL', 'FARMER', 'SPARE_PARTS', 'CAR_BOND', 'FUNERAL',
    ];

    /** Outreach pipeline stages. */
    public const STATUSES = [
        'not_contacted', 'contacted', 'delivered', 'bounced',
        'responded', 'qualified', 'converted', 'not_interested',
    ];
}
