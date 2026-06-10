<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => [
                'user'  => $user->toAuthArray(),
                'token' => $token,
            ],
        ], 201);
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

        $user  = Auth::user();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data'  => [
                'user'  => $user->toAuthArray(),
                'token' => $token,
            ],
        ]);
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
}
