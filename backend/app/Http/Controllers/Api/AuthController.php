<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use App\Services\TwoFactorService;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    /** Register a customer account and issue a token. */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            // Customer-grade policy: 8+ chars, plus a breach check in production.
            'password' => ['required', app()->isProduction() ? Password::min(8)->uncompromised() : Password::min(8)],
            'company'  => ['nullable', 'string', 'max:255'],
            'phone'    => ['nullable', 'string', 'max:50'],
            'country'  => ['nullable', 'string', 'max:100'],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'], // hashed via cast
            'role'     => 'customer',
            'company'  => $data['company'] ?? null,
            'phone'    => $data['phone'] ?? null,
            'country'  => $data['country'] ?? 'Uganda',
        ]);

        return response()->json(['data' => $this->issueToken($user, 'customer')], 201);
    }

    /** Issue a Sanctum token on successful login (challenging for 2FA if on). */
    public function login(Request $request, TwoFactorService $tfa): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
            'code'     => ['nullable', 'string'], // 2FA code or recovery code, when enabled
            'scope'    => ['nullable', Rule::in(['admin', 'staff', 'customer'])], // which portal this token is for
        ]);

        if (! Auth::attempt(['email' => $data['email'], 'password' => $data['password']])) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();

        // Second factor: password was right, but this account requires a code.
        if ($user->hasTwoFactorEnabled()) {
            if (empty($data['code'])) {
                // Credentials are valid — tell the client to collect the code.
                return response()->json(['data' => ['two_factor_required' => true]]);
            }
            if (! $tfa->passesChallenge($user, $data['code'])) {
                throw ValidationException::withMessages([
                    'code' => ['That authentication code is not valid.'],
                ]);
            }
        }

        // Cookie/SPA mode: the request is stateful (came from a SANCTUM_STATEFUL
        // domain), so the session cookie is the credential — establish it and
        // return no token (nothing sensitive for JS to store). Otherwise fall
        // back to a Bearer token for token-mode clients.
        if ($request->hasSession()) {
            $request->session()->regenerate();

            return response()->json(['data' => [
                'user'       => $user->toAuthArray(),
                'token'      => null,
                'expires_at' => null,
            ]]);
        }

        return response()->json(['data' => $this->issueToken($user, $data['scope'] ?? null)]);
    }

    /** Sign out — revokes the Bearer token (token mode) and/or the session (cookie mode). */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        // Cookie/SPA session, if any.
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out.']);
    }

    /** Return the authenticated user */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->toAuthArray(),
        ]);
    }

    /**
     * Self-service email signature (staff only — appended to outgoing replies
     * sent from /admin/customers). Plain text, kept short and simple.
     */
    public function updateSignature(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isStaff(), 403);

        // Generous ceiling: pasted-from-Outlook HTML (with one inline logo,
        // before image extraction shrinks it) can run well past a plain-text
        // signature's length. 200KB of raw pasted markup is already a lot.
        $data = $request->validate([
            'signature' => ['nullable', 'string', 'max:200000'],
        ]);

        $signature = trim($data['signature'] ?? '');
        $clean = $signature === '' ? null : \App\Support\SignatureHtml::process($signature, $user->id);

        $user->update(['email_signature' => $clean]);

        return response()->json(['data' => ['email_signature' => $user->email_signature]]);
    }

    /** List this account's active sessions (signed-in devices). */
    public function sessions(Request $request): JsonResponse
    {
        // In cookie/SPA (stateful) mode the "current" credential is a
        // TransientToken with no id — only a real bearer token has one.
        $current = $request->user()->currentAccessToken();
        $currentId = $current instanceof PersonalAccessToken ? $current->getKey() : null;

        $sessions = $request->user()->tokens()
            ->orderByRaw('last_used_at IS NULL, last_used_at DESC')
            ->get()
            ->map(fn ($t) => [
                'id'           => $t->id,
                'name'         => $t->name,
                'last_used_at' => optional($t->last_used_at)->toIso8601String(),
                'created_at'   => optional($t->created_at)->toIso8601String(),
                'expires_at'   => optional($t->expires_at)->toIso8601String(),
                'current'      => $t->getKey() === $currentId,
            ]);

        return response()->json(['data' => $sessions]);
    }

    /** Revoke one session by id (must belong to the signed-in user). */
    public function revokeSession(Request $request, int $id): JsonResponse
    {
        $request->user()->tokens()->whereKey($id)->delete();

        return response()->json(['message' => 'Session signed out.']);
    }

    /** Sign out of every other device, keeping the current session alive. */
    public function revokeOtherSessions(Request $request): JsonResponse
    {
        $current = $request->user()->currentAccessToken();
        $currentId = $current instanceof PersonalAccessToken ? $current->getKey() : null;
        $request->user()->tokens()
            ->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))
            ->delete();

        return response()->json(['message' => 'Signed out of all other devices.']);
    }

    /**
     * Change the signed-in user's password (staff or customer).
     * Requires the current password, and revokes every OTHER session so a
     * stolen token elsewhere is killed the moment the password changes.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', Password::defaults(), 'confirmed', 'different:current_password'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Your current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $data['password']]);

        // Keep this session alive; sign out every other Bearer-token session.
        $current = $user->currentAccessToken();
        $user->tokens()
            ->when($current instanceof PersonalAccessToken, fn ($q) => $q->where('id', '!=', $current->id))
            ->delete();

        return response()->json(['message' => 'Password updated. Other sessions have been signed out.']);
    }

    /**
     * Request a password reset link for someone locked out (doesn't know their
     * current password, so changePassword() above isn't reachable). Always
     * responds the same way whether or not the email matches an account, so
     * this can't be used to discover which emails have accounts.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);

        PasswordBroker::sendResetLink(['email' => $data['email']]);

        return response()->json([
            'message' => "If an account exists for that email, we've sent a password reset link.",
        ]);
    }

    /**
     * Complete a reset from the emailed link. Signs out every existing
     * session on the account — same rationale as changePassword(): a reset
     * usually means "I don't trust this password anymore," so nothing that
     * signed in with the old one should stay signed in.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'token'    => ['required', 'string'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $status = PasswordBroker::reset(
            $data,
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== PasswordBroker::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [match ($status) {
                    PasswordBroker::INVALID_TOKEN    => 'This reset link is invalid or has already been used.',
                    PasswordBroker::RESET_THROTTLED  => 'Please wait a moment before trying again.',
                    default                          => 'This reset link has expired. Please request a new one.',
                }],
            ]);
        }

        return response()->json(['message' => 'Your password has been reset. You can now sign in.']);
    }

    /**
     * Create a token whose lifetime reflects the account type. Staff sessions
     * are short-lived (admin-configurable, default 8h) to limit the window of
     * a hijacked token; customer portal sessions run longer for convenience.
     */
    private function issueToken(User $user, ?string $scope = null): array
    {
        $token = $user->createToken(
            $this->sessionLabel($scope, request()),
            $this->tokenAbilities($user, $scope),
            $this->tokenExpiry($user),
        );

        return [
            'user'       => $user->toAuthArray(),
            'token'      => $token->plainTextToken,
            'expires_at' => optional($token->accessToken->expires_at)->toIso8601String(),
        ];
    }

    /**
     * Surface-scope a token so a leak is contained. A token issued for the
     * staff portal cannot reach /admin even if the holder is an admin — they
     * sign into the admin panel separately to get an admin-scoped token. The
     * requested scope is clamped to what the user's role actually allows, and
     * falls back to a role-derived default when no scope is supplied (keeps
     * older clients working).
     *
     * @return array<int, string>
     */
    private function tokenAbilities(User $user, ?string $scope): array
    {
        // Admin-panel tokens also need 'staff' — the panel legitimately calls a
        // few /staff endpoints (e.g. downloading an employee's HR document).
        $default = match (true) {
            $user->isOps()   => ['admin', 'staff'], // admin + ops
            $user->isStaff() => ['staff'],          // employee
            default          => ['customer'],
        };

        return match ($scope) {
            'admin'    => $user->isOps() ? ['admin', 'staff'] : $default,
            'staff'    => $user->isStaff() ? ['staff'] : $default,
            'customer' => ['customer'],
            default    => $default,
        };
    }

    /** A human-readable session label (portal · browser on OS) for the device list. */
    private function sessionLabel(?string $scope, Request $request): string
    {
        $ua = (string) $request->userAgent();

        $browser = match (true) {
            str_contains($ua, 'Edg')     => 'Edge',
            str_contains($ua, 'OPR')     => 'Opera',
            str_contains($ua, 'Chrome')  => 'Chrome',
            str_contains($ua, 'Firefox') => 'Firefox',
            str_contains($ua, 'Safari')  => 'Safari',
            default                      => 'Browser',
        };
        $os = match (true) {
            str_contains($ua, 'Windows')                                     => 'Windows',
            str_contains($ua, 'iPhone') || str_contains($ua, 'iPad')         => 'iOS',
            str_contains($ua, 'Mac')                                         => 'macOS',
            str_contains($ua, 'Android')                                     => 'Android',
            str_contains($ua, 'Linux')                                       => 'Linux',
            default                                                          => null,
        };
        $portal = match ($scope) {
            'admin'    => 'Admin panel',
            'staff'    => 'Staff portal',
            'customer' => 'Customer portal',
            default    => 'Session',
        };

        return $portal.' · '.$browser.($os ? ' on '.$os : '');
    }

    /** When a freshly issued token should expire, by role. */
    private function tokenExpiry(User $user): CarbonInterface
    {
        // Every internal account (admin, ops AND employee) gets the short,
        // admin-configurable session — the staff portal holds confidential HR
        // data, so an employee token must not be long-lived. Only customer
        // portal sessions run the longer 30-day window for convenience.
        if ($user->isStaff()) {
            $hours = (int) Setting::get('staff_session_lifetime_hours', 8);
            $hours = max(1, min(168, $hours)); // clamp 1h–7d
            return now()->addHours($hours);
        }

        return now()->addDays(30);
    }
}
