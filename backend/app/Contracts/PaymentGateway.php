<?php

namespace App\Contracts;

use Illuminate\Http\Request;

/**
 * A payment provider. Implementations wrap a specific gateway (Flutterwave,
 * PayPal, …). The rest of the app only depends on this contract, so
 * the provider can be swapped via config without touching checkout code, and any
 * {@see Payable} (Order or Invoice) can be charged through the same integration.
 */
interface PaymentGateway
{
    /** Machine name of the provider, e.g. "flutterwave", "manual". */
    public function name(): string;

    /**
     * Begin payment for a payable (order or invoice).
     *
     * @return array{status:string, redirect_url:?string, reference:?string, message:string}
     *   status: "pending" | "redirect" | "paid"
     *   redirect_url: hosted checkout URL the client should open, if any
     */
    public function initiate(Payable $payable): array;

    /**
     * Confirm the current payment state with the provider.
     *
     * @return array{payment_status:string, reference:?string}
     */
    public function verify(string $reference): array;

    /**
     * Process an inbound provider webhook (signature/lookup check + state update).
     *
     * @return array the JSON body to acknowledge the webhook with. Some providers
     *   require a specific echo payload or they keep retrying; the manual flow
     *   has no callbacks and returns a generic ack.
     */
    public function handleWebhook(Request $request): array;
}
