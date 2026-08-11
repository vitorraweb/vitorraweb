<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FetTrial;
use App\Models\FetTrialImportTemplate;
use App\Services\FetTrialImportService;
use App\Support\Audit;
use App\Support\SecureFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Two-step import of a client's own trip export.
 *
 * Step one reads the file and shows what it found — which sheet, which columns
 * map to what, which rows it could not read, and any question it needs answered
 * (a load column headed "tonnes" holding kilogrammes, say). Nothing is written.
 *
 * Step two commits the mapping the human confirmed. Splitting the two is the
 * point: an import that silently guesses is how a spreadsheet process fails,
 * and moving it into software without the confirmation step would only make the
 * same mistakes faster.
 */
class FetTrialImportController extends Controller
{
    private const DISK = 'local';

    public function __construct(private readonly FetTrialImportService $importer) {}

    /**
     * Upload and inspect. The file is kept (encrypted at rest) so the commit
     * step does not need it re-uploaded, and so any figure can later be traced
     * back to the document it came from.
     */
    public function preview(Request $request, FetTrial $trial): JsonResponse
    {
        $request->validate([
            // `txt` is deliberately allowed: a genuine CSV export is detected as
            // text/plain by PHP, so a stricter rule would reject real client
            // files. The parse step below is the actual gate.
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:8192'],
            'sheet' => ['nullable', 'string', 'max:100'],
        ]);

        $upload = $request->file('file');

        try {
            $inspection = $this->importer->inspect($upload->getRealPath());
            $sheet = $request->input('sheet') ?? ($inspection['sheets'][0]['name'] ?? null);
            $preview = $this->importer->preview($upload->getRealPath(), $sheet);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'That file could not be read. It needs to be an Excel or CSV file exported from the client\'s system.',
                'detail' => $e->getMessage(),
            ], 422);
        }

        // Readable as a spreadsheet, but nothing in it looks like a trip log.
        // Better to say so than to hand back an empty preview that looks fine.
        if (isset($preview['error'])) {
            return response()->json(['message' => $preview['error'], 'sheets' => $inspection['sheets']], 422);
        }

        $handle = SecureFile::storeUpload($upload, "fet-trials/{$trial->id}/imports", self::DISK);

        // A saved mapping for this client means the second upload needs no work.
        $template = FetTrialImportTemplate::where('client_key', FetTrialImportTemplate::clientKey($trial->client_company))->latest()->first();

        return response()->json([
            'handle' => $handle,
            'filename' => $upload->getClientOriginalName(),
            'sheets' => $inspection['sheets'],
            'preview' => $preview,
            'saved_template' => $template ? [
                'id' => $template->id, 'name' => $template->name,
                'sheet_hint' => $template->sheet_hint, 'mapping' => $template->mapping, 'unit_hints' => $template->unit_hints,
            ] : null,
            'fields' => collect(FetTrialImportService::FIELDS)
                ->map(fn ($spec, $key) => ['field' => $key, 'label' => $spec['label'], 'required' => ! empty($spec['required'])])
                ->values(),
        ]);
    }

    /** Re-read an already-uploaded file with a different sheet or mapping. */
    public function repreview(Request $request, FetTrial $trial): JsonResponse
    {
        $data = $request->validate([
            'handle' => ['required', 'string'],
            'sheet' => ['nullable', 'string', 'max:100'],
            'mapping' => ['nullable', 'array'],
            'units' => ['nullable', 'array'],
        ]);

        return $this->withTempFile($trial, $data['handle'], function (string $path) use ($data) {
            return response()->json([
                'preview' => $this->importer->preview($path, $data['sheet'] ?? null, $data['mapping'] ?? null, $data['units'] ?? []),
            ]);
        });
    }

    /** Commit the confirmed mapping. */
    public function commit(Request $request, FetTrial $trial): JsonResponse
    {
        $data = $request->validate([
            'handle' => ['required', 'string'],
            'filename' => ['nullable', 'string', 'max:255'],
            'sheet' => ['required', 'string', 'max:100'],
            'mapping' => ['required', 'array'],
            'mapping.*' => ['nullable', 'string'],
            'units' => ['nullable', 'array'],
            'save_template' => ['nullable', 'boolean'],
            'template_name' => ['nullable', 'string', 'max:150'],
        ]);

        return $this->withTempFile($trial, $data['handle'], function (string $path) use ($trial, $data, $request) {
            try {
                $import = $this->importer->commit($trial, $path, [
                    'sheet' => $data['sheet'],
                    'mapping' => array_filter($data['mapping'], fn ($v) => $v !== null && $v !== ''),
                    'units' => $data['units'] ?? [],
                    'filename' => $data['filename'] ?? basename($path),
                ]);
            } catch (\Throwable $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            $import->update(['source_path' => $data['handle']]);

            if ($data['save_template'] ?? false) {
                FetTrialImportTemplate::create([
                    'name' => $data['template_name'] ?: ($trial->client_company.' export'),
                    'client_key' => FetTrialImportTemplate::clientKey($trial->client_company),
                    'sheet_hint' => $data['sheet'],
                    'mapping' => $data['mapping'],
                    'unit_hints' => $data['units'] ?? null,
                    'created_by' => $request->user()?->id,
                ]);
            }

            Audit::log(
                'fet_trial.imported',
                "{$trial->reference}: imported {$import->rows_imported} trips from {$import->filename}"
                    .($import->rows_rejected ? " ({$import->rows_rejected} rows could not be read)" : ''),
                $trial
            );

            return response()->json([
                'import' => [
                    'id' => $import->id,
                    'filename' => $import->filename,
                    'sheet' => $import->sheet,
                    'rows_total' => $import->rows_total,
                    'rows_imported' => $import->rows_imported,
                    'rows_flagged' => $import->rows_flagged,
                    'rows_rejected' => $import->rows_rejected,
                    'rejections' => $import->rejections,
                ],
                'data' => app(FetTrialController::class)->shape($trial->fresh()),
            ]);
        });
    }

    /** Past imports, for provenance. */
    public function index(FetTrial $trial): JsonResponse
    {
        return response()->json([
            'data' => $trial->imports()->with('importer:id,name')->get()->map(fn ($i) => [
                'id' => $i->id,
                'filename' => $i->filename,
                'sheet' => $i->sheet,
                'rows_total' => $i->rows_total,
                'rows_imported' => $i->rows_imported,
                'rows_flagged' => $i->rows_flagged,
                'rows_rejected' => $i->rows_rejected,
                'rejections' => $i->rejections,
                'imported_by' => $i->importer?->name,
                'created_at' => $i->created_at,
            ]),
        ]);
    }

    /**
     * PhpSpreadsheet needs a real file on disk, but the stored copy is
     * encrypted — so it is decrypted to a temporary file, used, and removed.
     */
    private function withTempFile(FetTrial $trial, string $handle, callable $callback): JsonResponse
    {
        // Handles are server-issued paths; confirm this one belongs to this trial.
        if (! str_starts_with($handle, "fet-trials/{$trial->id}/imports/")) {
            return response()->json(['message' => 'That upload does not belong to this trial.'], 403);
        }

        $contents = SecureFile::read($handle, self::DISK);
        if ($contents === null) {
            return response()->json(['message' => 'That upload has expired. Please upload the file again.'], 404);
        }

        $tmp = tempnam(sys_get_temp_dir(), 'fettrial').'.'.pathinfo($handle, PATHINFO_EXTENSION);
        file_put_contents($tmp, $contents);

        try {
            return $callback($tmp);
        } finally {
            @unlink($tmp);
        }
    }
}
