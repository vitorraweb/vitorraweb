<?php

namespace App\Http\Controllers\Api;

use App\Contracts\InboundEmailProvider;
use App\Http\Controllers\Controller;
use App\Models\Communication;
use App\Notifications\CustomerReplied;
use App\Support\ContactOwner;
use App\Support\EmailQuoteStripper;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Shared inbox, Phase B — a customer's reply to their own inbox (not the
 * portal) arrives here as a webhook and gets captured back into the system,
 * the same way a portal reply does. Always acks 200 (never lets a signature
 * failure or disabled feature turn into a webhook retry storm).
 */
class InboundEmailController extends Controller
{
    public function __construct(private readonly InboundEmailProvider $provider) {}

    public function handle(Request $request): JsonResponse
    {
        if (! config('mail.inbound_capture_enabled')) {
            return response()->json(['status' => 'ignored']);
        }

        if (! $this->provider->verify($request)) {
            return response()->json(['status' => 'ignored']);
        }

        $payload = $this->provider->parse($request);

        if ($payload->from === '') {
            Log::warning('Inbound email webhook with no resolvable sender.');

            return response()->json(['status' => 'ignored']);
        }

        $dir = 'communications/'.sha1($payload->from);
        $attachments = collect($payload->attachments)
            ->map(fn (array $a) => [
                'name' => $a['filename'],
                'path' => SecureFile::storeContent($a['content'], $a['filename'], $dir),
                'size' => strlen($a['content']),
                'mime' => $a['mime'],
            ])->values()->all();

        $communication = Communication::create([
            'email'       => $payload->from,
            'direction'   => 'inbound',
            'channel'     => 'email',
            'subject'     => $payload->subject ?: null,
            'body'        => EmailQuoteStripper::strip($payload->text),
            'attachments' => $attachments ?: null,
            'sent_by'     => null,
            'message_id'  => $payload->messageId,
            'in_reply_to' => $payload->inReplyTo,
        ]);

        Notification::send(ContactOwner::resolve($payload->from), new CustomerReplied($communication));

        return response()->json(['status' => 'received']);
    }
}
