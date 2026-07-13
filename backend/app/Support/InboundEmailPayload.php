<?php

namespace App\Support;

/**
 * A parsed inbound email, normalized so the rest of the app doesn't care
 * which provider (Resend, or a future alternative) delivered it.
 */
readonly class InboundEmailPayload
{
    /** @param array<int, array{filename:string,mime:string,content:string}> $attachments */
    public function __construct(
        public string $from,
        public ?string $fromName,
        public string $subject,
        public string $text,
        public ?string $html,
        public array $attachments,
        public ?string $messageId = null,
        public ?string $inReplyTo = null,
    ) {}
}
