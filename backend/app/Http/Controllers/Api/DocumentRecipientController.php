<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\DocumentRecipients;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The people a quotation or invoice can be sent to: the whole Vitorra team,
 * and clients from the system matching a search.
 */
class DocumentRecipientController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = trim((string) ($request->validate(['q' => ['nullable', 'string', 'max:100']])['q'] ?? ''));

        return response()->json([
            'team'    => DocumentRecipients::team()->map(fn (User $u) => $u->only(['id', 'name', 'email', 'department', 'job_title']))->values(),
            'clients' => mb_strlen($q) >= 2 ? DocumentRecipients::searchClients($q) : [],
        ]);
    }
}
