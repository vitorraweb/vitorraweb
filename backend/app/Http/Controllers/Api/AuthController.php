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
        $token = $user->createToken('api-token', $this->tokenAbilities($user, $scope), $this->tokenExpiry($user));

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
