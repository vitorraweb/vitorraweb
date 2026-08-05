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
use App\Support\Audit;
use App\Support\SecureFile;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
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
            'data'    => $user->leaveRequests()->with('approvals.user:id,name')->latest()->get()->map(fn ($l) => $this->shape($l)),
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
            ? SecureFile::storeUpload($request->file('document'), "staff/{$user->id}/leave") // encrypted at rest (health data)
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

        $this->notifyOutstanding($leave);

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
        $query = LeaveRequest::with('user:id,name,department', 'approvals.user:id,name')->latest('start_date');
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        return response()->json([
            'data'     => $query->limit(500)->get()->map(fn ($l) => $this->shape($l, withUser: true, viewer: $request->user())),
            'statuses' => LeaveRequest::STATUSES,
            'types'    => LeaveRequest::TYPES,
        ]);
    }

    /** Requests still waiting on this person's signature (Operations or Finance). */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();

        // Only requests this person can actually sign right now: never their
        // own, never one they have already signed, and only where their stage
        // (Operations or Finance) is still outstanding.
        $queue = LeaveRequest::where('status', 'pending')
            ->where('user_id', '!=', $user->id)
            ->with('user:id,name,department', 'approvals.user:id,name')
            ->orderBy('start_date')
            ->get()
            ->filter(fn ($l) => $this->assignableStage($user, $l) !== null)
            ->values();

        return response()->json(['data' => $queue->map(fn ($l) => $this->shape($l, withUser: true, viewer: $user))]);
    }

    /**
     * Add one signature to a request. Leave is granted only once both
     * Operations and Finance have approved; either of them may decline, which
     * ends the request immediately.
     */
    public function decision(Request $request, LeaveRequest $leave): JsonResponse
    {
        $actor = $request->user();
        $stage = $this->assignableStage($actor, $leave);

        if (! $stage) {
            return response()->json(['message' => 'You are not allowed to review this request.'], 403);
        }
        if ($leave->status !== 'pending') {
            return response()->json(['message' => 'This request has already been reviewed.'], 422);
        }

        $data = $request->validate([
            'status'  => ['required', Rule::in(['approved', 'declined'])],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $leave->approvals()->create([
            'user_id'  => $actor->id,
            'stage'    => $stage,
            'decision' => $data['status'],
            'comment'  => $data['comment'] ?? null,
        ]);
        $leave->load('approvals.user:id,name');

        $declined = $data['status'] === 'declined';
        $complete = $declined || $leave->outstandingStages() === [];

        if ($complete) {
            $leave->update([
                'status'         => $declined ? 'declined' : 'approved',
                'review_comment' => $data['comment'] ?? null,
                'reviewed_by'    => $actor->id,
                'reviewed_at'    => now(),
            ]);
            Mail::to($leave->user->email)->send(new LeaveDecided($leave->fresh()->load('user:id,name,email', 'reviewer:id,name')));
        } else {
            // Still pending — tell whoever owes the remaining signature.
            $this->notifyOutstanding($leave);
        }

        return response()->json(['data' => $this->shape($leave->fresh()->load('user:id,name,department', 'approvals.user:id,name'), withUser: true, viewer: $actor)]);
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

    /**
     * Stream a sick-note document. This is health data, so access is tighter
     * than leave *approval*: only the owner or HR (admin, or anyone with the
     * People/HR module — currently Operations) may open it. A line manager who
     * is not HR can approve the leave but cannot read the medical note.
     */
    public function downloadNote(Request $request, LeaveRequest $leave): Response
    {
        if (! $leave->document_path) {
            return response()->json(['message' => 'No document.'], 404);
        }
        $actor = $request->user();
        $isHr  = $actor->isAdmin() || $actor->canModule('people');
        if ($leave->user_id !== $actor->id && ! $isHr) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if (! Storage::disk('local')->exists($leave->document_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        // Record HR access to an employee's medical document (accountability).
        if ($leave->user_id !== $actor->id) {
            Audit::log('sick_note.download', 'Opened the medical note for '.($leave->loadMissing('user')->user?->name ?? 'a staff member'), $leave);
        }

        $ext = pathinfo($leave->document_path, PATHINFO_EXTENSION) ?: 'pdf';

        return SecureFile::download($leave->document_path, "medical-note-{$leave->id}.{$ext}");
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    /**
     * Which signature, if any, this person may add to this request right now —
     * null means they cannot act on it.
     *
     * Leave needs two signatures, Operations and Finance, and they must come
     * from two different people. Guards, in order:
     *   - never your own request, whatever your role;
     *   - never a second signature from someone who already signed;
     *   - Finance is offered first, because the Senior Finance Officer is the
     *     only person who can give it — spending them on the Operations
     *     signature would leave the request unable to complete.
     */
    private function assignableStage(User $actor, LeaveRequest $leave): ?string
    {
        if ($leave->user_id === $actor->id) {
            return null;
        }

        $leave->loadMissing('approvals');
        if ($leave->approvals->contains('user_id', $actor->id)) {
            return null;
        }

        $signed = $leave->approvedStages();

        if (! in_array('finance', $signed, true) && $this->isFinanceApprover($actor)) {
            return 'finance';
        }
        if (! in_array('operations', $signed, true) && $actor->isOps()) {
            return 'operations';
        }

        return null;
    }

    /**
     * Holders of the "Accounting — approve" grant (the Senior Finance Officer).
     *
     * Deliberately not User::canModule() — that returns true for an admin on
     * every module, which would let one admin supply both signatures alone and
     * make the two-person rule meaningless. Only a real grant counts here.
     */
    private function isFinanceApprover(User $user): bool
    {
        $perms = is_array($user->permissions)
            ? $user->permissions
            : (config('admin_modules.departments.'.$user->department) ?? []);

        return in_array('accounting_approve', $perms, true);
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

    /**
     * Email whoever still owes a signature — on submission, and again after the
     * first of the two approvals lands so the second is actually chased.
     */
    private function notifyOutstanding(LeaveRequest $leave): void
    {
        $leave->loadMissing('approvals', 'user:id,name,email');
        $sent = [];

        foreach ($leave->outstandingStages() as $stage) {
            foreach ($this->approversFor($stage) as $approver) {
                // Never ask the applicant to sign their own request.
                if ($approver->id === $leave->user_id || in_array($approver->email, $sent, true)) {
                    continue;
                }
                Mail::to($approver->email)->send(new LeaveSubmitted($leave, $approver->name));
                $sent[] = $approver->email;
            }
        }

        // The shared HR inbox too, so nothing goes unseen while someone is away.
        $hr = Setting::get('notify_email');
        if ($hr && ! in_array($hr, $sent, true)) {
            Mail::to($hr)->send(new LeaveSubmitted($leave, 'HR team'));
        }
    }

    /** Staff who can give a given stage's signature. @return list<User> */
    private function approversFor(string $stage): array
    {
        $staff = User::whereIn('role', ['admin', 'ops', 'employee'])->get();

        $matches = $stage === 'finance'
            ? $staff->filter(fn (User $u) => $this->isFinanceApprover($u))
            : $staff->filter(fn (User $u) => $u->isOps());

        return $matches->filter(fn (User $u) => filled($u->email))->values()->all();
    }

    private function nextOccurrence(Carbon $recurringDate, Carbon $from): Carbon
    {
        $candidate = $recurringDate->copy()->year($from->year);
        return $candidate->lt($from) ? $candidate->addYear() : $candidate;
    }

    private function shape(LeaveRequest $l, bool $withUser = false, ?User $viewer = null): array
    {
        $l->loadMissing('approvals.user:id,name');

        $out = [
            /* Both signatures, so every screen can show how far a request has got
               rather than just "pending". `can_decide` tells the client whether to
               offer the buttons at all — the API is still the one enforcing it. */
            'approvals'   => $l->approvals->map(fn ($a) => [
                'stage'    => $a->stage,
                'label'    => \App\Models\LeaveApproval::STAGE_LABELS[$a->stage] ?? $a->stage,
                'by'       => $a->user?->name,
                'decision' => $a->decision,
                'at'       => $a->created_at?->toIso8601String(),
            ])->values()->all(),
            'awaiting'    => array_map(
                fn ($s) => \App\Models\LeaveApproval::STAGE_LABELS[$s] ?? $s,
                $l->status === 'pending' ? $l->outstandingStages() : []
            ),
            'can_decide'  => $viewer ? $this->assignableStage($viewer, $l) !== null : false,
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
