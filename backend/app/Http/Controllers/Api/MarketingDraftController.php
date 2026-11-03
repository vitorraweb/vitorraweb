<?php

namespace App\Http\Controllers\Api;

use App\Console\Commands\BlogDraftsToken;
use App\Http\Controllers\Controller;
use App\Models\Prospect;
use App\Models\ProspectCampaign;
use App\Models\Spotlight;
use App\Services\Marketing\EmailDesigner;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The daily market briefing's suggestions arrive here as drafts, from
 * scripts/push_marketing_drafts.py, so nobody copies and pastes them.
 *
 * Same key as blog drafts (`blog:drafts-token`, ability "blog-drafts") and the
 * same rule: it only ever creates things that are switched off. A Spotlight is
 * saved inactive; a campaign is saved as a draft with no audience. A person
 * reviews, switches the Spotlight on, or test-sends and sends the campaign.
 */
class MarketingDraftController extends Controller
{
    public function spotlight(Request $request): JsonResponse
    {
        $this->key($request);
        $data = $request->validate([
            'eyebrow' => ['nullable', 'string', 'max:60'],
            'title' => ['required', 'string', 'max:140'], 'body' => ['nullable', 'string', 'max:280'],
            'title_sw' => ['nullable', 'string', 'max:140'], 'body_sw' => ['nullable', 'string', 'max:280'],
            'cta_label' => ['nullable', 'required_with:cta_url', 'string', 'max:40'], 'cta_label_sw' => ['nullable', 'string', 'max:40'],
            'cta_url' => ['nullable', 'string', 'max:500', 'regex:#^(/[^/\\\\]|https://)#'],
            'pages' => ['required', 'array', 'min:1'], 'pages.*' => [Rule::in(Spotlight::PAGES)],
            'starts_on' => ['nullable', 'date'], 'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
        ]);
        $s = Spotlight::create([...$data, 'is_active' => false, 'priority' => 0, 'created_by' => $request->user()->id]);
        Audit::log('marketing.draft_spotlight', "Claude added an inactive Spotlight draft: {$s->title}");

        return response()->json(['data' => ['id' => $s->id, 'review' => '/admin/marketing/spotlight']], 201);
    }

    public function campaign(Request $request): JsonResponse
    {
        $this->key($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'subject' => ['required', 'string', 'max:255'],
            'preheader' => ['nullable', 'string', 'max:200'],
            'product' => ['nullable', Rule::in(Prospect::PRODUCTS)],
            // Either plain paragraphs, or ordered sections mixing text, headings and our own photos.
            'paragraphs' => ['required_without:sections', 'array', 'min:1', 'max:12'],
            'paragraphs.*' => ['string', 'max:1200'],
            'sections' => ['required_without:paragraphs', 'array', 'min:1', 'max:20'],
            'sections.*.type' => ['required', Rule::in(['heading', 'text', 'image', 'photo_text', 'button'])],
            'sections.*.text' => ['nullable', 'string', 'max:1200'],
            'sections.*.src' => ['nullable', 'string', 'max:300', 'regex:#^/[A-Za-z0-9/_\-.]+\.(jpe?g|png|webp)$#'],
            'sections.*.alt' => ['nullable', 'string', 'max:200'],
            'button_label' => ['nullable', 'required_with:button_url', 'string', 'max:60'],
            'button_url' => ['nullable', 'string', 'max:500', 'regex:#^(/[^/\\\\]|https://)#'],
            // This key's own earlier drafts that this one replaces; anything else is left alone.
            'replaces' => ['nullable', 'array', 'max:20'],
            'replaces.*' => ['integer'],
        ]);

        // The "Simple letter" layout: logo, message, one button. Paragraph text is
        // escaped here; the designer cleans everything again on save.
        $para = fn (string $t) => collect(preg_split('/\n{2,}/', trim($t)))->map(fn ($p) => '<p>'.nl2br(e($p)).'</p>')->implode('');
        $blocks = [
            ['type' => 'logo', 'props' => ['width' => 84, 'paddingY' => 28]],
            ['type' => 'divider', 'props' => ['width' => 100, 'paddingY' => 4]],
        ];
        if (! empty($data['sections'])) {
            foreach ($data['sections'] as $sec) {
                $src = ! empty($sec['src']) ? EmailDesigner::siteUrl($sec['src']) : null;
                $blocks[] = match ($sec['type']) {
                    'heading' => ['type' => 'heading', 'props' => ['text' => (string) ($sec['text'] ?? ''), 'size' => 22, 'align' => 'left', 'paddingY' => 16]],
                    'image' => ['type' => 'image', 'props' => ['src' => $src, 'alt' => $sec['alt'] ?? '', 'width' => 100, 'paddingY' => 8]],
                    'button' => ['type' => 'button', 'props' => ['label' => (string) ($data['button_label'] ?? ''), 'url' => (string) ($data['button_url'] ?? '/enquire'), 'color' => '#1E1E1E', 'paddingY' => 16]],
                    'photo_text' => ['type' => 'columns', 'props' => ['src' => $src, 'alt' => $sec['alt'] ?? '', 'html' => $para((string) ($sec['text'] ?? '')), 'imageSide' => 'left']],
                    default => ['type' => 'text', 'props' => ['html' => $para((string) ($sec['text'] ?? '')), 'paddingY' => 12]],
                };
            }
        } else {
            $blocks[] = ['type' => 'text', 'props' => ['html' => collect($data['paragraphs'])->map(fn ($p) => '<p>'.nl2br(e($p)).'</p>')->implode(''), 'paddingY' => 28]];
        }
        // The button goes at the end unless a section already placed it.
        if (! empty($data['button_url']) && ! collect($data['sections'] ?? [])->contains('type', 'button')) {
            $blocks[] = ['type' => 'button', 'props' => ['label' => $data['button_label'], 'url' => $data['button_url'], 'color' => '#1E1E1E', 'paddingY' => 12]];
        }
        $blocks[] = ['type' => 'spacer', 'props' => ['height' => 28]];

        $c = ProspectCampaign::create([
            'name' => $data['name'], 'subject' => $data['subject'], 'preheader' => $data['preheader'] ?? null,
            'product' => $data['product'] ?? null, 'body' => '',
            'design' => EmailDesigner::normalise(['settings' => ['canvas' => '#F2F2F2', 'background' => '#FFFFFF', 'font' => 'arial'], 'blocks' => $blocks], 'u'.$request->user()->id),
            'skip_avoid' => true, 'status' => 'draft', 'created_by' => $request->user()->id,
        ]);
        Audit::log('marketing.draft_campaign', "Claude added a campaign draft: {$c->name}");
        if (! empty($data['replaces'])) {
            ProspectCampaign::whereIn('id', $data['replaces'])->where('created_by', $request->user()->id)->where('status', 'draft')->where('id', '!=', $c->id)->delete();
        }

        return response()->json(['data' => ['id' => $c->id, 'review' => "/admin/marketing/campaigns/{$c->id}"]], 201);
    }

    private function key(Request $request): void
    {
        $token = $request->user()?->currentAccessToken();
        abort_unless($token && in_array(BlogDraftsToken::ABILITY, (array) ($token->abilities ?? []), true), 403, 'This key cannot create drafts.');
    }
}
