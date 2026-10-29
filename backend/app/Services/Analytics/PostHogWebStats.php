<?php

namespace App\Services\Analytics;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Website visitor numbers for the console, read from PostHog's query API
 * (HogQL). Read-only; needs a personal API key with the query:read scope.
 *
 * The website only sends PostHog events from public pages (staff screens are
 * filtered in the browser), so every figure here is real visitor traffic.
 * Results are cached briefly — the live count for 30 seconds, the rest for
 * five minutes — so a screen left open does not hammer the API.
 */
class PostHogWebStats
{
    public const PERIODS = ['today' => 0, '7d' => 7, '30d' => 30];

    public static function configured(): bool
    {
        return filled(config('services.posthog.project_id')) && filled(config('services.posthog.personal_api_key'));
    }

    /** Links into PostHog for the things the console does not redraw (replays, live feed). */
    public static function links(): array
    {
        $base = config('services.posthog.host').'/project/'.config('services.posthog.project_id');

        return [
            'web'     => $base.'/web',
            'replays' => $base.'/replay/home',
            'live'    => $base.'/activity/live',
        ];
    }

    /** People on the site in the last five minutes, and the pages they are on. */
    public function live(): array
    {
        return Cache::remember('posthog:live', 30, function () {
            $rows = $this->query("
                SELECT properties.\$pathname AS path, uniq(properties.\$session_id) AS people
                FROM events
                WHERE timestamp > now() - INTERVAL 5 MINUTE AND properties.\$session_id IS NOT NULL
                GROUP BY path ORDER BY people DESC LIMIT 10");
            $total = $this->query("
                SELECT uniq(properties.\$session_id) FROM events
                WHERE timestamp > now() - INTERVAL 5 MINUTE AND properties.\$session_id IS NOT NULL");

            return [
                'now'   => (int) ($total[0][0] ?? 0),
                'pages' => array_map(fn ($r) => ['path' => (string) ($r[0] ?? '/'), 'people' => (int) $r[1]], $rows),
            ];
        });
    }

    /** Visitors, sessions, page views, engagement and where they came from, for a period. */
    public function summary(string $period): array
    {
        $days = self::PERIODS[$period] ?? 7;

        return Cache::remember("posthog:summary:{$period}", 300, function () use ($days) {
            // "today" = since midnight vs. the same span yesterday; N days vs. the N before.
            [$from, $prevFrom, $prevTo] = $days === 0
                ? ['toStartOfDay(now())', 'toStartOfDay(now()) - INTERVAL 1 DAY', 'now() - INTERVAL 1 DAY']
                : ["now() - INTERVAL {$days} DAY", 'now() - INTERVAL '.(2 * $days).' DAY', "now() - INTERVAL {$days} DAY"];

            $totals = fn (string $where) => $this->query("
                SELECT uniq(person_id), uniq(properties.\$session_id), countIf(event = '\$pageview'),
                       countIf(event IN ('enquiry_submitted', 'contact_submitted', 'reservation_submitted'))
                FROM events WHERE {$where}")[0] ?? [0, 0, 0, 0];

            $now  = $totals("timestamp >= {$from}");
            $prev = $totals("timestamp >= {$prevFrom} AND timestamp < {$prevTo}");

            $engagement = $this->query("
                SELECT avg(\$session_duration), if(count() = 0, 0, countIf(\$is_bounce) / count())
                FROM sessions WHERE \$start_timestamp >= {$from}")[0] ?? [null, null];

            $daily = $days === 0 ? $this->query("
                SELECT toHour(timestamp) AS h, uniq(person_id), countIf(event = '\$pageview')
                FROM events WHERE timestamp >= {$from} GROUP BY h ORDER BY h")
                : $this->query("
                SELECT toDate(timestamp) AS d, uniq(person_id), countIf(event = '\$pageview')
                FROM events WHERE timestamp >= {$from} GROUP BY d ORDER BY d");

            $pages = $this->query("
                SELECT properties.\$pathname AS p, count() AS views, uniq(person_id) AS people
                FROM events WHERE event = '\$pageview' AND timestamp >= {$from}
                GROUP BY p ORDER BY views DESC LIMIT 10");

            $channels = $this->query("
                SELECT \$channel_type AS c, count() AS n FROM sessions
                WHERE \$start_timestamp >= {$from} GROUP BY c ORDER BY n DESC LIMIT 8");

            $breakdown = fn (string $prop) => $this->query("
                SELECT properties.{$prop} AS v, uniq(person_id) AS people
                FROM events WHERE event = '\$pageview' AND timestamp >= {$from}
                GROUP BY v ORDER BY people DESC LIMIT 8");

            $pair = fn (array $rows, string $k = 'label') => array_map(fn ($r) => [$k => (string) ($r[0] ?? '') ?: 'Unknown', 'people' => (int) $r[1]], $rows);

            return [
                'visitors'   => ['now' => (int) $now[0], 'before' => (int) $prev[0]],
                'sessions'   => ['now' => (int) $now[1], 'before' => (int) $prev[1]],
                'pageviews'  => ['now' => (int) $now[2], 'before' => (int) $prev[2]],
                'leads'      => ['now' => (int) $now[3], 'before' => (int) $prev[3]],
                'avg_session_seconds' => $engagement[0] !== null ? (int) round((float) $engagement[0]) : null,
                'bounce_rate'         => $engagement[1] !== null ? round((float) $engagement[1] * 100, 1) : null,
                'by_time'   => array_map(fn ($r) => ['label' => (string) $r[0], 'visitors' => (int) $r[1], 'pageviews' => (int) $r[2]], $daily),
                'hourly'    => $days === 0,
                'pages'     => array_map(fn ($r) => ['path' => (string) ($r[0] ?? '/'), 'views' => (int) $r[1], 'people' => (int) $r[2]], $pages),
                'channels'  => array_map(fn ($r) => ['label' => (string) ($r[0] ?? '') ?: 'Unknown', 'sessions' => (int) $r[1]], $channels),
                'countries' => $pair($breakdown('$geoip_country_name')),
                'devices'   => $pair($breakdown('$device_type')),
                'browsers'  => $pair($breakdown('$browser')),
            ];
        });
    }

    /** @return array<int, array<int, mixed>> rows */
    private function query(string $hogql): array
    {
        $res = Http::withToken((string) config('services.posthog.personal_api_key'))
            ->acceptJson()->timeout(20)->connectTimeout(5)
            ->post(config('services.posthog.host').'/api/projects/'.config('services.posthog.project_id').'/query/', [
                'query' => ['kind' => 'HogQLQuery', 'query' => trim(preg_replace('/\s+/', ' ', $hogql))],
            ]);

        if (! $res->successful()) {
            // Never log the key; the status and PostHog's own message are enough.
            Log::warning('PostHog query failed', ['status' => $res->status(), 'detail' => mb_substr((string) $res->json('detail'), 0, 200)]);
            throw new RuntimeException($res->status() === 401 || $res->status() === 403
                ? 'PostHog refused the key — check POSTHOG_PERSONAL_API_KEY has the query:read scope and the project id is right.'
                : 'PostHog did not answer ('.$res->status().').');
        }

        return (array) $res->json('results', []);
    }
}
