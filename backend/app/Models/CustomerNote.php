<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerNote extends Model
{
    protected $fillable = [
        'email', 'note', 'updated_by', 'owner_id', 'pipeline_stage',
        'override_name', 'override_phone', 'override_company', 'override_country',
    ];

    /** Unified pipeline stages, in the order they're worked. */
    public const STAGES = ['lead', 'contacted', 'qualified', 'quoted', 'won', 'fulfilled', 'lost'];

    public const STAGE_LABELS = [
        'lead'      => 'New Lead',
        'contacted' => 'Contacted',
        'qualified' => 'Qualified',
        'quoted'    => 'Quoted',
        'won'       => 'Won',
        'fulfilled' => 'Fulfilled',
        'lost'      => 'Lost',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Derive a single pipeline stage for a contact from the statuses of
     * their order, enquiry, and prospect records (most-advanced wins).
     *
     * @param  string[]  $orderStatuses
     * @param  string[]  $enquiryStatuses
     * @param  string[]  $prospectStatuses
     */
    public static function deriveStage(array $orderStatuses, array $enquiryStatuses, array $prospectStatuses): string
    {
        if (array_intersect($orderStatuses, ['delivered', 'complete']) !== []) {
            return 'fulfilled';
        }

        if (array_diff($orderStatuses, ['cancelled']) !== []
            || in_array('converted', $enquiryStatuses, true)
            || in_array('converted', $prospectStatuses, true)) {
            return 'won';
        }

        if (in_array('quoted', $enquiryStatuses, true)) {
            return 'quoted';
        }

        if (in_array('in_progress', $enquiryStatuses, true)
            || array_intersect($prospectStatuses, ['qualified', 'responded']) !== []) {
            return 'qualified';
        }

        if (in_array('new', $enquiryStatuses, true)
            || array_intersect($prospectStatuses, ['contacted', 'delivered']) !== []) {
            return 'contacted';
        }

        if (array_diff($prospectStatuses, ['not_interested', 'bounced']) !== []) {
            return 'lead';
        }

        if (in_array('closed', $enquiryStatuses, true)
            || in_array('cancelled', $orderStatuses, true)
            || $prospectStatuses !== []) {
            return 'lost';
        }

        return 'lead';
    }
}
