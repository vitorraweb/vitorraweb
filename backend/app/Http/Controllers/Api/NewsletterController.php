<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        // Only (re)set consent fields when subscribing or re-subscribing.
        if (! $subscriber->exists || $subscriber->status !== 'subscribed') {
            $subscriber->fill([
                'status'          => 'subscribed',
                'token'           => $subscriber->token ?: NewsletterSubscriber::freshToken(),
                'source'          => $data['source'] ?? 'footer',
                'locale'          => $data['locale'] ?? null,
                'consent_ip'      => $request->ip(),
                'consent_at'      => now(),
                'unsubscribed_at' => null,
            ])->save();
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
