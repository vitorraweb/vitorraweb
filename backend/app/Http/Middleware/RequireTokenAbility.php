<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\TransientToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Surface scoping by Sanctum token ability: `ability:admin`. Passes when the
 * token carries any of the listed abilities (or the wildcard `*`). A request
 * with no concrete personal-access-token behind it (transient test auth, or a
 * non-token guard) is left to the role/permission gates — this only constrains
 * real bearer tokens, which is all production ever uses.
 */
class RequireTokenAbility
{
    public function handle(Request $request, Closure $next, string ...$abilities): Response
    {
        $user  = $request->user();
        $token = $user?->currentAccessToken();

        // Nothing to scope (no PAT) — defer to the other guards on the route.
        if (! $token || $token instanceof TransientToken) {
            return $next($request);
        }

        foreach ($abilities as $ability) {
            if ($user->tokenCan($ability)) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'This session is not allowed here.'], 403);
    }
}
