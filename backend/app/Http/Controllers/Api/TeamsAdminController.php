<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\TeamsNotification;
use App\Services\Teams\EntraTokenValidator;
use App\Services\Teams\TeamsCard;
use App\Services\Teams\TeamsNotifier;
use App\Services\Marketing\EmailDesigner;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Settings → Microsoft Teams (admin only): what is configured, which events
 * post to Teams, recent deliveries, and an explicit test message. Never
 * returns the webhook URL or any Entra secret — only whether they are set.
 */
class TeamsAdminController extends Controller
{
    public function status(): JsonResponse
    {
        return response()->json(['data' => [
            'webhook_configured' => TeamsNotifier::configured(),
            'sso_configured'     => EntraTokenValidator::configured(),
            'events'             => collect(config('teams.events'))->map(fn ($label, $key) => ['key' => $key, 'label' => $label, 'enabled' => in_array($key, TeamsNotifier::enabledEvents(), true)])->values(),
            'recent'             => TeamsNotification::latest()->limit(20)->get(['id', 'event', 'title', 'status', 'attempts', 'last_error', 'sent_at', 'created_at']),
            'tab_url'            => EmailDesigner::siteUrl('/teams/dashboard'),
        ]]);
    }

    public function events(Request $request): JsonResponse
    {
        $data = $request->validate(['events' => ['present', 'array'], 'events.*' => [Rule::in(array_keys(config('teams.events')))]]);
        Setting::put(['teams_events' => array_values(array_unique($data['events']))]);
        Audit::log('teams.events', 'Teams notification events changed', null, ['events' => $data['events']]);

        return $this->status();
    }

    /** Post one test message now, only when an admin presses the button. */
    public function test(Request $request, TeamsNotifier $notifier): JsonResponse
    {
        if (! TeamsNotifier::configured()) {
            return response()->json(['message' => 'No Teams webhook is configured on the server (TEAMS_WORKFLOW_WEBHOOK_URL).'], 422);
        }
        $card = TeamsCard::make('Test message from Vitorra')
            ->text('If you can read this in Teams, notifications are working.')
            ->fact('Sent by', $request->user()->name)
            ->fact('Time', now()->format('j M Y, H:i'))
            ->link(EmailDesigner::siteUrl('/admin/settings'), 'Open Vitorra settings');
        $n = TeamsNotification::create([
            'event' => 'test', 'dedupe_key' => 'test:'.Str::uuid(), 'title' => $card->title(), 'payload' => $card->payload(), 'status' => 'pending',
        ]);
        $ok = $notifier->deliver($n);
        Audit::log('teams.test', 'Teams test notification '.($ok ? 'delivered' : 'failed'), $n);

        return response()->json([
            'ok'      => $ok,
            'message' => $ok ? 'Test message posted to Teams.' : 'Teams did not accept the message: '.($n->fresh()->last_error ?? 'unknown error'),
        ], $ok ? 200 : 502);
    }
}
