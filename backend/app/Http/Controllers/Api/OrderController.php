<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewOrder;
use App\Mail\OrderConfirmation;
use App\Mail\ReservationConfirmation;
use App\Models\Order;
use App\Models\Product;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Place an order (guest checkout).
     *
     * Prices are ALWAYS recomputed from the database — the client only sends
     * which product + variant + quantity it wants, never a price. The order is
     * created as `pending` / unpaid; payment is handled separately once a
     * gateway is live.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_name'           => ['required', 'string', 'max:255'],
            'customer_email'          => ['required', 'email', 'max:255'],
            'customer_phone'          => ['nullable', 'string', 'max:50'],
            'currency'                => ['required', 'in:UGX,USD'],
            'notes'                   => ['nullable', 'string', 'max:2000'],

            'shipping_address'           => ['required', 'array'],
            'shipping_address.line1'     => ['required', 'string', 'max:255'],
            'shipping_address.line2'     => ['nullable', 'string', 'max:255'],
            'shipping_address.city'      => ['required', 'string', 'max:120'],
            'shipping_address.country'   => ['required', 'string', 'max:120'],
            'shipping_address.postcode'  => ['nullable', 'string', 'max:30'],

            'items'                   => ['required', 'array', 'min:1'],
            'items.*.slug'            => ['required', 'string'],
            'items.*.quantity'        => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.grind'           => ['nullable', 'string', 'max:120'],
            'items.*.weight'          => ['nullable', 'string', 'max:60'],
        ]);

        $currency = $data['currency'];

        // Load every requested product in one query (published only).
        $slugs    = collect($data['items'])->pluck('slug')->unique();
        $products = Product::published()->whereIn('slug', $slugs)->get()->keyBy('slug');

        $missing = $slugs->reject(fn ($slug) => $products->has($slug));
        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Some items are no longer available: ' . $missing->implode(', '),
            ]);
        }

        // Build the line items, recomputing every price from the catalogue.
        $lineItems = [];
        $subtotal  = 0;

        foreach ($data['items'] as $item) {
            $product = $products[$item['slug']];
            $qty     = (int) $item['quantity'];

            $priceUgx   = (int) ($product->price_ugx ?? 0);
            $priceCents = (int) ($product->price_usd_cents ?? 0);

            // Reject if the chosen currency has no price set for this product.
            if (($currency === 'UGX' && $priceUgx <= 0) || ($currency === 'USD' && $priceCents <= 0)) {
                throw ValidationException::withMessages([
                    'items' => "“{$product->name}” isn’t available in {$currency}.",
                ]);
            }

            // Stock is checked but NOT decremented here — that happens on payment
            // confirmation so abandoned/unpaid orders don't lock inventory.
            if (! is_null($product->stock_quantity) && $product->stock_quantity < $qty) {
                throw ValidationException::withMessages([
                    'items' => "“{$product->name}” is out of stock.",
                ]);
            }

            $unitInCurrency = $currency === 'USD' ? $priceCents : $priceUgx;
            $lineTotal      = $unitInCurrency * $qty;
            $subtotal      += $lineTotal;

            $lineItems[] = [
                'product_id'           => $product->id,
                'product_name'         => $product->name,
                'product_slug'         => $product->slug,
                'options'              => array_filter([
                    'grind'  => $item['grind']  ?? null,
                    'weight' => $item['weight'] ?? ($product->meta['weight'] ?? null),
                ]),
                'quantity'             => $qty,
                'unit_price_ugx'       => $priceUgx,
                'unit_price_usd_cents' => $priceCents,
                'line_total'           => $lineTotal,
            ];
        }

        // Persist header + items atomically.
        $order = DB::transaction(function () use ($data, $currency, $subtotal, $lineItems, $request) {
            $order = Order::create([
                'reference'        => self::makeReference(),
                'user_id'          => $request->user()?->id,
                'customer_name'    => $data['customer_name'],
                'customer_email'   => $data['customer_email'],
                'customer_phone'   => $data['customer_phone'] ?? null,
                'currency'         => $currency,
                'subtotal'         => $subtotal,
                'total'            => $subtotal, // delivery/tax confirmed by the team
                'status'           => 'pending',
                'payment_status'   => 'pending',
                'shipping_address' => $data['shipping_address'],
                'notes'            => $data['notes'] ?? null,
            ]);

            $order->items()->createMany($lineItems);

            return $order;
        });

        $order->load('items');

        // Notify customer + team. The team mail sets reply-to → customer in its
        // own envelope (see NewOrder), so hitting Reply reaches the buyer.
        Mail::to($order->customer_email)->send(new OrderConfirmation($order));
        Mail::to(config('mail.team_address'))->send(new NewOrder($order));

        return response()->json([
            'data'    => $order,
            'message' => 'Order received. A confirmation has been emailed to you.',
        ], 201);
    }

    /**
     * "Reserve Now, Pay Cash" — self-serve FET reservation.
     *
     * Creates a real order against the FET catalogue with no online payment:
     * the cash is paid in person before installation or collection. The
     * price is recomputed server-side from the catalogue, exactly as in
     * store().
     */
    public function reserve(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_name'  => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'tier'           => ['required', 'in:car,suv,lighttruck,heavytruck'],
            'quantity'       => ['nullable', 'integer', 'min:1', 'max:50'],
            'currency'       => ['nullable', 'in:UGX,USD'],
            'notes'          => ['nullable', 'string', 'max:2000'],
        ]);

        $currency = $data['currency'] ?? 'UGX';
        $qty      = (int) ($data['quantity'] ?? 1);
        $slug     = "fet-{$data['tier']}";

        $product = Product::published()->where('category', 'FET')->where('slug', $slug)->first();

        if (! $product) {
            throw ValidationException::withMessages([
                'tier' => 'This FET model is not available right now.',
            ]);
        }

        $priceUgx   = (int) ($product->price_ugx ?? 0);
        $priceCents = (int) ($product->price_usd_cents ?? 0);

        if (($currency === 'UGX' && $priceUgx <= 0) || ($currency === 'USD' && $priceCents <= 0)) {
            throw ValidationException::withMessages([
                'tier' => "This FET model isn't available in {$currency}.",
            ]);
        }

        $unitInCurrency = $currency === 'USD' ? $priceCents : $priceUgx;
        $lineTotal      = $unitInCurrency * $qty;

        $order = DB::transaction(function () use ($data, $currency, $qty, $lineTotal, $product, $request) {
            $order = Order::create([
                'reference'        => self::makeReference(),
                'user_id'          => $request->user()?->id,
                'customer_name'    => $data['customer_name'],
                'customer_email'   => $data['customer_email'],
                'customer_phone'   => $data['customer_phone'] ?? null,
                'currency'         => $currency,
                'subtotal'         => $lineTotal,
                'total'            => $lineTotal,
                'status'           => 'pending',
                'payment_method'   => 'cash',
                'payment_status'   => 'pending',
                'shipping_address' => [],
                'notes'            => $data['notes'] ?? null,
            ]);

            $order->items()->create([
                'product_id'           => $product->id,
                'product_name'         => $product->name,
                'product_slug'         => $product->slug,
                'options'              => [],
                'quantity'             => $qty,
                'unit_price_ugx'       => $product->price_ugx,
                'unit_price_usd_cents' => $product->price_usd_cents,
                'line_total'           => $lineTotal,
            ]);

            return $order;
        });

        $order->load('items');

        try {
            app(DocumentService::class)->generateReservationConfirmation($order);
        } catch (\Throwable $e) {
            Log::warning('Failed to generate reservation confirmation PDF', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
            ]);
        }

        Mail::to($order->customer_email)->send(new ReservationConfirmation($order));
        Mail::to(config('mail.team_address'))->send(new NewOrder($order));

        return response()->json([
            'data'    => $order,
            'message' => 'Reservation received. Our team will be in touch to arrange cash payment before installation.',
        ], 201);
    }

    /** Public order lookup by reference — used by the confirmation page. */
    public function show(string $reference): JsonResponse
    {
        $order = Order::with('items')->where('reference', $reference)->firstOrFail();

        return response()->json(['data' => $order]);
    }

    /** Generate a unique, human-friendly order reference (e.g. VIT-7Q3K8M2A). */
    public static function makeReference(): string
    {
        do {
            $reference = 'VIT-' . Str::upper(Str::random(8));
        } while (Order::where('reference', $reference)->exists());

        return $reference;
    }
}
