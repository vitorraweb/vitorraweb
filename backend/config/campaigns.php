<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Prospect campaign sending
    |--------------------------------------------------------------------------
    |
    | Campaigns are drained in small batches rather than sent in one request, so
    | a 160-recipient list neither times out the browser nor exceeds the mail
    | provider's rate limit. `batch_size` is how many go out per run (the cron
    | runs every minute); `throttle_ms` is the pause between individual sends —
    | Resend allows roughly 2 requests a second on the standard plan.
    |
    */

    'batch_size'  => (int) env('CAMPAIGN_BATCH_SIZE', 50),
    'throttle_ms' => (int) env('CAMPAIGN_THROTTLE_MS', 600),

    // Per-campaign attachment limits (MB per file, and how many files).
    'max_attachment_mb'    => (int) env('CAMPAIGN_MAX_ATTACHMENT_MB', 8),
    'max_attachment_count' => (int) env('CAMPAIGN_MAX_ATTACHMENT_COUNT', 5),

];
