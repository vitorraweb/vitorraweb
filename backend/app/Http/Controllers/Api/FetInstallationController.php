<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FetFuelLog;
use App\Models\FetInstallation;
use App\Models\User;
use App\Services\FetSavingsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Admin side of the FET "proven savings" loop: staff record installations and
 * fuel readings, and read back the measured savings. Gated by the `fet` module.
 */
class FetInstallationController extends Controller
{
    public function __construct(private readonly FetSavingsService $savings)
    {
    }

    /** All installations, newest first, each with its measured-savings summary. */
    public function index(): JsonResponse
    {
        $installations = FetInstallation::with('fuelLogs')
            ->latest()
            ->get()
            ->map(fn (FetInstallation $i) => $this->shape($i, staff: true));

        return response()->json([
            'data'  => $installations,
            'tiers' => config('fet.tiers'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(creating: true));

        $data['device_model'] = $data['device_model'] ?? config("fet.tiers.{$data['tier']}.model");
        $data['reference'] = $this->nextReference();
        // Link to a portal account when the email matches a registered user.
        $data['user_id'] = $data['user_id']
            ?? optional(User::whereRaw('lower(email) = ?', [mb_strtolower($data['customer_email'] ?? '')])->first())->id;

        $installation = FetInstallation::create($data);

        return response()->json(['data' => $this->shape($installation, staff: true)], 201);
    }

    public function show(FetInstallation $installation): JsonResponse
    {
        return response()->json(['data' => $this->shape($installation->load('fuelLogs'), staff: true)]);
    }

    public function update(Request $request, FetInstallation $installation): JsonResponse
    {
        $data = $request->validate($this->rules(creating: false));
        $installation->update($data);

        return response()->json(['data' => $this->shape($installation->fresh()->load('fuelLogs'), staff: true)]);
    }

    public function destroy(FetInstallation $installation): JsonResponse
    {
        $installation->delete(); // fuel logs cascade

        return response()->json(['message' => 'Installation removed.']);
    }

    /** Record a fuel reading against an installation (staff source). */
    public function storeLog(Request $request, FetInstallation $installation): JsonResponse
    {
        $data = $this->validateLog($request, staff: true);
        $data['source'] = 'staff';
        $data['logged_by'] = $request->user()->id;
        $installation->fuelLogs()->create($data);

        return response()->json(['data' => $this->shape($installation->fresh()->load('fuelLogs'), staff: true)], 201);
    }

    public function destroyLog(FetInstallation $installation, FetFuelLog $log): JsonResponse
    {
        abort_unless($log->fet_installation_id === $installation->id, 404);
        $log->delete();

        return response()->json(['data' => $this->shape($installation->fresh()->load('fuelLogs'), staff: true)]);
    }

    /** Branded measured-savings certificate (PDF) for an installation. */
    public function certificate(FetInstallation $installation): Response
    {
        return self::renderCertificate($installation, $this->savings);
    }

    /* ── shared helpers (also used by the customer portal) ─────────────────── */

    /**
     * Shape an installation for the API. Staff see the full record (incl. the
     * decrypted plate, contact details, notes); customers get the same savings
     * but a trimmed record.
     *
     * @return array<string, mixed>
     */
    public function shape(FetInstallation $i, bool $staff): array
    {
        $i->loadMissing('fuelLogs');

        $common = [
            'id'              => $i->id,
            'reference'       => $i->reference,
            'customer_name'   => $i->customer_name,
            'company'         => $i->company,
            'vehicle'         => $i->vehicle,
            'tier'            => $i->tier,
            'tier_label'      => config("fet.tiers.{$i->tier}.label", $i->tier),
            'device_model'    => $i->device_model,
            'fuel_type'       => $i->fuel_type,
            'currency'        => $i->currency,
            'registration'    => $i->registration,
            'installed_on'    => optional($i->installed_on)->toDateString(),
            'status'          => $i->status,
            'savings'         => $this->savings->summary($i),
            'logs'            => $i->fuelLogs->map(fn (FetFuelLog $l) => [
                'id'          => $l->id,
                'logged_on'   => optional($l->logged_on)->toDateString(),
                'odometer_km' => $l->odometer_km,
                'litres'      => (float) $l->litres,
                'cost'        => $l->cost,
                'phase'       => $l->phase,
                'source'      => $l->source,
                'note'        => $l->note,
            ])->values()->all(),
        ];

        if (! $staff) {
            return $common;
        }

        return array_merge($common, [
            'customer_email'     => $i->customer_email,
            'customer_phone'     => $i->customer_phone,
            'baseline_l_per_100' => $i->baseline_l_per_100 !== null ? (float) $i->baseline_l_per_100 : null,
            'baseline_source'    => $i->baseline_source,
            'consent_to_publish' => $i->consent_to_publish,
            'notes'              => $i->notes,
            'enquiry_id'         => $i->enquiry_id,
            'order_id'           => $i->order_id,
        ]);
    }

    /** Build + stream the savings certificate (shared by admin + customer portal). */
    public static function renderCertificate(FetInstallation $installation, FetSavingsService $savings): Response
    {
        $summary = $savings->summary($installation);

        $pdf = Pdf::loadView('documents.fet-savings-certificate', [
            'installation' => $installation,
            'summary'      => $summary,
            'tierLabel'    => config("fet.tiers.{$installation->tier}.label", $installation->tier),
        ]);

        return $pdf->download('fet-savings-'.$installation->reference.'.pdf');
    }

    /** Validate a fuel-log payload. Customers may only file 'after' readings. */
    public function validateLog(Request $request, bool $staff): array
    {
        $rules = [
            'logged_on'   => ['required', 'date', 'before_or_equal:today'],
            'odometer_km' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'litres'      => ['required', 'numeric', 'min:0.1', 'max:100000'],
            'cost'        => ['nullable', 'integer', 'min:0'],
            'note'        => ['nullable', 'string', 'max:500'],
        ];
        if ($staff) {
            $rules['phase'] = ['nullable', Rule::in(['before', 'after'])];
        }

        $data = $request->validate($rules);
        $data['phase'] = $staff ? ($data['phase'] ?? 'after') : 'after';

        return $data;
    }

    private function rules(bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';
        $tiers = array_keys(config('fet.tiers'));

        return [
            'customer_name'      => [$required, 'string', 'max:255'],
            'customer_email'     => ['nullable', 'email', 'max:255'],
            'customer_phone'     => ['nullable', 'string', 'max:50'],
            'company'            => ['nullable', 'string', 'max:255'],
            'tier'               => [$required, Rule::in($tiers)],
            'device_model'       => ['nullable', 'string', 'max:100'],
            'vehicle'            => ['nullable', 'string', 'max:255'],
            'registration'       => ['nullable', 'string', 'max:64'],
            'fuel_type'          => ['nullable', Rule::in(['diesel', 'petrol'])],
            'currency'           => ['nullable', Rule::in(['UGX', 'USD', 'EUR'])],
            'baseline_l_per_100' => ['nullable', 'numeric', 'min:0', 'max:200'],
            'baseline_source'    => ['nullable', Rule::in(['measured', 'declared', 'segment'])],
            'installed_on'       => ['nullable', 'date'],
            'status'             => ['nullable', Rule::in(['active', 'paused', 'removed'])],
            'consent_to_publish' => ['nullable', 'boolean'],
            'notes'              => ['nullable', 'string', 'max:5000'],
            'enquiry_id'         => ['nullable', 'integer', Rule::exists('enquiries', 'id')],
            'order_id'           => ['nullable', 'integer', Rule::exists('orders', 'id')],
            'user_id'            => ['nullable', 'integer', Rule::exists('users', 'id')],
        ];
    }

    /** Next FET-INST-YYYY-#### reference (per-year sequence). */
    private function nextReference(): string
    {
        $prefix = sprintf('FET-INST-%d-', now()->year);
        $last = FetInstallation::where('reference', 'like', $prefix.'%')
            ->orderByDesc('reference')
            ->value('reference');
        $seq = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return sprintf('%s%04d', $prefix, $seq);
    }
}
