<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only view over the audit trail (admin only). The log is written from
 * across the app via App\Support\Audit; this just surfaces it for review.
 */
class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ActivityLog::with('user:id,name,email')->orderByDesc('id');

        if ($request->filled('action')) {
            $q->where('action', $request->query('action'));
        }
        if ($request->filled('user_id')) {
            $q->where('user_id', (int) $request->query('user_id'));
        }
        if ($request->filled('search')) {
            $q->where('description', 'like', '%'.$request->query('search').'%');
        }

        $rows = $q->limit(300)->get()->map(fn (ActivityLog $a) => [
            'id'          => $a->id,
            'action'      => $a->action,
            'description' => $a->description,
            'actor'       => $a->user?->name ?? 'System',
            'actor_email' => $a->user?->email,
            'ip'          => $a->ip,
            'created_at'  => optional($a->created_at)->toIso8601String(),
        ]);

        return response()->json([
            'data'    => $rows,
            'actions' => ActivityLog::query()->select('action')->distinct()->orderBy('action')->pluck('action'),
        ]);
    }
}
