<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewContactMessage;
use App\Models\ContactMessage;
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
        ]);

        $msg = ContactMessage::create($data);

        // Reply-to (sender) is set in the mailable's envelope
        Mail::to(config('mail.team_address'))->send(new NewContactMessage($msg));

        return response()->json([
            'data'    => $msg,
            'message' => 'Message received. We will reply within 24 hours.',
        ], 201);
    }
}
