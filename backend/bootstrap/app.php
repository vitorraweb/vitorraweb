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
        // Role-based access guard for admin routes
        $middleware->alias([
            'role' => \App\Http\Middleware\RequireRole::class,
            'perm' => \App\Http\Middleware\RequirePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
        // Report exceptions to Sentry (no-op when SENTRY_LARAVEL_DSN is unset)
        \Sentry\Laravel\Integration::handles($exceptions);
    })->create();
