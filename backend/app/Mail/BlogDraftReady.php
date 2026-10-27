<?php

namespace App\Mail;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

/** A draft blog post waiting for a reviewer to check and publish. */
class BlogDraftReady extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly BlogPost $post, public readonly ?User $sender = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Blog draft to review: {$this->post->title}",
            replyTo: $this->sender ? [$this->sender->email] : [],
        );
    }

    public function content(): Content
    {
        $origin = rtrim((string) config('services.frontend.url'), '/');

        return new Content(text: 'emails.blog-draft-ready', with: [
            'topic'      => $this->post->topic ? config("blog_autopilot.topics.{$this->post->topic}.label") : null,
            'reviewLink' => URL::temporarySignedRoute('blog.review', now()->addDays((int) config('blog_autopilot.link_days', 14)), ['post' => $this->post->id]),
            'editLink'   => $origin.'/admin/blog/'.$this->post->id.'/edit',
        ]);
    }
}
