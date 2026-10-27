<?php

namespace App\Console\Commands;

use App\Mail\BlogDraftReady;
use App\Models\BlogPost;
use App\Models\Setting;
use App\Services\BlogAutopilot;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class DraftBlogPost extends Command
{
    protected $signature = 'blog:draft {--topic= : fet | coffee | logistics | seal (default: next in the rotation)}';

    protected $description = 'Research this week\'s news on one sector and save a draft blog post for Marketing to review.';

    public function handle(BlogAutopilot $autopilot): int
    {
        if (! config('blog_autopilot.enabled')) {
            $this->warn('Blog autopilot is switched off (BLOG_AUTOPILOT_ENABLED). Skipping.');
            return self::SUCCESS;
        }
        if (! $autopilot->enabled()) {
            $this->warn('ANTHROPIC_API_KEY is not set, so no draft can be written. Skipping.');
            return self::SUCCESS;
        }

        $topics = array_keys(config('blog_autopilot.topics'));
        $topic = $this->option('topic');
        if ($topic && ! in_array($topic, $topics, true)) {
            $this->error('Unknown topic. Use one of: '.implode(', ', $topics));
            return self::INVALID;
        }
        if (! $topic) {
            $rotation = config('blog_autopilot.rotation');
            $topic = $rotation[BlogPost::where('origin', 'auto')->count() % count($rotation)];
        }

        $this->info("Researching {$topic}…");
        $post = $autopilot->draft($topic);
        if (! $post) {
            $this->error('No draft this time (see the log). The next scheduled run will try again.');
            return self::FAILURE;
        }

        $to = collect(explode(',', (string) (Setting::get('blog_review_to') ?: 'support@vitorra.org')))
            ->map(fn ($e) => trim($e))->filter()->values()->all();
        if ($to) {
            Mail::to($to)->send(new BlogDraftReady($post));
        }

        $this->info("Draft saved: \"{$post->title}\" (#{$post->id})".($to ? ' — review email sent to '.implode(', ', $to) : '').'.');

        return self::SUCCESS;
    }
}
