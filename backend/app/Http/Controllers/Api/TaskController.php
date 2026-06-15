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

    /**
     * Team progress / KPI summary: overall completion rate and overdue count,
     * plus a workload breakdown per person and per department. Scoped the
     * same way as index() — admins see everything, everyone else sees their
     * own + their department's tasks.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Task::query();

        if (! $user->isAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                    ->orWhere('created_by', $user->id);
                if ($user->department) {
                    $q->orWhere('department', $user->department);
                }
            });
        }

        $tasks = $query->get(['id', 'assigned_to', 'department', 'status', 'due_date']);
        $today = now()->startOfDay();
        $isOverdue = fn (Task $t) => $t->due_date && $t->status !== 'done' && $t->due_date->lt($today);

        $byStatus = array_fill_keys(Task::STATUSES, 0);
        foreach ($tasks as $task) {
            $byStatus[$task->status] = ($byStatus[$task->status] ?? 0) + 1;
        }
        $total = $tasks->count();
        $done = $byStatus['done'] ?? 0;

        $byPerson = User::whereIn('role', ['admin', 'ops'])
            ->orderBy('name')
            ->get(['id', 'name', 'department'])
            ->map(function ($person) use ($tasks, $isOverdue) {
                $mine = $tasks->where('assigned_to', $person->id);
                $personTotal = $mine->count();
                $personDone = $mine->where('status', 'done')->count();

                return [
                    'id'              => $person->id,
                    'name'            => $person->name,
                    'department'      => $person->department,
                    'total'           => $personTotal,
                    'done'            => $personDone,
                    'in_progress'     => $mine->where('status', 'in_progress')->count(),
                    'blocked'         => $mine->where('status', 'blocked')->count(),
                    'todo'            => $mine->where('status', 'todo')->count(),
                    'overdue'         => $mine->filter($isOverdue)->count(),
                    'completion_rate' => $personTotal > 0 ? (int) round($personDone / $personTotal * 100) : 0,
                ];
            })
            ->filter(fn ($p) => $p['total'] > 0)
            ->values();

        $deptLabels = config('admin_modules.department_labels', []);
        $byDepartment = collect($deptLabels)
            ->map(function ($label, $dept) use ($tasks, $isOverdue) {
                $mine = $tasks->where('department', $dept);
                $deptTotal = $mine->count();
                $deptDone = $mine->where('status', 'done')->count();

                return [
                    'department'      => $dept,
                    'label'           => $label,
                    'total'           => $deptTotal,
                    'done'            => $deptDone,
                    'overdue'         => $mine->filter($isOverdue)->count(),
                    'completion_rate' => $deptTotal > 0 ? (int) round($deptDone / $deptTotal * 100) : 0,
                ];
            })
            ->filter(fn ($d) => $d['total'] > 0)
            ->values();

        return response()->json(['data' => [
            'total'           => $total,
            'by_status'       => $byStatus,
            'overdue'         => $tasks->filter($isOverdue)->count(),
            'completion_rate' => $total > 0 ? (int) round($done / $total * 100) : 0,
            'by_person'       => $byPerson,
            'by_department'   => $byDepartment,
        ]]);
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
