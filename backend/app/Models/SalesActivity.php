<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One conversation with a customer or prospect: a call, WhatsApp chat, visit, meeting or note. */
class SalesActivity extends Model
{
    public const KINDS = ['call' => 'Call', 'whatsapp' => 'WhatsApp', 'meeting' => 'Meeting', 'visit' => 'Site visit', 'email' => 'Email', 'note' => 'Note'];

    public const OUTCOMES = [
        'reached'         => 'Spoke to them',
        'no_answer'       => 'No answer',
        'interested'      => 'Interested',
        'quote_requested' => 'Wants a quote',
        'assessment'      => 'Assessment booked',
        'negotiating'     => 'Negotiating',
        'not_interested'  => 'Not interested',
        'won'             => 'Agreed to buy',
    ];

    protected $fillable = ['email', 'prospect_id', 'kind', 'outcome', 'summary', 'next_action', 'next_action_on', 'user_id', 'occurred_at'];

    protected $casts = ['occurred_at' => 'datetime', 'next_action_on' => 'date:Y-m-d', 'user_id' => 'integer', 'prospect_id' => 'integer'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function prospect(): BelongsTo
    {
        return $this->belongsTo(Prospect::class);
    }
}
