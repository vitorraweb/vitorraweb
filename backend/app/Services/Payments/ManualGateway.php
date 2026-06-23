<?php

namespace App\Services\Payments;

use App\Contracts\Payable;
use App\Contracts\PaymentGateway;
use App\Models\Order;
use Illuminate\Http\Request;

/**
 * Interim gateway used until a live provider (Flutterwave / PayPal / Stripe)
 * is configured. It places the order as awaiting manual confirmation — the
 * team reconciles payment offline (bank transfer, mobile money, on delivery)
 * and marks it paid in the admin panel.
 *
 * To add a real provider: create a sibling class implementing PaymentGateway,
 * then point PAYMENT_DRIVER at it (see config/payments.php + AppServiceProvider).
 */
class ManualGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'manual';
    }

    public function initiate(Payable $payable): array
    {
        $payable->attachPaymentInitiation('', 'manual');

        return [
            'status'       => 'pending',
            'redirect_url' => null,
            'reference'    => $payable->payableReference(),
            'message'      => 'Received. Our team will confirm payment with you shortly.',
        ];
    }

    public function verify(string $reference): array
    {
        $order = Order::where('reference', $reference)->first();

        return [
            'payment_status' => $order?->payment_status ?? 'pending',
            'reference'      => $reference,
        ];
    }

    public function handleWebhook(Request $request): array
    {
        // No-op: the manual flow has no provider callbacks.
        return ['received' => true];
    }
}
