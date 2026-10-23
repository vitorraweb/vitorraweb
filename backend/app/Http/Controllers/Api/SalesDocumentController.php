<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Internal sales documents (contract templates and the like) for the sales
 * team to read and work from. Kept in resources/, never on the public disk:
 * they carry the company's bank details and terms still under review.
 * Each file ships as a PDF to read in the browser and the original Word
 * file to fill in.
 */
class SalesDocumentController extends Controller
{
    /** key => metadata. Files live in resources/sales-documents/{key}.{pdf,docx}. */
    private const DOCUMENTS = [
        'fet-sales-agreement' => [
            'title'       => 'FET Module Sales and Installation Agreement',
            'product'     => 'FET',
            'description' => 'Contract template for selling and installing a Fuel Eco Tech module: price, payment terms, ownership until paid, installation, warranty, returns and liability.',
            'status'      => 'Draft for review',
            'added'       => '2026-10-23',
        ],
    ];

    private const MIME = [
        'pdf'  => 'application/pdf',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    public function index(): JsonResponse
    {
        return response()->json(['data' => collect(self::DOCUMENTS)
            ->map(fn ($d, $key) => ['key' => $key] + $d + ['formats' => array_keys(array_filter(self::MIME, fn ($_, $f) => is_file($this->path($key, $f)), ARRAY_FILTER_USE_BOTH))])
            ->values()]);
    }

    public function file(string $key, string $format): BinaryFileResponse|JsonResponse
    {
        if (! isset(self::DOCUMENTS[$key], self::MIME[$format]) || ! is_file($path = $this->path($key, $format))) {
            return response()->json(['message' => 'Document not found.'], 404);
        }
        Audit::log('sales_document.'.($format === 'pdf' ? 'view' : 'download'), self::DOCUMENTS[$key]['title']." ({$format})");

        $name = $key.'.'.$format;
        $headers = ['Content-Type' => self::MIME[$format], 'Cache-Control' => 'no-store'];

        return $format === 'pdf'
            ? response()->file($path, $headers + ['Content-Disposition' => 'inline; filename="'.$name.'"'])
            : response()->download($path, $name, $headers);
    }

    private function path(string $key, string $format): string
    {
        return resource_path("sales-documents/{$key}.{$format}");
    }
}
