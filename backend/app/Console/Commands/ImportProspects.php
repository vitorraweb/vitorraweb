<?php

namespace App\Console\Commands;

use App\Models\Prospect;
use Illuminate\Console\Command;

class ImportProspects extends Command
{
    protected $signature = 'prospects:import {file? : Path to the cleaned JSON} {--fresh : Truncate the table first}';

    protected $description = 'Import prospects from a cleaned JSON file (idempotent — only adds new rows).';

    public function handle(): int
    {
        $path = $this->argument('file') ?? database_path('data/fet-prospects.json');

        if (! file_exists($path)) {
            $this->error("File not found: {$path}");
            return self::FAILURE;
        }

        $rows = json_decode(file_get_contents($path), true);
        if (! is_array($rows)) {
            $this->error('Invalid JSON.');
            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            Prospect::truncate();
            $this->warn('Truncated prospects table.');
        }

        $created = 0;
        $skipped = 0;

        foreach ($rows as $r) {
            if (empty($r['name']) || empty($r['category'])) {
                continue;
            }

            // firstOrCreate keeps re-imports safe: existing prospects (and any
            // manual edits to their status/feedback/assignment) are never overwritten.
            $prospect = Prospect::firstOrCreate(
                ['name' => $r['name'], 'category' => $r['category']],
                [
                    'product'         => $r['product'] ?? 'FET',
                    'location'        => $r['location'] ?? null,
                    'phone'           => $r['phone'] ?? null,
                    'email'           => $r['email'] ?? null,
                    'outreach_status' => $r['outreach_status'] ?? 'not_contacted',
                    'feedback'        => $r['feedback'] ?? null,
                    'follow_up'       => $r['follow_up'] ?? null,
                    'flags'           => $r['flags'] ?? null,
                    'source'          => $r['source'] ?? null,
                ]
            );

            $prospect->wasRecentlyCreated ? $created++ : $skipped++;
        }

        $this->info("Imported {$created} new prospects, skipped {$skipped} existing.");
        return self::SUCCESS;
    }
}
