<?php

namespace Tests\Feature;

use App\Models\Enquiry;
use App\Models\Meeting;
use App\Models\Setting;
use App\Models\TeamsNotification;
use App\Models\User;
use App\Support\TeamsMeetingUrl;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TeamsIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private const WEBHOOK = 'https://prod-00.westeurope.logic.azure.com:443/workflows/abc/triggers/manual/paths/invoke?api-version=2016-06-01&sig=SECRETSIG123';
    private const TENANT = '11111111-2222-3333-4444-555555555555';
    private const CLIENT = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config([
            'services.frontend.url' => 'https://vitorra.org',
            'teams.m365_domains' => ['vitorra.org'],
            'teams.webhook_url' => null,
            'teams.entra.tenant_id' => null,
            'teams.entra.client_id' => null,
        ]);
    }

    private function user(string $role = 'admin', array $extra = []): User
    {
        return User::create(['name' => 'Staff '.uniqid(), 'email' => 's'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme', 'role' => $role, ...$extra]);
    }

    private function headers(User $u, string $ability = 'admin'): array
    {
        return ['Authorization' => 'Bearer '.$u->createToken('t', [$ability, 'staff'])->plainTextToken];
    }

    /* ── Meeting links ───────────────────────────────────────────────────── */

    public function test_only_real_teams_meeting_links_are_accepted(): void
    {
        foreach ([
            'https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc%40thread.v2/0?context=%7b%22Tid%22%3a%22x%22%7d',
            'https://teams.microsoft.com/meet/2345678901?p=AbCdEf',
            'https://TEAMS.microsoft.com/l/meetup-join/19%3ameeting_abc',
            'https://teams.live.com/meet/9876543210',
            'https://teams.cloud.microsoft/l/meetup-join/19%3ameeting_x',
            'https://gov.teams.microsoft.us/l/meetup-join/19%3ameeting_x',
        ] as $ok) {
            $this->assertTrue(TeamsMeetingUrl::isValid($ok), $ok);
        }
        foreach ([
            'http://teams.microsoft.com/l/meetup-join/19%3ameeting_abc',          // not https
            'https://teams.microsoft.com.evil.example/l/meetup-join/x',          // lookalike host
            'https://evilteams.microsoft.com/l/meetup-join/x',                    // not an allowed host
            'https://teams.microsoft.com@evil.example/l/meetup-join/x',           // credentials trick
            'https://user:pw@teams.microsoft.com/l/meetup-join/x',
            'https://teams.microsoft.com:8443/l/meetup-join/x',                   // odd port
            'https://teams.microsoft.com/l/chat/0/0?users=a@b.com',               // not a meeting
            'https://teams.microsoft.com/l/meetup-join/',                         // empty meeting
            'javascript:alert(1)//teams.microsoft.com/l/meetup-join/x',
            'https://teams.microsoft.com/l/meetup-join/x y',
            '',
        ] as $bad) {
            $this->assertFalse(TeamsMeetingUrl::isValid($bad), $bad);
        }
    }

    /* ── Meetings: visibility and editing ────────────────────────────────── */

    public function test_meeting_visibility_and_editing_rules(): void
    {
        $admin = $this->user('admin');
        $ops = $this->user('ops', ['department' => 'marketing']);
        $otherOps = $this->user('ops', ['department' => 'finance']);
        $employee = $this->user('employee', ['department' => 'sales']);
        $url = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc%40thread.v2/0';

        $this->withHeaders($this->headers($ops))->postJson('/api/admin/meetings', ['title' => 'Bad', 'starts_at' => now()->addDay(), 'join_url' => 'https://zoom.us/j/123'])
            ->assertStatus(422)->assertJsonValidationErrors('join_url');
        $all = $this->withHeaders($this->headers($ops))->postJson('/api/admin/meetings', ['title' => 'All hands', 'starts_at' => now()->addDay(), 'join_url' => $url])->assertCreated()->json('data.id');
        $this->app['auth']->forgetGuards();
        $fin = $this->withHeaders($this->headers($otherOps))->postJson('/api/admin/meetings', ['title' => 'Finance only', 'starts_at' => now()->addDay(), 'join_url' => $url, 'department' => 'finance'])->assertCreated()->json('data.id');
        $this->app['auth']->forgetGuards();

        // Employees cannot add meetings (admin panel is admin/ops only)…
        $this->withHeaders($this->headers($employee, 'staff'))->postJson('/api/admin/meetings', ['title' => 'x', 'starts_at' => now(), 'join_url' => $url])->assertForbidden();
        $this->app['auth']->forgetGuards();
        // …and see company-wide meetings, not other departments'.
        $this->withHeaders($this->headers($employee, 'staff'))->getJson('/api/staff/meetings')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'All hands')->assertJsonPath('data.0.can_edit', false);
        $this->app['auth']->forgetGuards();

        // Ops can't edit someone else's meeting; the creator and admins can.
        $this->withHeaders($this->headers($ops))->patchJson("/api/admin/meetings/{$fin}", ['title' => 'Hijack'])->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->headers($otherOps))->patchJson("/api/admin/meetings/{$fin}", ['title' => 'Finance review'])->assertOk();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($this->headers($admin))->deleteJson("/api/admin/meetings/{$all}")->assertOk();
        $this->assertSame(['Finance review'], Meeting::pluck('title')->all());
    }

    /* ── Chat addresses ──────────────────────────────────────────────────── */

    public function test_teams_chat_address_rules(): void
    {
        $this->assertSame('a@vitorra.org', $this->user('ops', ['email' => 'A@vitorra.org'])->teamsEmail());
        $this->assertNull($this->user('ops', ['email' => 'someone@gmail.com'])->teamsEmail(), 'a Gmail login is not a Teams address');
        $this->assertSame('real@vitorra.org', $this->user('ops', ['email' => 'x@gmail.com', 'microsoft_email' => 'Real@vitorra.org'])->teamsEmail());

        $admin = $this->user('admin');
        $target = $this->user('employee', ['email' => 'p@gmail.com']);
        $this->withHeaders($this->headers($admin))->patchJson("/api/admin/users/{$target->id}", ['microsoft_email' => 'p.mwesigwa@vitorra.org'])
            ->assertOk()->assertJsonPath('data.teams_email', 'p.mwesigwa@vitorra.org');
    }

    /* ── Notifications ───────────────────────────────────────────────────── */

    private function submitEnquiry(): void
    {
        $this->postJson('/api/enquiries', ['name' => 'Fleet [Click](https://evil.example)', 'email' => 'b@fleet.ug', 'country' => 'Uganda', 'message' => 'FET please', 'product_category' => 'FET'])->assertCreated();
    }

    public function test_missing_configuration_never_breaks_the_action(): void
    {
        Http::fake();
        $this->submitEnquiry();
        $this->assertSame(0, TeamsNotification::count());
        Http::assertNothingSent();
    }

    public function test_an_enquiry_posts_one_adaptive_card_with_a_console_link(): void
    {
        config(['teams.webhook_url' => self::WEBHOOK]);
        Http::fake(['*logic.azure.com*' => Http::response('', 202)]);

        $this->submitEnquiry();

        $n = TeamsNotification::sole();
        $this->assertSame('sent', $n->status);
        Http::assertSent(function (Request $r) {
            $card = $r['attachments'][0]['content'] ?? [];
            $text = json_encode($card);

            return $r['type'] === 'message'
                && $r['attachments'][0]['contentType'] === 'application/vnd.microsoft.card.adaptive'
                && $card['type'] === 'AdaptiveCard'
                && $card['actions'][0]['url'] === 'https://vitorra.org/admin/enquiries'
                && ! str_contains($text, '[Click]')            // no disguised Markdown links
                && ! str_contains($text, 'b@fleet.ug');        // no customer email in the channel
        });

        // The same event again is a duplicate, not a second message.
        app(\App\Services\Teams\TeamsAlerts::class)->newEnquiry(Enquiry::sole());
        $this->assertSame(1, TeamsNotification::count());
    }

    public function test_switched_off_events_are_not_posted(): void
    {
        config(['teams.webhook_url' => self::WEBHOOK]);
        Setting::put(['teams_events' => ['new_order']]);
        Http::fake();

        $this->submitEnquiry();

        $this->assertSame(0, TeamsNotification::count());
    }

    public function test_failures_are_retried_a_bounded_number_of_times_and_logged_without_the_url(): void
    {
        config(['teams.webhook_url' => self::WEBHOOK, 'teams.max_attempts' => 3]);
        Http::fake(['*' => Http::response('Bad sig=SECRETSIG123 at '.self::WEBHOOK, 500)]);
        Log::spy();

        $this->submitEnquiry(); // attempt 1, inline after the response
        $n = TeamsNotification::sole();
        $this->assertSame('pending', $n->status);
        $this->assertSame(1, $n->attempts);
        $this->assertNotNull($n->next_attempt_at);
        $this->assertStringNotContainsString('SECRETSIG123', $n->last_error);
        $this->assertStringNotContainsString('logic.azure.com', $n->last_error);

        foreach ([2, 3, 4] as $i) {
            TeamsNotification::query()->update(['next_attempt_at' => now()->subSecond()]);
            $this->artisan('teams:deliver')->assertSuccessful();
        }
        $n->refresh();
        $this->assertSame('failed', $n->status);
        $this->assertSame(3, $n->attempts, 'never more than max_attempts');

        Log::shouldHaveReceived('warning')->withArgs(fn ($msg, $ctx = []) => ! str_contains(json_encode($ctx), 'SECRETSIG123'));
    }

    public function test_a_timeout_is_handled_like_any_failure(): void
    {
        config(['teams.webhook_url' => self::WEBHOOK]);
        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('cURL error 28: Operation timed out after 10001 ms for '.self::WEBHOOK));

        $this->submitEnquiry();

        $n = TeamsNotification::sole();
        $this->assertSame('pending', $n->status);
        $this->assertStringContainsString('timed out', $n->last_error);
        $this->assertStringNotContainsString('SECRETSIG123', $n->last_error);
    }

    public function test_test_message_is_admin_only_and_never_reveals_the_webhook(): void
    {
        config(['teams.webhook_url' => self::WEBHOOK]);
        Http::fake(['*' => Http::response('', 202)]);

        $this->withHeaders($this->headers($this->user('ops')))->postJson('/api/admin/teams/test')->assertForbidden();
        Http::assertNothingSent();
        $this->app['auth']->forgetGuards();

        $admin = $this->headers($this->user('admin'));
        $this->withHeaders($admin)->postJson('/api/admin/teams/test')->assertOk()->assertJsonPath('ok', true);
        Http::assertSentCount(1);

        $status = $this->withHeaders($admin)->getJson('/api/admin/teams')->assertOk();
        $status->assertJsonPath('data.webhook_configured', true);
        $this->assertStringNotContainsString('SECRETSIG123', $status->getContent());
        $this->assertStringNotContainsString('logic.azure.com', $this->withHeaders($admin)->getJson('/api/admin/settings')->getContent());
    }

    public function test_executive_report_includes_google_ads_only_when_there_is_data(): void
    {
        config(['teams.webhook_url' => self::WEBHOOK]);
        Http::fake(['*' => Http::response('', 202)]);
        $alerts = app(\App\Services\Teams\TeamsAlerts::class);
        $summary = ['period' => 'week', 'period_label' => 'Last 7 days', 'revenue' => ['UGX' => ['current' => 0]], 'enquiries' => ['current' => 2], 'orders' => ['current' => 0]];

        $alerts->executiveReport($summary);
        $this->assertStringNotContainsString('Google Ads', json_encode(TeamsNotification::sole()->payload));

        TeamsNotification::query()->delete();
        \App\Models\GoogleAdsCampaignDay::create(['date' => now()->toDateString(), 'campaign_id' => '1', 'campaign_name' => 'FET', 'cost_micros' => 5_000_000]);
        $alerts->executiveReport($summary);
        $this->assertStringContainsString('Google Ads spend', json_encode(TeamsNotification::sole()->payload));
    }

    /* ── Teams tab sign-in (Entra SSO) ───────────────────────────────────── */

    private array $key;

    private function entra(): void
    {
        config(['teams.entra.tenant_id' => self::TENANT, 'teams.entra.client_id' => self::CLIENT]);
        $res = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($res, $pem);
        $d = openssl_pkey_get_details($res)['rsa'];
        $b64 = fn ($v) => rtrim(strtr(base64_encode($v), '+/', '-_'), '=');
        $this->key = ['pem' => $pem];
        Http::fake(['login.microsoftonline.com/*' => Http::response(['keys' => [[
            'kty' => 'RSA', 'use' => 'sig', 'kid' => 'k1', 'alg' => 'RS256', 'n' => $b64($d['n']), 'e' => $b64($d['e']),
        ]]])]);
    }

    private function token(array $override = []): string
    {
        return JWT::encode([
            'aud' => self::CLIENT, 'iss' => 'https://login.microsoftonline.com/'.self::TENANT.'/v2.0', 'tid' => self::TENANT,
            'ver' => '2.0', 'scp' => 'access_as_user', 'oid' => 'oid-1', 'preferred_username' => 'boss@vitorra.org',
            'iat' => time(), 'nbf' => time(), 'exp' => time() + 3600, ...$override,
        ], $this->key['pem'], 'RS256', 'k1');
    }

    public function test_teams_sign_in_is_refused_until_configured(): void
    {
        $this->postJson('/api/auth/teams', ['token' => 'x.y.z'])->assertStatus(503)->assertJsonPath('code', 'teams_sso_not_configured');
    }

    public function test_a_verified_teams_token_signs_in_the_matching_console_user(): void
    {
        $this->entra();
        $boss = $this->user('admin', ['email' => 'boss@vitorra.org']);

        $res = $this->postJson('/api/auth/teams', ['token' => $this->token()])->assertOk();
        $this->assertSame($boss->id, $res->json('data.user.id'));
        $this->assertNotEmpty($res->json('data.token'));
        $this->assertSame('oid-1', $boss->refresh()->microsoft_oid, 'linked to the Entra object id');

        // The issued token works on the admin dashboard API.
        $this->app['auth']->forgetGuards();
        $this->withHeaders(['Authorization' => 'Bearer '.$res->json('data.token')])->getJson('/api/admin/stats')->assertOk();
    }

    public function test_tokens_that_fail_any_check_are_refused(): void
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class); // many attempts by design
        $this->entra();
        $this->user('admin', ['email' => 'boss@vitorra.org']);

        foreach ([
            'other tenant'   => ['tid' => '99999999-2222-3333-4444-555555555555', 'iss' => 'https://login.microsoftonline.com/99999999-2222-3333-4444-555555555555/v2.0'],
            'wrong audience' => ['aud' => '00000003-0000-0000-c000-000000000000'],
            'no scope'       => ['scp' => 'User.Read'],
            'v1 token'       => ['ver' => '1.0'],
            'expired'        => ['exp' => time() - 3600, 'iat' => time() - 7200, 'nbf' => time() - 7200],
        ] as $why => $bad) {
            $this->postJson('/api/auth/teams', ['token' => $this->token($bad)])->assertStatus(401);
        }

        // Signed by someone else's key.
        $other = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($other, $otherPem);
        $forged = JWT::encode(['aud' => self::CLIENT, 'iss' => 'https://login.microsoftonline.com/'.self::TENANT.'/v2.0', 'tid' => self::TENANT, 'ver' => '2.0', 'scp' => 'access_as_user', 'oid' => 'x', 'preferred_username' => 'boss@vitorra.org', 'exp' => time() + 600], $otherPem, 'RS256', 'k1');
        $this->postJson('/api/auth/teams', ['token' => $forged])->assertStatus(401);
    }

    public function test_access_rules_still_apply_inside_teams(): void
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class); // many attempts by design
        $this->entra();
        $this->user('employee', ['email' => 'emp@vitorra.org']);
        $this->user('ops', ['email' => 'gone@vitorra.org', 'staff_status' => 'left']);
        $this->user('ops', ['email' => 'gmailer@gmail.com']);
        $linked = $this->user('ops', ['email' => 'linked@vitorra.org']);
        $linked->forceFill(['microsoft_oid' => 'someone-else'])->save();

        $this->postJson('/api/auth/teams', ['token' => $this->token(['preferred_username' => 'emp@vitorra.org', 'oid' => 'o2'])])->assertStatus(403)->assertJsonPath('code', 'no_dashboard_access');
        $this->postJson('/api/auth/teams', ['token' => $this->token(['preferred_username' => 'gone@vitorra.org', 'oid' => 'o3'])])->assertStatus(403)->assertJsonPath('code', 'inactive');
        $this->postJson('/api/auth/teams', ['token' => $this->token(['preferred_username' => 'nobody@vitorra.org', 'oid' => 'o4'])])->assertStatus(403)->assertJsonPath('code', 'no_account');
        // An address that isn't the person's Microsoft 365 address doesn't count.
        $this->postJson('/api/auth/teams', ['token' => $this->token(['preferred_username' => 'gmailer@gmail.com', 'oid' => 'o5'])])->assertStatus(403);
        // Already linked to another Entra account.
        $this->postJson('/api/auth/teams', ['token' => $this->token(['preferred_username' => 'linked@vitorra.org', 'oid' => 'o6'])])->assertStatus(403)->assertJsonPath('code', 'account_mismatch');
    }

    public function test_sign_in_attempts_are_rate_limited(): void
    {
        \Illuminate\Support\Facades\Cache::flush(); // start from a clean limiter
        $this->entra();
        foreach (range(1, 8) as $i) {
            $r = $this->postJson('/api/auth/teams', ['token' => 'not.a.token']);
            $this->assertSame(401, $r->status(), "attempt {$i}");
        }
        $this->postJson('/api/auth/teams', ['token' => 'not.a.token'])->assertStatus(429);
    }

    public function test_two_factor_is_still_required_inside_teams(): void
    {
        $this->entra();
        $u = $this->user('admin', ['email' => 'boss@vitorra.org']);
        $tfa = app(\App\Services\TwoFactorService::class);
        $secret = $tfa->generateSecret();
        $u->forceFill(['two_factor_secret' => $secret, 'two_factor_confirmed_at' => now()])->save();

        $this->postJson('/api/auth/teams', ['token' => $this->token()])->assertOk()->assertJsonPath('data.two_factor_required', true);
        $this->postJson('/api/auth/teams', ['token' => $this->token(), 'code' => '000000'])->assertStatus(422);
        $code = (new \PragmaRX\Google2FA\Google2FA)->getCurrentOtp($secret);
        $this->postJson('/api/auth/teams', ['token' => $this->token(), 'code' => $code])->assertOk()->assertJsonPath('data.user.id', $u->id);
    }
}
