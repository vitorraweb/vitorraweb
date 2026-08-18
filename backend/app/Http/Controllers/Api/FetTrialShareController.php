<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FetTrial;
use App\Services\FetTrialReportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * The client's read-only view of their own trial.
 *
 * Unauthenticated by design: clients keep sending their export and get a link
 * back, rather than being asked to hold yet another login. The token is the
 * credential, so what it exposes is deliberately narrower than the staff view —
 * no contact records, no internal notes, no device serial, no driver identity
 * unless that was explicitly switched on when the link was issued.
 *
 * The strict verdict rule applies here too: if the evidence does not carry a
 * result, the client is told what is still needed rather than shown a number
 * with a caveat attached.
 */
class FetTrialShareController extends Controller
{
    public function __construct(
        private readonly FetTrialController $trials,
        private readonly FetTrialReportService $reports,
    ) {}

    public function show(string $token): JsonResponse
    {
        $trial = $this->resolve($token);

        if ($trial instanceof JsonResponse) {
            return $trial;
        }

        $data = $this->trials->shape($trial, staff: false);

        // Findings are an internal working record — the client sees the trips
        // and the result, not our queue of open questions about their data.
        unset($data['flags'], $data['share_token']);
        $data['analysis'] = collect($data['analysis'])
            ->except(['blocking_flags', 'open_questions'])
            ->all();

        return response()->json(['data' => $data]);
    }

    /** The same branded report staff can download, from the client's own link. */
    public function pdf(string $token): Response
    {
        $trial = $this->resolve($token);

        return $trial instanceof JsonResponse ? $trial : $this->reports->pdf($trial);
    }

    /**
     * The INTERNAL review link — the full staff view of a trial, outside
     * staff sign-in. Issued for a leadership review (the CEO does not hold a
     * staff login); a deliberately separate token from the client link, so
     * neither can widen the other and each is revoked on its own.
     *
     * The payload is the staff shape — findings, decisions and their notes,
     * internal notes, held figures — minus the two live tokens, so a holder
     * of this link cannot mint or discover the other link from it.
     */
    public function review(string $token): JsonResponse
    {
        $trial = FetTrial::where('review_token', $token)->first();

        if (! $trial) {
            return response()->json(['message' => 'This link is no longer active.'], 404);
        }

        if ($trial->review_expires_at && $trial->review_expires_at->isPast()) {
            return response()->json(['message' => 'This link has expired. Please ask for a new one.'], 410);
        }

        $data = $this->trials->shape($trial, staff: true);
        unset($data['share_token'], $data['review_token']);

        return response()->json(['data' => $data]);
    }

    /**
     * Find the trial behind a token, or the reason it cannot be shown.
     *
     * @return FetTrial|JsonResponse
     */
    private function resolve(string $token)
    {
        $trial = FetTrial::where('share_token', $token)->first();

        if (! $trial) {
            return response()->json(['message' => 'This link is no longer active.'], 404);
        }

        if ($trial->share_expires_at && $trial->share_expires_at->isPast()) {
            return response()->json(['message' => 'This link has expired. Please ask your Vitorra contact for a new one.'], 410);
        }

        return $trial;
    }
}
