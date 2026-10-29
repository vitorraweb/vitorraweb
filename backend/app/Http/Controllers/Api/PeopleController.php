<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\CompanyEvent;
use App\Models\LeaveRequest;
use App\Models\MonthlyReport;
use App\Models\PublicHoliday;
use App\Models\User;
use App\Services\LeaveService;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

/**
 * People (HR) — the managers' side of staff management: an HR overview, the
 * employee records, a team leave calendar, and company announcements.
 * Gated by the `people` module (Operations, Finance, Leadership, admins).
 *
 * Account matters — role, console permissions, password, sign-in email — stay
 * admin-only in Settings → Staff; this controller edits HR details only.
 */
class PeopleController extends Controller
{
    public const EMPLOYMENT_TYPES = ['permanent' => 'Permanent', 'contract' => 'Fixed-term contract', 'intern' => 'Intern', 'casual' => 'Casual'];

    public function __construct(private readonly LeaveService $leave) {}

    /** Active staff (admin, ops, employee) who have not left. */
    public static function activeStaff()
    {
        return User::whereIn('role', ['admin', 'ops', 'employee'])
            ->where(fn ($q) => $q->whereNull('staff_status')->orWhere('staff_status', '!=', 'left'));
    }

    /* ── Overview ─────────────────────────────────────────────────────────── */

    public function overview(): JsonResponse
    {
        $today = now()->startOfDay();
        $staff = self::activeStaff()->get();
        $ids = $staff->pluck('id');

        $away = LeaveRequest::with('user:id,name,department')
            ->whereIn('user_id', $ids)->where('status', 'approved')
            ->whereDate('end_date', '>=', $today)->whereDate('start_date', '<=', $today->copy()->addDays(14))
            ->orderBy('start_date')->get();

        $lastPeriod = $today->copy()->subMonthNoOverflow()->format('Y-m');
        $submitted = MonthlyReport::where('period', $lastPeriod)->whereIn('status', ['submitted', 'reviewed'])->pluck('user_id')->flip();
        $missing = $staff->where('role', '!=', 'admin')->filter(fn (User $u) => ! isset($submitted[$u->id])
            && (! $u->start_date || $u->start_date->lt($today->copy()->startOfMonth()->subMonthNoOverflow()->endOfMonth())));

        $probation = $staff->filter(fn (User $u) => $u->start_date && $u->role !== 'admin')
            ->map(fn (User $u) => ['user' => $u, 'ends' => $u->start_date->copy()->addMonths(3)])
            ->filter(fn ($r) => $r['ends']->betweenIncluded($today, $today->copy()->addDays(30)))
            ->sortBy('ends');

        $contracts = $staff->filter(fn (User $u) => $u->contract_end_date && $u->contract_end_date->betweenIncluded($today, $today->copy()->addDays(60)))
            ->sortBy('contract_end_date');

        $month = (int) $today->month;
        $birthdays = $staff->filter(fn (User $u) => $u->date_of_birth && (int) $u->date_of_birth->month === $month)
            ->sortBy(fn (User $u) => $u->date_of_birth->day);
        $anniversaries = $staff->filter(fn (User $u) => $u->start_date && (int) $u->start_date->month === $month && $u->start_date->year < $today->year)
            ->sortBy(fn (User $u) => $u->start_date->day);

        $person = fn (User $u) => ['id' => $u->id, 'name' => $u->name, 'department' => $u->department, 'job_title' => $u->job_title];

        return response()->json(['data' => [
            'headcount'      => $staff->count(),
            'by_department'  => $staff->groupBy(fn ($u) => $u->department ?: 'unassigned')->map->count(),
            'department_labels' => config('admin_modules.department_labels'),
            'on_leave_today' => $away->filter(fn ($l) => $l->start_date->lte($today))->map(fn ($l) => $this->leaveRow($l))->values(),
            'away_soon'      => $away->filter(fn ($l) => $l->start_date->gt($today))->map(fn ($l) => $this->leaveRow($l))->values(),
            'pending_leave'  => LeaveRequest::where('status', 'pending')->count(),
            'missing_reports' => ['period' => $lastPeriod, 'people' => $missing->map($person)->values()],
            'probation_ending' => $probation->map(fn ($r) => $person($r['user']) + ['date' => $r['ends']->toDateString()])->values(),
            'contracts_ending' => $contracts->map(fn (User $u) => $person($u) + ['date' => $u->contract_end_date->toDateString()])->values(),
            'birthdays'      => $birthdays->map(fn (User $u) => $person($u) + ['day' => $u->date_of_birth->day])->values(),
            'anniversaries'  => $anniversaries->map(fn (User $u) => $person($u) + ['day' => $u->start_date->day, 'years' => $today->year - $u->start_date->year])->values(),
            'missing_emergency_contact' => $staff->whereNull('emergency_contact_phone')->count(),
        ]]);
    }

    /* ── Employee records ─────────────────────────────────────────────────── */

    public function employees(): JsonResponse
    {
        $year = (int) now()->year;
        $staff = User::whereIn('role', ['admin', 'ops', 'employee'])->with('supervisor:id,name')->withCount('staffDocuments')->orderBy('name')->get();
        $used = $this->daysTaken($staff->pluck('id'), $year);

        return response()->json([
            'data'  => $staff->map(fn (User $u) => $this->employee($u, $used[$u->id] ?? []))->values(),
            'types' => self::EMPLOYMENT_TYPES,
            'departments' => config('admin_modules.department_labels'),
        ]);
    }

    public function updateEmployee(Request $request, User $user): JsonResponse
    {
        abort_unless(in_array($user->role, ['admin', 'ops', 'employee'], true), 404);

        $data = $request->validate([
            'job_title'                  => ['nullable', 'string', 'max:120'],
            'department'                 => ['nullable', Rule::in(array_keys(config('admin_modules.department_labels')))],
            'supervisor_id'              => ['nullable', 'integer', Rule::exists('users', 'id'), Rule::notIn([$user->id])],
            'phone'                      => ['nullable', 'string', 'max:40'],
            'start_date'                 => ['nullable', 'date'],
            'staff_status'               => ['nullable', Rule::in(['active', 'on_leave', 'left'])],
            'employment_type'            => ['nullable', Rule::in(array_keys(self::EMPLOYMENT_TYPES))],
            'contract_end_date'          => ['nullable', 'date'],
            'date_of_birth'              => ['nullable', 'date', 'before:today'],
            'leave_entitlement_days'     => ['nullable', 'integer', 'min:0', 'max:60'],
            'emergency_contact_name'     => ['nullable', 'string', 'max:120'],
            'emergency_contact_phone'    => ['nullable', 'string', 'max:40'],
            'emergency_contact_relation' => ['nullable', 'string', 'max:60'],
        ]);

        $user->fill($data);
        $changed = array_keys($user->getDirty());
        $user->save();

        if ($changed) {
            Audit::log('people.employee_updated', 'Updated HR record of '.$user->name.' ('.implode(', ', $changed).')', $user);
        }

        $user->load('supervisor:id,name')->loadCount('staffDocuments');

        return response()->json(['data' => $this->employee($user, $this->daysTaken(collect([$user->id]), (int) now()->year)[$user->id] ?? [])]);
    }

    /* ── Leave calendar ───────────────────────────────────────────────────── */

    public function calendar(Request $request): JsonResponse
    {
        [$from, $to] = $this->month($request);

        $leave = LeaveRequest::with('user:id,name,department')
            ->whereIn('status', ['approved', 'pending'])
            ->whereDate('start_date', '<=', $to)->whereDate('end_date', '>=', $from)
            ->orderBy('start_date')->get()
            ->map(fn ($l) => $this->leaveRow($l) + ['type' => $l->type, 'status' => $l->status]);

        return response()->json(['data' => ['month' => $from->format('Y-m'), 'leave' => $leave] + $this->daysOff($from, $to)]);
    }

    /** The staff-portal version: approved leave only, no leave type (sick leave is private). */
    public function staffCalendar(Request $request): JsonResponse
    {
        [$from, $to] = $this->month($request);
        $user = $request->user();

        $leave = LeaveRequest::with('user:id,name,department')
            ->where('status', 'approved')
            ->whereHas('user', fn ($q) => $user->department ? $q->where('department', $user->department) : $q->where('id', $user->id))
            ->whereDate('start_date', '<=', $to)->whereDate('end_date', '>=', $from)
            ->orderBy('start_date')->get()
            ->map(fn ($l) => $this->leaveRow($l));

        return response()->json(['data' => ['month' => $from->format('Y-m'), 'leave' => $leave] + $this->daysOff($from, $to)]);
    }

    /* ── Announcements ───────────────────────────────────────────────────── */

    public function announcements(): JsonResponse
    {
        return response()->json(['data' => Announcement::with('creator:id,name')->latest()->limit(100)->get()->map(fn ($a) => $this->announcement($a))]);
    }

    public function storeAnnouncement(Request $request): JsonResponse
    {
        $a = Announcement::create($this->validateAnnouncement($request) + ['created_by' => $request->user()->id]);

        return response()->json(['data' => $this->announcement($a->load('creator:id,name'))], 201);
    }

    public function updateAnnouncement(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement->update($this->validateAnnouncement($request));

        return response()->json(['data' => $this->announcement($announcement->load('creator:id,name'))]);
    }

    public function destroyAnnouncement(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    /** Staff side: notices for the signed-in person. */
    public function staffAnnouncements(Request $request): JsonResponse
    {
        return response()->json(['data' => Announcement::visibleTo($request->user())->with('creator:id,name')->limit(20)->get()->map(fn ($a) => $this->announcement($a))]);
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    private function validateAnnouncement(Request $request): array
    {
        return $request->validate([
            'title'      => ['required', 'string', 'max:200'],
            'body'       => ['required', 'string', 'max:5000'],
            'department' => ['nullable', Rule::in(array_keys(config('admin_modules.department_labels')))],
            'pinned'     => ['boolean'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);
    }

    private function announcement(Announcement $a): array
    {
        return [
            ...$a->only(['id', 'title', 'body', 'department', 'pinned']),
            'expires_at' => $a->expires_at?->toIso8601String(),
            'created_at' => $a->created_at->toIso8601String(),
            'author'     => $a->creator?->name,
            'expired'    => $a->expires_at && $a->expires_at->isPast(),
        ];
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function month(Request $request): array
    {
        $m = $request->validate(['month' => ['nullable', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/']])['month'] ?? now()->format('Y-m');
        $from = Carbon::createFromFormat('Y-m-d', $m.'-01')->startOfDay();

        return [$from, $from->copy()->endOfMonth()];
    }

    private function daysOff(Carbon $from, Carbon $to): array
    {
        $holidays = PublicHoliday::get()->map(function ($h) use ($from) {
            $d = $h->recurring ? $h->date->copy()->year($from->year) : $h->date;

            return ['name' => $h->name, 'date' => $d->toDateString()];
        })->filter(fn ($h) => $h['date'] >= $from->toDateString() && $h['date'] <= $from->copy()->endOfMonth()->toDateString())->values();

        $events = CompanyEvent::whereDate('start_date', '<=', $to)->whereDate('end_date', '>=', $from)->get()
            ->map(fn ($e) => ['title' => $e->title, 'start_date' => $e->start_date->toDateString(), 'end_date' => $e->end_date->toDateString(), 'blocks_leave' => $e->blocks_leave]);

        return ['holidays' => $holidays, 'events' => $events];
    }

    private function leaveRow(LeaveRequest $l): array
    {
        return [
            'id'          => $l->id,
            'user_id'     => $l->user_id,
            'name'        => $l->user?->name,
            'department'  => $l->user?->department,
            'start_date'  => $l->start_date->toDateString(),
            'end_date'    => $l->end_date->toDateString(),
            'working_days' => $l->working_days,
        ];
    }

    /** Approved working days taken this year, per person and leave type. */
    private function daysTaken(Collection $ids, int $year): array
    {
        $out = [];
        LeaveRequest::whereIn('user_id', $ids)->where('status', 'approved')->whereYear('start_date', $year)
            ->selectRaw('user_id, type, sum(working_days) as days')->groupBy('user_id', 'type')->get()
            ->each(function ($r) use (&$out) { $out[$r->user_id][$r->type] = (int) $r->days; });

        return $out;
    }

    private function employee(User $u, array $taken): array
    {
        $annual = $taken['annual'] ?? 0;
        $entitlement = (int) ($u->leave_entitlement_days ?? 21);

        return [
            ...$u->only(['id', 'name', 'email', 'role', 'phone', 'department', 'supervisor_id', 'job_title', 'staff_status', 'employment_type',
                'leave_entitlement_days', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation']),
            'start_date'        => $u->start_date?->toDateString(),
            'contract_end_date' => $u->contract_end_date?->toDateString(),
            'date_of_birth'     => $u->date_of_birth?->toDateString(),
            'supervisor'        => $u->supervisor?->name,
            'teams_email'       => $u->teamsEmail(),
            'documents'         => (int) ($u->staff_documents_count ?? 0),
            'leave'             => [
                'entitlement' => $entitlement,
                'annual_used' => $annual,
                'annual_left' => max(0, $entitlement - $annual),
                'sick_used'   => $taken['sick'] ?? 0,
                'other_used'  => array_sum($taken) - $annual - ($taken['sick'] ?? 0),
            ],
            'on_probation'      => $u->start_date && $u->role !== 'admin' && $u->start_date->copy()->addMonths(3)->isFuture(),
        ];
    }
}
