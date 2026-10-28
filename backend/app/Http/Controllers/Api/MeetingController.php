<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Support\Audit;
use App\Support\TeamsMeetingUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Teams meetings shared with staff. Meetings are created in Teams or
 * Outlook; staff paste the join link here so colleagues can find and join
 * them from Vitorra (no calendar permissions, no automatic creation).
 *
 *   See:   admins and ops see every meeting; employees see company-wide
 *          meetings and their own department's.
 *   Add:   admins and ops.
 *   Edit:  the person who added it, or an admin.
 */
class MeetingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $upcoming = $request->query('when', 'upcoming') !== 'past';

        $rows = Meeting::query()->visibleTo($user)->with('creator:id,name')
            ->when($upcoming, fn ($q) => $q->where(fn ($w) => $w->where('starts_at', '>=', now()->subHours(3))->orWhere('ends_at', '>=', now())), fn ($q) => $q->where('starts_at', '<', now()))
            ->orderBy('starts_at', $upcoming ? 'asc' : 'desc')->limit(100)->get();

        return response()->json(['data' => $rows->map(fn (Meeting $m) => $this->shape($m, $user))]);
    }

    public function store(Request $request): JsonResponse
    {
        $meeting = Meeting::create($this->validated($request) + ['created_by' => $request->user()->id]);
        Audit::log('meeting.created', "Meeting \"{$meeting->title}\" added", $meeting);

        return response()->json(['data' => $this->shape($meeting->load('creator:id,name'), $request->user())], 201);
    }

    public function update(Request $request, Meeting $meeting): JsonResponse
    {
        abort_unless($meeting->editableBy($request->user()), 403, 'Only the person who added this meeting, or an admin, can change it.');
        $meeting->update($this->validated($request, partial: true));

        return response()->json(['data' => $this->shape($meeting->fresh('creator:id,name'), $request->user())]);
    }

    public function destroy(Request $request, Meeting $meeting): JsonResponse
    {
        abort_unless($meeting->editableBy($request->user()), 403, 'Only the person who added this meeting, or an admin, can remove it.');
        Audit::log('meeting.deleted', "Meeting \"{$meeting->title}\" removed", $meeting);
        $meeting->delete();

        return response()->json(['message' => 'Meeting removed.']);
    }

    private function shape(Meeting $m, $user): array
    {
        return [
            ...$m->only(['id', 'title', 'join_url', 'notes', 'department']),
            'starts_at'  => $m->starts_at?->toIso8601String(),
            'ends_at'    => $m->ends_at?->toIso8601String(),
            'created_by' => $m->creator?->name,
            'can_edit'   => $m->editableBy($user),
        ];
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        $data = $request->validate([
            'title'      => [$req, 'string', 'max:200'],
            'starts_at'  => [$req, 'date'],
            'ends_at'    => ['nullable', 'date', 'after:starts_at'],
            'join_url'   => [$req, 'string', 'max:2048', TeamsMeetingUrl::rule()],
            'notes'      => ['nullable', 'string', 'max:2000'],
            'department' => ['nullable', Rule::in(array_keys(config('admin_modules.department_labels')))],
        ]);
        if (isset($data['join_url'])) {
            $data['join_url'] = trim($data['join_url']);
        }

        return $data;
    }
}
