<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReceiptScanLink;
use App\Services\ReceiptInbox;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The phone side of "scan with your phone". No sign-in: the 30-minute link
 * from the QR code is the key, and all it can do is add receipts to the
 * Finance inbox (credited to whoever made the link). It cannot read,
 * change or list anything.
 */
class ReceiptScanController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $link = ReceiptScanLink::findByToken($token);
        if (! $link) {
            return response()->json(['message' => 'This scan link has expired. Open Accounting → Receipts on the computer and scan a new QR code.'], 410);
        }

        return response()->json(['data' => [
            'for'        => $link->user?->name,
            'expires_at' => $link->expires_at->toIso8601String(),
            'uploaded'   => $link->uploads,
            'remaining'  => ReceiptScanLink::MAX_UPLOADS - $link->uploads,
        ]]);
    }

    public function upload(Request $request, string $token, ReceiptInbox $inbox): JsonResponse
    {
        $link = ReceiptScanLink::findByToken($token);
        if (! $link) {
            return response()->json(['message' => 'This scan link has expired. Scan a new QR code.'], 410);
        }
        $request->validate(['file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240']]);

        $receipt = $inbox->store($request->file('file'), $link->user_id, 'phone');
        $link->increment('uploads');

        return response()->json(['data' => ['id' => $receipt->id], 'message' => 'Saved.'], 201);
    }
}
