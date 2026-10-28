<?php

namespace App\Services\Marketing;

use App\Models\Communication;
use App\Models\Prospect;
use App\Models\ProspectCampaignRecipient;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * The decision engine: which leads Marketing should spend time on, and which
 * it should leave alone.
 *
 * Deliberately a set of plain, explainable rules rather than a model — every
 * score comes with the reasons behind it, in words, so the team can see why
 * a lead is "hot" and argue with it. It learns from our own history: how the
 * lead behaved with past campaigns (opened, clicked, replied, or ignored),
 * where it sits in the pipeline, and how well its industry has converted.
 *
 * Tiers
 *   hot             ≥ 60   act now
 *   warm            35–59  keep in campaigns, follow up
 *   cold            15–34  email only, low effort
 *   avoid           < 15, or said no / bad contact details — not suggested
 *   do_not_contact  unsubscribed — never emailed again
 *   customer        already converted — not a lead
 */
class LeadScorer
{
    private const ENGAGEMENT_DAYS = 120;

    /** Campaign history, replies and industry fit, loaded once for a whole run. */
    private array $history = [];
    private array $replies = [];
    private array $industryRate = [];

    public static function forAll(): self
    {
        return (new self)->loadContext();
    }

    public function loadContext(?Collection $emails = null): self
    {
        $since = now()->subDays(self::ENGAGEMENT_DAYS);

        // Per address: campaigns received, opened, clicked; last activity.
        $q = ProspectCampaignRecipient::query()
            ->where('status', 'sent')->where('sent_at', '>=', $since)
            ->selectRaw('LOWER(email) e, COUNT(*) received,
                SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) opened,
                SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) clicked,
                MAX(clicked_at) last_click, MAX(opened_at) last_open')
            ->groupByRaw('LOWER(email)');
        if ($emails) {
            $q->whereIn(DB::raw('LOWER(email)'), $emails->map(fn ($e) => mb_strtolower($e))->all());
        }
        $this->history = $q->get()->keyBy('e')->all();

        $r = Communication::query()->where('direction', 'inbound')->where('created_at', '>=', $since)
            ->selectRaw('LOWER(email) e, COUNT(*) n, MAX(created_at) last')->groupByRaw('LOWER(email)');
        if ($emails) {
            $r->whereIn(DB::raw('LOWER(email)'), $emails->map(fn ($e) => mb_strtolower($e))->all());
        }
        $this->replies = $r->get()->keyBy('e')->all();

        // How well each product × industry has converted so far.
        $this->industryRate = Prospect::query()
            ->selectRaw("product, category, COUNT(*) n, SUM(CASE WHEN outreach_status = 'converted' THEN 1 ELSE 0 END) won")
            ->groupBy('product', 'category')->get()
            ->mapWithKeys(fn ($row) => ["{$row->product}|{$row->category}" => $row->n >= 5 ? $row->won / $row->n : null])
            ->all();

        return $this;
    }

    /**
     * @return array{score:int, tier:string, reasons:list<string>, action:string}
     */
    public function score(Prospect $p): array
    {
        $email = mb_strtolower(trim((string) $p->email));
        $flags = (array) ($p->flags ?? []);

        // Hard rules first: these are not judgement calls.
        if ($p->unsubscribed_at) {
            return $this->result(0, 'do_not_contact', ['Unsubscribed on '.$p->unsubscribed_at->format('j M Y')], 'Do not email. They asked to be removed.');
        }
        if ($p->outreach_status === 'converted') {
            return $this->result(100, 'customer', ['Already a customer'], 'Look after them as a customer, not a lead.');
        }
        if ($p->outreach_status === 'not_interested') {
            return $this->result(5, 'avoid', ['Said they were not interested'], 'Leave alone. Revisit only if something changes.');
        }
        if ($p->outreach_status === 'bounced' || in_array('bad_email', $flags, true) || ($email === '' && blank($p->phone))) {
            return $this->result(8, 'avoid', [$email === '' ? 'No email or phone on file' : 'Email address does not work'], 'Fix the contact details before spending time here.');
        }

        $points = [];   // [points, reason]
        $h = $this->history[$email] ?? null;
        $reply = $this->replies[$email] ?? null;

        // Pipeline stage.
        $stage = [
            'not_contacted' => [10, 'Not contacted yet'],
            'contacted'     => [6, null],
            'delivered'     => [6, null],
            'responded'     => [25, 'Has responded before'],
            'qualified'     => [35, 'Qualified by the team'],
            'quoted'        => [40, 'Has a quotation'],
        ][$p->outreach_status] ?? [6, null];
        $points[] = $stage;

        // Engagement with our emails (last 120 days).
        if ($reply) {
            $points[] = [min(30, 18 + 6 * (int) $reply->n), 'Replied to us '.$this->ago($reply->last)];
        }
        if ($h) {
            if ((int) $h->clicked > 0) {
                $points[] = [min(30, 15 * (int) $h->clicked), 'Clicked a link in '.$this->n((int) $h->clicked, 'campaign').', last '.$this->ago($h->last_click)];
            }
            if ((int) $h->opened > 0 && (int) $h->clicked === 0) {
                $points[] = [min(15, 5 * (int) $h->opened), 'Opened '.$this->n((int) $h->opened, 'campaign').' but did not click'];
            }
            // Disappointment: campaigns that went unanswered entirely.
            $ignored = (int) $h->received - max((int) $h->opened, (int) $h->clicked);
            if ($ignored >= 2 && ! $reply) {
                $points[] = [-8 * ($ignored - 1), 'Ignored '.$this->n($ignored, 'campaign').' in a row'];
            }
        }

        // A quotation that went quiet.
        if ($p->outreach_status === 'quoted' && $p->updated_at && $p->updated_at->lt(now()->subDays(60))) {
            $points[] = [-25, 'Quoted '.$p->updated_at->diffForHumans().' and went quiet'];
        }

        // Follow-ups.
        if ($p->follow_up_on) {
            $days = (int) now()->startOfDay()->diffInDays($p->follow_up_on, false);
            if ($days <= 0 && $days >= -7) {
                $points[] = [10, $days === 0 ? 'Follow-up due today' : 'Follow-up overdue by '.$this->n(-$days, 'day')];
            } elseif ($days < -30 && ! $h?->clicked && ! $reply) {
                $points[] = [-10, 'Follow-up missed over a month ago with no response since'];
            }
        }

        // Fit: how this industry has converted for this product.
        $rate = $this->industryRate["{$p->product}|{$p->category}"] ?? null;
        if ($rate !== null && $rate > 0) {
            $points[] = [(int) min(15, round($rate * 100)), round($rate * 100).'% of '.strtolower(str_replace('_', ' ', $p->category)).' leads became customers'];
        }
        if ($email !== '' && filled($p->phone)) {
            $points[] = [3, null];
        }

        $score = max(0, min(99, array_sum(array_column($points, 0))));
        // "Avoid" is earned by disappointing us, never by being new: a lead
        // with no bad signals is at worst cold — worth an email, not a call.
        $disappointed = collect($points)->contains(fn ($x) => $x[0] < 0);
        if ($score < 15 && ! $disappointed) {
            $score = 15;
        }
        $tier = $score >= 60 ? 'hot' : ($score >= 35 ? 'warm' : ($score >= 15 ? 'cold' : 'avoid'));

        // Reasons, strongest effect first, with the sign so "why" is clear.
        $reasons = collect($points)->filter(fn ($x) => $x[1] !== null)
            ->sortByDesc(fn ($x) => abs($x[0]))->map(fn ($x) => $x[1])->take(4)->values()->all();

        return $this->result($score, $tier, $reasons ?: ['No activity yet'], $this->action($p, $tier, $h, $reply));
    }

    private function action(Prospect $p, string $tier, ?object $h, ?object $reply): string
    {
        return match (true) {
            $p->outreach_status === 'quoted' && $tier !== 'avoid' => 'Chase the quotation by phone.',
            (bool) $reply => 'Reply personally and offer a call or assessment.',
            $h && (int) $h->clicked > 0 => blank($p->phone) ? 'Email them directly; they clicked recently.' : 'Call them; they clicked recently.',
            $p->outreach_status === 'not_contacted' && $tier !== 'avoid' => 'Include in the next campaign to test interest.',
            $tier === 'hot' => 'Call this week.',
            $tier === 'warm' => 'Keep in campaigns and follow up.',
            $tier === 'cold' => 'Email only; do not chase by phone.',
            default => 'Leave alone; not worth the team\'s time right now.',
        };
    }

    /** Score and store every prospect (or the given ones). Returns how many changed tier. */
    public function scoreAndStore(?Collection $prospects = null): int
    {
        $changed = 0;
        $query = $prospects ? Prospect::whereIn('id', $prospects->pluck('id')) : Prospect::query();
        $query->chunkById(200, function ($chunk) use (&$changed) {
            foreach ($chunk as $p) {
                $r = $this->score($p);
                if ($p->lead_tier !== $r['tier']) {
                    $changed++;
                }
                // Quietly: scoring must not touch updated_at, which the
                // "quoted and went quiet" rule reads.
                Prospect::whereKey($p->id)->update([
                    'lead_score'     => $r['score'],
                    'lead_tier'      => $r['tier'],
                    'lead_reasons'   => json_encode($r['reasons']),
                    'lead_action'    => $r['action'],
                    'lead_scored_at' => now(),
                ]);
            }
        });

        return $changed;
    }

    private function result(int $score, string $tier, array $reasons, string $action): array
    {
        return compact('score', 'tier', 'reasons', 'action');
    }

    private function n(int $n, string $word): string
    {
        return $n.' '.$word.($n === 1 ? '' : 's');
    }

    private function ago(mixed $when): string
    {
        return $when ? \Illuminate\Support\Carbon::parse($when)->diffForHumans() : 'recently';
    }
}
