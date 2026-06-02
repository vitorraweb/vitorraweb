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
            'product_category' => ['nullable', Rule::in(['FET', 'SEAL', 'COFFEE', 'LOGISTICS', ''])],
            'name'             => ['required', 'string', 'max:255'],
            'email'            => ['required', 'email', 'max:255'],
            'company'          => ['nullable', 'string', 'max:255'],
            'phone'            => ['nullable', 'string', 'max:50'],
            'country'          => ['required', 'string', 'max:100'],
            'message'          => ['required', 'string', 'max:5000'],
        ]);

        $enquiry = Enquiry::create($data);

        // Notify the team — reply-to set so hitting Reply goes back to the customer
        Mail::to(config('mail.team_address'))
            ->replyTo($enquiry->email, $enquiry->name)
            ->send(new NewEnquiry($enquiry));

        return response()->json([
            'data'    => $enquiry,
            'message' => 'Enquiry received. We will be in touch within 24 hours.',
        ], 201);
    }
}
