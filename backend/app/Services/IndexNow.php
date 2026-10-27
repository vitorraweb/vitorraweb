<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * IndexNow: tells Bing (and Yandex, Seznam, Naver, which share the
 * protocol) that a page is new or changed, so it is crawled within minutes
 * rather than whenever the crawler next passes. Bing's index is what
 * ChatGPT search and Copilot answer from. The key is public by design: the
 * site serves it at /{key}.txt to prove ownership.
 *
 * Off outside production; a failure is logged and never blocks a publish.
 */
class IndexNow
{
    public static function submit(array $paths): void
    {
        $key = config('services.indexnow.key');
        if (! config('services.indexnow.enabled') || ! $key || ! $paths) {
            return;
        }

        $site = rtrim(config('services.indexnow.site'), '/');
        try {
            Http::timeout(5)->post('https://api.indexnow.org/indexnow', [
                'host'        => parse_url($site, PHP_URL_HOST),
                'key'         => $key,
                'keyLocation' => "{$site}/{$key}.txt",
                'urlList'     => array_values(array_map(fn ($p) => $site.$p, $paths)),
            ]);
        } catch (\Throwable $e) {
            Log::warning('IndexNow submit failed: '.$e->getMessage());
        }
    }
}
