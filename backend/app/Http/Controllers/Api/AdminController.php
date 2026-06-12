<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Prospect;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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

    /**
     * Convert a quoted enquiry into a cash-reserved order.
     *
     * Staff pick the agreed price and (for FET) the device tier explicitly —
     * `Enquiry.requirements` stores translated display labels, not raw tier
     * ids, so we don't try to parse them. Setting `product_slug = 'fet-{tier}'`
     * on the line item is what lets the customer portal's savings widget
     * recognise this order later.
     */
    public function convertEnquiryToOrder(Request $request, Enquiry $enquiry): JsonResponse
    {
        if ($enquiry->status !== 'quoted') {
            throw ValidationException::withMessages([
                'status' => 'Only quoted enquiries can be converted to an order.',
            ]);
        }

        if (Order::where('enquiry_id', $enquiry->id)->exists()) {
            throw ValidationException::withMessages([
                'enquiry' => 'This enquiry has already been converted to an order.',
            ]);
        }

        $data = $request->validate([
            'currency'     => ['required', 'in:UGX,USD'],
            'agreed_total' => ['required', 'integer', 'min:1'],
            'tier'         => ['nullable', 'in:car,suv,lighttruck,heavytruck'],
            'quantity'     => ['nullable', 'integer', 'min:1', 'max:50'],
            'product_name' => ['nullable', 'string', 'max:255'],
            'notes'        => ['nullable', 'string', 'max:2000'],
        ]);

        $qty = (int) ($data['quantity'] ?? 1);

        $productName = $data['product_name']
            ?? trim(($enquiry->product_category ?: 'Custom') . ' order — converted from enquiry #' . $enquiry->id);

        $productSlug = $data['tier']
            ? "fet-{$data['tier']}"
            : strtolower(($enquiry->product_category ?: 'general')) . '-custom';

        $order = DB::transaction(function () use ($enquiry, $data, $qty, $productName, $productSlug) {
            $order = Order::create([
                'reference'        => OrderController::makeReference(),
                'enquiry_id'       => $enquiry->id,
                'customer_name'    => $enquiry->name,
                'customer_email'   => $enquiry->email,
                'customer_phone'   => $enquiry->phone,
                'currency'         => $data['currency'],
                'subtotal'         => $data['agreed_total'],
                'total'            => $data['agreed_total'],
                'status'           => 'pending',
                'payment_method'   => 'cash',
                'payment_status'   => 'pending',
                'shipping_address' => [],
                'notes'            => $data['notes'] ?? null,
            ]);

            $order->items()->create([
                'product_name'         => $productName,
                'product_slug'         => $productSlug,
                'options'              => [],
                'quantity'             => $qty,
                'unit_price_ugx'       => $data['currency'] === 'UGX' ? intdiv($data['agreed_total'], $qty) : 0,
                'unit_price_usd_cents' => $data['currency'] === 'USD' ? intdiv($data['agreed_total'], $qty) : 0,
                'line_total'           => $data['agreed_total'],
            ]);

            $enquiry->update(['status' => 'converted']);

            return $order;
        });

        $order->load('items');

        try {
            app(DocumentService::class)->generateReservationConfirmation($order);
        } catch (\Throwable $e) {
            Log::warning('Failed to generate reservation confirmation PDF', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);
        }

        return response()->json([
            'data'    => $order,
            'message' => 'Enquiry converted to order.',
        ], 201);
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
        $query = Order::with(['items', 'user:id,name,email', 'documents'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(25));
    }

    /**
     * Update an order's status, payment status, tracking, and installation
     * details. Each field is updatable independently (PATCH semantics) so
     * staff can mark payment received without also touching shipping status,
     * and vice versa.
     *
     * Crossing into `delivered` for the first time stamps `delivered_at` and
     * generates the installation certificate; payment_status flipping to
     * `paid` generates the payment receipt. Both PDFs are generated
     * synchronously and failures are logged, never blocking the response.
     */
    public function updateOrder(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'status'                       => ['sometimes', 'required', 'in:pending,processing,shipped,delivered,complete,cancelled'],
            'payment_status'               => ['sometimes', 'required', 'in:pending,partial,paid'],
            'preferred_installation_date'  => ['sometimes', 'nullable', 'date'],
            'installation_location'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'tracking_number'              => ['sometimes', 'nullable', 'string', 'max:255'],
            'notes'                        => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $wasPaid      = $order->payment_status === 'paid';
        $wasDelivered = $order->delivered_at !== null;

        if (($data['status'] ?? null) === 'delivered' && ! $wasDelivered) {
            $data['delivered_at'] = now();
        }

        $order->update($data);

        $docs = app(DocumentService::class);

        if (($data['payment_status'] ?? null) === 'paid' && ! $wasPaid) {
            try {
                $docs->generatePaymentReceipt($order);
            } catch (\Throwable $e) {
                Log::warning('Failed to generate payment receipt PDF', [
                    'order_id' => $order->id,
                    'error'    => $e->getMessage(),
                ]);
            }
        }

        if (isset($data['delivered_at'])) {
            try {
                $docs->generateInstallationCertificate($order);
            } catch (\Throwable $e) {
                Log::warning('Failed to generate installation certificate PDF', [
                    'order_id' => $order->id,
                    'error'    => $e->getMessage(),
                ]);
            }
        }

        return response()->json(['data' => $order->load(['items', 'documents'])]);
    }
}
