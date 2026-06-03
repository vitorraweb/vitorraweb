<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /** Dashboard summary counts */
    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'enquiries_new'     => Enquiry::where('status', 'new')->count(),
                'enquiries_total'   => Enquiry::count(),
                'messages_unread'   => ContactMessage::where('status', 'unread')->count(),
                'orders_pending'    => Order::where('status', 'pending')->count(),
                'orders_total'      => Order::count(),
            ],
        ]);
    }

    /** Paginated enquiries list (newest first) */
    public function enquiries(Request $request): JsonResponse
    {
        $query = Enquiry::latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('category')) {
            $query->where('product_category', strtoupper($request->category));
        }

        return response()->json($query->paginate(25));
    }

    /** Update an enquiry's status */
    public function updateEnquiry(Request $request, Enquiry $enquiry): JsonResponse
    {
        $data = $request->validate([
            'status'      => ['required', 'in:new,in_progress,quoted,converted,closed'],
            'assigned_to' => ['nullable', 'string', 'max:255'],
        ]);

        $enquiry->update($data);

        return response()->json(['data' => $enquiry]);
    }

    /** Paginated contact messages */
    public function messages(Request $request): JsonResponse
    {
        $query = ContactMessage::latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(25));
    }

    /** Mark a contact message as read */
    public function markRead(ContactMessage $message): JsonResponse
    {
        $message->update(['status' => 'read', 'read_at' => now()]);

        return response()->json(['data' => $message]);
    }

    /** Paginated orders */
    public function orders(Request $request): JsonResponse
    {
        $query = Order::with(['product:id,name,slug', 'user:id,name,email'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(25));
    }

    /** Update an order's status */
    public function updateOrder(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'status'          => ['required', 'in:pending,processing,shipped,delivered,complete,cancelled'],
            'tracking_number' => ['nullable', 'string', 'max:255'],
        ]);

        $order->update($data);

        return response()->json(['data' => $order]);
    }
}
