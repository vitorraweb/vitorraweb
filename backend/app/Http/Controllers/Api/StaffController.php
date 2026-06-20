<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StaffDocument;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Employee self-service portal — everything is scoped to the signed-in staff
 * member (admin / ops / employee). HR management lives in the admin panel.
 */
class StaffController extends Controller
{
    /** The signed-in staff member's own profile, supervisor, and leave entitlement. */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('supervisor:id,name,email,job_title');

        return response()->json(['data' => [
            'id'                     => $user->id,
            'name'                   => $user->name,
            'email'                  => $user->email,
            'role'                   => $user->role,
            'phone'                  => $user->phone,
            'department'             => $user->department,
            'job_title'              => $user->job_title,
            'job_description'        => $user->job_description,
            'start_date'             => optional($user->start_date)->toDateString(),
            'staff_status'           => $user->staff_status,
            'leave_entitlement_days' => $user->leave_entitlement_days,
            'supervisor'             => $user->supervisor ? [
                'id'        => $user->supervisor->id,
                'name'      => $user->supervisor->name,
                'email'     => $user->supervisor->email,
                'job_title' => $user->supervisor->job_title,
            ] : null,
            'is_supervisor'          => $user->reports()->exists(),
        ]]);
    }

    /** Direct reports of the signed-in staff member (for supervisors). */
    public function team(Request $request): JsonResponse
    {
        $reports = $request->user()->reports()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'job_title', 'department', 'staff_status', 'start_date']);

        return response()->json(['data' => $reports]);
    }

    /** The signed-in staff member's own HR documents (metadata only). */
    public function documents(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->documentList($request->user())]);
    }

    /**
     * Stream a staff document from the private disk. Allowed for the owner, the
     * owner's supervisor, and HR (admin/ops) — never a public URL.
     */
    public function download(Request $request, StaffDocument $document): StreamedResponse|JsonResponse
    {
        if (! $this->canAccessDocument($request->user(), $document)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if (! Storage::disk('local')->exists($document->path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        // Record HR/supervisor access to someone else's private HR file.
        if ($document->user_id !== $request->user()->id) {
            Audit::log('hr_document.download', 'Downloaded HR document "'.$document->title.'" of '.($document->user?->name ?? 'a staff member'), $document);
        }

        return Storage::disk('local')->download($document->path, $document->original_name ?? $document->title);
    }

    /** Whether a staff member may read another's document. */
    private function canAccessDocument(User $user, StaffDocument $document): bool
    {
        return $document->user_id === $user->id
            || in_array($user->role, ['admin', 'ops'], true)
            || User::where('id', $document->user_id)->where('supervisor_id', $user->id)->exists();
    }

    /** Shared document-list shape (id/type/title/size/date — never the raw path). */
    public static function documentList(User $user): array
    {
        return $user->staffDocuments()->latest()->get()
            ->map(fn (StaffDocument $d) => [
                'id'            => $d->id,
                'type'          => $d->type,
                'title'         => $d->title,
                'original_name' => $d->original_name,
                'size'          => $d->size,
                'created_at'    => $d->created_at->toIso8601String(),
            ])->all();
    }
}
