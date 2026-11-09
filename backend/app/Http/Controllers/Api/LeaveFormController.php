<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveApproval;
use App\Models\LeaveRequest;
use App\Models\Setting;
use App\Models\User;
use App\Services\LeaveService;
use App\Support\BrandedDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\Response;

/**
 * The printable leave application form, on the letterhead, with space for the
 * employee and their immediate supervisor to sign, and an office-use block for
 * the two console signatures (Operations and Finance).
 *
 * Three ways to get it:
 *   - blank, with the signed-in person's own details filled in (staff portal);
 *   - completed from one leave request (the applicant, or HR);
 *   - blank for a named employee (HR, from the leave tracker).
 * `?blank=1` on the first leaves every field empty, for the notice board.
 */
class LeaveFormController extends Controller
{
    public function __construct(private readonly LeaveService $leave) {}

    /** Staff: a form with my details, or a completely blank one. */
    public function mine(Request $request): Response
    {
        $user = $request->user();

        return $request->boolean('blank')
            ? $this->render(null, null, 'leave-application-form.pdf')
            : $this->render($user, null, 'leave-form-'.str($user->name)->slug().'.pdf');
    }

    /** Staff: the form for one of my own requests. */
    public function mineForRequest(Request $request, LeaveRequest $leave): Response
    {
        abort_unless($leave->user_id === $request->user()->id, 403, 'Forbidden.');

        return $this->render($leave->user, $leave, "leave-form-{$leave->id}.pdf");
    }

    /** HR: the form for any request. */
    public function forRequest(LeaveRequest $leave): Response
    {
        return $this->render($leave->user, $leave, "leave-form-{$leave->id}.pdf");
    }

    /** HR: a blank form already carrying one employee's details. */
    public function forEmployee(User $user): Response
    {
        abort_unless(in_array($user->role, ['admin', 'ops', 'employee'], true), 404);

        return $this->render($user, null, 'leave-form-'.str($user->name)->slug().'.pdf');
    }

    private function render(?User $user, ?LeaveRequest $leave, string $filename): Response
    {
        File::ensureDirectoryExists(storage_path('fonts'));
        $user?->loadMissing('supervisor:id,name,job_title');
        $leave?->loadMissing('approvals.user:id,name');
        $s = Setting::resolved();
        $year = $leave ? $leave->start_date->year : now()->year;

        $balance = null;
        if ($user) {
            $entitlement = (int) ($user->leave_entitlement_days ?? 21);
            // Days already used or booked, not counting this request itself.
            $used = $this->leave->annualUsed($user, $year, $leave?->id);
            $balance = ['entitlement' => $entitlement, 'used' => $used, 'left' => max(0, $entitlement - $used), 'year' => $year];
        }

        $signature = function (string $stage) use ($leave) {
            $a = $leave?->approvals->firstWhere('stage', $stage);

            return $a ? ['by' => $a->user?->name, 'decision' => $a->decision, 'date' => $a->created_at?->format('d M Y')] : null;
        };

        $return = null;
        if ($leave) {
            // First working day after the leave ends.
            $d = $leave->end_date->copy()->addDay();
            for ($i = 0; $i < 20 && $this->leave->workingDays($d, $d) === 0; $i++) {
                $d->addDay();
            }
            $return = $d->format('d M Y');
        }

        return Pdf::loadView('documents.leave-form', ['d' => [
            'art'     => resource_path('document-art'),
            'company' => BrandedDocument::COMPANY + ['email' => 'support@vitorra.org', 'tin' => $s['company_tin'] ?? ''],
            'user'    => $user,
            'leave'   => $leave,
            'types'   => ['annual' => 'Annual', 'sick' => 'Sick', 'compassionate' => 'Compassionate', 'maternity' => 'Maternity', 'unpaid' => 'Unpaid', 'other' => 'Other'],
            'balance' => $balance,
            'return'  => $return,
            'ref'     => $leave ? 'LV-'.$leave->created_at->format('Y').'-'.str_pad((string) $leave->id, 4, '0', STR_PAD_LEFT) : null,
            'stages'  => collect(LeaveApproval::STAGES)->mapWithKeys(fn ($st) => [$st => ['label' => LeaveApproval::STAGE_LABELS[$st] ?? $st, 'signed' => $signature($st)]])->all(),
            'status'  => $leave?->status,
            'dept'    => $user ? (config('admin_modules.department_labels')[$user->department] ?? $user->department) : null,
        ]])->setPaper('a4')->setOption('dpi', 96)->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isFontSubsettingEnabled', true)
            ->download($filename);
    }
}
