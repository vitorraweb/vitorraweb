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
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

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

        return response()->json(['data' => $this->issueToken($user, $data['scope'] ?? null)]);
    }

    /** Revoke the current token (logout) */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /** Return the authenticated user */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->toAuthArray(),
        ]);
    }

    /** List this account's active sessions (signed-in devices). */
    public function sessions(Request $request): JsonResponse
    {
        $current = $request->user()->currentAccessToken();

        $sessions = $request->user()->tokens()
            ->orderByRaw('last_used_at IS NULL, last_used_at DESC')
            ->get()
            ->map(fn ($t) => [
                'id'           => $t->id,
                'name'         => $t->name,
                'last_used_at' => optional($t->last_used_at)->toIso8601String(),
                'created_at'   => optional($t->created_at)->toIso8601String(),
                'expires_at'   => optional($t->expires_at)->toIso8601String(),
                'current'      => $current ? $t->id === $current->id : false,
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
        $request->user()->tokens()
            ->when($current, fn ($q) => $q->where('id', '!=', $current->id))
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

        // Keep this session alive; sign out everywhere else.
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Password updated. Other sessions have been signed out.']);
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
