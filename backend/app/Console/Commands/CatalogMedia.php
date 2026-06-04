<?php

namespace App\Console\Commands;

use App\Models\Media;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CatalogMedia extends Command
{
    protected $signature = 'media:catalog {--path= : Public assets dir to scan (defaults to ../frontend/public)}';

    protected $description = 'Register existing frontend/public media (images, videos, PDFs) into the media library — references only, no copying.';

    /** Extensions we surface, mapped to mime. */
    private array $mimes = [
        'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
        'webp' => 'image/webp', 'gif' => 'image/gif', 'svg' => 'image/svg+xml',
        'mp4' => 'video/mp4', 'webm' => 'video/webm', 'mov' => 'video/quicktime',
        'pdf' => 'application/pdf',
    ];

    public function handle(): int
    {
        $dir = $this->option('path') ?: realpath(base_path('..') . '/frontend/public');

        if (! $dir || ! is_dir($dir)) {
            $this->error('Public assets directory not found: ' . ($dir ?: '(null)'));
            return self::FAILURE;
        }

        $added = 0;
        $skipped = 0;

        // Next.js scaffold defaults — not real brand media.
        $exclude = ['file.svg', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg'];

        foreach (File::allFiles($dir) as $file) {
            $ext = strtolower($file->getExtension());
            if (! isset($this->mimes[$ext]) || in_array($file->getFilename(), $exclude, true)) {
                continue;
            }

            $rel  = str_replace('\\', '/', $file->getRelativePathname()); // e.g. products/coffee/packshot.png
            $url  = '/' . $rel;                                            // served by the frontend (same origin as /admin)
            $mime = $this->mimes[$ext];
            $type = str_starts_with($mime, 'image/') ? 'image' : (str_starts_with($mime, 'video/') ? 'video' : 'pdf');

            // Keyed by URL → re-running never duplicates. path is the frontend-relative
            // path (NOT under media/), so destroy() will not delete the repo file.
            $media = Media::firstOrCreate(['url' => $url], [
                'filename'      => $file->getFilename(),
                'original_name' => $file->getFilename(),
                'path'          => $rel,
                'type'          => $type,
                'mime'          => $mime,
                'size'          => $file->getSize(),
                'uploaded_by'   => 'Library import',
            ]);

            $media->wasRecentlyCreated ? $added++ : $skipped++;
        }

        $this->info("Cataloged {$added} new media files, skipped {$skipped} already present.");
        return self::SUCCESS;
    }
}
