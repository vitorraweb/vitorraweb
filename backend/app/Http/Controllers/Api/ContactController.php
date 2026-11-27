<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewContactMessage;
use App\Models\ContactMessage;
use App\Support\LeadSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'email'   => ['required', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            // See EnquiryController — optional, untrusted, never blocking.
            'attribution' => ['nullable', 'array'],
        ]);

        // The same message sent again a moment later (double tap, retry) is
        // one message: the team is told once and the lead counted once.
        $dup = ContactMessage::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower(trim($data['email']))])
            ->where('created_at', '>=', now()->subMinutes(\App\Models\Enquiry::DUPLICATE_WINDOW_MINUTES))
            ->latest('id')->take(5)->get()
            ->first(fn (ContactMessage $m) => trim((string) $m->message) === trim($data['message']));
        if ($dup) {
            return response()->json(['data' => $dup, 'duplicate' => true, 'message' => 'Message received. We will reply within 24 hours.'], 200);
        }

        $data = array_merge($data, LeadSource::resolve($request->input('attribution', []) ?: []));

        $msg = ContactMessage::create($data);

        // Reply-to (sender) is set in the mailable's envelope
        Mail::to(config('mail.team_address'))->send(new NewContactMessage($msg));
        app(\App\Services\Teams\TeamsAlerts::class)->newMessage($msg);

        return response()->json([
            'data'    => $msg,
            'message' => 'Message received. We will reply within 24 hours.',
        ], 201);
    }
}
