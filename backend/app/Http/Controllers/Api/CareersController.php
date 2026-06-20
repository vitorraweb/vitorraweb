<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ApplicationReceived;
use App\Models\JobApplication;
use App\Models\JobOpening;
use App\Models\Setting;
use App\Services\CvExtractionService;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CareersController extends Controller
{
    public function __construct(private readonly CvExtractionService $cv) {}

    /** Public list of open roles. */
    public function index(): JsonResponse
    {
        $openings = JobOpening::where('status', 'open')
            ->where(fn ($q) => $q->whereNull('closes_at')->orWhere('closes_at', '>=', now()->toDateString()))
            ->latest()
            ->get(['title', 'slug', 'department', 'location', 'employment_type', 'closes_at']);

        return response()->json(['data' => $openings]);
    }

    /** A single open role by slug. */
    public function show(string $slug): JsonResponse
    {
        $opening = JobOpening::where('slug', $slug)->where('status', 'open')->first();
        if (! $opening) {
            return response()->json(['message' => 'This role is no longer open.'], 404);
        }

        return response()->json(['data' => $opening->only([
            'title', 'slug', 'department', 'location', 'employment_type', 'description', 'closes_at',
        ])]);
    }

    /**
     * Step 1 of applying: upload a CV. Stores it to a short-lived pending area
     * and (for PDFs) extracts details via Claude to pre-fill the form.
     */
    public function extractCv(Request $request): JsonResponse
    {
        // Honeypot — bots fill hidden fields; return a benign empty result.
        if (filled($request->input('website'))) {
            return response()->json(['cv_token' => null, 'extracted' => null]);
        }

        $request->validate([
            'cv' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        $file  = $request->file('cv');
        $token = (string) Str::uuid();
        $ext   = strtolower($file->getClientOriginalExtension() ?: 'pdf');
        $path  = $file->storeAs('applications/pending', "{$token}.{$ext}", 'local');

        $extracted = $this->cv->extract($path);
        if ($extracted) {
            Storage::disk('local')->put("applications/pending/{$token}.json", json_encode($extracted));
        }

        return response()->json([
            'cv_token'      => $token,
            'original_name' => $file->getClientOriginalName(),
            'extracted'     => $extracted,
        ]);
    }

    /** Step 2: submit the application, attaching the previously-uploaded CV. */
    public function apply(Request $request): JsonResponse
    {
        if (filled($request->input('website'))) {
            return response()->json(['message' => 'Application received.']); // honeypot — no-op
        }

        $data = $request->validate([
            'cv_token'   => ['required', 'string'],
            'slug'       => ['nullable', 'string'],
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'max:255'],
            'phone'      => ['nullable', 'string', 'max:50'],
            'location'   => ['nullable', 'string', 'max:255'],
            'cover_note' => ['nullable', 'string', 'max:5000'],
        ]);

        // Locate the pending CV by token (uuid → guards against path traversal).
        if (! Str::isUuid($data['cv_token'])) {
            return response()->json(['message' => 'Please upload your CV again.'], 422);
        }
        $pending = collect(Storage::disk('local')->files('applications/pending'))
            ->first(fn ($p) => str_starts_with(basename($p), $data['cv_token'].'.') && ! str_ends_with($p, '.json'));
        if (! $pending) {
            return response()->json(['message' => 'Your CV upload expired — please upload it again.'], 422);
        }

        $opening = ! empty($data['slug'])
            ? JobOpening::where('slug', $data['slug'])->where('status', 'open')->first()
            : null;

        $extracted = null;
        $jsonPath = 'applications/pending/'.$data['cv_token'].'.json';
        if (Storage::disk('local')->exists($jsonPath)) {
            $extracted = json_decode(Storage::disk('local')->get($jsonPath), true);
        }

        $application = JobApplication::create([
            'job_opening_id' => $opening?->id,
            'name'           => $data['name'],
            'email'          => $data['email'],
            'phone'          => $data['phone'] ?? null,
            'location'       => $data['location'] ?? null,
            'cover_note'     => $data['cover_note'] ?? null,
            'extracted'      => $extracted,
            'status'         => 'new',
        ]);

        // Move the CV out of pending into the application's own folder, then
        // encrypt it at rest (pending stays plaintext for the AI read above).
        $finalPath = 'applications/'.$application->id.'/'.basename($pending);
        Storage::disk('local')->move($pending, $finalPath);
        SecureFile::encryptExisting($finalPath);
        Storage::disk('local')->delete($jsonPath);
        $application->update(['cv_path' => $finalPath]);

        if ($hr = Setting::get('notify_email')) {
            Mail::to($hr)->send(new ApplicationReceived($application->load('opening:id,title')));
        }

        return response()->json(['message' => 'Thank you — your application has been received.'], 201);
    }

    /** Used by the admin store to build a unique slug. */
    public static function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'role';
        $slug = $base;
        $i = 2;
        while (JobOpening::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }
        return $slug;
    }
}
