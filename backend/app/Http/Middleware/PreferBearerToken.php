<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * An explicit Bearer token always decides who the caller is.
 *
 * Sanctum checks the session guard before the token, and production lists the
 * site as a stateful domain while the site authenticates with tokens. Any
 * session cookie the browser still held — from an earlier sign-in, never ended
 * on the server — therefore outranked the token of the account just signed
 * into, and a customer signing in with a new email landed in the old account.
 * When a token is presented we skip the session guard for this request.
 */
class PreferBearerToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken()) {
            config(['sanctum.guard' => []]);
        }

        return $next($request);
    }
}
