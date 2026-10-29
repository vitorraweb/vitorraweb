<?php

namespace App\Services\Analytics;

use App\Models\Enquiry;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * The handful of things worth knowing about the website this week, written as
 * plain sentences for the console's first page. Built from the PostHog
 * figures (PostHogWebStats) plus our own enquiries, most important first:
 * warnings, then big moves, then useful context. Each insight is independent —
 * one failing query drops that line, not the panel.
 */
class WebInsights
{
    private const PRODUCT_PAGES = [
        'FET'       => ['/products/fuel-eco-tech', 'Fuel Eco Tech'],
        'SEAL'      => ['/products/seal-wound-spray', 'SEAL Wound Spray'],
        'COFFEE'    => ['/products/coffee', 'Coffee'],
        'LOGISTICS' => ['/products/logistics', 'Logistics'],
    ];

    public function __construct(private PostHogWebStats $stats) {}

    /** @return array<int, array{tone:string, headline:string, detail:string, href:string, weight:int}> */
    public function build(): array
    {
        return Cache::remember('posthog:insights', 900, function () {
            $s = $this->stats->summary('7d');
            $out = [];

            foreach (['traffic', 'conversion', 'products', 'landing', 'channels', 'devices', 'countries'] as $kind) {
                try {
                    array_push($out, ...array_map(fn ($l) => $l + ['kind' => $kind], $this->{$kind}($s)));
                } catch (Throwable) {
                    // That line is skipped; the rest still show.
                }
            }

            usort($out, fn ($a, $b) => $b['weight'] <=> $a['weight']);

            return array_slice($out, 0, 6);
        });
    }

    private function traffic(array $s): array
    {
        [$now, $before] = [$s['visitors']['now'], $s['visitors']['before']];
        if ($now === 0 && $before === 0) {
            return [$this->line('warn', 'No visitors recorded in the last 7 days', 'Check that the website analytics key is set on Vercel and the site has been redeployed.', 100, 'No visitors recorded')];
        }
        if ($before === 0) {
            return [$this->line('info', number_format($now).' people visited the website this week', 'There is no earlier week to compare with yet.', 40, number_format($now).' visitors')];
        }
        $pct = (int) round(($now - $before) / $before * 100);
        $tone = $pct <= -20 ? 'down' : ($pct >= 20 ? 'up' : 'info');

        return [$this->line(
            $tone,
            number_format($now).' visitors this week, '.($pct >= 0 ? "up {$pct}%" : 'down '.abs($pct).'%').' on last week',
            number_format($s['sessions']['now']).' visits and '.number_format($s['pageviews']['now']).' pages read.',
            abs($pct) >= 20 ? 80 : 45,
            number_format($now).' visitors · '.($pct >= 0 ? '+' : '−').abs($pct).'% vs last week',
        )];
    }

    private function conversion(array $s): array
    {
        $visitors = $s['visitors']['now'];
        if ($visitors < 20) {
            return [];
        }
        $leads = $s['leads']['now'];
        $rate = round($leads / $visitors * 100, 1);

        if ($leads === 0) {
            return [$this->line('warn', 'No enquiries from '.number_format($visitors).' visitors this week', 'People are arriving but not getting in touch. Check the enquiry forms and the call-to-action on the most read pages.', 95, 'No enquiries this week')];
        }

        return [$this->line(
            $rate >= 2 ? 'up' : 'info',
            "{$rate}% of visitors got in touch",
            number_format($leads).' '.($leads === 1 ? 'lead' : 'leads').' (enquiries, messages, reservations) from '.number_format($visitors).' visitors. 1–3% is typical for business websites.',
            60,
            "{$rate}% got in touch ({$leads})",
        )];
    }

    /** Product pages read a lot but producing few enquiries — the clearest place to act. */
    private function products(array $s): array
    {
        $views = $this->stats->productPageViews(array_map(fn ($p) => $p[0], self::PRODUCT_PAGES));
        $enquiries = Enquiry::query()
            ->where('created_at', '>=', now()->subDays(7))
            ->where('email', 'not like', '%@vitorra.org')
            ->selectRaw('product_category, count(*) as n')->groupBy('product_category')
            ->pluck('n', 'product_category');

        $out = [];
        $best = null;
        foreach (self::PRODUCT_PAGES as $key => [$path, $label]) {
            $people = $views[$path] ?? 0;
            $n = (int) ($enquiries[$key] ?? 0);
            if ($people >= 30 && $n === 0) {
                $out[] = $this->line('warn', "{$label}: ".number_format($people).' people read the page, no enquiries', 'Interest is there but nobody asked. Worth a stronger call to action or a follow-up offer on that page.', 90, "{$label}: ".number_format($people).' readers, 0 enquiries');
            }
            if ($people > 0 && (! $best || $people > $best[1])) {
                $best = [$label, $people, $n];
            }
        }
        if ($best && ! $out) {
            [$label, $people, $n] = $best;
            $out[] = $this->line('info', "{$label} is the most read product this week", number_format($people).' people read the page; '.$n.' '.($n === 1 ? 'enquiry' : 'enquiries').' came in for it.', 50, "Top product: {$label}");
        }

        return $out;
    }

    /** The busiest first page that sends most people away. */
    private function landing(array $s): array
    {
        $row = collect($this->stats->landingPages())->first(fn ($r) => $r['sessions'] >= 20 && $r['bounce'] >= 70);
        if (! $row) {
            return [];
        }

        return [$this->line('warn', round($row['bounce']).'% of people who arrive on '.$row['path'].' leave without reading on', number_format($row['sessions']).' visits started there this week. It is the page to improve first.', 85, round($row['bounce']).'% leave from '.$row['path'])];
    }

    private function channels(array $s): array
    {
        $total = array_sum(array_column($s['channels'], 'sessions'));
        if ($total < 10) {
            return [];
        }
        $top = $s['channels'][0];
        $share = (int) round($top['sessions'] / $total * 100);
        $paid = collect($s['channels'])->first(fn ($c) => str_starts_with($c['label'], 'Paid'));
        $detail = $paid && $paid !== $top
            ? $paid['label'].' (ads) brought '.number_format($paid['sessions']).' visits.'
            : 'Across '.count($s['channels']).' ways people find the site.';

        return [$this->line('info', "Most visits come from {$top['label']} ({$share}%)", $detail, 40, "Top source: {$top['label']} {$share}%")];
    }

    private function devices(array $s): array
    {
        $total = array_sum(array_column($s['devices'], 'people'));
        $mobile = collect($s['devices'])->first(fn ($d) => strcasecmp($d['label'], 'Mobile') === 0);
        if ($total < 20 || ! $mobile) {
            return [];
        }
        $pct = (int) round($mobile['people'] / $total * 100);

        return $pct >= 60
            ? [$this->line('info', "{$pct}% of visitors are on a phone", 'Pages, forms and the WhatsApp button should be checked on a phone first.', 35, "{$pct}% on phones")]
            : [];
    }

    private function countries(array $s): array
    {
        $total = array_sum(array_column($s['countries'], 'people'));
        if ($total < 20 || count($s['countries']) < 2) {
            return [];
        }
        $abroad = collect($s['countries'])->reject(fn ($c) => in_array($c['label'], ['Uganda', 'Unknown'], true))->take(3);
        if ($abroad->isEmpty()) {
            return [];
        }

        return [$this->line('info', 'Visitors from abroad: '.$abroad->map(fn ($c) => "{$c['label']} ({$c['people']})")->join(', '), 'International interest, useful for coffee export and SEAL.', 30, 'Abroad: '.$abroad->map(fn ($c) => $c['label'])->join(', '))];
    }

    /** $short is the few-word version for the one-line strip on the console home. */
    private function line(string $tone, string $headline, string $detail, int $weight, string $short = ''): array
    {
        return ['tone' => $tone, 'headline' => $headline, 'short' => $short ?: $headline, 'detail' => $detail, 'href' => '/admin/website', 'weight' => $weight];
    }
}
