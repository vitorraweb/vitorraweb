<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FetTrial;
use App\Models\FetTrialFlag;
use App\Models\FetTrialTrip;
use App\Services\FetTrialAnalysisService;
use App\Services\FetTrialConversionService;
use App\Services\FetTrialReportService;
use App\Services\FetTrialValidator;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Client FET trials: setup, trips, data-quality findings and the analysis.
 * Gated by the `fet_trials` module — marketing runs these, so they have it by
 * default even though they have no access to the post-sale `fet` module.
 */
class FetTrialController extends Controller
{
    public function __construct(
        private readonly FetTrialAnalysisService $analysis,
        private readonly FetTrialValidator $validator,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $trials = FetTrial::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('q'), fn ($q) => $q->where('client_company', 'like', '%'.$request->string('q').'%'))
            ->withCount('trips')
            ->latest()
            ->get()
            ->map(fn (FetTrial $t) => $this->summarise($t));

        return response()->json(['data' => $trials]);
    }

    public function store(Request $request): JsonResponse
    {
        $trial = FetTrial::create($this->validated($request) + [
            'reference' => FetTrial::nextReference(),
            'created_by' => $request->user()?->id,
        ]);

        Audit::log('fet_trial.created', "Started trial {$trial->reference} for {$trial->client_company}", $trial);

        return response()->json(['data' => $this->shape($trial)], 201);
    }

    public function show(FetTrial $trial): JsonResponse
    {
        return response()->json(['data' => $this->shape($trial)]);
    }

    public function update(Request $request, FetTrial $trial): JsonResponse
    {
        $trial->update($this->validated($request, updating: true));

        // Setup changes move the evidence goalposts (the installation date
        // decides which trips are baseline), so the checks are re-run.
        $this->validator->validate($trial->fresh());

        return response()->json(['data' => $this->shape($trial->fresh())]);
    }

    public function destroy(FetTrial $trial): JsonResponse
    {
        Audit::log('fet_trial.deleted', "Deleted trial {$trial->reference}", $trial);
        $trial->delete();

        return response()->json(['deleted' => true]);
    }

    /** Re-run the data-quality checks on demand. */
    public function revalidate(FetTrial $trial): JsonResponse
    {
        $counts = $this->validator->validate($trial);

        return response()->json(['data' => $this->shape($trial->fresh()), 'counts' => $counts]);
    }

    /* ── trips ────────────────────────────────────────────────────────────── */

    public function storeTrip(Request $request, FetTrial $trial): JsonResponse
    {
        $trip = $trial->trips()->create($this->validatedTrip($request) + ['source' => 'manual']);
        $this->validator->validate($trial->fresh());

        return response()->json(['data' => $this->shape($trial->fresh()), 'trip_id' => $trip->id], 201);
    }

    public function updateTrip(Request $request, FetTrial $trial, FetTrialTrip $trip): JsonResponse
    {
        abort_unless($trip->fet_trial_id === $trial->id, 404);

        $trip->update($this->validatedTrip($request, updating: true));
        $this->validator->validate($trial->fresh());

        return response()->json(['data' => $this->shape($trial->fresh())]);
    }

    public function destroyTrip(FetTrial $trial, FetTrialTrip $trip): JsonResponse
    {
        abort_unless($trip->fet_trial_id === $trial->id, 404);

        $trip->delete();
        $this->validator->validate($trial->fresh());

        return response()->json(['data' => $this->shape($trial->fresh())]);
    }

    /**
     * Take a trip out of the calculation, or put it back. Excluding always
     * carries a reason — a figure that quietly dropped an inconvenient trip is
     * exactly what this module exists to prevent.
     */
    public function setTripStatus(Request $request, FetTrial $trial, FetTrialTrip $trip): JsonResponse
    {
        abort_unless($trip->fet_trial_id === $trial->id, 404);

        $data = $request->validate([
            'status' => ['required', Rule::in(['valid', 'excluded'])],
            'reason' => ['required_if:status,excluded', 'nullable', 'string', 'max:500'],
        ]);

        $trip->update([
            'status' => $data['status'],
            'exclusion_reason' => $data['status'] === 'excluded' ? $data['reason'] : null,
        ]);

        Audit::log(
            'fet_trial.trip_'.($data['status'] === 'excluded' ? 'excluded' : 'included'),
            "{$trial->reference}: {$trip->route_label} on ".($trip->trip_date?->toDateString() ?? 'no date')
                .($data['status'] === 'excluded' ? " excluded — {$data['reason']}" : ' returned to the calculation'),
            $trial
        );

        $this->validator->validate($trial->fresh());

        return response()->json(['data' => $this->shape($trial->fresh())]);
    }

    /* ── data-quality findings ────────────────────────────────────────────── */

    /** Settle a finding: accept it, note it was corrected, or exclude the trip. */
    public function resolveFlag(Request $request, FetTrial $trial, FetTrialFlag $flag): JsonResponse
    {
        abort_unless($flag->fet_trial_id === $trial->id, 404);

        $data = $request->validate([
            'resolution' => ['required', Rule::in(FetTrialFlag::RESOLUTIONS)],
            'note' => ['required', 'string', 'max:1000'],
        ]);

        $flag->update([
            'resolution' => $data['resolution'],
            'resolution_note' => $data['note'],
            'resolved_by' => $request->user()?->id,
            'resolved_at' => now(),
        ]);

        if ($data['resolution'] === 'excluded' && $flag->fet_trial_trip_id) {
            $flag->trip?->update(['status' => 'excluded', 'exclusion_reason' => $data['note']]);
        }

        Audit::log('fet_trial.flag_resolved', "{$trial->reference}: {$flag->code} — {$data['resolution']}: {$data['note']}", $trial);

        $this->validator->validate($trial->fresh());

        return response()->json(['data' => $this->shape($trial->fresh())]);
    }

    /** Reopen a finding that was settled in error. */
    public function reopenFlag(FetTrial $trial, FetTrialFlag $flag): JsonResponse
    {
        abort_unless($flag->fet_trial_id === $trial->id, 404);

        $flag->update(['resolution' => null, 'resolution_note' => null, 'resolved_by' => null, 'resolved_at' => null]);
        $this->validator->validate($trial->fresh());

        return response()->json(['data' => $this->shape($trial->fresh())]);
    }

    /* ── closing the deal ─────────────────────────────────────────────────── */

    /**
     * Record how the trial ended. Winning one creates the installation that
     * carries its measured baseline into the post-sale savings loop.
     */
    public function outcome(Request $request, FetTrial $trial): JsonResponse
    {
        $data = $request->validate([
            'outcome' => ['required', Rule::in(['won', 'lost'])],
            'decided_on' => ['nullable', 'date'],
            'outcome_note' => ['nullable', 'string', 'max:2000'],
            'units_sold' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'deal_value' => ['nullable', 'numeric', 'min:0'],
        ]);

        $trial = app(FetTrialConversionService::class)
            ->recordOutcome($trial, $data['outcome'], $data);

        return response()->json([
            'data' => $this->shape($trial),
            'installation' => $trial->installation
                ? ['id' => $trial->installation->id, 'reference' => $trial->installation->reference]
                : null,
        ]);
    }

    /** Reopen a trial that was closed in error. The installation is kept. */
    public function reopen(FetTrial $trial): JsonResponse
    {
        $trial->update(['status' => 'review', 'decided_on' => null]);
        Audit::log('fet_trial.reopened', "Reopened {$trial->reference}", $trial);

        return response()->json(['data' => $this->shape($trial->fresh())]);
    }

    /* ── client-facing output ─────────────────────────────────────────────── */

    /** The branded report, as sent to the client. */
    public function pdf(FetTrial $trial): Response
    {
        Audit::log('fet_trial.report_downloaded', "Downloaded the report for {$trial->reference}", $trial);

        return app(FetTrialReportService::class)->pdf($trial);
    }

    /** The trip log as a spreadsheet, in the client's own measurement model. */
    public function spreadsheet(FetTrial $trial): Response
    {
        $file = app(FetTrialReportService::class)->spreadsheet($trial);

        return response($file['content'], 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$file['filename'].'"',
            'Content-Length' => (string) strlen($file['content']),
            'Cache-Control' => 'no-store',
        ]);
    }

    /** The same trip log as plain CSV — for analysts, not for formatting. */
    public function csv(FetTrial $trial): Response
    {
        $file = app(FetTrialReportService::class)->csv($trial);

        Audit::log('fet_trial.csv_downloaded', "Downloaded the trip log (CSV) for {$trial->reference}", $trial);

        return response($file['content'], 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$file['filename'].'"',
            'Content-Length' => (string) strlen($file['content']),
            'Cache-Control' => 'no-store',
        ]);
    }

    /* ── client share link ────────────────────────────────────────────────── */

    public function share(Request $request, FetTrial $trial): JsonResponse
    {
        $data = $request->validate([
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'include_driver' => ['nullable', 'boolean'],
        ]);

        $token = $trial->issueShareToken();
        $trial->update([
            'share_expires_at' => isset($data['expires_in_days']) ? now()->addDays($data['expires_in_days']) : null,
            'share_includes_driver' => (bool) ($data['include_driver'] ?? false),
        ]);

        Audit::log('fet_trial.shared', "Issued a client link for {$trial->reference}", $trial);

        return response()->json(['token' => $token, 'expires_at' => $trial->fresh()->share_expires_at]);
    }

    public function revokeShare(FetTrial $trial): JsonResponse
    {
        $trial->forceFill(['share_token' => null, 'share_expires_at' => null])->save();
        Audit::log('fet_trial.share_revoked', "Revoked the client link for {$trial->reference}", $trial);

        return response()->json(['revoked' => true]);
    }

    /* ── shaping ──────────────────────────────────────────────────────────── */

    /** @return array<string, mixed> */
    public function shape(FetTrial $trial, bool $staff = true): array
    {
        $trial->loadMissing('trips', 'flags', 'prospect', 'installation');

        return [
            'id' => $trial->id,
            'reference' => $trial->reference,
            'client_company' => $trial->client_company,
            'contact_name' => $staff ? $trial->contact_name : null,
            'contact_email' => $staff ? $trial->contact_email : null,
            'contact_phone' => $staff ? $trial->contact_phone : null,
            'registration' => $trial->registration,
            'vehicle_make' => $trial->vehicle_make,
            'vehicle_type' => $trial->vehicle_type,
            'rated_capacity_kg' => $trial->rated_capacity_kg,
            'tare_kg' => $trial->tare_kg,
            'device_serial' => $staff ? $trial->device_serial : null,
            'device_model' => $trial->device_model,
            'installed_on' => $trial->installed_on?->toDateString(),
            'trial_start' => $trial->trial_start?->toDateString(),
            'trial_end' => $trial->trial_end?->toDateString(),
            'fuel_price' => $trial->fuel_price !== null ? (float) $trial->fuel_price : null,
            'currency' => $trial->currency,
            'baseline_method' => $trial->baseline_method,
            'declared_baseline_l_per_100' => $trial->declared_baseline_l_per_100,
            'fleet_standard_km_per_l' => $trial->fleet_standard_km_per_l,
            'required_matched_trips' => $trial->requiredMatchedTrips(),
            'min_baseline_trips_per_route' => $trial->minBaselineTripsPerRoute(),
            'status' => $trial->status,
            // How it closed, and what it became. Internal — a client's own view
            // of their trial has no business showing our deal value.
            'decided_on' => $staff ? $trial->decided_on?->toDateString() : null,
            'outcome_note' => $staff ? $trial->outcome_note : null,
            'units_sold' => $staff ? $trial->units_sold : null,
            'deal_value' => $staff && $trial->deal_value !== null ? (float) $trial->deal_value : null,
            'enquiry_id' => $staff ? $trial->enquiry_id : null,
            'prospect_id' => $staff ? $trial->prospect_id : null,
            'prospect_name' => $staff ? $trial->prospect?->name : null,
            'installation' => $staff && $trial->installation
                ? ['id' => $trial->installation->id, 'reference' => $trial->installation->reference]
                : null,
            'notes' => $staff ? $trial->notes : null,
            'share_token' => $staff ? $trial->share_token : null,
            'share_expires_at' => $trial->share_expires_at,
            'trips' => $trial->trips->map(fn (FetTrialTrip $t) => $this->shapeTrip($t, $trial, $staff))->all(),
            'flags' => $staff ? $trial->flags->map(fn (FetTrialFlag $f) => [
                'id' => $f->id,
                'trip_id' => $f->fet_trial_trip_id,
                'code' => $f->code,
                'severity' => $f->severity,
                'field' => $f->field,
                'message' => $f->message,
                'suggested_action' => $f->suggested_action,
                'context' => $f->context,
                'resolution' => $f->resolution,
                'resolution_note' => $f->resolution_note,
                'resolved_at' => $f->resolved_at,
            ])->all() : [],
            'analysis' => $this->analysis->analyse($trial),
        ];
    }

    /** @return array<string, mixed> */
    private function shapeTrip(FetTrialTrip $trip, FetTrial $trial, bool $staff): array
    {
        return [
            'id' => $trip->id,
            'sequence' => $trip->sequence,
            'trip_date' => $trip->trip_date?->toDateString(),
            'return_date' => $trip->return_date?->toDateString(),
            'route_label' => $trip->route_label,
            'route_key' => $trip->route_key,
            'region' => $trip->region,
            'distance_km' => $trip->distance_km !== null ? (float) $trip->distance_km : null,
            'distance_source' => $trip->distance_source,
            'fuel_opening_l' => $trip->fuel_opening_l !== null ? (float) $trip->fuel_opening_l : null,
            'fuel_issued_l' => $trip->fuel_issued_l !== null ? (float) $trip->fuel_issued_l : null,
            'fuel_topup_l' => $trip->fuel_topup_l !== null ? (float) $trip->fuel_topup_l : null,
            'fuel_closing_l' => $trip->fuel_closing_l !== null ? (float) $trip->fuel_closing_l : null,
            'fuel_used_l' => $trip->fuel_used_l !== null ? (float) $trip->fuel_used_l : null,
            'fuel_method' => $trip->fuel_method,
            'fuel_used_ivms_l' => $trip->fuel_used_ivms_l !== null ? (float) $trip->fuel_used_ivms_l : null,
            'fuel_variance_l' => $trip->fuelVarianceL(),
            'load_out_kg' => $trip->load_out_kg,
            'load_in_kg' => $trip->load_in_kg,
            'utilisation_pct' => $trip->utilisationPct($trial->rated_capacity_kg),
            'avg_speed_kmh' => $trip->avg_speed_kmh !== null ? (float) $trip->avg_speed_kmh : null,
            // Driver identity is PII and is withheld from the client view unless
            // it was explicitly switched on when the link was issued.
            'driver_name' => ($staff || $trial->share_includes_driver) ? $trip->driver_name : null,
            'conditions' => $trip->conditions,
            'phase' => $trip->effectivePhase(),
            'phase_override' => $trip->phase_override,
            'phase_override_reason' => $trip->phase_override_reason,
            'status' => $trip->status,
            'exclusion_reason' => $trip->exclusion_reason,
            'l_per_100' => $trip->litresPer100Km(),
            'km_per_l' => $trip->kmPerLitre(),
            'source' => $trip->source,
            'source_row_ref' => $staff ? $trip->source_row_ref : null,
            'notes' => $trip->notes,
        ];
    }

    /** @return array<string, mixed> */
    private function summarise(FetTrial $trial): array
    {
        $analysis = $this->analysis->analyse($trial);

        return [
            'id' => $trial->id,
            'reference' => $trial->reference,
            'client_company' => $trial->client_company,
            'registration' => $trial->registration,
            'status' => $trial->status,
            'installed_on' => $trial->installed_on?->toDateString(),
            'trips_count' => $trial->trips_count ?? $trial->trips()->count(),
            'confidence' => $analysis['confidence']['level'],
            'saving_pct' => $analysis['verdict'] ? $analysis['headline']['saving_pct'] : null,
            'open_findings' => count($analysis['blocking_flags']) + count($analysis['open_questions']),
            'updated_at' => $trial->updated_at,
        ];
    }

    /* ── validation ───────────────────────────────────────────────────────── */

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';

        return $request->validate([
            'client_company' => [$required, 'string', 'max:200'],
            'contact_name' => ['nullable', 'string', 'max:200'],
            'contact_email' => ['nullable', 'email', 'max:200'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'enquiry_id' => ['nullable', 'exists:enquiries,id'],
            'prospect_id' => ['nullable', 'exists:prospects,id'],
            'registration' => ['nullable', 'string', 'max:50'],
            'vehicle_make' => ['nullable', 'string', 'max:100'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'rated_capacity_kg' => ['nullable', 'integer', 'min:1', 'max:200000'],
            'tare_kg' => ['nullable', 'integer', 'min:1', 'max:200000'],
            'device_serial' => ['nullable', 'string', 'max:100'],
            'device_model' => ['nullable', 'string', 'max:100'],
            'installed_on' => ['nullable', 'date'],
            'trial_start' => ['nullable', 'date'],
            'trial_end' => ['nullable', 'date', 'after_or_equal:trial_start'],
            'fuel_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'baseline_method' => ['nullable', Rule::in(FetTrial::BASELINE_METHODS)],
            'declared_baseline_l_per_100' => ['nullable', 'numeric', 'min:0', 'max:999'],
            'fleet_standard_km_per_l' => ['nullable', 'numeric', 'min:0', 'max:99'],
            'required_matched_trips' => ['nullable', 'integer', 'min:1', 'max:50'],
            'min_baseline_trips_per_route' => ['nullable', 'integer', 'min:1', 'max:50'],
            'status' => ['nullable', Rule::in(FetTrial::STATUSES)],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }

    /** @return array<string, mixed> */
    private function validatedTrip(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';

        return $request->validate([
            'route_label' => [$required, 'string', 'max:150'],
            'region' => ['nullable', 'string', 'max:100'],
            'trip_date' => ['nullable', 'date'],
            'return_date' => ['nullable', 'date'],
            'distance_km' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'distance_source' => ['nullable', Rule::in(['tracker', 'odometer', 'planned'])],
            'odo_out_km' => ['nullable', 'integer', 'min:0'],
            'odo_in_km' => ['nullable', 'integer', 'min:0'],
            'fuel_opening_l' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'fuel_issued_l' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'fuel_topup_l' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'fuel_closing_l' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'fuel_used_ivms_l' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'load_out_kg' => ['nullable', 'integer', 'min:0', 'max:500000'],
            'load_in_kg' => ['nullable', 'integer', 'min:0', 'max:500000'],
            'avg_speed_kmh' => ['nullable', 'numeric', 'min:0', 'max:250'],
            'driver_name' => ['nullable', 'string', 'max:150'],
            'conditions' => ['nullable', 'array'],
            'phase_override' => ['nullable', Rule::in(['baseline', 'trial'])],
            'phase_override_reason' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
