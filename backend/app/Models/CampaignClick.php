<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One tracked click on a campaign link. */
class CampaignClick extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['campaign_id', 'recipient_id', 'url', 'suspected_bot'];

    protected $casts = ['suspected_bot' => 'boolean'];
}
