<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CampaignClick;
use App\Models\ProspectCampaignRecipient;
use App\Services\Marketing\CampaignTracking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Public endpoints hit from inside campaign emails: the open pixel, the click
 * redirect and unsubscribe. No login — the per-recipient token is the key,
 * and these only ever record engagement or honour an opt-out.
 */
class CampaignTrackController extends Controller
{
    /** 1×1 transparent GIF. */
    private const PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    public function open(string $token): Response
    {
        $r = ProspectCampaignRecipient::where('token', $token)->first();
        if ($r) {
            $r->forceFill(['opened_at' => $r->opened_at ?? now(), 'open_count' => $r->open_count + 1])->save();
        }

        return response(base64_decode(self::PIXEL), 200, [
            'Content-Type'  => 'image/gif',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
        ]);
    }

    public function click(Request $request, string $token): RedirectResponse
    {
        $r = ProspectCampaignRecipient::where('token', $token)->first();
        $target = $r ? CampaignTracking::verifiedTarget($token, (string) $request->query('u'), (string) $request->query('s')) : null;

        // A broken or tampered link still lands somewhere sensible.
        if (! $target) {
            return redirect()->away(\App\Services\Marketing\EmailDesigner::siteUrl('/'));
        }

        $bot = CampaignTracking::looksLikeBot($request->userAgent(), $r);
        CampaignClick::create(['campaign_id' => $r->campaign_id, 'recipient_id' => $r->id, 'url' => $target, 'suspected_bot' => $bot]);
        if (! $bot) {
            // A real click proves the email was opened, even with images blocked.
            $r->forceFill([
                'clicked_at'  => $r->clicked_at ?? now(),
                'click_count' => $r->click_count + 1,
                'opened_at'   => $r->opened_at ?? now(),
            ])->save();
        }

        return redirect()->away($target);
    }

    /**
     * GET shows a confirmation page (link scanners open links, so a GET never
     * unsubscribes anyone); POST unsubscribes — from the page's button, or a
     * mail client's one-click List-Unsubscribe.
     */
    public function unsubscribePage(string $token): Response
    {
        $r = ProspectCampaignRecipient::where('token', $token)->first();

        return response()->view('campaign-unsubscribe', ['token' => $token, 'found' => (bool) $r, 'done' => (bool) $r?->unsubscribed_at, 'email' => $r?->email]);
    }

    public function unsubscribe(string $token): Response
    {
        $r = ProspectCampaignRecipient::where('token', $token)->first();
        if ($r) {
            $r->forceFill(['unsubscribed_at' => $r->unsubscribed_at ?? now()])->save();
            // Every prospect row on that address stops receiving campaigns.
            \App\Models\Prospect::whereRaw('LOWER(email) = ?', [mb_strtolower($r->email)])->whereNull('unsubscribed_at')
                ->update(['unsubscribed_at' => now(), 'lead_tier' => 'do_not_contact', 'lead_score' => 0]);
        }

        return response()->view('campaign-unsubscribe', ['token' => $token, 'found' => (bool) $r, 'done' => true, 'email' => $r?->email]);
    }
}
