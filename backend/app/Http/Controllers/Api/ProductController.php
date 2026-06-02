<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /** All published products (optional ?category=COFFEE filter) */
    public function index(Request $request): JsonResponse
    {
        $query = Product::published()->latest();

        if ($request->filled('category')) {
            $query->category($request->category);
        }

        return response()->json(['data' => $query->get()]);
    }

    /** Single published product by slug */
    public function show(string $slug): JsonResponse
    {
        $product = Product::published()->where('slug', $slug)->firstOrFail();

        return response()->json(['data' => $product]);
    }

    /** Coffee products only (used by the coffee shop) */
    public function coffee(): JsonResponse
    {
        $products = Product::published()->category('COFFEE')->latest()->get();

        return response()->json(['data' => $products]);
    }
}
