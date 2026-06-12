@extends('documents._layout', ['docTitle' => 'Reservation Confirmation'])

@section('content')
    <table class="meta">
        <tr><td class="label">Order Reference</td><td>{{ $order->reference }}</td></tr>
        <tr><td class="label">Date</td><td>{{ $order->created_at->format('d M Y, H:i') }} (EAT)</td></tr>
        <tr><td class="label">Customer</td><td>{{ $order->customer_name }}</td></tr>
        <tr><td class="label">Email</td><td>{{ $order->customer_email }}</td></tr>
        @if ($order->customer_phone)
            <tr><td class="label">Phone</td><td>{{ $order->customer_phone }}</td></tr>
        @endif
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="amount">Unit price</th>
                <th class="amount">Line total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td class="amount">{{ $order->money($order->unitPrice($item)) }}</td>
                    <td class="amount">{{ $order->money($item->line_total) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr class="grand">
            <td>Total due</td>
            <td class="amount" style="text-align: right;">{{ $order->money($order->total) }}</td>
        </tr>
    </table>

    <div class="notice">
        <strong>Payment:</strong> this unit has been reserved. Payment is collected in cash at
        installation (or on collection). No online payment is required to hold this reservation.
        Our team will be in touch to confirm details and arrange a suitable installation date.
    </div>
@endsection
