<?php

namespace App\Http\Controllers\Api;

use App\Contracts\PaymentGateway;
use App\Http\Controllers\Controller;
use App\Models\Communication;
use App\Models\Document;
use App\Models\Enquiry;
use App\Models\FetInstallation;
use App\Models\InstallmentPayment;
use App\Models\Order;
use App\Notifications\CustomerReplied;
use App\Rules\PhoneNumber;
use App\Services\FetSavingsService;
use App\Support\ContactOwner;
use App\Support\Phone;
use App\Support\SecureFile;
use App\Support\SignatureHtml;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification as NotificationFacade;
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

        // Customers can pay a part online only when a live gateway is configured
        // and the plan currency is one Flutterwave settles (UGX/USD).
        $onlineEnabled = config('payments.driver') === 'flutterwave'
            && in_array($order->currency, ['UGX', 'USD'], true);

        return [
            'total'          => (int) $order->total,
            'paid'           => $paid,
            'balance'        => max(0, (int) $order->total - $paid),
            'online_enabled' => $onlineEnabled,
            'payments' => $plan->payments->map(fn ($p) => [
                'id'       => $p->id,
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

    /* ── Messages — the customer's reply thread with Vitorra staff ─────────── */

    /** Every communication (staff reply or the customer's own reply) on this account's email. */
    public function communications(Request $request): JsonResponse
    {
        $email = $this->email($request);

        $items = Communication::whereRaw('lower(email) = ?', [$email])->orderBy('created_at')->get()
            ->map(fn (Communication $c) => $this->shapeCommunication($c));

        return response()->json([
            'data'          => $items,
            'unread_count'  => Communication::whereRaw('lower(email) = ?', [$email])
                ->where('direction', 'outbound')->whereNull('customer_read_at')->count(),
        ]);
    }

    /** The customer replies from their own account — no email infrastructure needed for this. */
    public function sendCommunication(Request $request): JsonResponse
    {
        $data = $request->validate([
            // Generous ceiling: the reply box accepts rich pasted content
            // (formatting, an inline image), which runs well past a plain
            // paragraph before SignatureHtml::process() sanitizes it below.
            'body'            => ['required', 'string', 'max:50000'],
            'attachments.*'   => ['file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:8192'],
        ]);

        $email = $this->email($request);
        $user  = $request->user();

        $body = trim($data['body']);
        $clean = SignatureHtml::process($body, $user->id, 'communications');
        abort_if($clean === '', 422, 'Message cannot be empty.');

        $communication = Communication::create([
            'email'     => $email,
            'direction' => 'inbound',
            'channel'   => 'portal',
            'body'      => $clean,
            'sent_by'   => null,
        ]);

        $communication->update(['attachments' => $this->storeAttachments($request, $email)]);

        NotificationFacade::send(ContactOwner::resolve($email), new CustomerReplied($communication));

        return response()->json(['data' => $this->shapeCommunication($communication)], 201);
    }

    /** Marks every staff reply on this account as read (clears the Messages tab's unread badge). */
    public function markCommunicationsRead(Request $request): JsonResponse
    {
        Communication::whereRaw('lower(email) = ?', [$this->email($request)])
            ->where('direction', 'outbound')->whereNull('customer_read_at')
            ->update(['customer_read_at' => now()]);

        return response()->json(['message' => 'Marked as read.']);
    }

    public function downloadCommunicationAttachment(Request $request, Communication $communication, int $index): Response
    {
        abort_unless(mb_strtolower(trim($communication->email)) === $this->email($request), 403);

        $attachment = ($communication->attachments ?? [])[$index] ?? null;
        abort_if($attachment === null, 404);

        return SecureFile::download($attachment['path'], $attachment['name']);
    }

    /** @return array<int, array{name:string,size:int,mime:string}> */
    private function storeAttachments(Request $request, string $email): array
    {
        $files = $request->file('attachments', []);
        if (empty($files)) {
            return [];
        }

        $dir = 'communications/'.sha1($email);

        return collect($files)->map(fn ($file) => [
            'name' => $file->getClientOriginalName(),
            'path' => SecureFile::storeUpload($file, $dir),
            'size' => $file->getSize(),
            'mime' => $file->getClientMimeType(),
        ])->values()->all();
    }

    private function shapeCommunication(Communication $c): array
    {
        return [
            'id'         => $c->id,
            'direction'  => $c->direction,
            'channel'    => $c->channel,
            'subject'    => $c->subject,
            'body'       => $c->body,
            'attachments' => collect($c->attachments ?? [])->map(fn ($a, $i) => [
                'index' => $i, 'name' => $a['name'], 'size' => $a['size'],
            ])->values()->all(),
            'created_at' => $c->created_at,
        ];
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
            'phone'   => ['sometimes', 'nullable', 'string', 'max:50', new PhoneNumber()],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        if (array_key_exists('phone', $data)) {
            $data['phone'] = Phone::e164($data['phone']);
        }

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

    /* ── Pay an installment online (B2B pay-in-parts) ──────────────────────── */

    /** Start a Flutterwave payment for one due installment of the customer's order. */
    public function payInstallmentOnline(Request $request, PaymentGateway $gateway, InstallmentPayment $installment): JsonResponse
    {
        $this->authorizeInstallment($request, $installment);

        if ($installment->payableIsPaid()) {
            return response()->json(['message' => 'This instalment is already paid.'], 422);
        }

        $order = $installment->plan->order;
        if (config('payments.driver') !== 'flutterwave' || ! in_array($order->currency, ['UGX', 'USD'], true)) {
            return response()->json(['message' => 'Online payment isn’t available for this plan. Please pay another way.'], 422);
        }

        $result = $gateway->initiate($installment);

        if (($result['status'] ?? null) !== 'redirect') {
            return response()->json(['message' => 'Online payment isn’t available right now. Please try again later.'], 422);
        }

        return response()->json(['data' => $result, 'message' => $result['message'] ?? 'Payment initiated.']);
    }

    /** Reconcile any online-initiated, still-pending instalments for an order. */
    public function installmentStatus(Request $request, PaymentGateway $gateway, string $reference): JsonResponse
    {
        $order = Order::with('installmentPlan.payments')
            ->whereRaw('lower(customer_email) = ?', [$this->email($request)])
            ->where('reference', $reference)
            ->firstOrFail();

        $plan = $order->installmentPlan;
        if ($plan) {
            foreach ($plan->payments as $payment) {
                if (! $payment->payableIsPaid() && $payment->payment_reference) {
                    $gateway->verify($payment->payableReference());
                }
            }
        }

        return response()->json(['data' => $this->customerPlan($order->fresh('installmentPlan.payments'))]);
    }

    /** Guard: the installment must belong to an order owned by this customer. */
    private function authorizeInstallment(Request $request, InstallmentPayment $installment): void
    {
        $email = mb_strtolower(trim((string) $installment->plan->order->customer_email));
        abort_unless($email === $this->email($request), 403);
    }

    private function email(Request $request): string
    {
        return mb_strtolower(trim($request->user()->email));
    }
}
