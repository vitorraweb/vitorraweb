@extends('documents._layout', ['docTitle' => 'Payment Receipt'])

@section('content')
    <table class="meta">
        <tr><td class="label">Order Reference</td><td>{{ $order->reference }}</td></tr>
        <tr><td class="label">Date</td><td>{{ now()->format('d M Y, H:i') }} (EAT)</td></tr>
        <tr><td class="label">Customer</td><td>{{ $order->customer_name }}</td></tr>
        <tr><td class="label">Email</td><td>{{ $order->customer_email }}</td></tr>
        <tr><td class="label">Payment Method</td><td>{{ $order->payment_method === 'cash' ? 'Cash' : ucfirst((string) $order->payment_method) }}</td></tr>
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
            <td>Order total</td>
            <td class="amount" style="text-align: right;">{{ $order->money($order->total) }}</td>
        </tr>
    </table>

    @if ($order->payment_status === 'paid')
        <div class="notice">
            <strong>Payment received in full.</strong> Thank you for your purchase — this receipt
            confirms full payment of the order total above.
        </div>
    @else
        <div class="notice">
            <strong>Partial payment recorded.</strong> A payment has been received toward this
            order. The remaining balance will be confirmed with you by our team.
        </div>
    @endif
@endsection
