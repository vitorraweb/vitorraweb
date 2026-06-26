<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Allow the Next.js frontend to call the API
        $middleware->validateCsrfTokens(except: ['api/*']);
        // Cookie (HttpOnly) auth for the SPA alongside Bearer tokens. Inert until
        // SANCTUM_STATEFUL_DOMAINS lists the frontend hosts — only requests from
        // those domains become stateful (session cookie); everything else stays
        // token-based, so this is a no-op until that env var is set in prod.
        $middleware->statefulApi();
        // Role-based access guard for admin routes
        $middleware->alias([
            'role'    => \App\Http\Middleware\RequireRole::class,
            'perm'    => \App\Http\Middleware\RequirePermission::class,
            // Surface scoping by token ability (only constrains real bearer
            // tokens; '*' tokens pass all).
            'ability' => \App\Http\Middleware\RequireTokenAbility::class,
            // Cloudflare Turnstile bot check on public forms (no-op until
            // TURNSTILE_SECRET_KEY is set).
            'turnstile' => \App\Http\Middleware\VerifyTurnstile::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
        // Report exceptions to Sentry (no-op when SENTRY_LARAVEL_DSN is unset)
        \Sentry\Laravel\Integration::handles($exceptions);
    })->create();
