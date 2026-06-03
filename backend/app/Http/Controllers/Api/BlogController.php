<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 12), 50);

        $posts = BlogPost::published()
            ->with('author:id,name')
            ->select(['id', 'user_id', 'title', 'slug', 'excerpt', 'cover_image', 'published_at', 'seo_title', 'seo_description'])
            ->latest('published_at')
            ->paginate($perPage);

        return response()->json([
            'data' => $posts->items(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page'    => $posts->lastPage(),
                'per_page'     => $posts->perPage(),
                'total'        => $posts->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $post = BlogPost::published()
            ->with('author:id,name')
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json(['data' => $post]);
    }
}
