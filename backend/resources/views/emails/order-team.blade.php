@php
    $a = $order->shipping_address ?? [];
    $cityCountry = trim(($a['city'] ?? '') . ', ' . ($a['country'] ?? ''), ', ');
@endphp
New order placed on vitorra.org
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference:  {{ $order->reference }}
Placed:     {{ $order->created_at->format('d M Y, H:i') }} (EAT)
Status:     {{ ucfirst($order->status) }} · Payment {{ $order->payment_status }}

Customer
──────────────────────────────────────
Name:   {{ $order->customer_name }}
Email:  {{ $order->customer_email }}
Phone:  {{ $order->customer_phone ?: '—' }}

Items
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
Total:     {{ $order->money($order->total) }} ({{ $order->currency }})

Deliver to
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
Customer notes: {{ $order->notes }}

@endif
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply to this email to reach {{ $order->customer_name }} directly.
Manage this order in the admin panel.
