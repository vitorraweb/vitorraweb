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
            'paragraphs' => ['required', 'array', 'min:1', 'max:12'],
            'paragraphs.*' => ['string', 'max:1200'],
            'button_label' => ['nullable', 'required_with:button_url', 'string', 'max:60'],
            'button_url' => ['nullable', 'string', 'max:500', 'regex:#^(/[^/\\\\]|https://)#'],
        ]);

        // The "Simple letter" layout: logo, message, one button. Paragraph text is
        // escaped here; the designer cleans everything again on save.
        $html = collect($data['paragraphs'])->map(fn ($p) => '<p>'.nl2br(e($p)).'</p>')->implode('');
        $blocks = [
            ['type' => 'logo', 'props' => ['width' => 84, 'paddingY' => 28]],
            ['type' => 'divider', 'props' => ['width' => 100, 'paddingY' => 4]],
            ['type' => 'text', 'props' => ['html' => $html, 'paddingY' => 28]],
        ];
        if (! empty($data['button_url'])) {
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

        return response()->json(['data' => ['id' => $c->id, 'review' => "/admin/marketing/campaigns/{$c->id}"]], 201);
    }

    private function key(Request $request): void
    {
        $token = $request->user()?->currentAccessToken();
        abort_unless($token && in_array(BlogDraftsToken::ABILITY, (array) ($token->abilities ?? []), true), 403, 'This key cannot create drafts.');
    }
}
