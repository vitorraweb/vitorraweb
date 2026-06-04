<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewEnquiry;
use App\Models\Enquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class EnquiryController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_category'     => ['nullable', Rule::in(['FET', 'SEAL', 'COFFEE', 'LOGISTICS', ''])],
            'name'                 => ['required', 'string', 'max:255'],
            'email'                => ['required', 'email', 'max:255'],
            'company'              => ['nullable', 'string', 'max:255'],
            'phone'                => ['nullable', 'string', 'max:50'],
            'country'              => ['required', 'string', 'max:100'],
            // Either a free-text message or structured requirements must be present.
            'message'              => ['nullable', 'string', 'max:5000', 'required_without:requirements'],
            // Structured, quote-ready answers from the product-aware form.
            'requirements'         => ['nullable', 'array', 'max:40'],
            'requirements.*.key'   => ['required_with:requirements', 'string', 'max:100'],
            'requirements.*.label' => ['required_with:requirements', 'string', 'max:200'],
            'requirements.*.value' => ['required_with:requirements', 'string', 'max:2000'],
        ]);

        // Auto-route by product: assign the owning team and pick its inbox.
        $route = config('enquiries.routing')[$data['product_category'] ?? ''] ?? null;
        $data['assigned_to'] = $route['team'] ?? config('enquiries.default_team');

        $enquiry = Enquiry::create($data);

        // Notify the routed team inbox (falls back to the general team address);
        // reply-to (customer) is set in the mailable's envelope.
        $inbox = ($route['email'] ?? null) ?: config('mail.team_address');
        Mail::to($inbox)->send(new NewEnquiry($enquiry));

        return response()->json([
            'data'    => $enquiry,
            'message' => 'Enquiry received. We will be in touch within 24 hours.',
        ], 201);
    }
}
