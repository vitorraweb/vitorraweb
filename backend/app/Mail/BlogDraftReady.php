<?php

namespace App\Mail;

use App\Models\BlogPost;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

/** A new auto-drafted blog post waiting for a person to check and publish. */
class BlogDraftReady extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly BlogPost $post) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Blog draft to review: {$this->post->title}");
    }

    public function content(): Content
    {
        $origin = rtrim((string) config('services.frontend.url'), '/');

        return new Content(text: 'emails.blog-draft-ready', with: [
            'topic'      => config("blog_autopilot.topics.{$this->post->topic}.label", 'General'),
            'reviewLink' => URL::temporarySignedRoute('blog.review', now()->addDays((int) config('blog_autopilot.link_days', 14)), ['post' => $this->post->id]),
            'editLink'   => $origin.'/admin/blog/'.$this->post->id,
        ]);
    }
}
