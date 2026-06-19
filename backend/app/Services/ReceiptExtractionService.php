<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Reads a receipt / supplier invoice (PDF or image) with Claude and returns the
 * vendor, date, amount, currency and VAT to pre-fill a transaction — sevDesk's
 * "document capture", reusing the same structured-output pipeline as the CV
 * reader. Best-effort: returns null if the API key is unset or anything fails.
 */
class ReceiptExtractionService
{
    private const ENDPOINT = 'https://api.anthropic.com/v1/messages';

    private const SCHEMA = [
        'type' => 'object',
        'properties' => [
            'vendor'      => ['type' => 'string'],
            'date'        => ['type' => 'string'],          // YYYY-MM-DD or ""
            'currency'    => ['type' => 'string'],          // UGX | USD | EUR or ""
            'amount'      => ['type' => 'number'],          // gross total
            'vat_rate'    => ['type' => 'integer'],         // 0 if unknown
            'description' => ['type' => 'string'],
        ],
        'required' => ['vendor', 'date', 'currency', 'amount', 'vat_rate', 'description'],
        'additionalProperties' => false,
    ];

    /** @return array<string,mixed>|null */
    public function extract(UploadedFile $file): ?array
    {
        $key = config('services.anthropic.key');
        if (! $key) {
            return null;
        }

        $ext = strtolower($file->getClientOriginalExtension());
        $mime = match ($ext) {
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            default => null,
        };
        if (! $mime) {
            return null;
        }

        try {
            $b64 = base64_encode(file_get_contents($file->getRealPath()));
            $doc = $mime === 'application/pdf'
                ? ['type' => 'document', 'source' => ['type' => 'base64', 'media_type' => $mime, 'data' => $b64]]
                : ['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => $mime, 'data' => $b64]];

            $res = Http::withHeaders([
                'x-api-key' => $key, 'anthropic-version' => '2023-06-01', 'content-type' => 'application/json',
            ])->timeout(60)->post(self::ENDPOINT, [
                'model'      => config('services.anthropic.cv_model', 'claude-haiku-4-5'),
                'max_tokens' => 1024,
                'messages'   => [[
                    'role'    => 'user',
                    'content' => [
                        $doc,
                        ['type' => 'text', 'text' => 'Extract the supplier/vendor name, the document date, the total amount (gross), the currency, the VAT rate as a whole-number percent (0 if none shown), and a short description of what was bought. Use empty values if not shown — do not invent.'],
                    ],
                ]],
                'output_config' => ['format' => ['type' => 'json_schema', 'schema' => self::SCHEMA]],
            ]);

            if (! $res->successful()) {
                Log::warning('Receipt extraction failed', ['status' => $res->status()]);
                return null;
            }

            foreach ($res->json('content', []) as $block) {
                if (($block['type'] ?? null) === 'text') {
                    $d = json_decode($block['text'], true);
                    if (! is_array($d)) {
                        return null;
                    }
                    $currency = in_array(strtoupper((string) ($d['currency'] ?? '')), ['UGX', 'USD', 'EUR'], true) ? strtoupper($d['currency']) : null;
                    $amount = (float) ($d['amount'] ?? 0);
                    // Convert to the minor unit our ledger uses (UGX whole, USD/EUR cents).
                    $amountMinor = $currency === 'UGX' || $currency === null ? (int) round($amount) : (int) round($amount * 100);

                    return [
                        'vendor'       => trim((string) ($d['vendor'] ?? '')),
                        'date'         => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) ($d['date'] ?? '')) ? $d['date'] : null,
                        'currency'     => $currency,
                        'amount_minor' => $amountMinor,
                        'vat_rate'     => (int) ($d['vat_rate'] ?? 0),
                        'description'  => trim((string) ($d['description'] ?? '')),
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Receipt extraction error: '.$e->getMessage());
        }

        return null;
    }
}
