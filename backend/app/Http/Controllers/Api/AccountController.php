<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Enquiry;
use App\Models\FetInstallation;
use App\Models\Order;
use App\Services\FetSavingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AccountController extends Controller
{
    public function __construct(private readonly FetSavingsService $savings)
    {
    }

    /* ── FET installations (proven savings) ────────────────────────────────── */

    /** The signed-in customer's FET installations, each with measured savings. */
    public function fetInstallations(Request $request): JsonResponse
    {
        $controller = app(FetInstallationController::class);

        $data = $this->fetQuery($request)->with('fuelLogs')->latest()->get()
            ->map(fn (FetInstallation $i) => $controller->shape($i, staff: false));

        return response()->json([
            'data'  => $data,
            'fleet' => $this->savings->fleetFromSummaries($data->pluck('savings')->all()),
        ]);
    }

    public function fetInstallation(Request $request, string $reference): JsonResponse
    {
        $installation = $this->fetQuery($request)->where('reference', $reference)->firstOrFail();

        return response()->json(['data' => app(FetInstallationController::class)->shape($installation, staff: false)]);
    }

    /** Customer self-logs a fill-up (always an 'after' reading). */
    public function fetLog(Request $request, string $reference): JsonResponse
    {
        $installation = $this->fetQuery($request)->where('reference', $reference)->firstOrFail();

        $data = app(FetInstallationController::class)->validateLog($request, staff: false);
        $data['source'] = 'customer';
        $installation->fuelLogs()->create($data);

        return response()->json(['data' => app(FetInstallationController::class)->shape($installation->fresh(), staff: false)], 201);
    }

    public function fetCertificate(Request $request, string $reference): Response
    {
        $installation = $this->fetQuery($request)->where('reference', $reference)->firstOrFail();

        return FetInstallationController::renderCertificate($installation, $this->savings);
    }

    /** Installations belonging to the signed-in customer (matched by email). */
    private function fetQuery(Request $request)
    {
        return FetInstallation::whereRaw('lower(customer_email) = ?', [$this->email($request)]);
    }

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
        $order = Order::with(['items', 'installmentPlan.payments'])
            ->whereRaw('lower(customer_email) = ?', [$this->email($request)])
            ->where('reference', $reference)
            ->firstOrFail();

        $data = $order->toArray();
        $data['installment_plan'] = $this->customerPlan($order);

        return response()->json(['data' => $data]);
    }

    /** Read-only payment-plan view for the customer (schedule, paid, balance). */
    private function customerPlan(Order $order): ?array
    {
        $plan = $order->installmentPlan;
        if (! $plan) {
            return null;
        }

        $paid = (int) $plan->payments->whereNotNull('paid_at')->sum('amount');

        return [
            'total'   => (int) $order->total,
            'paid'    => $paid,
            'balance' => max(0, (int) $order->total - $paid),
            'payments' => $plan->payments->map(fn ($p) => [
                'label'    => $p->label,
                'amount'   => $p->amount,
                'due_date' => optional($p->due_date)->toDateString(),
                'paid'     => $p->paid_at !== null,
                'paid_at'  => optional($p->paid_at)->toDateString(),
            ])->values()->all(),
        ];
    }

    /**
     * Customer-set installation preferences. Scoped by email like the other
     * account endpoints; only meaningful while the order hasn't shipped yet,
     * but no status check here — staff can still adjust it later in admin.
     */
    public function updateInstallation(Request $request, string $reference): JsonResponse
    {
        $order = Order::whereRaw('lower(customer_email) = ?', [$this->email($request)])
            ->where('reference', $reference)
            ->firstOrFail();

        $data = $request->validate([
            'preferred_installation_date' => ['required', 'date', 'after:today'],
            'installation_location'       => ['nullable', 'string', 'max:255'],
        ]);

        $order->update($data);

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

    /**
     * Documents center — generated order documents (reservation
     * confirmations, payment receipts, installation certificates) plus the
     * static product literature available to every customer.
     */
    public function documents(Request $request): JsonResponse
    {
        $email = $this->email($request);

        $orderDocuments = Document::whereHas('order', fn ($q) => $q->whereRaw('lower(customer_email) = ?', [$email]))
            ->with('order:id,reference')
            ->latest('generated_at')
            ->get()
            ->map(fn (Document $doc) => [
                'name'            => $doc->title,
                'url'             => $doc->url,
                'type'            => 'PDF',
                'order_reference' => $doc->order?->reference,
                'generated_at'    => $doc->generated_at,
            ]);

        return response()->json(['data' => [
            'order_documents'    => $orderDocuments,
            'product_literature' => [
                ['name' => 'Fuel Eco Tech — Vehicle Application Guide', 'url' => '/downloads/vitorra-fet-application-guide.pdf', 'type' => 'PDF'],
                ['name' => 'Fuel Eco Tech — Product Datasheet', 'url' => '/downloads/vitorra-fet-datasheet.pdf', 'type' => 'PDF'],
            ],
        ]]);
    }

    private function email(Request $request): string
    {
        return mb_strtolower(trim($request->user()->email));
    }
}
