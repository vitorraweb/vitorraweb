<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Tells the Next.js frontend to drop its cached copy of specific blog pages
 * right away, instead of waiting for the ISR revalidate window (currently 30
 * minutes) to expire naturally. Best-effort: a slow or unreachable frontend
 * must never block or fail an admin request — the cache still self-heals on
 * its own schedule if this doesn't get through.
 */
class FrontendRevalidator
{
    /** @param string[] $slugs affected post slugs; the list + homepage previews are always included. */
    public static function blogPosts(array $slugs = []): void
    {
        $url    = config('services.frontend.revalidate_url');
        $secret = config('services.frontend.revalidate_secret');

        if (empty($url) || empty($secret)) {
            return; // not configured — nothing to notify
        }

        try {
            Http::withHeaders(['x-revalidate-secret' => $secret])
                ->timeout(5)
                ->post($url, ['slugs' => array_values(array_unique(array_filter($slugs)))]);
        } catch (\Throwable $e) {
            Log::warning('Frontend revalidation request failed', ['error' => $e->getMessage()]);
        }
    }
}
