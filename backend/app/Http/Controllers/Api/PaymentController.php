<?php

namespace App\Http\Controllers\Api;

use App\Contracts\PaymentGateway;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentGateway $gateway) {}

    /**
     * Begin payment for an order. With the manual driver this simply confirms
     * the order is awaiting offline payment; with a live provider it returns a
     * hosted-checkout URL for the client to open.
     */
    public function pay(string $reference): JsonResponse
    {
        $order = Order::where('reference', $reference)->firstOrFail();

        if ($order->payment_status === 'paid') {
            return response()->json([
                'data'    => ['status' => 'paid', 'redirect_url' => null],
                'message' => 'This order is already paid.',
            ]);
        }

        $result = $this->gateway->initiate($order);

        return response()->json([
            'data'    => $result,
            'message' => $result['message'] ?? 'Payment initiated.',
        ]);
    }

    /**
     * Inbound provider webhook. The {provider} segment lets each gateway have a
     * stable URL; the bound gateway verifies the signature and updates state.
     */
    public function webhook(string $provider, Request $request): JsonResponse
    {
        $this->gateway->handleWebhook($request);

        return response()->json(['received' => true]);
    }
}
