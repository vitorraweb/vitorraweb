Your reservation is confirmed — Vitorra Holdings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi {{ $order->customer_name }},

@if (!empty($online))
Thank you for reserving a Fuel Eco Tech unit. To secure your installation,
please complete your payment securely online (card or Mobile Money — MTN /
Airtel). Once payment is received, our team will be in touch to arrange a
suitable installation date.
@else
Thank you for reserving a Fuel Eco Tech unit. No payment is required online —
payment is made in cash before installation (or on collection). Our team
will be in touch shortly to confirm payment and arrange a suitable
installation date.
@endif

Order reference:  {{ $order->reference }}
Placed:           {{ $order->created_at->format('d M Y, H:i') }} (EAT)

Your reservation
──────────────────────────────────────
@foreach ($order->items as $item)
{{ $item->quantity }} × {{ $item->product_name }}
    {{ $order->money($order->unitPrice($item)) }} each — {{ $order->money($item->line_total) }}
@endforeach
──────────────────────────────────────
@if (!empty($online))
Total to pay:  {{ $order->money($order->total) }}
@else
Total due (cash, before installation):  {{ $order->money($order->total) }}
@endif

@if ($order->notes)
Your notes: {{ $order->notes }}

@endif
A reservation confirmation PDF is attached to your account documents once you
register or log in to the customer portal with this email address.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Questions? Just reply to this email and our team will help.

Vitorra Holdings Limited · vitorra.org
