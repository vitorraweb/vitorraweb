<?php

namespace App\Services;

use App\Mail\ProspectOutreach;
use App\Models\Prospect;
use App\Models\ProspectCampaign;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Drains prospect campaigns a batch at a time.
 *
 * Two things call this: the every-minute scheduler, and the admin screen while
 * a campaign is open (so a send still completes on a box where the cron is not
 * running). A per-campaign lock keeps those two from double-sending, and each
 * recipient row is marked before the next is attempted, so an interrupted run
 * resumes exactly where it stopped rather than re-emailing the whole list.
 */
class CampaignSender
{
    /**
     * Send the next batch for a campaign.
     *
     * @return array{sent: int, failed: int, remaining: int, locked: bool}
     */
    public function drain(ProspectCampaign $campaign, ?int $limit = null): array
    {
        $limit = $limit ?: (int) config('campaigns.batch_size', 50);
        $throttle = (int) config('campaigns.throttle_ms', 600) * 1000;

        $lock = Cache::lock("prospect-campaign:{$campaign->id}", 300);

        if (! $lock->get()) {
            return ['sent' => 0, 'failed' => 0, 'remaining' => $this->pending($campaign), 'locked' => true];
        }

        $sent = 0;
        $failed = 0;

        try {
            $batch = $campaign->recipients()
                ->where('status', 'pending')
                ->orderBy('id')
                ->limit($limit)
                ->get();

            foreach ($batch as $recipient) {
                try {
                    Mail::to($recipient->email)->send(
                        ProspectOutreach::forCampaign($campaign, $recipient->name ?: $recipient->email)
                    );

                    $recipient->update(['status' => 'sent', 'sent_at' => now(), 'error' => null]);
                    $campaign->increment('sent_count');
                    $sent++;

                    // Move the prospect along the pipeline, without overwriting a
                    // stage the team has already advanced by hand. Prospects that
                    // shared this address (recorded as duplicates so we email the
                    // inbox once) advance too — they were genuinely contacted.
                    $this->markContacted($recipient->prospect);

                    $campaign->recipients()
                        ->where('status', 'duplicate')
                        ->where('email', $recipient->email)
                        ->with('prospect')
                        ->get()
                        ->each(fn ($dupe) => $this->markContacted($dupe->prospect));
                } catch (\Throwable $e) {
                    $recipient->update([
                        'status' => 'failed',
                        'error'  => Str::limit($e->getMessage(), 500),
                    ]);
                    $campaign->increment('failed_count');
                    $failed++;

                    Log::warning('Campaign send failed', [
                        'campaign' => $campaign->id,
                        'email'    => $recipient->email,
                        'error'    => $e->getMessage(),
                    ]);
                }

                if ($throttle > 0) {
                    usleep($throttle);
                }
            }

            $remaining = $this->pending($campaign);

            if ($remaining === 0 && $campaign->status === 'sending') {
                $campaign->update(['status' => 'sent', 'completed_at' => now()]);
            }

            return ['sent' => $sent, 'failed' => $failed, 'remaining' => $remaining, 'locked' => false];
        } finally {
            $lock->release();
        }
    }

    private function markContacted(?Prospect $prospect): void
    {
        if ($prospect && $prospect->outreach_status === 'not_contacted') {
            $prospect->update(['outreach_status' => 'contacted']);
        }
    }

    private function pending(ProspectCampaign $campaign): int
    {
        return $campaign->recipients()->where('status', 'pending')->count();
    }
}
