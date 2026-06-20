<?php

namespace App\Support;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

/**
 * Records sensitive actions to the audit trail. Best-effort: a logging failure
 * must never break the operation being audited, so everything is wrapped.
 */
class Audit
{
    public static function log(string $action, ?string $description = null, ?Model $subject = null, array $meta = []): void
    {
        try {
            ActivityLog::create([
                'user_id'      => Auth::id(),
                'action'       => $action,
                'subject_type' => $subject ? $subject::class : null,
                'subject_id'   => $subject?->getKey(),
                'description'  => $description,
                'ip'           => Request::ip(),
                'metadata'     => $meta !== [] ? $meta : null,
                'created_at'   => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Audit log failed: '.$e->getMessage(), ['action' => $action]);
        }
    }
}
