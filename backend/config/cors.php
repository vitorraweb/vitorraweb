<?php

/*
|--------------------------------------------------------------------------
| Browser origins allowed to call the API
|--------------------------------------------------------------------------
| Production frontend is vitorra.org (apex + www) on Vercel; Vercel
| preview/deploy builds live on *.vercel.app (matched by pattern below).
| FRONTEND_URL stays supported, and CORS_ALLOWED_ORIGINS (comma-separated)
| can add more origins without a code change. Duplicates are removed.
*/

$origins = array_values(array_unique(array_filter(array_merge(
    [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'https://vitorra.org',
        'https://www.vitorra.org',
        'http://localhost:3000',
    ],
    array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))
))));

return [
    'paths'                    => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => $origins,
    // Vercel preview/deploy URLs, e.g. https://vitorraweb-git-master-xyz.vercel.app
    'allowed_origins_patterns' => ['/^https:\/\/[a-z0-9-]+\.vercel\.app$/'],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => true,
];
