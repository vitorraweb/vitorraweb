<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Encryption at rest for confidential private-disk uploads (HR files, medical
 * notes, supplier documents, CVs, finance receipts). Files are written as
 * `VENC1:` + an encrypted payload, so a leaked disk/backup reveals nothing
 * without the app key. Reads transparently decrypt, and fall back to returning
 * legacy plaintext files (no prefix) so existing uploads keep working.
 */
class SecureFile
{
    private const MARKER = 'VENC1:';

    /** Encrypt an uploaded file and store it under $dir; returns the stored path. */
    public static function storeUpload(UploadedFile $file, string $dir, string $disk = 'local', ?string $name = null): string
    {
        $name = $name ?: $file->hashName();              // keeps the extension
        $path = trim($dir, '/').'/'.$name;
        $plain = (string) file_get_contents($file->getRealPath());

        Storage::disk($disk)->put($path, self::MARKER.Crypt::encryptString($plain));

        return $path;
    }

    /** Encrypt raw bytes (e.g. an inbound-email attachment) and store under $dir; returns the stored path. */
    public static function storeContent(string $content, string $filename, string $dir, string $disk = 'local'): string
    {
        $path = trim($dir, '/').'/'.Str::random(32).'_'.$filename;

        Storage::disk($disk)->put($path, self::MARKER.Crypt::encryptString($content));

        return $path;
    }

    /** Encrypt a file already on disk, in place (no-op if already encrypted). */
    public static function encryptExisting(string $path, string $disk = 'local'): void
    {
        $raw = Storage::disk($disk)->get($path);
        if ($raw === null || str_starts_with($raw, self::MARKER)) {
            return;
        }
        Storage::disk($disk)->put($path, self::MARKER.Crypt::encryptString($raw));
    }

    /** Decrypted contents (or legacy plaintext); null if the file is missing. */
    public static function read(string $path, string $disk = 'local'): ?string
    {
        if (! Storage::disk($disk)->exists($path)) {
            return null;
        }
        $raw = Storage::disk($disk)->get($path);
        if ($raw !== null && str_starts_with($raw, self::MARKER)) {
            return Crypt::decryptString(substr($raw, strlen(self::MARKER)));
        }

        return $raw;
    }

    /** A browser attachment download of a (decrypted) private file. */
    public static function download(string $path, string $downloadName, string $disk = 'local'): Response
    {
        $contents = self::read($path, $disk);
        if ($contents === null) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        return response($contents, 200, [
            'Content-Type'        => self::mimeFor($downloadName),
            'Content-Disposition' => 'attachment; filename="'.addslashes($downloadName).'"; filename*=UTF-8\'\''.rawurlencode($downloadName),
            'Content-Length'      => (string) strlen($contents),
            'Cache-Control'       => 'no-store',
        ]);
    }

    private static function mimeFor(string $name): string
    {
        return match (strtolower(pathinfo($name, PATHINFO_EXTENSION))) {
            'pdf'         => 'application/pdf',
            'png'         => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'doc'         => 'application/msword',
            'docx'        => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            default       => 'application/octet-stream',
        };
    }
}
