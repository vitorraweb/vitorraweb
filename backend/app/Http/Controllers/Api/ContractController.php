<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContractSigningRequest;
use App\Models\Contract;
use App\Models\Quotation;
use App\Support\Audit;
use App\Support\ContractDocument;
use App\Support\ContractTemplate;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Staff side of sales contracts: fill one in (starting from Finance's FET
 * template, or from a quotation), preview the exact PDF, and send it to the
 * client with a one-time signing link (ContractSigningController is the
 * client's side). Signed or void contracts are locked.
 */
class ContractController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Contract::query()->latest('id');
        if ($request->filled('status')) {
            $request->query('status') === 'expired'
                ? $q->whereIn('status', ['sent', 'viewed'])->where('sign_expires_at', '<', now())
                : $q->where('status', $request->query('status'));
        }
        if ($request->filled('q')) {
            $term = '%'.addcslashes((string) $request->query('q'), '%_\\').'%';
            $q->where(fn ($w) => $w->where('number', 'like', $term)->orWhere('buyer_name', 'like', $term)->orWhere('buyer_email', 'like', $term));
        }

        return response()->json(['data' => $q->limit(500)->get()->map(fn (Contract $c) => $this->shape($c))]);
    }

    /** Starting values for a new contract: the template, plus a quotation's customer and price if given. */
    public function defaults(Request $request): JsonResponse
    {
        $data = ContractTemplate::defaults();
        $data['template_clauses'] = ContractTemplate::clauses();

        if ($request->filled('quotation') && ($q = Quotation::with('items')->find($request->integer('quotation')))) {
            $first = $q->items->first();
            $qty = (int) ($q->items->count() === 1 ? $first->quantity : 1);
            $data = array_merge($data, array_filter([
                'quotation_id'       => $q->id,
                'buyer_name'         => $q->customer_name,
                'buyer_email'        => $q->customer_email,
                'buyer_phone'        => $q->customer_phone,
                'buyer_address'      => $q->customer_address,
                'buyer_registration' => $q->customer_tax_id,
                'buyer_contact'      => $q->customer_attention,
                'currency'           => $q->currency,
                'quantity'           => $qty ?: 1,
                'model_number'       => $first?->name,
                'unit_cost'          => $qty ? (int) round($q->total / $qty) : null,
                'total_amount'       => $q->total,
                'price_note'         => $q->tax_rate > 0 ? "Inclusive of {$q->tax_rate}% VAT" : null,
            ], fn ($v) => $v !== null && $v !== ''));
        }

        return response()->json(['data' => $data]);
    }

    public function show(Contract $contract): JsonResponse
    {
        return response()->json(['data' => $this->shape($contract->load('quotation:id,number', 'sender:id,name'), full: true)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $contract = Contract::create($data + [
            'number'       => Contract::nextNumber(),
            'status'       => 'draft',
            'quotation_id' => $request->integer('quotation_id') ?: null,
            'created_by'   => $request->user()->id,
        ]);

        return response()->json(['data' => $this->shape($contract, full: true)], 201);
    }

    /**
     * Editing a contract that is out for signature cancels its link: the
     * client must never be able to sign wording that has since changed.
     */
    public function update(Request $request, Contract $contract): JsonResponse
    {
        if ($contract->isLocked()) {
            return response()->json(['message' => 'A signed or void contract can no longer be changed.'], 422);
        }
        $data = $this->validated($request);
        $wasOut = in_array($contract->status, ['sent', 'viewed'], true);

        $contract->fill($data);
        if ($contract->status !== 'draft') {
            $contract->forceFill(['status' => 'draft', 'sign_token_hash' => null, 'sign_expires_at' => null]);
        }
        $contract->save();

        return response()->json([
            'data'    => $this->shape($contract->fresh(['quotation:id,number', 'sender:id,name']), full: true),
            'message' => $wasOut ? 'Saved. The signing link that was sent no longer works; send the contract again.' : 'Saved.',
        ]);
    }

    public function preview(Request $request): Response
    {
        $data = $this->validated($request, preview: true);
        $contract = new Contract($data + ['status' => 'draft']);
        $contract->number = $request->string('number')->toString() ?: 'DRAFT';

        return response(ContractDocument::pdf($contract)->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="preview.pdf"',
            'Cache-Control'       => 'no-store',
        ]);
    }

    /** The signed copy once signed (as kept at signature), otherwise the current draft. */
    public function pdf(Contract $contract): Response
    {
        if ($contract->status === 'signed' && $contract->signed_pdf_path) {
            Audit::log('contract.signed_pdf', "Opened signed contract {$contract->number}", $contract);

            return SecureFile::download($contract->signed_pdf_path, $contract->number.'-signed.pdf');
        }

        return ContractDocument::pdf($contract)->download($contract->number.'.pdf');
    }

    /** Email the client the contract and a fresh one-time signing link. */
    public function send(Request $request, Contract $contract): JsonResponse
    {
        if ($contract->isLocked()) {
            return response()->json(['message' => 'A signed or void contract cannot be sent.'], 422);
        }
        $missing = collect(['buyer_name' => 'the client\'s name', 'buyer_email' => 'the client\'s email', 'total_amount' => 'the total amount'])
            ->filter(fn ($_, $f) => blank($contract->{$f}))->values();
        if ($missing->isNotEmpty()) {
            return response()->json(['message' => 'Add '.$missing->implode(', ').' before sending.'], 422);
        }

        $hours = (int) config('contracts.link_hours', 48);
        $token = $contract->issueSigningToken($hours);
        $contract->forceFill([
            'status'         => 'sent',
            'sent_at'        => now(),
            'sent_by'        => $request->user()->id,
            'sent_to'        => $contract->buyer_email,
            'viewed_at'      => null,
            'declined_at'    => null,
            'decline_reason' => null,
        ])->save();
        $url = $contract->signingUrl($token);

        Mail::to($contract->buyer_email)->send(new ContractSigningRequest($contract, $url, ContractDocument::pdf($contract)->output(), $request->user()));
        Audit::log('contract.sent', "Sent contract {$contract->number} to {$contract->buyer_email} for signature", $contract);

        return response()->json([
            'data'       => $this->shape($contract->fresh(['quotation:id,number', 'sender:id,name']), full: true),
            // Shown once, for staff who also want to share it on WhatsApp. Only its hash is stored.
            'sign_url'   => $url,
            'expires_at' => $contract->sign_expires_at->toIso8601String(),
        ]);
    }

    public function void(Contract $contract): JsonResponse
    {
        if ($contract->status === 'signed') {
            return response()->json(['message' => 'A signed contract cannot be voided here.'], 422);
        }
        $contract->forceFill(['status' => 'void', 'voided_at' => now(), 'sign_token_hash' => null, 'sign_expires_at' => null])->save();
        Audit::log('contract.voided', "Voided contract {$contract->number}", $contract);

        return response()->json(['data' => $this->shape($contract->fresh(['quotation:id,number', 'sender:id,name']), full: true)]);
    }

    /* ── helpers ─────────────────────────────────────────────────────────── */

    private function validated(Request $request, bool $preview = false): array
    {
        $s = ['nullable', 'string', 'max:255'];
        $money = ['nullable', 'integer', 'min:0', 'max:1000000000000'];

        $data = $request->validate([
            'agreement_date'        => ['nullable', 'date'],
            'seller_company'        => $s,
            'seller_address'        => ['nullable', 'string', 'max:1000'],
            'seller_name'           => $s,
            'seller_title'          => $s,
            'buyer_name'            => [$preview ? 'nullable' : 'required', 'string', 'max:255'],
            'buyer_registration'    => $s,
            'buyer_address'         => ['nullable', 'string', 'max:1000'],
            'buyer_contact'         => $s,
            'buyer_phone'           => ['nullable', 'string', 'max:64'],
            'buyer_email'           => ['nullable', 'email', 'max:255'],
            'quantity'              => ['nullable', 'integer', 'min:1', 'max:100000'],
            'model_number'          => $s,
            'serial_number'         => $s,
            'vehicle_description'   => ['nullable', 'string', 'max:2000'],
            'registration_numbers'  => $s,
            'chassis_numbers'       => $s,
            'engine_numbers'        => $s,
            'installation_location' => $s,
            'installation_date'     => ['nullable', 'date'],
            'currency'              => ['nullable', Rule::in(['UGX', 'USD', 'EUR'])],
            'unit_cost'             => $money,
            'total_amount'          => $money,
            'price_note'            => $s,
            'payment_option'        => ['nullable', Rule::in(['advance', 'instalment'])],
            'instalment_amount'     => $money,
            'bank_account_name'     => $s,
            'bank_name'             => $s,
            'bank_account_number'   => ['nullable', 'string', 'max:64'],
            'mobile_money'          => ['nullable', 'string', 'max:64'],
            'clauses'               => ['required', 'array', 'min:1', 'max:40'],
            'clauses.*.key'         => ['required', 'string', 'max:40'],
            'clauses.*.title'       => ['required', 'string', 'max:200'],
            'clauses.*.body'        => ['nullable', 'string', 'max:8000'],
        ]);

        $data['clauses'] = array_values(array_map(fn ($c) => [
            'key' => $c['key'], 'title' => $c['title'], 'body' => (string) ($c['body'] ?? ''),
        ], $data['clauses']));
        $data['currency'] ??= 'UGX';
        $data['payment_option'] ??= 'advance';
        $data['quantity'] ??= 1;
        $data['buyer_name'] ??= '';

        return collect($data)->only(Contract::EDITABLE)->all();
    }

    private function shape(Contract $c, bool $full = false): array
    {
        $out = [
            'id'                    => $c->id,
            'number'                => $c->number,
            'status'                => $c->status,
            'is_expired'            => $c->isExpired(),
            'is_awaiting_signature' => $c->isAwaitingSignature(),
            'buyer_name'            => $c->buyer_name,
            'buyer_email'           => $c->buyer_email,
            'currency'              => $c->currency,
            'total_amount'          => $c->total_amount,
            'model_number'          => $c->model_number,
            'sent_at'               => $c->sent_at?->toIso8601String(),
            'sign_expires_at'       => $c->sign_expires_at?->toIso8601String(),
            'signed_at'             => $c->signed_at?->toIso8601String(),
            'created_at'            => $c->created_at?->toIso8601String(),
        ];
        if ($full) {
            $out += $c->only(Contract::EDITABLE) + [
                'agreement_date'    => $c->agreement_date?->toDateString(),
                'installation_date' => $c->installation_date?->toDateString(),
                'quotation'         => $c->quotation ? ['id' => $c->quotation->id, 'number' => $c->quotation->number] : null,
                'sent_by'           => $c->sender?->name,
                'sent_to'           => $c->sent_to,
                'viewed_at'         => $c->viewed_at?->toIso8601String(),
                'signer_name'       => $c->signer_name,
                'signer_position'   => $c->signer_position,
                'signature_type'    => $c->signature_type,
                'signer_ip'         => $c->signer_ip,
                'signed_hash'       => $c->signed_hash,
                'declined_at'       => $c->declined_at?->toIso8601String(),
                'decline_reason'    => $c->decline_reason,
                'template_clauses'  => ContractTemplate::clauses(),
            ];
        }

        return $out;
    }
}
