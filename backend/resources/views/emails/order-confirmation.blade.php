@php
    $a = $order->shipping_address ?? [];
    $cityCountry = trim(($a['city'] ?? '') . ', ' . ($a['country'] ?? ''), ', ');
@endphp
Thank you for your order — Vitorra Coffee
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi {{ $order->customer_name }},

We've received your order. Our team will confirm stock, delivery, and payment
with you shortly — typically within 24 hours.

Order reference:  {{ $order->reference }}
Placed:           {{ $order->created_at->format('d M Y, H:i') }} (EAT)

Your items
──────────────────────────────────────
@foreach ($order->items as $item)
@php
    $opts = array_filter([$item->options['weight'] ?? null, $item->options['grind'] ?? null]);
    $suffix = $opts ? ' (' . implode(', ', $opts) . ')' : '';
@endphp
{{ $item->quantity }} × {{ $item->product_name }}{{ $suffix }}
    {{ $order->money($order->unitPrice($item)) }} each — {{ $order->money($item->line_total) }}
@endforeach
──────────────────────────────────────
Subtotal:  {{ $order->money($order->subtotal) }}
Delivery:  Confirmed on order
Total:     {{ $order->money($order->total) }}

Delivering to
──────────────────────────────────────
{{ $a['line1'] ?? '' }}
@if (!empty($a['line2']))
{{ $a['line2'] }}
@endif
{{ $cityCountry }}
@if (!empty($a['postcode']))
{{ $a['postcode'] }}
@endif

@if ($order->notes)
Your notes: {{ $order->notes }}

@endif
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Questions? Just reply to this email and our team will help.

Vitorra Coffee · The taste of Uganda
