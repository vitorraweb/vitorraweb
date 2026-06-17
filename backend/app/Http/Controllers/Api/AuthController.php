<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Register a customer account and issue a token. */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
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

        return response()->json(['data' => $this->issueToken($user)], 201);
    }

    /** Issue a Sanctum token on successful login */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($data)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return response()->json(['data' => $this->issueToken(Auth::user())]);
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
            'password'         => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
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
    private function issueToken(User $user): array
    {
        $token = $user->createToken('api-token', ['*'], $this->tokenExpiry($user));

        return [
            'user'       => $user->toAuthArray(),
            'token'      => $token->plainTextToken,
            'expires_at' => optional($token->accessToken->expires_at)->toIso8601String(),
        ];
    }

    /** When a freshly issued token should expire, by role. */
    private function tokenExpiry(User $user): CarbonInterface
    {
        if (in_array($user->role, ['admin', 'ops'], true)) {
            $hours = (int) Setting::get('staff_session_lifetime_hours', 8);
            $hours = max(1, min(168, $hours)); // clamp 1h–7d
            return now()->addHours($hours);
        }

        return now()->addDays(30);
    }
}
