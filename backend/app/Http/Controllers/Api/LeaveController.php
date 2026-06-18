<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\LeaveDecided;
use App\Mail\LeaveSubmitted;
use App\Models\CompanyEvent;
use App\Models\LeaveRequest;
use App\Models\PublicHoliday;
use App\Models\Setting;
use App\Models\User;
use App\Services\LeaveService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeaveController extends Controller
{
    public function __construct(private readonly LeaveService $leave) {}

    /** The signed-in staff member's own leave requests + balance. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $year = now()->year;
        $used = $this->leave->annualUsed($user, $year);

        return response()->json([
            'data'    => $user->leaveRequests()->latest()->get()->map(fn ($l) => $this->shape($l)),
            'balance' => [
                'entitlement' => $user->leave_entitlement_days,
                'used'        => $used,
                'remaining'   => max(0, $user->leave_entitlement_days - $used),
                'year'        => $year,
            ],
            'types'   => LeaveRequest::TYPES,
        ]);
    }

    /**
     * Live preview for the apply form: working-day count + any warnings
     * (blackout, same-department clash, insufficient balance) before submit.
     */
    public function preview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'       => ['required', Rule::in(LeaveRequest::TYPES)],
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $user  = $request->user();
        $start = Carbon::parse($data['start_date']);
        $end   = Carbon::parse($data['end_date']);
        $days  = $this->leave->workingDays($start, $end);

        return response()->json([
            'working_days' => $days,
            'warnings'     => $this->warnings($user, $data['type'], $start, $end, $days),
        ]);
    }

    /** Apply for leave. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type'       => ['required', Rule::in(LeaveRequest::TYPES)],
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
            'reason'     => ['nullable', 'string', 'max:2000'],
            'document'   => [Rule::requiredIf($request->input('type') === 'sick'), 'file', 'mimes:pdf,jpg,jpeg,png', 'max:8192'],
        ]);

        $user  = $request->user();
        $start = Carbon::parse($data['start_date']);
        $end   = Carbon::parse($data['end_date']);
        $days  = $this->leave->workingDays($start, $end);

        if ($days < 1) {
            throw ValidationException::withMessages(['start_date' => ['That range has no working days (weekends and public holidays are excluded).']]);
        }

        // Hard rules — block on conflict.
        if ($event = $this->leave->blackoutClash($start, $end)) {
            throw ValidationException::withMessages(['start_date' => ["Leave is blocked during \"{$event->title}\". Please choose other dates."]]);
        }
        if ($colleague = $this->leave->departmentClash($user, $start, $end)) {
            throw ValidationException::withMessages(['start_date' => ["{$colleague} from your team is already on leave during these dates. Please choose other dates."]]);
        }
        if (in_array($data['type'], LeaveRequest::DEDUCTS_BALANCE, true)) {
            $remaining = $user->leave_entitlement_days - $this->leave->annualUsed($user, $start->year);
            if ($days > $remaining) {
                throw ValidationException::withMessages(['type' => ["This exceeds your remaining annual leave ({$remaining} day(s) left this year)."]]);
            }
        }

        $path = $request->hasFile('document')
            ? $request->file('document')->store("staff/{$user->id}/leave", 'local')
            : null;

        $leave = $user->leaveRequests()->create([
            'type'          => $data['type'],
            'start_date'    => $start,
            'end_date'      => $end,
            'working_days'  => $days,
            'reason'        => $data['reason'] ?? null,
            'status'        => 'pending',
            'document_path' => $path,
        ]);

        $this->notifyReviewers($leave, $user);

        return response()->json(['data' => $this->shape($leave)], 201);
    }

    /** Cancel one's own pending or approved request. */
    public function cancel(Request $request, LeaveRequest $leave): JsonResponse
    {
        if ($leave->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if (! in_array($leave->status, ['pending', 'approved'], true)) {
            return response()->json(['message' => 'This request can no longer be cancelled.'], 422);
        }

        $leave->update(['status' => 'cancelled']);

        return response()->json(['data' => $this->shape($leave)]);
    }

    /** HR overview — all leave requests, optionally filtered by status/type. */
    public function all(Request $request): JsonResponse
    {
        $query = LeaveRequest::with('user:id,name,department')->latest('start_date');
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        return response()->json([
            'data'     => $query->limit(500)->get()->map(fn ($l) => $this->shape($l, withUser: true)),
            'statuses' => LeaveRequest::STATUSES,
            'types'    => LeaveRequest::TYPES,
        ]);
    }

    /** Requests awaiting the signed-in reviewer (their reports, or all if HR). */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = LeaveRequest::where('status', 'pending')->with('user:id,name,department,supervisor_id');
        if (! in_array($user->role, ['admin', 'ops'], true)) {
            // Supervisors see only their direct reports.
            $query->whereHas('user', fn ($q) => $q->where('supervisor_id', $user->id));
        }

        return response()->json(['data' => $query->orderBy('start_date')->get()->map(fn ($l) => $this->shape($l, withUser: true))]);
    }

    /** Approve or decline a request (supervisor of the requester, or HR). */
    public function decision(Request $request, LeaveRequest $leave): JsonResponse
    {
        $actor = $request->user();
        if (! $this->canReview($actor, $leave)) {
            return response()->json(['message' => 'You are not allowed to review this request.'], 403);
        }
        if ($leave->status !== 'pending') {
            return response()->json(['message' => 'This request has already been reviewed.'], 422);
        }

        $data = $request->validate([
            'status'  => ['required', Rule::in(['approved', 'declined'])],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $leave->update([
            'status'         => $data['status'],
            'review_comment' => $data['comment'] ?? null,
            'reviewed_by'    => $actor->id,
            'reviewed_at'    => now(),
        ]);

        Mail::to($leave->user->email)->send(new LeaveDecided($leave->fresh()->load('user:id,name,email', 'reviewer:id,name')));

        return response()->json(['data' => $this->shape($leave, withUser: true)]);
    }

    /** Upcoming public holidays + active leave blackouts (for the portal). */
    public function holidays(): JsonResponse
    {
        $today = now()->startOfDay();
        $horizon = $today->copy()->addYear();

        $holidays = PublicHoliday::get()->map(function ($h) use ($today, $horizon) {
            // Project recurring holidays onto the current/next year for display.
            $date = $h->recurring ? $this->nextOccurrence($h->date, $today) : $h->date;
            return ['name' => $h->name, 'date' => $date->format('Y-m-d'), 'recurring' => $h->recurring];
        })
        ->filter(fn ($h) => $h['date'] >= $today->format('Y-m-d') && $h['date'] <= $horizon->format('Y-m-d'))
        ->sortBy('date')->values();

        $blackouts = CompanyEvent::where('blocks_leave', true)
            ->where('end_date', '>=', $today->format('Y-m-d'))
            ->orderBy('start_date')
            ->get(['title', 'start_date', 'end_date'])
            ->map(fn ($e) => ['title' => $e->title, 'start_date' => $e->start_date->format('Y-m-d'), 'end_date' => $e->end_date->format('Y-m-d')]);

        return response()->json(['holidays' => $holidays, 'blackouts' => $blackouts]);
    }

    /** Stream a sick-note document (owner, supervisor, or HR only). */
    public function downloadNote(Request $request, LeaveRequest $leave): StreamedResponse|JsonResponse
    {
        if (! $leave->document_path) {
            return response()->json(['message' => 'No document.'], 404);
        }
        $actor = $request->user();
        if ($leave->user_id !== $actor->id && ! $this->canReview($actor, $leave)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if (! Storage::disk('local')->exists($leave->document_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return Storage::disk('local')->download($leave->document_path);
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    private function canReview(User $actor, LeaveRequest $leave): bool
    {
        return in_array($actor->role, ['admin', 'ops'], true)
            || $leave->loadMissing('user')->user?->supervisor_id === $actor->id;
    }

    private function warnings(User $user, string $type, Carbon $start, Carbon $end, int $days): array
    {
        $w = [];
        if ($days < 1) {
            $w[] = 'This range has no working days (weekends and public holidays are excluded).';
        }
        if ($event = $this->leave->blackoutClash($start, $end)) {
            $w[] = "Leave is blocked during \"{$event->title}\".";
        }
        if ($colleague = $this->leave->departmentClash($user, $start, $end)) {
            $w[] = "{$colleague} from your team is already on leave during these dates.";
        }
        if (in_array($type, LeaveRequest::DEDUCTS_BALANCE, true)) {
            $remaining = $user->leave_entitlement_days - $this->leave->annualUsed($user, $start->year);
            if ($days > $remaining) {
                $w[] = "Exceeds your remaining annual leave ({$remaining} day(s) left).";
            }
        }
        return $w;
    }

    private function notifyReviewers(LeaveRequest $leave, User $user): void
    {
        $sent = [];
        $user->loadMissing('supervisor:id,name,email');
        if ($user->supervisor?->email) {
            Mail::to($user->supervisor->email)->send(new LeaveSubmitted($leave, $user->supervisor->name));
            $sent[] = $user->supervisor->email;
        }
        $hr = Setting::get('notify_email');
        if ($hr && ! in_array($hr, $sent, true)) {
            Mail::to($hr)->send(new LeaveSubmitted($leave, 'HR team'));
        }
    }

    private function nextOccurrence(Carbon $recurringDate, Carbon $from): Carbon
    {
        $candidate = $recurringDate->copy()->year($from->year);
        return $candidate->lt($from) ? $candidate->addYear() : $candidate;
    }

    private function shape(LeaveRequest $l, bool $withUser = false): array
    {
        $out = [
            'id'             => $l->id,
            'type'           => $l->type,
            'start_date'     => $l->start_date->format('Y-m-d'),
            'end_date'       => $l->end_date->format('Y-m-d'),
            'working_days'   => $l->working_days,
            'reason'         => $l->reason,
            'status'         => $l->status,
            'has_document'   => (bool) $l->document_path,
            'review_comment' => $l->review_comment,
            'reviewed_at'    => optional($l->reviewed_at)->toIso8601String(),
            'created_at'     => $l->created_at->toIso8601String(),
        ];
        if ($withUser && $l->relationLoaded('user') && $l->user) {
            $out['user'] = ['id' => $l->user->id, 'name' => $l->user->name, 'department' => $l->user->department];
        }
        return $out;
    }
}
