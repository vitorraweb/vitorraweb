<?php

namespace App\Services\Teams;

use App\Jobs\DeliverTeamsNotification;
use App\Models\Setting;
use App\Models\TeamsNotification;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Posts short messages into a Teams channel through a Teams Workflows
 * webhook (the replacement for the retired Office 365 connectors).
 *
 * Design rules:
 *   - Never breaks the action that caused it. notify() swallows every error;
 *     with no webhook configured, or the event switched off, it does nothing.
 *   - Posted once. Each message has a dedupe key (e.g. "enquiry:42"); a
 *     second notify() with the same key is ignored.
 *   - Delivered after the response, through the queue (sync on our host, so
 *     dispatched afterResponse), with a short timeout. A failure is retried
 *     by `teams:deliver` (every minute) at most `max_attempts` times.
 *   - The webhook URL is a secret: it is never logged, stored, or returned.
 *     Errors are recorded as the status code plus a short, URL-stripped
 *     excerpt of the response.
 */
class TeamsNotifier
{
    public static function configured(): bool
    {
        return filled(config('teams.webhook_url'));
    }

    /** @return list<string> */
    public static function enabledEvents(): array
    {
        $stored = Setting::get('teams_events');

        return array_values(array_intersect(
            is_array($stored) ? $stored : array_keys(config('teams.events')),
            array_keys(config('teams.events'))
        ));
    }

    public function notify(string $event, string $dedupeKey, TeamsCard $card): ?TeamsNotification
    {
        try {
            if (! self::configured() || ! in_array($event, self::enabledEvents(), true)) {
                return null;
            }

            try {
                $n = TeamsNotification::create([
                    'event'      => $event,
                    'dedupe_key' => mb_substr($dedupeKey, 0, 191),
                    'title'      => mb_substr($card->title(), 0, 250),
                    'payload'    => $card->payload(),
                    'status'     => 'pending',
                ]);
            } catch (QueryException) {
                return null; // already queued or sent: duplicate
            }

            DeliverTeamsNotification::dispatch($n->id)->afterResponse();

            return $n;
        } catch (\Throwable $e) {
            Log::warning('Teams notification not queued', ['event' => $event, 'error' => self::sanitise($e->getMessage())]);

            return null;
        }
    }

    /** One delivery attempt. Returns true when Teams accepted the message. */
    public function deliver(TeamsNotification $n): bool
    {
        if ($n->status === 'sent') {
            return true;
        }
        $url = config('teams.webhook_url');
        if (! $url) {
            return false; // left pending; delivered once the webhook is configured
        }

        $n->increment('attempts');
        $error = null;
        try {
            $res = Http::timeout(max(2, (int) config('teams.timeout', 10)))->connectTimeout(5)
                ->acceptJson()->asJson()->post($url, $n->payload);
            if ($res->successful()) {
                $n->forceFill(['status' => 'sent', 'sent_at' => now(), 'last_error' => null, 'next_attempt_at' => null])->save();

                return true;
            }
            $error = 'HTTP '.$res->status().': '.mb_substr(trim(strip_tags($res->body())), 0, 200);
        } catch (\Throwable $e) {
            $error = class_basename($e).': '.$e->getMessage();
        }

        $error = self::sanitise($error);
        $max = max(1, (int) config('teams.max_attempts', 3));
        $backoff = config('teams.backoff', [60, 300, 900]);
        $done = $n->attempts >= $max;
        $n->forceFill([
            'status'          => $done ? 'failed' : 'pending',
            'last_error'      => mb_substr($error, 0, 500),
            'next_attempt_at' => $done ? null : now()->addSeconds($backoff[min($n->attempts - 1, count($backoff) - 1)] ?? 300),
        ])->save();
        Log::warning('Teams notification delivery failed', ['id' => $n->id, 'event' => $n->event, 'attempt' => $n->attempts, 'error' => $error]);

        return false;
    }

    /** Retry what is due (bounded per run). */
    public function deliverDue(int $limit = 20): int
    {
        if (! self::configured()) {
            return 0;
        }
        $sent = 0;
        TeamsNotification::where('status', 'pending')
            ->where('attempts', '<', max(1, (int) config('teams.max_attempts', 3)))
            ->where(fn ($q) => $q->whereNull('next_attempt_at')->where('created_at', '<=', now()->subMinute())
                ->orWhere('next_attempt_at', '<=', now()))
            ->orderBy('id')->limit($limit)->get()
            ->each(function (TeamsNotification $n) use (&$sent) {
                $sent += $this->deliver($n) ? 1 : 0;
            });

        return $sent;
    }

    /** Strip anything that looks like a URL (the webhook URL carries its signature in the query). */
    public static function sanitise(string $message): string
    {
        $message = preg_replace('#https?://[^\s"\'<>]+#i', '[url]', $message);
        $message = preg_replace('/(sig|signature|code|token)=[^&\s"]+/i', '$1=[redacted]', $message);

        return mb_substr(trim($message), 0, 500);
    }
}
