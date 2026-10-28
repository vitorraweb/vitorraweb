<?php

namespace App\Services;

use App\Models\FinanceReceipt;
use App\Support\SecureFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

/**
 * Finance's receipt inbox: every receipt is kept, encrypted, the moment it
 * arrives (from a phone scan or an upload), and read by AI afterwards so a
 * slow read never holds up the person scanning. Recording it as an expense
 * is a separate step, done by Finance with the read values pre-filled.
 */
class ReceiptInbox
{
    public const MIMES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'application/pdf' => 'pdf'];

    public function __construct(private ReceiptExtractionService $reader) {}

    public function store(UploadedFile $file, ?int $userId, string $source): FinanceReceipt
    {
        $mime = $file->getMimeType() ?: $file->getClientMimeType();

        return FinanceReceipt::create([
            'path'          => SecureFile::storeUpload($file, 'finance/receipts'),
            'original_name' => mb_substr($file->getClientOriginalName() ?: 'receipt.'.(self::MIMES[$mime] ?? 'jpg'), 0, 250),
            'mime'          => $mime,
            'size'          => (int) $file->getSize(),
            'source'        => $source,
            'uploaded_by'   => $userId,
            'status'        => 'new',
        ]);
    }

    /** AI-read one receipt (no-op without a key). Returns true if fields were filled. */
    public function read(FinanceReceipt $r): bool
    {
        $r->forceFill(['read_attempts' => $r->read_attempts + 1])->save();
        $bytes = SecureFile::read($r->path);
        $out = $bytes !== null ? $this->reader->extractBytes($bytes, $r->mime) : null;

        $r->forceFill(['read_at' => now()])->save();
        if (! $out) {
            return false;
        }

        // Never overwrite what Finance has typed in.
        $r->fill(array_filter([
            'vendor'       => $r->vendor ?: ($out['vendor'] ?: null),
            'receipt_date' => $r->receipt_date ?: $out['date'],
            'currency'     => $r->currency ?: $out['currency'],
            'amount_minor' => $r->amount_minor ?: ($out['amount_minor'] ?: null),
            'vat_rate'     => $r->vat_rate ?? $out['vat_rate'],
            'description'  => $r->description ?: ($out['description'] ?: null),
        ], fn ($v) => $v !== null))->save();

        return true;
    }

    /** Read whatever is waiting (a few per run; each read can take seconds). */
    public function readPending(int $limit = 5): int
    {
        if (! config('services.anthropic.key')) {
            return 0;
        }
        $n = 0;
        FinanceReceipt::whereNull('read_at')->where('read_attempts', '<', 3)->oldest()->limit($limit)->get()
            ->each(function (FinanceReceipt $r) use (&$n) {
                try {
                    $n += $this->read($r) ? 1 : 0;
                } catch (\Throwable $e) {
                    Log::warning('Receipt read failed: '.$e->getMessage());
                }
            });

        return $n;
    }
}
