<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cloudflare Turnstile verification for public, unauthenticated form endpoints
 * (enquiry, contact, newsletter, supplier onboarding, careers apply).
 *
 * Free, privacy-friendly bot protection (no puzzles, GDPR-friendly). This guard
 * is OPT-IN and default-off, matching the project's other integrations:
 *
 *   • No `TURNSTILE_SECRET_KEY` set  → middleware passes everything through,
 *     so nothing changes for visitors until the team creates a free Cloudflare
 *     account and pastes the keys. The frontend widget likewise hides itself.
 *
 *   • Key set, token valid           → request proceeds.
 *   • Key set, token missing/invalid → 422, the form shows the message.
 *   • Key set, Cloudflare unreachable → FAIL-OPEN (request proceeds). A real
 *     customer must never be blocked because Cloudflare had a blip; the
 *     honeypot + rate limiting remain as a backstop.
 */
class VerifyTurnstile
{
    private const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function handle(Request $request, Closure $next): Response
    {
        $secret = config('services.turnstile.secret');

        // Default-off: no secret configured → skip verification entirely.
        if (empty($secret)) {
            return $next($request);
        }

        // The widget posts its token; we accept it from JSON, form input or header.
        $token = $request->input('turnstile_token')
            ?? $request->input('cf-turnstile-response')
            ?? $request->header('CF-Turnstile-Response');

        if (empty($token)) {
            return $this->fail('Please complete the anti-spam check and try again.');
        }

        try {
            $response = Http::asForm()
                ->timeout(8)
                ->post(self::VERIFY_URL, [
                    'secret'   => $secret,
                    'response' => $token,
                    'remoteip' => $request->ip(),
                ]);
        } catch (\Throwable $e) {
            // Network/transport failure — fail open so genuine users get through.
            Log::warning('Turnstile verification unreachable, allowing request', [
                'error' => $e->getMessage(),
            ]);

            return $next($request);
        }

        // Non-2xx from Cloudflare is also treated as a transient outage → fail open.
        if (! $response->successful()) {
            Log::warning('Turnstile verification returned an error, allowing request', [
                'status' => $response->status(),
            ]);

            return $next($request);
        }

        if ($response->json('success') === true) {
            return $next($request);
        }

        // A definitive negative verdict (bad/expired/duplicate token) → block.
        return $this->fail('Anti-spam check failed. Please refresh the page and try again.');
    }

    private function fail(string $message): Response
    {
        return response()->json([
            'message' => $message,
            'errors'  => ['turnstile_token' => [$message]],
        ], 422);
    }
}
