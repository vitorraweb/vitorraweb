<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    public const TYPE_RESERVATION  = 'reservation_confirmation';
    public const TYPE_RECEIPT      = 'payment_receipt';
    public const TYPE_INSTALLATION = 'installation_certificate';

    protected $fillable = [
        'order_id',
        'enquiry_id',
        'type',
        'title',
        'path',
        'url',
        'generated_at',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(Enquiry::class);
    }
}
