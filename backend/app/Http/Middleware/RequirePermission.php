<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/*
 * Gates a route by operational module: `perm:orders`, or any of several:
 * `perm:quotations,accounting`. Admins pass everything;
 * other staff pass only if the module is in their effective permissions.
 * This is the authoritative access check — the frontend nav filtering is only
 * cosmetic.
 */
class RequirePermission
{
    public function handle(Request $request, Closure $next, string ...$modules): Response
    {
        $user = $request->user();

        if (! $user || ! collect($modules)->contains(fn ($m) => $user->canModule($m))) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
