<?php

namespace App\Contracts;

use App\Models\Order;
use Illuminate\Http\Request;

/**
 * A payment provider. Implementations wrap a specific gateway (Flutterwave,
 * PayPal, Stripe, …). The rest of the app only depends on this contract, so
 * the provider can be swapped via config without touching checkout code.
 */
interface PaymentGateway
{
    /** Machine name of the provider, e.g. "flutterwave", "manual". */
    public function name(): string;

    /**
     * Begin payment for an order.
     *
     * @return array{status:string, redirect_url:?string, reference:?string, message:string}
     *   status: "pending" | "redirect" | "paid"
     *   redirect_url: hosted checkout URL the client should open, if any
     */
    public function initiate(Order $order): array;

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
     *   (e.g. Pesapal) require a specific echo payload or they keep retrying; the
     *   manual flow has no callbacks and returns a generic ack.
     */
    public function handleWebhook(Request $request): array;
}
