<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorService;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Self-service app-based two-factor for staff. Enrolment is a two-step
 * confirm-before-enable so a half-finished setup never locks anyone out.
 */
class TwoFactorController extends Controller
{
    public function __construct(private readonly TwoFactorService $tfa) {}

    /** Start enrolment: issue a pending (unconfirmed) secret + QR to scan. */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Two-factor is already on. Turn it off first to re-enrol.'], 422);
        }

        $secret = $this->tfa->generateSecret();
        // Store as a pending secret — confirmed_at stays null until a code proves it.
        $user->two_factor_secret = $secret;
        $user->two_factor_confirmed_at = null;
        $user->save();

        return response()->json(['data' => [
            'secret'  => $secret,           // manual-entry fallback
            'qr_code' => $this->tfa->qrCodeDataUri($user, $secret),
        ]]);
    }

    /** Confirm enrolment with a working code; returns one-time recovery codes. */
    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string']]);
        $user = $request->user();

        if (! $user->two_factor_secret || $user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Start setup again — no pending enrolment found.'], 422);
        }
        if (! $this->tfa->verify($user->two_factor_secret, $data['code'])) {
            throw ValidationException::withMessages(['code' => ['That code is not valid. Check your authenticator app and try again.']]);
        }

        $recovery = $this->tfa->generateRecoveryCodes();
        $user->two_factor_recovery_codes = $recovery;
        $user->two_factor_confirmed_at = now();
        $user->save();

        Audit::log('user.2fa_enabled', $user->name.' turned on two-factor authentication', $user);

        return response()->json([
            'message'        => 'Two-factor is now on.',
            'recovery_codes' => $recovery, // shown once — the client must tell the user to save them
        ]);
    }

    /** Turn off two-factor (requires the password + a current code/recovery code). */
    public function disable(Request $request): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string'],
            'code'     => ['required', 'string'],
        ]);
        $user = $request->user();

        if (! $user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Two-factor is not on.'], 422);
        }
        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => ['Your password is incorrect.']]);
        }
        if (! $this->tfa->passesChallenge($user, $data['code'])) {
            throw ValidationException::withMessages(['code' => ['That code is not valid.']]);
        }

        $user->two_factor_secret = null;
        $user->two_factor_recovery_codes = null;
        $user->two_factor_confirmed_at = null;
        $user->save();

        Audit::log('user.2fa_disabled', $user->name.' turned off two-factor authentication', $user);

        return response()->json(['message' => 'Two-factor has been turned off.']);
    }
}
