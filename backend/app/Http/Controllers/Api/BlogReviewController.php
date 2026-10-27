<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Support\Audit;
use App\Support\FrontendRevalidator;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The one-click review page linked from the "Blog draft to review" email.
 * The link is signed and expires, so it needs no login. Opening it (GET) only
 * shows the article — mail scanners such as Outlook Safe Links open every link
 * in an email, so publishing needs the button press (POST).
 */
class BlogReviewController extends Controller
{
    public function __invoke(Request $request, BlogPost $post): Response
    {
        $published = false;

        if ($request->isMethod('post') && $post->status !== 'published') {
            $post->update(['status' => 'published', 'published_at' => now()]);
            FrontendRevalidator::blogPosts([$post->slug]);
            Audit::log('blog.publish', "Published \"{$post->title}\" from the review email", $post);
            $published = true;
        }

        return response()->view('blog-review', [
            'post'      => $post,
            'published' => $published,
            'action'    => $request->fullUrl(),
            'liveUrl'   => rtrim((string) config('services.frontend.url'), '/').'/blog/'.$post->slug,
            'editUrl'   => rtrim((string) config('services.frontend.url'), '/').'/admin/blog/'.$post->id.'/edit',
        ]);
    }
}
