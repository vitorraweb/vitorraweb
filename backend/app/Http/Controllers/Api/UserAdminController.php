<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StaffDocument;
use App\Models\User;
use App\Support\Audit;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserAdminController extends Controller
{
    /** Fields returned for a staff record. */
    private const FIELDS = [
        'id', 'name', 'email', 'role', 'phone',
        'department', 'supervisor_id', 'job_title', 'job_description',
        'start_date', 'staff_status', 'leave_entitlement_days',
        'permissions', 'documents', 'notes', 'created_at',
    ];

    /** Staff directory (admin + ops + employees). Customers are managed elsewhere. */
    public function index(): JsonResponse
    {
        $users = User::whereIn('role', ['admin', 'ops', 'employee'])
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

        return response()->json(['data' => $this->payload($user)], 201);
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

        $previousRole = $user->role;
        $roleChanged  = isset($data['role']) && $data['role'] !== $previousRole;
        $user->update($update);

        if ($roleChanged) {
            Audit::log('user.role_change', $user->name.' role changed from '.$previousRole.' to '.$data['role'], $user, ['from' => $previousRole, 'to' => $data['role']]);
        }

        return response()->json(['data' => $this->payload($user->fresh())]);
    }

    /**
     * Staff record shaped for API output. `only()` returns a raw Carbon for the
     * date-cast `start_date`, which JSON-encodes to a full ISO timestamp the
     * frontend's <input type="date"> can't display — so normalise it to Y-m-d.
     */
    private function payload(User $user): array
    {
        return array_merge($user->only(self::FIELDS), [
            'start_date' => optional($user->start_date)->toDateString(),
        ]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['password' => ['required', Password::defaults()]]);
        $user->update(['password' => $data['password']]);
        // Force the affected user to re-authenticate everywhere with the new password.
        $user->tokens()->delete();

        Audit::log('user.password_reset', 'Reset the password for '.$user->name, $user);

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

        Audit::log('user.delete', 'Removed staff member '.$user->name.' ('.$user->email.')', null, ['user_id' => $user->id, 'role' => $user->role]);
        $user->delete();

        return response()->json(['message' => 'Staff member removed.']);
    }

    /** List a staff member's private HR documents (metadata only). */
    public function documents(User $user): JsonResponse
    {
        return response()->json(['data' => StaffController::documentList($user)]);
    }

    /** Upload a private HR document (contract, ID, certificate) to the private disk. */
    public function uploadDocument(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'file'  => ['required', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:8192'],
            'type'  => ['required', Rule::in(StaffDocument::TYPES)],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $path = SecureFile::storeUpload($file, "staff/{$user->id}"); // private disk, encrypted at rest

        $doc = $user->staffDocuments()->create([
            'type'          => $data['type'],
            'title'         => $data['title'],
            'path'          => $path,
            'original_name' => $file->getClientOriginalName(),
            'size'          => $file->getSize(),
            'uploaded_by'   => $request->user()->id,
        ]);

        return response()->json(['data' => StaffController::documentList($user), 'id' => $doc->id], 201);
    }

    /** Delete a staff document (file + record). */
    public function deleteDocument(StaffDocument $document): JsonResponse
    {
        Storage::disk('local')->delete($document->path);
        $document->delete();

        return response()->json(['message' => 'Document removed.']);
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
            'role'         => [$required, Rule::in(['admin', 'ops', 'employee'])],
            'password'     => [$creating ? 'required' : 'sometimes', Password::defaults()],
            'phone'        => ['nullable', 'string', 'max:50'],
            'department'   => ['nullable', Rule::in($departments)],
            'supervisor_id'   => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($q) => $q->whereIn('role', ['admin', 'ops', 'employee'])), Rule::notIn([$user?->id])],
            'job_title'    => ['nullable', 'string', 'max:255'],
            'job_description' => ['nullable', 'string', 'max:10000'],
            'start_date'   => ['nullable', 'date'],
            'staff_status' => ['nullable', Rule::in(['active', 'on_leave', 'left'])],
            'leave_entitlement_days' => ['nullable', 'integer', 'min:0', 'max:365'],
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
            ->only(['name', 'role', 'phone', 'department', 'supervisor_id', 'job_title', 'job_description', 'start_date', 'staff_status', 'leave_entitlement_days', 'permissions', 'documents', 'notes'])
            ->all();
    }

    private function adminCount(): int
    {
        return User::where('role', 'admin')->count();
    }
}
