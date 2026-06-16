<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewsletterBroadcast as NewsletterBroadcastMail;
use App\Mail\WelcomeSubscriber;
use App\Models\NewsletterBroadcast;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class NewsletterController extends Controller
{
    /**
     * Public newsletter signup (single opt-in). Idempotent: re-subscribing an
     * existing address just refreshes consent. Always returns a generic success
     * so the endpoint never reveals whether an address is already on the list.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'  => ['required', 'email', 'max:255'],
            'locale' => ['nullable', 'string', 'max:8'],
            'source' => ['nullable', 'string', 'max:50'],
            // Honeypot — real users never fill this; bots usually do.
            'hp'     => ['nullable', 'string', 'max:0'],
        ]);

        $email = Str::lower(trim($data['email']));

        $subscriber = NewsletterSubscriber::firstOrNew(['email' => $email]);
        $isNew = ! $subscriber->exists || $subscriber->status !== 'subscribed';

        // Only (re)set consent fields when subscribing or re-subscribing.
        if ($isNew) {
            $subscriber->fill([
                'status'          => 'subscribed',
                'token'           => $subscriber->token ?: NewsletterSubscriber::freshToken(),
                'source'          => $data['source'] ?? 'footer',
                'locale'          => $data['locale'] ?? null,
                'consent_ip'      => $request->ip(),
                'consent_at'      => now(),
                'unsubscribed_at' => null,
            ])->save();

            $frontendUrl    = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://vitorra.org')), '/');
            $unsubscribeUrl = $frontendUrl . '/unsubscribe?token=' . $subscriber->token;

            Mail::to($subscriber->email)->send(new WelcomeSubscriber($unsubscribeUrl));
        }

        return response()->json([
            'message' => 'You are subscribed. Thank you.',
        ], 201);
    }

    /**
     * Unsubscribe via the token embedded in newsletter links. Returns the
     * address so the confirmation page can show what was removed.
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:64'],
        ]);

        $subscriber = NewsletterSubscriber::where('token', $data['token'])->first();

        if (! $subscriber) {
            return response()->json([
                'message' => 'This unsubscribe link is invalid or has expired.',
            ], 404);
        }

        if ($subscriber->status !== 'unsubscribed') {
            $subscriber->update([
                'status'          => 'unsubscribed',
                'unsubscribed_at' => now(),
            ]);
        }

        return response()->json([
            'email'   => $subscriber->email,
            'message' => 'You have been unsubscribed. You will no longer receive our newsletter.',
        ]);
    }

    /**
     * Admin: compose and send a broadcast to all active subscribers.
     * Each email gets a personalised unsubscribe link. The broadcast is
     * recorded so marketing can see what was sent and when.
     */
    public function broadcast(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'body'    => ['required', 'string', 'max:20000'],
        ]);

        $subscribers = NewsletterSubscriber::where('status', 'subscribed')->get();

        if ($subscribers->isEmpty()) {
            return response()->json(['message' => 'No active subscribers to send to.'], 422);
        }

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://vitorra.org')), '/');

        foreach ($subscribers as $subscriber) {
            $unsubscribeUrl = $frontendUrl . '/unsubscribe?token=' . $subscriber->token;

            Mail::to($subscriber->email)->send(new NewsletterBroadcastMail(
                $data['subject'],
                $data['body'],
                $subscriber->token,
                $unsubscribeUrl,
            ));
        }

        $broadcast = NewsletterBroadcast::create([
            'subject'          => $data['subject'],
            'body_markdown'    => $data['body'],
            'sent_by'          => $request->user()->id,
            'recipient_count'  => $subscribers->count(),
        ]);

        return response()->json([
            'message'          => "Sent to {$subscribers->count()} subscriber(s).",
            'recipient_count'  => $subscribers->count(),
            'broadcast_id'     => $broadcast->id,
        ]);
    }

    /** Admin: list past broadcasts. */
    public function broadcasts(Request $request): JsonResponse
    {
        return response()->json(
            NewsletterBroadcast::with('sender:id,name')->latest()->paginate(20)
        );
    }

    /** Admin: list subscribers (filterable by status, searchable by email). */
    public function index(Request $request): JsonResponse
    {
        $query = NewsletterSubscriber::query()->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('q')) {
            $query->where('email', 'like', '%'.$search.'%');
        }

        return response()->json($query->paginate(50));
    }
}
