<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductAdminController extends Controller
{
    /** All products (published + drafts), newest first, filterable by category. */
    public function index(Request $request): JsonResponse
    {
        $query = Product::latest();

        if ($request->filled('category')) {
            $query->where('category', strtoupper($request->category));
        }

        return response()->json($query->paginate(30));
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(['data' => $product]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->payload($request);
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? '' ?: $data['name']);

        $product = Product::create($data);

        return response()->json(['data' => $product], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $this->payload($request);

        if (! empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $product->id);
        } else {
            unset($data['slug']);
        }

        $product->update($data);

        return response()->json(['data' => $product->fresh()]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted.']);
    }

    /* ── Helpers ──────────────────────────────────────────────────────────── */

    private function payload(Request $request): array
    {
        // Normalise category case so 'coffee' and 'COFFEE' both validate.
        if ($request->filled('category')) {
            $request->merge(['category' => strtoupper((string) $request->input('category'))]);
        }

        $v = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'slug'              => ['nullable', 'string', 'max:255'],
            'category'          => ['required', Rule::in(['FET', 'SEAL', 'COFFEE', 'LOGISTICS'])],
            'description'       => ['nullable', 'string'],
            'price_ugx'         => ['nullable', 'integer', 'min:0'],
            'price_usd'         => ['nullable', 'numeric', 'min:0'],   // dollars → stored as cents
            'stock_quantity'    => ['nullable', 'integer', 'min:0'],
            'is_published'      => ['sometimes', 'boolean'],
            'images'            => ['nullable', 'array'],
            'images.*.url'      => ['required_with:images', 'string', 'max:1000'],
            'images.*.alt'      => ['nullable', 'string', 'max:255'],
            'meta'              => ['nullable', 'array'],
            'meta.tagline'      => ['nullable', 'string', 'max:255'],
            'meta.weight'       => ['nullable', 'string', 'max:255'],
            'meta.roast'        => ['nullable', 'string', 'max:255'],
            'meta.origin'       => ['nullable', 'string', 'max:255'],
            'meta.tasting_notes'=> ['nullable', 'string', 'max:255'],
            'meta.badge'        => ['nullable', 'string', 'max:255'],
        ]);

        $out = [
            'name'            => $v['name'],
            'category'        => strtoupper($v['category']),
            'description'     => $v['description'] ?? null,
            'price_ugx'       => $v['price_ugx'] ?? null,
            'price_usd_cents' => isset($v['price_usd']) ? (int) round($v['price_usd'] * 100) : null,
            'stock_quantity'  => $v['stock_quantity'] ?? null,
            'is_published'    => $v['is_published'] ?? false,
        ];

        if (array_key_exists('slug', $v)) {
            $out['slug'] = $v['slug'];
        }

        if (array_key_exists('images', $v)) {
            $out['images'] = ! empty($v['images'])
                ? array_map(fn ($i) => ['url' => $i['url'], 'alt' => $i['alt'] ?? '', 'type' => 'image'], $v['images'])
                : null;
        }

        if (array_key_exists('meta', $v)) {
            $meta = array_filter($v['meta'] ?? [], fn ($x) => $x !== null && $x !== '');
            $out['meta'] = $meta ?: null;
        }

        return $out;
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'product';
        $original = $slug;
        $i = 2;
        while (
            Product::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$original}-{$i}";
            $i++;
        }
        return $slug;
    }
}
