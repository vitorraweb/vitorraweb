<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * List tasks visible to the current user. Admins see all; everyone else
     * sees tasks assigned to them, created by them, or in their department.
     * Also ships the assignable-staff list for the assignee picker.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Task::with(['assignee:id,name', 'creator:id,name']);

        if (! $user->isAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                    ->orWhere('created_by', $user->id);
                if ($user->department) {
                    $q->orWhere('department', $user->department);
                }
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($assignee = $request->query('assignee')) {
            $query->where('assigned_to', $assignee);
        }
        if ($request->boolean('mine')) {
            $query->where('assigned_to', $user->id);
        }
        if (($dept = $request->query('department')) && $user->isAdmin()) {
            $query->where('department', $dept);
        }

        $tasks = $query
            ->orderByRaw("CASE status WHEN 'done' THEN 1 ELSE 0 END")
            ->orderByRaw('due_date IS NULL')
            ->orderBy('due_date')
            ->latest()
            ->limit(500)
            ->get();

        return response()->json([
            'data'      => $tasks,
            'assignees' => User::whereIn('role', ['admin', 'ops'])
                ->orderBy('name')
                ->get(['id', 'name', 'department']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(creating: true));

        $task = Task::create(array_merge($data, ['created_by' => $request->user()->id]));

        return response()->json(['data' => $task->load(['assignee:id,name', 'creator:id,name'])], 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate($this->rules(creating: false));

        $task->update($data);

        return response()->json(['data' => $task->fresh()->load(['assignee:id,name', 'creator:id,name'])]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        // Only the creator or an admin can delete a task.
        if (! $request->user()->isAdmin() && $task->created_by !== $request->user()->id) {
            return response()->json(['message' => 'Only the task creator or an admin can delete this task.'], 403);
        }

        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    private function rules(bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';
        $departments = array_keys(config('admin_modules.departments'));

        return [
            'title'       => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'status'      => ['nullable', Rule::in(Task::STATUSES)],
            'priority'    => ['nullable', Rule::in(Task::PRIORITIES)],
            'due_date'    => ['nullable', 'date'],
            'department'  => ['nullable', Rule::in($departments)],
        ];
    }
}
