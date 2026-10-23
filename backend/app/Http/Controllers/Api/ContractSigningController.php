<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContractDeclined;
use App\Mail\ContractSigned;
use App\Models\Contract;
use App\Support\Audit;
use App\Support\ContractDocument;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpFoundation\Response;

/**
 * The client's side of a contract: the one-time link emailed to them. No
 * login; the link is the credential. It works for a limited time (48 hours
 * by default), for one signature, and stops working the moment staff edit the
 * contract, send a fresh link, or void it.
 */
class ContractSigningController extends Controller
{
    private const GONE = 'This signing link has expired, has already been used, or has been replaced by a newer one. Please contact your Vitorra representative for a new link.';

    public function show(Request $request, string $token): JsonResponse
    {
        $c = $this->resolve($token);
        if (! $c) {
            return response()->json(['message' => self::GONE], 410);
        }
        if (! $c->viewed_at) {
            $c->forceFill(['viewed_at' => now(), 'status' => 'viewed'])->save();
            Audit::log('contract.viewed', "Client opened contract {$c->number} ({$request->ip()})", $c);
        }

        return response()->json(['data' => [
            'number'     => $c->number,
            'buyer_name' => $c->buyer_name,
            'expires_at' => $c->sign_expires_at->toIso8601String(),
            'document'   => ContractDocument::build($c),
        ]]);
    }

    public function pdf(string $token): Response
    {
        $c = $this->resolve($token);

        return $c
            ? ContractDocument::pdf($c)->download($c->number.'.pdf')
            : response()->json(['message' => self::GONE], 410);
    }

    public function sign(Request $request, string $token): JsonResponse
    {
        $data = $request->validate([
            'signer_name'     => ['required', 'string', 'max:120'],
            'signer_position' => ['nullable', 'string', 'max:120'],
            'signature_type'  => ['required', 'in:drawn,typed'],
            'signature_data'  => ['required', 'string', 'max:400000'],
            'agree'           => ['accepted'],
        ]);
        if ($data['signature_type'] === 'drawn' && ! preg_match('#^data:image/png;base64,[A-Za-z0-9+/=]+$#', $data['signature_data'])) {
            return response()->json(['message' => 'Please draw your signature again.'], 422);
        }
        if ($data['signature_type'] === 'typed' && mb_strlen(trim($data['signature_data'])) > 120) {
            return response()->json(['message' => 'The typed signature is too long.'], 422);
        }

        $contract = DB::transaction(function () use ($token, $data, $request) {
            $c = Contract::where('sign_token_hash', hash('sha256', $token))->lockForUpdate()->first();
            if (! $c || ! $c->isAwaitingSignature()) {
                return null;
            }
            $c->forceFill([
                'status'          => 'signed',
                'signed_at'       => now(),
                'signer_name'     => trim($data['signer_name']),
                'signer_position' => filled($data['signer_position'] ?? null) ? trim($data['signer_position']) : null,
                'signature_type'  => $data['signature_type'],
                'signature_data'  => $data['signature_type'] === 'typed' ? trim($data['signature_data']) : $data['signature_data'],
                'signer_ip'       => $request->ip(),
                'signer_agent'    => mb_substr((string) $request->userAgent(), 0, 500),
                'signed_hash'     => ContractDocument::hash(ContractDocument::build($c)),
                'sign_token_hash' => null, // one signature per link
            ])->save();

            return $c;
        });
        if (! $contract) {
            return response()->json(['message' => self::GONE], 410);
        }

        $pdf = ContractDocument::pdf($contract)->output();
        $contract->forceFill(['signed_pdf_path' => SecureFile::storeContent($pdf, $contract->number.'-signed.pdf', 'contracts')])->save();
        Audit::log('contract.signed', "Contract {$contract->number} signed by {$contract->signer_name} ({$contract->signer_ip})", $contract);

        // The signature is already recorded; a mail outage must not show the
        // client an error for a contract they have in fact signed.
        try {
            $mail = Mail::to($contract->buyer_email);
            if ($cc = $contract->sender?->email) {
                $mail->cc($cc);
            }
            $mail->send(new ContractSigned($contract, $pdf));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['data' => [
            'status'    => 'signed',
            'number'    => $contract->number,
            'signed_at' => $contract->signed_at->toIso8601String(),
            'email'     => $contract->buyer_email,
        ]]);
    }

    public function decline(Request $request, string $token): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:1000']]);
        $c = $this->resolve($token);
        if (! $c) {
            return response()->json(['message' => self::GONE], 410);
        }
        $c->forceFill([
            'status'          => 'declined',
            'declined_at'     => now(),
            'decline_reason'  => $data['reason'] ?? null,
            'sign_token_hash' => null,
        ])->save();
        Audit::log('contract.declined', "Client declined contract {$c->number}", $c);

        try {
            Mail::to($c->sender?->email ?: config('mail.from.address'))->send(new ContractDeclined($c));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['data' => ['status' => 'declined']]);
    }

    private function resolve(string $token): ?Contract
    {
        $c = Contract::findBySigningToken($token);

        return $c && $c->isAwaitingSignature() ? $c : null;
    }
}
