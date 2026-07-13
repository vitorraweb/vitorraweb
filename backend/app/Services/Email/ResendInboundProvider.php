<?php

namespace App\Services\Email;

use App\Contracts\InboundEmailProvider;
use App\Support\InboundEmailPayload;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Resend delivers inbound email as a webhook signed with Svix (the same
 * signing scheme Resend uses for its outbound event webhooks): headers
 * `svix-id`, `svix-timestamp`, `svix-signature`, verified as an HMAC-SHA256
 * over "{id}.{timestamp}.{raw body}" using the base64 portion of the
 * `whsec_...` signing secret from the Resend dashboard.
 *
 * NOTE for activation: Resend's inbound-email payload field names should be
 * double-checked against their current docs when this is switched on — this
 * class is the single place to adjust if they differ from what's parsed here.
 */
class ResendInboundProvider implements InboundEmailProvider
{
    public function __construct(private readonly ?string $webhookSecret) {}

    public function verify(Request $request): bool
    {
        if (! $this->webhookSecret) {
            return false;
        }

        $id        = $request->header('svix-id');
        $timestamp = $request->header('svix-timestamp');
        $signature = $request->header('svix-signature');

        if (! $id || ! $timestamp || ! $signature) {
            return false;
        }

        $secretKey = str_starts_with($this->webhookSecret, 'whsec_')
            ? base64_decode(substr($this->webhookSecret, 6))
            : $this->webhookSecret;

        $expected = base64_encode(hash_hmac('sha256', $id.'.'.$timestamp.'.'.$request->getContent(), $secretKey, true));

        // svix-signature may list several "v1,<sig>" candidates space-separated.
        foreach (explode(' ', $signature) as $candidate) {
            [, $sig] = array_pad(explode(',', $candidate, 2), 2, '');
            if ($sig && hash_equals($expected, $sig)) {
                return true;
            }
        }

        Log::warning('Resend inbound-email webhook with invalid signature', ['ip' => $request->ip()]);

        return false;
    }

    public function parse(Request $request): InboundEmailPayload
    {
        $data = $request->input('data', []);

        $attachments = collect($data['attachments'] ?? [])->map(fn (array $a) => [
            'filename' => $a['filename'] ?? 'attachment',
            'mime'     => $a['content_type'] ?? 'application/octet-stream',
            'content'  => base64_decode($a['content'] ?? '', true) ?: '',
        ])->filter(fn (array $a) => $a['content'] !== '')->values()->all();

        return new InboundEmailPayload(
            from: mb_strtolower(trim((string) ($data['from']['email'] ?? $data['from'] ?? ''))),
            fromName: $data['from']['name'] ?? null,
            subject: (string) ($data['subject'] ?? ''),
            text: (string) ($data['text'] ?? ''),
            html: $data['html'] ?? null,
            attachments: $attachments,
            messageId: $data['headers']['message-id'] ?? null,
            inReplyTo: $data['headers']['in-reply-to'] ?? null,
        );
    }
}
