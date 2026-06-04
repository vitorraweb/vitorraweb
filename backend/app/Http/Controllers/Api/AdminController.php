<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Prospect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /** Dashboard summary — headline counts plus enquiry funnel & order/revenue breakdowns. */
    public function stats(): JsonResponse
    {
        $now       = now();
        $thisMonth = $now->copy()->startOfMonth();
        $lastMonth = $thisMonth->copy()->subMonthNoOverflow();

        /* ── Enquiries (the active funnel) ──────────────────────────────── */
        $enqStatusRaw = Enquiry::selectRaw('status, COUNT(*) c')->groupBy('status')->pluck('c', 'status');
        $byStatus = [];
        foreach (['new', 'in_progress', 'quoted', 'converted', 'closed'] as $k) {
            $byStatus[$k] = (int) ($enqStatusRaw[$k] ?? 0);
        }

        $enqProductRaw = Enquiry::selectRaw(
            "CASE WHEN product_category IS NULL OR product_category = '' THEN 'GENERAL' ELSE product_category END AS p, COUNT(*) c"
        )->groupBy('p')->pluck('c', 'p');
        $byProduct = [];
        foreach (['FET', 'SEAL', 'COFFEE', 'LOGISTICS', 'GENERAL'] as $k) {
            $byProduct[$k] = (int) ($enqProductRaw[$k] ?? 0);
        }

        $enqTotal       = Enquiry::count();
        $converted      = $byStatus['converted'];
        $conversionRate = $enqTotal > 0 ? round($converted / $enqTotal * 100, 1) : 0;

        // Average first-response time, from replied_at (set when an enquiry first leaves "new").
        $replied = Enquiry::whereNotNull('replied_at')->get(['created_at', 'replied_at']);
        $avgResponseHours = $replied->count() > 0
            ? round($replied->avg(fn ($e) => abs($e->created_at->diffInMinutes($e->replied_at))) / 60, 1)
            : null;

        /* ── Orders & revenue ───────────────────────────────────────────── */
        $ordStatusRaw = Order::selectRaw('status, COUNT(*) c')->groupBy('status')->pluck('c', 'status');
        $ordByStatus = [];
        foreach (['pending', 'processing', 'shipped', 'delivered', 'complete', 'cancelled'] as $k) {
            $ordByStatus[$k] = (int) ($ordStatusRaw[$k] ?? 0);
        }

        // Amounts are stored in the order's own currency unit (UGX shillings / USD cents),
        // so we never sum across currencies — we report each separately.
        $byCurrency = fn ($collection) => [
            'UGX' => (int) ($collection['UGX'] ?? 0),
            'USD' => (int) ($collection['USD'] ?? 0),
        ];
        $pendingValue = Order::whereIn('status', ['pending', 'processing'])
            ->selectRaw('currency, SUM(total) s')->groupBy('currency')->pluck('s', 'currency');
        $revenue = Order::where('payment_status', 'paid')
            ->selectRaw('currency, SUM(total) s')->groupBy('currency')->pluck('s', 'currency');

        /* ── Prospects (outreach pipeline) ──────────────────────────────── */
        $prospectStatusRaw = Prospect::selectRaw('outreach_status, COUNT(*) c')->groupBy('outreach_status')->pluck('c', 'outreach_status');
        $prospectStatus = [];
        foreach (Prospect::STATUSES as $k) {
            $prospectStatus[$k] = (int) ($prospectStatusRaw[$k] ?? 0);
        }
        $prospectCatRaw = Prospect::selectRaw('category, COUNT(*) c')->groupBy('category')->pluck('c', 'category');
        $prospectCat = [];
        foreach (Prospect::CATEGORIES as $k) {
            $prospectCat[$k] = (int) ($prospectCatRaw[$k] ?? 0);
        }
        $prospectTotal = Prospect::count();
        $prospectReached = $prospectTotal - $prospectStatus['not_contacted'] - $prospectStatus['bounced'];

        return response()->json([
            'data' => [
                // Legacy headline keys (kept for compatibility).
                'enquiries_new'   => $byStatus['new'],
                'enquiries_total' => $enqTotal,
                'messages_unread' => ContactMessage::where('status', 'unread')->count(),
                'orders_pending'  => $ordByStatus['pending'],
                'orders_total'    => Order::count(),

                'enquiries' => [
                    'total'              => $enqTotal,
                    'open'               => $byStatus['new'] + $byStatus['in_progress'],
                    'converted'          => $converted,
                    'conversion_rate'    => $conversionRate,
                    'this_month'         => Enquiry::where('created_at', '>=', $thisMonth)->count(),
                    'last_month'         => Enquiry::whereBetween('created_at', [$lastMonth, $thisMonth])->count(),
                    'by_product'         => $byProduct,
                    'by_status'          => $byStatus,
                    'avg_response_hours' => $avgResponseHours,
                ],
                'orders' => [
                    'total'         => Order::count(),
                    'pending'       => $ordByStatus['pending'] + $ordByStatus['processing'],
                    'by_status'     => $ordByStatus,
                    'this_month'    => Order::where('created_at', '>=', $thisMonth)->count(),
                    'last_month'    => Order::whereBetween('created_at', [$lastMonth, $thisMonth])->count(),
                    'pending_value' => $byCurrency($pendingValue),
                    'revenue'       => $byCurrency($revenue),
                ],
                'prospects' => [
                    'total'         => $prospectTotal,
                    'reached'       => $prospectReached,
                    'converted'     => $prospectStatus['converted'],
                    'needs_fixing'  => Prospect::whereNotNull('flags')->count(),
                    'by_status'     => $prospectStatus,
                    'by_category'   => $prospectCat,
                ],
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
        // PATCH semantics — each field is updatable on its own (status OR assignee).
        $data = $request->validate([
            'status'      => ['sometimes', 'required', 'in:new,in_progress,quoted,converted,closed'],
            'assigned_to' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        // Record first-response time the first time an enquiry moves off "new".
        if (isset($data['status']) && $data['status'] !== 'new' && $enquiry->replied_at === null) {
            $data['replied_at'] = now();
        }

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
        $query = Order::with(['items', 'user:id,name,email'])->latest();

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
