<?php

namespace App\Console\Commands;

use App\Models\Prospect;
use Illuminate\Console\Command;

class ImportProspects extends Command
{
    protected $signature = 'prospects:import
        {file? : Path to the cleaned JSON (defaults to the product'."'".'s list)}
        {--product=FET : Product line this list belongs to (FET, SEAL)}
        {--fresh : Truncate the table first}';

    protected $description = 'Import prospects from a cleaned JSON file (idempotent — only adds new rows).';

    public function handle(): int
    {
        $product = strtoupper((string) $this->option('product'));

        if (! in_array($product, Prospect::PRODUCTS, true)) {
            $this->error("Unknown product '{$product}'. Expected one of: ".implode(', ', Prospect::PRODUCTS));
            return self::FAILURE;
        }

        $path = $this->argument('file')
            ?? database_path('data/'.strtolower($product).'-prospects.json');

        if (! file_exists($path)) {
            $this->error("File not found: {$path}");
            return self::FAILURE;
        }

        $rows = json_decode(file_get_contents($path), true);
        if (! is_array($rows)) {
            $this->error('Invalid JSON.');
            return self::FAILURE;
        }

        // Scoped to the product — a SEAL reload must never wipe the FET list.
        if ($this->option('fresh')) {
            $deleted = Prospect::where('product', $product)->delete();
            $this->warn("Deleted {$deleted} existing {$product} prospects.");
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
                [
                    'name'     => $r['name'],
                    'category' => $r['category'],
                    'product'  => $r['product'] ?? $product,
                ],
                [
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
