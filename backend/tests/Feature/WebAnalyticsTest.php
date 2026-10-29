<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class WebAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private function headers(string $role = 'admin', ?string $department = null): array
    {
        $u = User::create([
            'name' => 'Staff', 'email' => 's-'.uniqid().'@vitorra.org', 'password' => 'changeme123changeme',
            'role' => $role, 'department' => $department,
        ]);

        return ['Authorization' => 'Bearer '.$u->createToken('t', ['admin'])->plainTextToken];
    }

    private function configure(): void
    {
        config(['services.posthog' => ['host' => 'https://eu.posthog.com', 'project_id' => '12345', 'personal_api_key' => 'phx_test_secret']]);
        Cache::flush();
    }

    public function test_not_configured_is_a_calm_answer(): void
    {
        config(['services.posthog.project_id' => null, 'services.posthog.personal_api_key' => null]);
        Http::fake();

        $this->withHeaders($this->headers())->getJson('/api/admin/web-analytics/summary')->assertOk()->assertJsonPath('data.configured', false);
        $this->withHeaders($this->headers())->getJson('/api/admin/web-analytics/live')->assertOk()->assertJsonPath('data.configured', false);
        Http::assertNothingSent();
    }

    public function test_summary_reads_posthog_with_the_key_and_shapes_the_answer(): void
    {
        $this->configure();
        Http::fake(['eu.posthog.com/api/projects/12345/query/' => function (Request $r) {
            $q = $r['query']['query'];
            $rows = match (true) {
                str_contains($q, 'FROM sessions') && str_contains($q, 'avg(') => [[95.4, 0.42]],
                str_contains($q, '$channel_type')                         => [['Paid Search', 30], ['Direct', 12]],
                str_contains($q, 'toDate(timestamp)')                     => [['2026-10-28', 40, 120], ['2026-10-29', 22, 60]],
                str_contains($q, 'properties.$pathname AS p')            => [['/products/fuel-eco-tech', 90, 50]],
                str_contains($q, '$geoip_country_name')                   => [['Uganda', 55], [null, 3]],
                str_contains($q, 'properties.$device_type')               => [['Mobile', 48]],
                str_contains($q, 'properties.$browser')                   => [['Chrome', 40]],
                str_contains($q, 'interval 14 day') || str_contains($q, 'INTERVAL 14 DAY') => [[50, 60, 150, 2]],
                default                                                   => [[62, 70, 180, 3]],
            };

            return Http::response(['results' => $rows, 'columns' => []]);
        }]);

        $d = $this->withHeaders($this->headers())->getJson('/api/admin/web-analytics/summary?period=7d')->assertOk()->json('data');

        $this->assertTrue($d['configured']);
        $this->assertSame(['now' => 62, 'before' => 50], $d['visitors']);
        $this->assertSame(180, $d['pageviews']['now']);
        $this->assertSame(3, $d['leads']['now']);
        $this->assertSame(95, $d['avg_session_seconds']);
        $this->assertEquals(42, $d['bounce_rate']);
        $this->assertSame('/products/fuel-eco-tech', $d['pages'][0]['path']);
        $this->assertSame('Paid Search', $d['channels'][0]['label']);
        $this->assertSame('Unknown', $d['countries'][1]['label']);
        $this->assertStringStartsWith('https://eu.posthog.com/project/12345/', $d['links']['replays']);

        Http::assertSent(fn (Request $r) => $r->hasHeader('Authorization', 'Bearer phx_test_secret') && $r['query']['kind'] === 'HogQLQuery');
    }

    public function test_live_counts_people_in_the_last_five_minutes(): void
    {
        $this->configure();
        Http::fake(['eu.posthog.com/*' => function (Request $r) {
            return Http::response(['results' => str_contains($r['query']['query'], 'GROUP BY path')
                ? [['/', 3], ['/products/seal-wound-spray', 1]]
                : [[4]]]);
        }]);

        $d = $this->withHeaders($this->headers())->getJson('/api/admin/web-analytics/live')->assertOk()->json('data');
        $this->assertSame(4, $d['now']);
        $this->assertSame('/products/seal-wound-spray', $d['pages'][1]['path']);
    }

    public function test_a_refused_key_is_explained_and_never_logged(): void
    {
        $this->configure();
        Log::spy();
        Http::fake(['eu.posthog.com/*' => Http::response(['detail' => 'Invalid personal API key.'], 401)]);

        $d = $this->withHeaders($this->headers())->getJson('/api/admin/web-analytics/summary')->assertOk()->json('data');
        $this->assertStringContainsString('query:read', $d['error']);
        $this->assertStringNotContainsString('phx_test_secret', json_encode($d));
        Log::shouldHaveReceived('warning')->withArgs(fn ($m, $ctx) => ! str_contains(json_encode($ctx), 'phx_test_secret'));
    }

    public function test_only_staff_with_the_marketing_reports_module_can_read_it(): void
    {
        $this->configure();
        Http::fake();
        $this->withHeaders($this->headers('ops', 'operations'))->getJson('/api/admin/web-analytics/summary')->assertForbidden();
        $this->flushHeaders();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/admin/web-analytics/summary')->assertUnauthorized();
    }

    public function test_period_is_validated(): void
    {
        $this->configure();
        Http::fake();
        $this->withHeaders($this->headers())->getJson('/api/admin/web-analytics/summary?period=1y')->assertStatus(422);
    }
}
