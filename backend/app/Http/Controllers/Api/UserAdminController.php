<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserAdminController extends Controller
{
    /** Fields returned for a staff record. */
    private const FIELDS = [
        'id', 'name', 'email', 'role', 'phone',
        'department', 'job_title', 'start_date', 'staff_status',
        'permissions', 'documents', 'notes', 'created_at',
    ];

    /** Staff directory (admin + ops). Customers are managed elsewhere. */
    public function index(): JsonResponse
    {
        $users = User::whereIn('role', ['admin', 'ops'])
            ->orderBy('name')
            ->get(self::FIELDS);

        // Ship the module/department registry so the editor can render choices
        // without hardcoding them on the client.
        return response()->json([
            'data'              => $users,
            'modules'           => config('admin_modules.modules'),
            'departments'       => config('admin_modules.department_labels'),
            'department_modules' => config('admin_modules.departments'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules($request, creating: true));

        $user = User::create(array_merge(
            $this->profile($data),
            [
                'email'    => $data['email'],
                'password' => $data['password'], // hashed via model cast
                'country'  => 'Uganda',
            ],
        ));

        return response()->json(['data' => $user->only(self::FIELDS)], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate($this->rules($request, creating: false, user: $user));

        // Never leave the system without an admin.
        if (isset($data['role']) && $user->role === 'admin' && $data['role'] !== 'admin' && $this->adminCount() <= 1) {
            return response()->json(['message' => 'You cannot change the role of the last admin.'], 422);
        }

        $update = $this->profile($data);
        if (array_key_exists('email', $data)) {
            $update['email'] = $data['email'];
        }

        $user->update($update);

        return response()->json(['data' => $user->fresh()->only(self::FIELDS)]);
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

        return response()->json(['message' => 'Staff member removed.']);
    }

    /** Validation rules shared by store + update. */
    private function rules(Request $request, bool $creating, ?User $user = null): array
    {
        $required = $creating ? 'required' : 'sometimes';
        $departments = array_keys(config('admin_modules.departments'));
        $modules = array_keys(config('admin_modules.modules'));

        return [
            'name'         => [$required, 'string', 'max:255'],
            'email'        => [$required, 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'role'         => [$required, Rule::in(['admin', 'ops'])],
            'password'     => [$creating ? 'required' : 'sometimes', 'string', 'min:8'],
            'phone'        => ['nullable', 'string', 'max:50'],
            'department'   => ['nullable', Rule::in($departments)],
            'job_title'    => ['nullable', 'string', 'max:255'],
            'start_date'   => ['nullable', 'date'],
            'staff_status' => ['nullable', Rule::in(['active', 'on_leave', 'left'])],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => [Rule::in($modules)],
            'documents'        => ['nullable', 'array'],
            'documents.*.label' => ['required_with:documents', 'string', 'max:255'],
            'documents.*.url'   => ['required_with:documents', 'string', 'max:2048'],
            'notes'        => ['nullable', 'string', 'max:5000'],
        ];
    }

    /** Pick the writable profile attributes that were actually supplied. */
    private function profile(array $data): array
    {
        return collect($data)
            ->only(['name', 'role', 'phone', 'department', 'job_title', 'start_date', 'staff_status', 'permissions', 'documents', 'notes'])
            ->all();
    }

    private function adminCount(): int
    {
        return User::where('role', 'admin')->count();
    }
}
