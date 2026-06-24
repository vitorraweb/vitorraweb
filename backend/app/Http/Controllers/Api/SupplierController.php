<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\SupplierOnboarded;
use App\Models\Setting;
use App\Models\Supplier;
use App\Rules\PhoneNumber;
use App\Support\Phone;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SupplierController extends Controller
{
    /**
     * Public supplier self-onboarding. Company + bank details + supporting
     * documents arrive in one multipart submission; the supplier lands as
     * `pending` for Ops/Finance to review. Bank fields are encrypted by the model.
     */
    public function onboard(Request $request): JsonResponse
    {
        // Honeypot — bots fill hidden fields.
        if (filled($request->input('website'))) {
            return response()->json(['message' => 'Thank you — your details have been received.']);
        }

        $data = $request->validate([
            'company_name'        => ['required', 'string', 'max:255'],
            'contact_name'        => ['nullable', 'string', 'max:255'],
            'email'               => ['required', 'email', 'max:255'],
            'phone'               => ['nullable', 'string', 'max:50', new PhoneNumber()],
            'country'             => ['nullable', 'string', 'max:100'],
            'address'             => ['nullable', 'string', 'max:500'],
            'category'            => ['nullable', 'string', 'max:255'],
            'description'         => ['nullable', 'string', 'max:5000'],
            'bank_name'           => ['nullable', 'string', 'max:255'],
            'bank_account_name'   => ['nullable', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'string', 'max:100'],
            'bank_branch'         => ['nullable', 'string', 'max:255'],
            'bank_swift'          => ['nullable', 'string', 'max:50'],
            'documents'           => ['nullable', 'array', 'max:6'],
            'documents.*'         => ['file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:8192'],
        ]);

        $data['phone'] = Phone::e164($data['phone'] ?? null);

        $supplier = Supplier::create(array_merge(
            collect($data)->except('documents')->all(),
            ['status' => 'pending'],
        ));

        foreach ($request->file('documents', []) as $file) {
            $path = SecureFile::storeUpload($file, "suppliers/{$supplier->id}"); // encrypted at rest

            $supplier->documents()->create([
                'type'          => 'other',
                'title'         => $file->getClientOriginalName(),
                'path'          => $path,
                'original_name' => $file->getClientOriginalName(),
                'size'          => $file->getSize(),
            ]);
        }

        if ($ops = Setting::get('notify_email')) {
            Mail::to($ops)->send(new SupplierOnboarded($supplier->loadCount('documents')));
        }

        return response()->json(['message' => 'Thank you — your details have been submitted for review.'], 201);
    }
}
