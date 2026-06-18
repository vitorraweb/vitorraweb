<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ReportReviewed;
use App\Mail\ReportSubmitted;
use App\Models\MonthlyReport;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class MonthlyReportController extends Controller
{
    /** The signed-in staff member's own reports + the current period. */
    public function index(Request $request): JsonResponse
    {
        $reports = $request->user()->monthlyReports()->orderByDesc('period')->get();

        return response()->json([
            'data'           => $reports->map(fn ($r) => $this->shape($r)),
            'current_period' => now()->format('Y-m'),
        ]);
    }

    /** Create or update one's own report for a period (draft or submit). */
    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'period'        => ['required', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
            'items'         => ['nullable', 'array'],
            'items.*.label' => ['required', 'string', 'max:255'],
            'items.*.done'  => ['boolean'],
            'items.*.note'  => ['nullable', 'string', 'max:1000'],
            'summary'       => ['nullable', 'string', 'max:5000'],
            'status'        => ['required', Rule::in(['draft', 'submitted'])],
        ]);

        $user = $request->user();
        $existing = $user->monthlyReports()->where('period', $data['period'])->first();
        if ($existing && $existing->status === 'reviewed') {
            return response()->json(['message' => 'This report has already been reviewed and is locked.'], 422);
        }

        $wasSubmitted = $existing?->status === 'submitted';

        $report = $user->monthlyReports()->updateOrCreate(
            ['period' => $data['period']],
            [
                'items'        => $data['items'] ?? [],
                'summary'      => $data['summary'] ?? null,
                'status'       => $data['status'],
                'submitted_at' => $data['status'] === 'submitted' ? ($existing?->submitted_at ?? now()) : null,
            ],
        );

        // Notify reviewers the first time it's submitted.
        if ($data['status'] === 'submitted' && ! $wasSubmitted) {
            $this->notifyReviewers($report, $user);
        }

        return response()->json(['data' => $this->shape($report->fresh())], $existing ? 200 : 201);
    }

    /** Reports from the signed-in reviewer's direct reports (or all, for HR). */
    public function team(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = MonthlyReport::with('user:id,name,department,supervisor_id')
            ->whereIn('status', ['submitted', 'reviewed'])
            ->orderByDesc('period');

        if (! in_array($user->role, ['admin', 'ops'], true)) {
            $query->whereHas('user', fn ($q) => $q->where('supervisor_id', $user->id));
        }

        return response()->json(['data' => $query->limit(200)->get()->map(fn ($r) => $this->shape($r, withUser: true))]);
    }

    /** Review a submitted report (author's supervisor, or HR). */
    public function review(Request $request, MonthlyReport $report): JsonResponse
    {
        $actor = $request->user();
        if (! $this->canReview($actor, $report)) {
            return response()->json(['message' => 'You are not allowed to review this report.'], 403);
        }
        if ($report->status === 'draft') {
            return response()->json(['message' => 'This report has not been submitted yet.'], 422);
        }

        $data = $request->validate([
            'supervisor_comment' => ['nullable', 'string', 'max:5000'],
            'rating'             => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $report->update([
            'status'             => 'reviewed',
            'supervisor_comment' => $data['supervisor_comment'] ?? null,
            'rating'             => $data['rating'] ?? null,
            'reviewed_by'        => $actor->id,
            'reviewed_at'        => now(),
        ]);

        Mail::to($report->user->email)->send(new ReportReviewed($report->fresh()->load('user:id,name,email', 'reviewer:id,name')));

        return response()->json(['data' => $this->shape($report->fresh(), withUser: true)]);
    }

    /**
     * Probation watch — staff still within their first 3 months, with how their
     * monthly reporting is going, so nobody silently reaches the probation end.
     */
    public function probation(): JsonResponse
    {
        $today = now()->startOfDay();

        $staff = User::whereIn('role', ['ops', 'employee'])
            ->whereNotNull('start_date')
            ->with('supervisor:id,name')
            ->get();

        $rows = $staff->map(function (User $u) use ($today) {
            $ends = $u->start_date->copy()->addMonths(3);
            return [
                'user'           => $ends,
                'id'             => $u->id,
                'name'           => $u->name,
                'job_title'      => $u->job_title,
                'department'     => $u->department,
                'start_date'     => $u->start_date->toDateString(),
                'probation_ends' => $ends->toDateString(),
                'days_remaining' => (int) ceil($today->diffInDays($ends, false)),
                'supervisor'     => $u->supervisor?->name,
                'reports_submitted' => MonthlyReport::where('user_id', $u->id)->whereIn('status', ['submitted', 'reviewed'])->count(),
                'reports_reviewed'  => MonthlyReport::where('user_id', $u->id)->where('status', 'reviewed')->count(),
            ];
        })
        ->filter(fn ($r) => $r['days_remaining'] >= 0)        // still on probation
        ->sortBy('days_remaining')
        ->map(fn ($r) => collect($r)->except('user')->all())  // drop helper
        ->values();

        return response()->json(['data' => $rows]);
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    private function canReview(User $actor, MonthlyReport $report): bool
    {
        return in_array($actor->role, ['admin', 'ops'], true)
            || $report->loadMissing('user')->user?->supervisor_id === $actor->id;
    }

    private function notifyReviewers(MonthlyReport $report, User $user): void
    {
        $user->loadMissing('supervisor:id,name,email');
        if ($user->supervisor?->email) {
            Mail::to($user->supervisor->email)->send(new ReportSubmitted($report, $user->supervisor->name));
        } elseif ($hr = Setting::get('notify_email')) {
            Mail::to($hr)->send(new ReportSubmitted($report, 'HR team'));
        }
    }

    private function shape(MonthlyReport $r, bool $withUser = false): array
    {
        $out = [
            'id'                 => $r->id,
            'period'             => $r->period,
            'items'              => $r->items ?? [],
            'summary'            => $r->summary,
            'status'             => $r->status,
            'submitted_at'       => optional($r->submitted_at)->toIso8601String(),
            'supervisor_comment' => $r->supervisor_comment,
            'rating'             => $r->rating,
            'reviewed_at'        => optional($r->reviewed_at)->toIso8601String(),
        ];
        if ($withUser && $r->relationLoaded('user') && $r->user) {
            $out['user'] = ['id' => $r->user->id, 'name' => $r->user->name, 'department' => $r->user->department];
        }
        return $out;
    }
}
