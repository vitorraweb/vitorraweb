<?php

namespace App\Services\Teams;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Validates the token the Teams tab gets from `authentication.getAuthToken()`
 * (a Microsoft Entra v2 access token issued to our app on the user's
 * behalf). Nothing the Teams client says about the user is trusted on its
 * own — only what this token proves:
 *
 *   - signature: RS256, against Microsoft's published keys for OUR tenant
 *     (JWKS cached 6h; refreshed once if an unknown key id appears)
 *   - issuer:    https://login.microsoftonline.com/{tenant}/v2.0
 *   - tenant:    tid == our tenant (single-tenant app)
 *   - audience:  our client id (or our Application ID URI)
 *   - version 2.0, our delegated scope (access_as_user), unexpired
 */
class EntraTokenValidator
{
    public static function configured(): bool
    {
        return filled(config('teams.entra.tenant_id')) && filled(config('teams.entra.client_id'));
    }

    public static function appIdUri(): string
    {
        $host = parse_url((string) config('services.frontend.url', 'https://vitorra.org'), PHP_URL_HOST) ?: 'vitorra.org';

        return config('teams.entra.app_id_uri') ?: 'api://'.strtolower($host).'/'.config('teams.entra.client_id');
    }

    /**
     * @return array<string,mixed> the verified claims
     *
     * @throws \UnexpectedValueException when the token is not acceptable
     */
    public function validate(string $jwt): array
    {
        if (! self::configured()) {
            throw new \UnexpectedValueException('Teams sign-in is not configured.');
        }
        $tenant = strtolower((string) config('teams.entra.tenant_id'));

        JWT::$leeway = 120;
        try {
            $claims = (array) JWT::decode($jwt, $this->keys(false));
        } catch (\UnexpectedValueException $e) {
            // A key we have not seen: Microsoft rotated keys. Refresh once.
            if (! str_contains($e->getMessage(), '"kid"')) {
                throw $e;
            }
            $claims = (array) JWT::decode($jwt, $this->keys(true));
        }

        $aud = $claims['aud'] ?? null;
        $scopes = preg_split('/\s+/', (string) ($claims['scp'] ?? ''));
        $checks = [
            'issuer'   => ($claims['iss'] ?? null) === "https://login.microsoftonline.com/{$tenant}/v2.0",
            'tenant'   => strtolower((string) ($claims['tid'] ?? '')) === $tenant,
            'audience' => in_array($aud, [config('teams.entra.client_id'), self::appIdUri()], true),
            'version'  => ($claims['ver'] ?? null) === '2.0',
            'scope'    => in_array(config('teams.entra.scope', 'access_as_user'), $scopes, true),
            'subject'  => filled($claims['oid'] ?? null),
        ];
        foreach ($checks as $name => $ok) {
            if (! $ok) {
                throw new \UnexpectedValueException("Token rejected: {$name}.");
            }
        }

        return $claims;
    }

    /** @return array<string, \Firebase\JWT\Key> */
    private function keys(bool $refresh): array
    {
        $tenant = (string) config('teams.entra.tenant_id');
        $cacheKey = 'entra_jwks_'.md5($tenant);
        if ($refresh) {
            Cache::forget($cacheKey);
        }
        $jwks = Cache::remember($cacheKey, 21600, function () use ($tenant) {
            $res = Http::timeout(10)->acceptJson()->get('https://login.microsoftonline.com/'.rawurlencode($tenant).'/discovery/v2.0/keys');
            if (! $res->successful() || ! is_array($res->json('keys'))) {
                throw new \UnexpectedValueException('Could not load Microsoft signing keys.');
            }

            return $res->json();
        });

        return JWK::parseKeySet($jwks, 'RS256');
    }
}
