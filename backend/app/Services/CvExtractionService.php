<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Extracts structured applicant details from an uploaded CV using Claude.
 *
 * The PDF is sent as a native document block with a JSON-schema structured
 * output, so the model returns guaranteed-valid JSON we can use to pre-fill
 * the application form. Best-effort only: if the API key is unset, the file
 * isn't a PDF, or anything fails, it returns null and the applicant fills the
 * form manually.
 */
class CvExtractionService
{
    private const ENDPOINT = 'https://api.anthropic.com/v1/messages';

    /** JSON schema for the fields we extract (structured outputs). */
    private const SCHEMA = [
        'type' => 'object',
        'properties' => [
            'name'             => ['type' => 'string'],
            'email'            => ['type' => 'string'],
            'phone'            => ['type' => 'string'],
            'location'         => ['type' => 'string'],
            'years_experience' => ['type' => 'integer'],
            'skills'           => ['type' => 'array', 'items' => ['type' => 'string']],
            'education'        => ['type' => 'array', 'items' => ['type' => 'string']],
            'last_role'        => ['type' => 'string'],
        ],
        'required' => ['name', 'email', 'phone', 'location', 'years_experience', 'skills', 'education', 'last_role'],
        'additionalProperties' => false,
    ];

    /**
     * @param  string  $path  Path on the private (local) disk to a PDF CV.
     * @return array<string,mixed>|null  Parsed fields, or null if extraction is unavailable/failed.
     */
    public function extract(string $path): ?array
    {
        $key = config('services.anthropic.key');
        if (! $key) {
            return null; // feature disabled — manual entry
        }
        if (! str_ends_with(strtolower($path), '.pdf')) {
            return null; // only PDFs are sent to the model
        }
        if (! Storage::disk('local')->exists($path)) {
            return null;
        }

        try {
            $base64 = base64_encode(Storage::disk('local')->get($path));

            $res = Http::withHeaders([
                'x-api-key'         => $key,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(60)->post(self::ENDPOINT, [
                'model'      => config('services.anthropic.cv_model', 'claude-haiku-4-5'),
                'max_tokens' => 2048,
                'messages'   => [[
                    'role'    => 'user',
                    'content' => [
                        ['type' => 'document', 'source' => ['type' => 'base64', 'media_type' => 'application/pdf', 'data' => $base64]],
                        ['type' => 'text', 'text' => 'Extract the applicant\'s details from this CV/resume. Use an empty string, 0, or an empty array for anything not stated — do not invent values. "years_experience" is total professional years as a whole number; "last_role" is their most recent job title; "skills" and "education" are short lists.'],
                    ],
                ]],
                'output_config' => ['format' => ['type' => 'json_schema', 'schema' => self::SCHEMA]],
            ]);

            if (! $res->successful()) {
                Log::warning('CV extraction failed', ['status' => $res->status(), 'body' => $res->json()]);
                return null;
            }

            foreach ($res->json('content', []) as $block) {
                if (($block['type'] ?? null) === 'text') {
                    $data = json_decode($block['text'], true);
                    return is_array($data) ? $this->normalise($data) : null;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('CV extraction error: '.$e->getMessage());
        }

        return null;
    }

    /** Coerce the model output into clean, expected types. */
    private function normalise(array $d): array
    {
        $strList = fn ($v) => collect(is_array($v) ? $v : [])
            ->map(fn ($x) => trim((string) $x))->filter()->take(20)->values()->all();

        return [
            'name'             => trim((string) ($d['name'] ?? '')),
            'email'            => trim((string) ($d['email'] ?? '')),
            'phone'            => trim((string) ($d['phone'] ?? '')),
            'location'         => trim((string) ($d['location'] ?? '')),
            'years_experience' => (int) ($d['years_experience'] ?? 0),
            'skills'           => $strList($d['skills'] ?? []),
            'education'        => $strList($d['education'] ?? []),
            'last_role'        => trim((string) ($d['last_role'] ?? '')),
        ];
    }
}
