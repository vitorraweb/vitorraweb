<?php

namespace App\Services;

use App\Models\BlogPost;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Drafts a blog post from this week's news on one Vitorra sector, in two
 * Claude calls: (1) research with the web search tool, which returns notes and
 * the pages it actually read; (2) write the article from those notes as
 * structured JSON. Splitting them keeps the article bound to sources we saw —
 * any "source" the writer names that research never returned is dropped.
 *
 * Always saves a DRAFT (origin = auto). Returns null if the key is unset or
 * anything fails; the caller logs it and tries again next run.
 */
class BlogAutopilot
{
    private const ENDPOINT = 'https://api.anthropic.com/v1/messages';

    private const ARTICLE_SCHEMA = [
        'type' => 'object',
        'properties' => [
            'title'           => ['type' => 'string'],
            'excerpt'         => ['type' => 'string'],
            'seo_title'       => ['type' => 'string'],
            'seo_description' => ['type' => 'string'],
            'content'         => ['type' => 'string'],   // markdown body, no H1
            'source_urls'     => ['type' => 'array', 'items' => ['type' => 'string']],
        ],
        'required' => ['title', 'excerpt', 'seo_title', 'seo_description', 'content', 'source_urls'],
        'additionalProperties' => false,
    ];

    /** What the writer may say about Vitorra. Anything else about us is off-limits. */
    private const VITORRA_FACTS = <<<'TXT'
Vitorra Holdings Limited is a Kampala-based holdings company (vitorra.org) with four lines:
- Fuel Eco Tech (FET): a device fitted to a vehicle's fuel line, between the pump and the filter, without modifying the engine. In an independent field test by CTI GmbH (Germany, signed November 2025) a Volkswagen T5 van went from 11.52 to 9.92 litres per 100 km, a 13.9% reduction. One vehicle is not every fleet, so Vitorra sells it through a free fuel assessment: measure the customer's own vehicles before and after fitting. Prices from UGX 1,891,000 including installation. Page: /products/fuel-eco-tech ; calculator: /products/fuel-eco-tech#fet-calculator ; assessment: /enquire?sector=FET
- SEAL Hemostatic Wound Spray: a chitosan-based spray for bleeding control, cleared by the US FDA (510(k)). It is NOT approved by Uganda's National Drug Authority — never say or imply it is. It does not replace a tourniquet. Page: /products/seal-wound-spray
- Vitorra Coffee: Ugandan Arabica for export buyers and local wholesale; retail bags are not on sale yet. Page: /products/coffee ; enquiries: /enquire?sector=COFFEE
- Vitorra Logistics: freight and supply-chain services for Ugandan importers and exporters, quoted per shipment. No promises about border times or tracking. Page: /products/logistics ; enquiries: /enquire?sector=LOGISTICS
TXT;

    public function __construct(private readonly ?string $key = null) {}

    public function enabled(): bool
    {
        return (bool) ($this->key ?? config('services.anthropic.key'));
    }

    /** Draft one post for $topic (a key of blog_autopilot.topics). */
    public function draft(string $topic): ?BlogPost
    {
        $spec = config("blog_autopilot.topics.$topic");
        if (! $spec || ! $this->enabled()) {
            return null;
        }

        $recent = BlogPost::latest('created_at')->limit(25)->pluck('title')->all();

        $research = $this->research($spec, $recent);
        if (! $research || $research['notes'] === '' || empty($research['sources'])) {
            Log::warning('Blog autopilot: research returned nothing usable', ['topic' => $topic]);
            return null;
        }

        $article = $this->write($spec, $research);
        if (! $article) {
            return null;
        }

        // Keep only sources research actually returned, in the order the writer cited them.
        $known = collect($research['sources'])->keyBy('url');
        $sources = collect($article['source_urls'])
            ->map(fn ($u) => $known->get($u))->filter()->unique('url')->values();
        if ($sources->isEmpty()) {
            $sources = collect($research['sources'])->take(3);
        }

        $content = rtrim($article['content'])
            ."\n\n*Researched with AI assistance and checked by the Vitorra team before publishing.*"
            ."\n\n## Sources\n\n"
            .$sources->map(fn ($s) => '- ['.str_replace(['[', ']'], '', $s['title'] ?: $s['url']).']('.$s['url'].')')->implode("\n");

        $covers = $spec['covers'];
        $used = BlogPost::where('topic', $topic)->count();

        return BlogPost::create([
            'title'           => Str::limit($article['title'], 250, ''),
            'slug'            => $this->uniqueSlug($article['title']),
            'excerpt'         => Str::limit($article['excerpt'], 495),
            'content'         => $content,
            'cover_image'     => $covers[$used % count($covers)],
            'status'          => 'draft',
            'origin'          => 'auto',
            'topic'           => $topic,
            'seo_title'       => Str::limit($article['seo_title'], 250, ''),
            'seo_description' => Str::limit($article['seo_description'], 495),
        ]);
    }

    /** @return array{notes:string, sources:list<array{url:string,title:string}>}|null */
    private function research(array $spec, array $recent): ?array
    {
        $today = now('Africa/Kampala')->toFormattedDateString();
        $covered = $recent ? "Already on our blog (do not repeat these angles):\n- ".implode("\n- ", $recent) : '';

        $messages = [[
            'role'    => 'user',
            'content' => <<<TXT
Today is {$today}. You are the research desk for the blog of Vitorra Holdings, a Kampala business.

Search the web for news from roughly the last three weeks about: {$spec['brief']}.

Pick the ONE development that matters most to business owners in Uganda and East Africa right now and that we have not covered. Prefer primary or reputable sources (government and regulator notices, Bank of Uganda, UBOS, URA, Uganda Coffee Development Authority, ICO, port authorities, Reuters, Daily Monitor, New Vision, The EastAfrican, Business Daily).

{$covered}

Then write research notes: what happened and when; the key facts and figures, each with the URL it came from; why it matters to a Ugandan business; and anything still uncertain. Facts only — no figures you did not read in a source.
TXT,
        ]];

        $tools = [[
            'type'          => 'web_search_20260209',
            'name'          => 'web_search',
            'max_uses'      => 8,
            'user_location' => ['type' => 'approximate', 'city' => 'Kampala', 'country' => 'UG', 'timezone' => 'Africa/Kampala'],
        ]];

        $content = [];
        // Server tools can pause a long turn; resend with what we have so far to let it finish.
        for ($i = 0; $i < 4; $i++) {
            $res = $this->call(['max_tokens' => 16000, 'messages' => $messages, 'tools' => $tools]);
            if (! $res) {
                return null;
            }
            $content = array_merge($content, $res['content'] ?? []);
            if (($res['stop_reason'] ?? null) !== 'pause_turn') {
                break;
            }
            $messages[] = ['role' => 'assistant', 'content' => $res['content']];
        }

        $notes = '';
        $cited = [];
        $seen = [];
        foreach ($content as $block) {
            $type = $block['type'] ?? null;
            if ($type === 'text') {
                $notes .= $block['text'];
                foreach ($block['citations'] ?? [] as $c) {
                    if (! empty($c['url'])) {
                        $cited[$c['url']] = ['url' => $c['url'], 'title' => (string) ($c['title'] ?? '')];
                    }
                }
            } elseif ($type === 'web_search_tool_result' && is_array($block['content'] ?? null) && array_is_list($block['content'])) {
                foreach ($block['content'] as $r) {
                    if (($r['type'] ?? null) === 'web_search_result' && ! empty($r['url'])) {
                        $seen[$r['url']] = ['url' => $r['url'], 'title' => (string) ($r['title'] ?? '')];
                    }
                }
            }
        }

        // Cited pages first, then the rest of what was searched.
        $sources = array_values($cited + $seen);

        return ['notes' => trim($notes), 'sources' => array_slice($sources, 0, 30)];
    }

    /** @return array<string,mixed>|null */
    private function write(array $spec, array $research): ?array
    {
        $sourceList = collect($research['sources'])->map(fn ($s) => "- {$s['url']} ({$s['title']})")->implode("\n");
        $facts = self::VITORRA_FACTS;

        $system = <<<TXT
You write articles for the Vitorra Holdings blog. Readers are business owners, fleet managers, procurement teams and buyers in Uganda and East Africa.

Voice: plain British English, calm and practical, like the best of the Financial Times explained to a busy owner. Short paragraphs. Use ## headings for sections (never a # heading — the page supplies the title). Use bold rarely. 650 to 1,000 words.

Rules:
- Every fact and figure must come from the research notes. Never invent numbers, quotes, dates or names. If the notes are unsure, say so.
- Give money in UGX where the notes allow, and say where a figure is an estimate.
- End with a short practical section: what a reader should do or watch next.
- You may mention Vitorra once, near the end, only where it genuinely helps the reader, with one link from the facts below. Never add claims about Vitorra beyond these facts; never promise savings or outcomes; no medical advice beyond general first-aid awareness.
- Do not include a sources list in the content; return the URLs you relied on in source_urls, chosen only from the list provided.

What you may say about Vitorra:
{$facts}
TXT;

        $res = $this->call([
            'max_tokens'    => 16000,
            'system'        => $system,
            'messages'      => [[
                'role'    => 'user',
                'content' => "Topic area: {$spec['label']}\n\nResearch notes:\n{$research['notes']}\n\nSources the research read:\n{$sourceList}\n\nWrite the article.",
            ]],
            'output_config' => ['format' => ['type' => 'json_schema', 'schema' => self::ARTICLE_SCHEMA]],
        ]);

        foreach ($res['content'] ?? [] as $block) {
            if (($block['type'] ?? null) === 'text') {
                $d = json_decode($block['text'], true);
                if (is_array($d) && filled($d['title'] ?? null) && filled($d['content'] ?? null)) {
                    return $d + ['source_urls' => []];
                }
            }
        }

        Log::warning('Blog autopilot: writer returned no article');
        return null;
    }

    /** One Messages API request; null on any failure or refusal. */
    private function call(array $body): ?array
    {
        try {
            $res = Http::withHeaders([
                'x-api-key'         => $this->key ?? config('services.anthropic.key'),
                'anthropic-version' => '2023-06-01',
                // On a safety decline, let the API retry on a fallback model in the same call.
                'anthropic-beta'    => 'server-side-fallback-2026-07-01',
                'content-type'      => 'application/json',
            ])->timeout(600)->post(self::ENDPOINT, [
                'model'     => config('blog_autopilot.model'),
                'fallbacks' => 'default',
            ] + $body);

            if (! $res->successful()) {
                Log::warning('Blog autopilot: API call failed', ['status' => $res->status(), 'body' => Str::limit($res->body(), 500)]);
                return null;
            }
            if ($res->json('stop_reason') === 'refusal') {
                Log::warning('Blog autopilot: request declined', ['details' => $res->json('stop_details')]);
                return null;
            }

            return $res->json();
        } catch (\Throwable $e) {
            Log::warning('Blog autopilot: '.$e->getMessage());
            return null;
        }
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::limit(Str::slug($title), 80, '') ?: 'post';
        $slug = $base;
        for ($i = 2; BlogPost::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
