<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enquiry;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * Customer self-service. Orders and enquiries are guest records keyed by
     * email, so each customer sees the records matching their own email.
     */
    public function orders(Request $request): JsonResponse
    {
        return response()->json(['data' => Order::whereRaw('lower(customer_email) = ?', [$this->email($request)])
            ->latest()
            ->get(['id', 'reference', 'currency', 'subtotal', 'total', 'status', 'payment_status', 'tracking_number', 'invoice_url', 'created_at'])]);
    }

    public function order(Request $request, string $reference): JsonResponse
    {
        $order = Order::with('items')
            ->whereRaw('lower(customer_email) = ?', [$this->email($request)])
            ->where('reference', $reference)
            ->firstOrFail();

        return response()->json(['data' => $order]);
    }

    public function enquiries(Request $request): JsonResponse
    {
        return response()->json(['data' => Enquiry::whereRaw('lower(email) = ?', [$this->email($request)])
            ->latest()
            ->get(['id', 'product_category', 'message', 'requirements', 'status', 'created_at'])]);
    }

    public function profile(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->only(['id', 'name', 'email', 'role', 'company', 'phone', 'country'])]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => ['sometimes', 'required', 'string', 'max:255'],
            'company' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone'   => ['sometimes', 'nullable', 'string', 'max:50'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        $request->user()->update($data);

        return response()->json(['data' => $request->user()->only(['id', 'name', 'email', 'role', 'company', 'phone', 'country'])]);
    }

    /** Documents available to every customer (product literature). */
    public function documents(): JsonResponse
    {
        return response()->json(['data' => [
            ['name' => 'Fuel Eco Tech — Vehicle Application Guide', 'url' => '/downloads/vitorra-fet-application-guide.pdf', 'type' => 'PDF'],
            ['name' => 'Fuel Eco Tech — Product Datasheet', 'url' => '/downloads/vitorra-fet-datasheet.pdf', 'type' => 'PDF'],
        ]]);
    }

    private function email(Request $request): string
    {
        return mb_strtolower(trim($request->user()->email));
    }
}
