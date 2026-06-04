<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    /** All media, newest first, optionally filtered by type. */
    public function index(Request $request): JsonResponse
    {
        $query = Media::latest();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->paginate(40));
    }

    /**
     * Upload one or more files to the public disk. Uploads are restricted to
     * authenticated admin/ops staff (this route sits behind the admin guard) —
     * closing the "file storage open to all logged-in users" issue.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'files'   => ['required', 'array', 'max:20'],
            'files.*' => ['file', 'max:20480', 'mimes:jpg,jpeg,png,webp,gif,svg,pdf,mp4,webm'], // 20 MB each
        ]);

        $created = [];

        foreach ($request->file('files') as $file) {
            $ext  = strtolower($file->getClientOriginalExtension() ?: $file->extension());
            $name = Str::random(24) . ($ext ? ".{$ext}" : '');
            $path = $file->storeAs('media', $name, 'public');
            $mime = $file->getMimeType() ?? '';

            $type = str_starts_with($mime, 'image/') ? 'image'
                : (str_starts_with($mime, 'video/') ? 'video' : 'pdf');

            $created[] = Media::create([
                'filename'      => $name,
                'original_name' => $file->getClientOriginalName(),
                'path'          => $path,
                'url'           => Storage::disk('public')->url($path),
                'type'          => $type,
                'mime'          => $mime,
                'size'          => $file->getSize(),
                'uploaded_by'   => $request->user()->name ?? null,
            ]);
        }

        return response()->json(['data' => $created], 201);
    }

    public function destroy(Media $media): JsonResponse
    {
        // Only delete the physical file for actual uploads (stored under media/).
        // Cataloged repo assets (products/…, hero/…) are references — never touch the file.
        if (str_starts_with((string) $media->path, 'media/')) {
            Storage::disk('public')->delete($media->path);
        }
        $media->delete();

        return response()->json(['message' => 'Removed from the library.']);
    }
}
