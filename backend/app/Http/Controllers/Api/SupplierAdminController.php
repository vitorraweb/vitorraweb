<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Models\Task;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupplierAdminController extends Controller
{
    /** Supplier directory — bank details are intentionally excluded from the list. */
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::withCount('documents')->latest();
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        return response()->json([
            'data'      => $query->limit(500)->get([
                'id', 'company_name', 'contact_name', 'email', 'phone', 'country',
                'category', 'status', 'reviewed_at', 'created_at',
            ]),
            'statuses'  => Supplier::STATUSES,
            'assignees' => User::whereIn('role', ['admin', 'ops'])->orderBy('name')->get(['id', 'name', 'department']),
        ]);
    }

    /** Full supplier record incl. decrypted bank details + documents. */
    public function show(Supplier $supplier): JsonResponse
    {
        // Viewing this record exposes decrypted bank details — record the access.
        Audit::log('supplier.view_bank', 'Viewed bank details for '.$supplier->company_name, $supplier);

        return response()->json(['data' => [
            'id'           => $supplier->id,
            'company_name' => $supplier->company_name,
            'contact_name' => $supplier->contact_name,
            'email'        => $supplier->email,
            'phone'        => $supplier->phone,
            'country'      => $supplier->country,
            'address'      => $supplier->address,
            'category'     => $supplier->category,
            'description'  => $supplier->description,
            'status'       => $supplier->status,
            'review_note'  => $supplier->review_note,
            'reviewed_at'  => optional($supplier->reviewed_at)->toIso8601String(),
            'created_at'   => $supplier->created_at->toIso8601String(),
            'bank'         => $supplier->bankDetails(),
            'documents'    => $supplier->documents()->latest()->get()->map(fn (SupplierDocument $d) => [
                'id'            => $d->id,
                'type'          => $d->type,
                'title'         => $d->title,
                'original_name' => $d->original_name,
                'size'          => $d->size,
                'created_at'    => $d->created_at->toIso8601String(),
            ]),
        ]]);
    }

    /** Approve / reject / request more info. */
    public function updateStatus(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'status'      => ['required', Rule::in(Supplier::STATUSES)],
            'review_note' => ['nullable', 'string', 'max:5000'],
        ]);

        $supplier->update([
            'status'      => $data['status'],
            'review_note' => $data['review_note'] ?? $supplier->review_note,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['data' => $supplier->only(['id', 'status', 'review_note', 'reviewed_at'])]);
    }

    /** Assign someone to review/approve this supplier — creates a task for them. */
    public function assignApprover(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')->where(fn ($q) => $q->whereIn('role', ['admin', 'ops']))],
        ]);

        $approver = User::find($data['user_id']);

        $task = Task::create([
            'title'         => 'Review supplier: '.$supplier->company_name,
            'description'   => 'Verify documents and bank details, then approve or reject in /admin/suppliers.',
            'assigned_to'   => $approver->id,
            'created_by'    => $request->user()->id,
            'status'        => 'todo',
            'priority'      => 'normal',
            'contact_email' => $supplier->email,
            'department'    => $approver->department,
            'due_date'      => now()->addDays(3),
        ]);

        return response()->json(['message' => "Assigned to {$approver->name}.", 'task_id' => $task->id]);
    }

    public function downloadDocument(SupplierDocument $document): StreamedResponse|JsonResponse
    {
        if (! Storage::disk('local')->exists($document->path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        Audit::log('supplier_document.download', 'Downloaded supplier document "'.$document->title.'"', $document);

        return Storage::disk('local')->download($document->path, $document->original_name ?? $document->title);
    }
}
