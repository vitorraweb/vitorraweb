<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\JobOpening;
use App\Support\Audit;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class JobAdminController extends Controller
{
    /* ── Openings ────────────────────────────────────────────────────────── */

    public function openings(): JsonResponse
    {
        $openings = JobOpening::withCount('applications')->latest()->get();

        return response()->json([
            'data'             => $openings,
            'employment_types' => JobOpening::EMPLOYMENT_TYPES,
        ]);
    }

    public function storeOpening(Request $request): JsonResponse
    {
        $data = $this->validateOpening($request, creating: true);
        $data['slug'] = CareersController::uniqueSlug($data['title']);
        $data['created_by'] = $request->user()->id;

        $opening = JobOpening::create($data);

        return response()->json(['data' => $opening], 201);
    }

    public function updateOpening(Request $request, JobOpening $opening): JsonResponse
    {
        $opening->update($this->validateOpening($request, creating: false));

        return response()->json(['data' => $opening->fresh()->loadCount('applications')]);
    }

    public function destroyOpening(JobOpening $opening): JsonResponse
    {
        $opening->delete();

        return response()->json(['message' => 'Opening removed.']);
    }

    /* ── Applications ────────────────────────────────────────────────────── */

    public function applications(Request $request): JsonResponse
    {
        $query = JobApplication::with('opening:id,title')->latest();
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('opening')) {
            $query->where('job_opening_id', (int) $request->query('opening'));
        }

        return response()->json([
            'data'     => $query->limit(500)->get(),
            'statuses' => JobApplication::STATUSES,
        ]);
    }

    public function updateApplication(Request $request, JobApplication $application): JsonResponse
    {
        $data = $request->validate([
            'status'     => ['sometimes', Rule::in(JobApplication::STATUSES)],
            'admin_note' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $application->update($data);

        return response()->json(['data' => $application->fresh()->load('opening:id,title')]);
    }

    public function downloadCv(JobApplication $application): Response
    {
        if (! $application->cv_path || ! Storage::disk('local')->exists($application->cv_path)) {
            return response()->json(['message' => 'No CV on file.'], 404);
        }

        Audit::log('cv.download', 'Downloaded the CV of applicant '.$application->name, $application);

        $ext = pathinfo($application->cv_path, PATHINFO_EXTENSION) ?: 'pdf';

        return SecureFile::download($application->cv_path, 'CV - '.$application->name.'.'.$ext);
    }

    private function validateOpening(Request $request, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'title'           => [$required, 'string', 'max:255'],
            'department'      => ['nullable', 'string', 'max:255'],
            'location'        => ['nullable', 'string', 'max:255'],
            'employment_type' => ['nullable', Rule::in(JobOpening::EMPLOYMENT_TYPES)],
            'description'     => ['nullable', 'string', 'max:20000'],
            'status'          => ['nullable', Rule::in(['open', 'closed'])],
            'closes_at'       => ['nullable', 'date'],
        ]);
    }
}
