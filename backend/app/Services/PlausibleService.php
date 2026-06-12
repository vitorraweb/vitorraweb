<?php

  namespace App\Services;

  use Illuminate\Support\Facades\Cache;
  use Illuminate\Support\Facades\Http;
  use Illuminate\Support\Facades\Log;

  /**
   * Reads visitor stats from Plausible's v2 Stats API for the admin dashboard's
   * "Website traffic" card. Cached 5 minutes so the dashboard's 45s poll
  doesn't
   * hammer Plausible. Returns `connected => false` (never throws) when no API
   * key is set or the request fails, so the dashboard can show a setup hint.
   */
  class PlausibleService
  {
      private const ENDPOINT = 'https://plausible.io/api/v2/query';

      public function getStats(): array
      {
          $apiKey = config('services.plausible.api_key');
          $siteId = config('services.plausible.site_id');

          if (! $apiKey) {
              return ['connected' => false];
          }

          return Cache::remember('plausible_stats', 300, function () use
  ($apiKey, $siteId) {
              try {
                  $today = $this->query($apiKey, $siteId, [
                      'metrics'    => ['visitors', 'pageviews'],
                      'date_range' => 'day',
                  ]);
                  $week = $this->query($apiKey, $siteId, [
                      'metrics'    => ['visitors', 'pageviews', 'bounce_rate'],
                      'date_range' => '7d',
                  ]);
                  $pages = $this->query($apiKey, $siteId, [
                      'metrics'    => ['visitors'],
                      'date_range' => '7d',
                      'dimensions' => ['event:page'],
                      'order_by'   => [['visitors', 'desc']],
                      'pagination' => ['limit' => 5],
                  ]);
                  $sources = $this->query($apiKey, $siteId, [
                      'metrics'    => ['visitors'],
                      'date_range' => '7d',
                      'dimensions' => ['visit:source'],
                      'order_by'   => [['visitors', 'desc']],
                      'pagination' => ['limit' => 5],
                  ]);

                  $todayRow = $today['results'][0]['metrics'] ?? [0, 0];
                  $weekRow  = $week['results'][0]['metrics'] ?? [0, 0, 0];

                  return [
                      'connected'       => true,
                      'visitors_today'  => (int) ($todayRow[0] ?? 0),
                      'pageviews_today' => (int) ($todayRow[1] ?? 0),
                      'visitors_7d'     => (int) ($weekRow[0] ?? 0),
                      'pageviews_7d'    => (int) ($weekRow[1] ?? 0),
                      'bounce_rate_7d'  => (float) ($weekRow[2] ?? 0),
                      'top_pages'       => collect($pages['results'] ??
  [])->map(fn ($row) => [
                          'page'     => $row['dimensions'][0] ?? '/',
                          'visitors' => (int) ($row['metrics'][0] ?? 0),
                      ])->values()->all(),
                      'top_sources' => collect($sources['results'] ??
  [])->map(fn ($row) => [
                          'source'   => $row['dimensions'][0] ?: 'Direct /
  None',
                          'visitors' => (int) ($row['metrics'][0] ?? 0),
                      ])->values()->all(),
                  ];
              } catch (\Throwable $e) {
                  Log::warning('Plausible stats fetch failed: ' .
  $e->getMessage());

                  return ['connected' => false, 'error' => true];
              }
          });
      }

      private function query(string $apiKey, string $siteId, array $body): array
      {
          $res = Http::timeout(8)
              ->withToken($apiKey)
              ->acceptJson()
              ->post(self::ENDPOINT, ['site_id' => $siteId, ...$body]);

          if (! $res->successful()) {
              throw new \RuntimeException("Plausible API error
  ({$res->status()}): {$res->body()}");
          }

          return $res->json();
      }
  }
