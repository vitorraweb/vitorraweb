Your reservation is confirmed — Vitorra Holdings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi {{ $order->customer_name }},

Thank you for reserving a Fuel Eco Tech unit. No payment is required online —
payment is made in cash before installation (or on collection). Our team
will be in touch shortly to confirm payment and arrange a suitable
installation date.

Order reference:  {{ $order->reference }}
Placed:           {{ $order->created_at->format('d M Y, H:i') }} (EAT)

Your reservation
──────────────────────────────────────
@foreach ($order->items as $item)
{{ $item->quantity }} × {{ $item->product_name }}
    {{ $order->money($order->unitPrice($item)) }} each — {{ $order->money($item->line_total) }}
@endforeach
──────────────────────────────────────
Total due (cash, before installation):  {{ $order->money($order->total) }}

@if ($order->notes)
Your notes: {{ $order->notes }}

@endif
A reservation confirmation PDF is attached to your account documents once you
register or log in to the customer portal with this email address.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Questions? Just reply to this email and our team will help.

Vitorra Holdings Limited · vitorra.org
