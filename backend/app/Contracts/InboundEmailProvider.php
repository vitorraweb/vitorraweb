<?php

namespace App\Contracts;

use App\Support\InboundEmailPayload;
use Illuminate\Http\Request;

/**
 * A provider that delivers inbound email as a webhook (Resend, or a future
 * alternative). Mirrors {@see PaymentGateway}: the rest of the app depends
 * only on this contract, so the concrete provider can be swapped via config.
 */
interface InboundEmailProvider
{
    /** Verify the webhook actually came from the provider (signature check). */
    public function verify(Request $request): bool;

    /** Normalize the provider's payload shape into an InboundEmailPayload. */
    public function parse(Request $request): InboundEmailPayload;
}
