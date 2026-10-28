<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinanceAccount;
use App\Models\FinanceCategory;
use App\Models\FinanceReceipt;
use App\Models\FinanceTransaction;
use App\Models\ReceiptScanLink;
use App\Services\Marketing\EmailDesigner;
use App\Services\ReceiptInbox;
use App\Support\Audit;
use App\Support\SecureFile;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Accounting → Receipts: the inbox of scanned and uploaded receipts, the
 * "scan with your phone" link (QR code), and turning a receipt into a draft
 * expense with the AI-read values pre-filled.
 */
class FinanceReceiptController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'new');
        $rows = FinanceReceipt::query()->with('uploader:id,name')
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest()->limit(200)->get();

        return response()->json([
            'data'   => $rows->map(fn (FinanceReceipt $r) => $this->shape($r)),
            'counts' => FinanceReceipt::selectRaw('status, COUNT(*) n')->groupBy('status')->pluck('n', 'status'),
            'reader' => (bool) config('services.anthropic.key'),
        ]);
    }

    /** Upload one or more receipts from the computer. */
    public function upload(Request $request, ReceiptInbox $inbox): JsonResponse
    {
        $request->validate(['files' => ['required', 'array', 'min:1', 'max:20'], 'files.*' => ['file', 'mimes:jpg,jpeg,png,pdf', 'max:10240']]);
        $stored = collect($request->file('files'))->map(fn ($f) => $inbox->store($f, $request->user()->id, 'upload'));

        return response()->json(['data' => $stored->map(fn ($r) => $this->shape($r)), 'message' => $stored->count().' receipt(s) added. They are read automatically within a minute.'], 201);
    }

    /** The receipt image/PDF, decrypted, for the inbox preview. */
    public function file(FinanceReceipt $receipt): Response
    {
        $bytes = SecureFile::read($receipt->path);
        abort_if($bytes === null, 404);

        return response($bytes, 200, [
            'Content-Type'        => $receipt->mime,
            'Content-Disposition' => 'inline; filename="receipt-'.$receipt->id.'.'.(ReceiptInbox::MIMES[$receipt->mime] ?? 'bin').'"',
            'Cache-Control'       => 'private, no-store',
        ]);
    }

    public function update(Request $request, FinanceReceipt $receipt): JsonResponse
    {
        $receipt->update($request->validate([
            'vendor'       => ['nullable', 'string', 'max:255'],
            'receipt_date' => ['nullable', 'date'],
            'currency'     => ['nullable', Rule::in(['UGX', 'USD', 'EUR'])],
            'amount_minor' => ['nullable', 'integer', 'min:0'],
            'vat_rate'     => ['nullable', 'integer', 'min:0', 'max:100'],
            'description'  => ['nullable', 'string', 'max:500'],
            'note'         => ['nullable', 'string', 'max:500'],
            'status'       => ['sometimes', Rule::in(['new', 'archived'])],
        ]));

        return response()->json(['data' => $this->shape($receipt->fresh('uploader'))]);
    }

    /** Read it with AI now, instead of waiting for the background run. */
    public function read(FinanceReceipt $receipt, ReceiptInbox $inbox): JsonResponse
    {
        if (! config('services.anthropic.key')) {
            return response()->json(['message' => 'Automatic reading is not switched on (no AI key on the server). Type the details in.'], 422);
        }
        $ok = $inbox->read($receipt);

        return response()->json(['data' => $this->shape($receipt->fresh('uploader')), 'message' => $ok ? 'Receipt read.' : 'The receipt could not be read. Type the details in.']);
    }

    /** Book the receipt as a draft expense (senior finance approves it as usual). */
    public function record(Request $request, FinanceReceipt $receipt): JsonResponse
    {
        if ($receipt->status === 'recorded') {
            return response()->json(['message' => 'This receipt is already recorded.'], 422);
        }
        $data = $request->validate([
            'finance_account_id'  => ['required', Rule::exists('finance_accounts', 'id')],
            'finance_category_id' => ['required', Rule::exists('finance_categories', 'id')],
            'sector'              => ['nullable', Rule::in(FinanceTransaction::SECTORS)],
            'amount'              => ['required', 'integer', 'min:1'],
            'vat_rate'            => ['nullable', 'integer', 'min:0', 'max:100'],
            'occurred_on'         => ['required', 'date'],
            'description'         => ['nullable', 'string', 'max:500'],
        ]);

        $account = FinanceAccount::findOrFail($data['finance_account_id']);
        if ($receipt->currency && $receipt->currency !== $account->currency) {
            return response()->json(['message' => "This receipt is in {$receipt->currency}. Choose a {$receipt->currency} account."], 422);
        }
        if (FinanceCategory::find($data['finance_category_id'])?->kind !== 'expense') {
            return response()->json(['message' => 'Choose an expense category.'], 422);
        }

        $vatRate = (int) ($data['vat_rate'] ?? 0);
        $tx = FinanceTransaction::create([
            'type'                => 'expense',
            'finance_account_id'  => $account->id,
            'finance_category_id' => $data['finance_category_id'],
            'sector'              => $data['sector'] ?? null,
            'currency'            => $account->currency,
            'amount'              => $data['amount'],
            'vat_rate'            => $vatRate,
            'vat_amount'          => $vatRate > 0 ? (int) round($data['amount'] * $vatRate / (100 + $vatRate)) : 0,
            'occurred_on'         => $data['occurred_on'],
            'description'         => $data['description'] ?? $receipt->vendor,
            'reference'           => 'Receipt #'.$receipt->id,
            'status'              => 'draft',
            'recorded_by'         => $request->user()->id,
            // The same encrypted file: the transaction's receipt download works as usual.
            'receipt_path'        => $receipt->path,
        ]);
        $receipt->update(['status' => 'recorded', 'finance_transaction_id' => $tx->id]);
        Audit::log('receipt.recorded', "Receipt #{$receipt->id} recorded as a draft expense", $tx);

        return response()->json(['data' => $this->shape($receipt->fresh('uploader')), 'message' => 'Recorded as a draft expense. A senior finance officer approves it in Transactions.']);
    }

    /** A 30-minute link (and QR code) a phone can scan receipts into without signing in. */
    public function scanLink(Request $request): JsonResponse
    {
        $token = Str::random(40);
        $link = ReceiptScanLink::create([
            'token_hash' => hash('sha256', $token),
            'user_id'    => $request->user()->id,
            'expires_at' => now()->addMinutes(30),
        ]);
        $url = EmailDesigner::siteUrl('/scan/'.$token);
        $svg = (new Writer(new ImageRenderer(new RendererStyle(240, 1), new SvgImageBackEnd)))->writeString($url);
        Audit::log('receipt.scan_link', 'Phone scan link created (30 minutes)', $link);

        return response()->json(['data' => [
            'url'        => $url,
            'qr'         => 'data:image/svg+xml;base64,'.base64_encode($svg),
            'expires_at' => $link->expires_at->toIso8601String(),
        ]]);
    }

    private function shape(FinanceReceipt $r): array
    {
        return [
            ...$r->only(['id', 'original_name', 'mime', 'size', 'source', 'status', 'vendor', 'receipt_date', 'currency', 'amount_minor', 'vat_rate', 'description', 'note', 'finance_transaction_id']),
            'uploaded_by' => $r->uploader?->name,
            'created_at'  => $r->created_at?->toIso8601String(),
            'read'        => $r->read_at !== null,
        ];
    }
}
