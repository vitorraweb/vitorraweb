<?php

namespace App\Services\GoogleAds;

use App\Models\GoogleAdsAccount;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Thin REST client for the Google Ads API — no SDK.
 *
 * The official PHP library pulls in gRPC and protobuf, which the shared
 * cPanel host cannot build. Everything the console needs is three calls
 * (search, list accessible customers, upload click conversions), so plain
 * HTTPS with Laravel's client is the smaller, sturdier choice.
 *
 * Auth: an OAuth refresh token from the "Connect Google Ads" flow is traded
 * for a short-lived access token, cached just under its one-hour life.
 * Developer tokens were retired on 9 Sep 2026; one is sent only if configured.
 */
class GoogleAdsClient
{
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const API_BASE  = 'https://googleads.googleapis.com';

    public const SCOPES = 'https://www.googleapis.com/auth/adwords openid email';

    public function __construct(private ?GoogleAdsAccount $account = null)
    {
        $this->account ??= GoogleAdsAccount::current();
    }

    /** The OAuth client exists in config — the precondition for connecting at all. */
    public static function clientConfigured(): bool
    {
        return filled(config('services.google_ads.client_id')) && filled(config('services.google_ads.client_secret'));
    }

    public function account(): ?GoogleAdsAccount
    {
        return $this->account;
    }

    /**
     * Run a GAQL query and return every row (follows pagination).
     *
     * @return list<array<string,mixed>>
     */
    public function search(string $query, ?string $customerId = null): array
    {
        $customerId = $this->customerId($customerId);
        $rows = [];
        $pageToken = null;

        do {
            $body = ['query' => $query] + ($pageToken ? ['pageToken' => $pageToken] : []);
            $json = $this->send('post', "customers/{$customerId}/googleAds:search", $body, $customerId);
            array_push($rows, ...($json['results'] ?? []));
            $pageToken = $json['nextPageToken'] ?? null;
        } while ($pageToken);

        return $rows;
    }

    /** Customer ids (digits) the connected Google login can reach directly. */
    public function accessibleCustomers(): array
    {
        $json = $this->send('get', 'customers:listAccessibleCustomers');

        return collect($json['resourceNames'] ?? [])
            ->map(fn ($r) => (string) str($r)->after('customers/'))
            ->filter()->values()->all();
    }

    /**
     * Upload offline click conversions ("this click became a sale").
     *
     * @param  list<array<string,mixed>>  $conversions
     * @return array<string,mixed>  raw response (results + partialFailureError)
     */
    public function uploadClickConversions(array $conversions): array
    {
        $customerId = $this->customerId();

        return $this->send('post', "customers/{$customerId}:uploadClickConversions", [
            'conversions'    => $conversions,
            'partialFailure' => true,
        ], $customerId);
    }

    /* ── OAuth ───────────────────────────────────────────────────────────── */

    /** The Google consent screen URL for "Connect Google Ads". */
    public static function authorizationUrl(string $state): string
    {
        return 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id'     => config('services.google_ads.client_id'),
            'redirect_uri'  => config('services.google_ads.redirect_uri'),
            'response_type' => 'code',
            'scope'         => self::SCOPES,
            // offline + consent: always return a refresh token, even when this
            // Google login has connected before.
            'access_type'   => 'offline',
            'prompt'        => 'consent',
            'state'         => $state,
        ]);
    }

    /**
     * Swap the callback's one-time code for tokens.
     *
     * @return array{refresh_token:string, access_token:string, email:?string}
     */
    public static function exchangeCode(string $code): array
    {
        $res = Http::asForm()->timeout(15)->post(self::TOKEN_URL, [
            'code'          => $code,
            'client_id'     => config('services.google_ads.client_id'),
            'client_secret' => config('services.google_ads.client_secret'),
            'redirect_uri'  => config('services.google_ads.redirect_uri'),
            'grant_type'    => 'authorization_code',
        ]);

        if (! $res->successful() || blank($res->json('refresh_token'))) {
            throw new GoogleAdsException('Google did not return a refresh token: '.($res->json('error_description') ?? $res->json('error') ?? $res->status()));
        }

        return [
            'refresh_token' => $res->json('refresh_token'),
            'access_token'  => $res->json('access_token'),
            'email'         => self::emailFromIdToken($res->json('id_token')),
        ];
    }

    /**
     * The id_token arrives straight from Google's token endpoint over TLS, so
     * its claims are read without re-verifying the signature — it only labels
     * which Google login was connected, it grants nothing.
     */
    private static function emailFromIdToken(?string $idToken): ?string
    {
        $payload = $idToken ? (explode('.', $idToken)[1] ?? null) : null;
        if (! $payload) {
            return null;
        }
        $claims = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);

        return is_array($claims) ? ($claims['email'] ?? null) : null;
    }

    private function accessToken(): string
    {
        $account = $this->account ?? throw new GoogleAdsException('Google Ads is not connected.');

        return Cache::remember("google_ads_access_token_{$account->id}", 3300, function () use ($account) {
            $res = Http::asForm()->timeout(15)->post(self::TOKEN_URL, [
                'client_id'     => config('services.google_ads.client_id'),
                'client_secret' => config('services.google_ads.client_secret'),
                'refresh_token' => $account->refresh_token,
                'grant_type'    => 'refresh_token',
            ]);

            if (! $res->successful() || blank($res->json('access_token'))) {
                // invalid_grant = the connection was revoked or the password
                // changed. Only reconnecting fixes it, so say that plainly.
                $reason = $res->json('error') === 'invalid_grant'
                    ? 'Google no longer accepts this connection (revoked or expired). Reconnect Google Ads in the console.'
                    : 'Could not refresh the Google sign-in: '.($res->json('error_description') ?? $res->status());
                throw new GoogleAdsException($reason);
            }

            return $res->json('access_token');
        });
    }

    /* ── Transport ───────────────────────────────────────────────────────── */

    private function customerId(?string $override = null): string
    {
        $id = $override ?? $this->account?->customer_id;
        if (blank($id)) {
            throw new GoogleAdsException('No Google Ads account chosen yet.');
        }

        return self::digits($id);
    }

    /** "123-456-7890" → "1234567890". */
    public static function digits(?string $id): string
    {
        return preg_replace('/\D/', '', (string) $id);
    }

    private function send(string $method, string $path, array $body = [], ?string $customerId = null): array
    {
        $url = self::API_BASE.'/'.config('services.google_ads.api_version').'/'.$path;

        /** @var Response $res */
        $res = $this->request($customerId)->{$method}($url, $method === 'get' ? [] : $body);

        if (! $res->successful()) {
            throw new GoogleAdsException(self::describeError($res), $res->status());
        }

        return $res->json() ?? [];
    }

    private function request(?string $customerId): PendingRequest
    {
        $headers = [];
        // A manager (MCC) login reaching a client account must say so.
        $login = self::digits($this->account?->login_customer_id);
        if ($login !== '' && $login !== $customerId) {
            $headers['login-customer-id'] = $login;
        }
        if (filled($token = config('services.google_ads.developer_token'))) {
            $headers['developer-token'] = $token;
        }

        return Http::withToken($this->accessToken())
            ->withHeaders($headers)
            ->acceptJson()
            ->timeout(30)
            ->retry(2, 1000, fn ($e) => $e instanceof \Illuminate\Http\Client\ConnectionException, throw: false);
    }

    /** Google's error body, reduced to the sentence a person can act on. */
    private static function describeError(Response $res): string
    {
        $error = $res->json('error') ?? [];
        $detail = collect($error['details'] ?? [])
            ->flatMap(fn ($d) => $d['errors'] ?? [])
            ->pluck('message')->filter()->first();

        return trim(($detail ?: ($error['message'] ?? 'Google Ads API error')).' (HTTP '.$res->status().')');
    }
}
