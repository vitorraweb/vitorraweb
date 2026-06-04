<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserAdminController extends Controller
{
    /** Staff accounts (admin + ops). Customers are managed elsewhere. */
    public function index(): JsonResponse
    {
        $users = User::whereIn('role', ['admin', 'ops'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'phone', 'created_at']);

        return response()->json(['data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'role'     => ['required', Rule::in(['admin', 'ops'])],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'role'     => $data['role'],
            'password' => $data['password'], // hashed via model cast
            'country'  => 'Uganda',
        ]);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role'])], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'  => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role'  => ['sometimes', 'required', Rule::in(['admin', 'ops'])],
        ]);

        // Never leave the system without an admin.
        if (isset($data['role']) && $user->role === 'admin' && $data['role'] !== 'admin' && $this->adminCount() <= 1) {
            return response()->json(['message' => 'You cannot change the role of the last admin.'], 422);
        }

        $user->update($data);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role'])]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'string', 'min:8']]);
        $user->update(['password' => $data['password']]);

        return response()->json(['message' => 'Password updated.']);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }
        if ($user->role === 'admin' && $this->adminCount() <= 1) {
            return response()->json(['message' => 'You cannot delete the last admin.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User removed.']);
    }

    private function adminCount(): int
    {
        return User::where('role', 'admin')->count();
    }
}
