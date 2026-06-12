@extends('documents._layout', ['docTitle' => 'Installation Certificate'])

@section('content')
    <table class="meta">
        <tr><td class="label">Order Reference</td><td>{{ $order->reference }}</td></tr>
        <tr><td class="label">Customer</td><td>{{ $order->customer_name }}</td></tr>
        <tr><td class="label">Installation Date</td><td>{{ ($order->delivered_at ?? now())->format('d M Y') }}</td></tr>
        @if ($order->installation_location)
            <tr><td class="label">Location</td><td>{{ $order->installation_location }}</td></tr>
        @endif
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Device / Tier Installed</th>
                <th>Qty</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td>{{ $item->quantity }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="notice">
        <strong>This certifies</strong> that the Fuel Eco Tech device(s) listed above were
        installed for {{ $order->customer_name }} under order {{ $order->reference }}.
        Vitorra Holdings Limited's Fuel Eco Tech range is independently certified
        (ISO 9001:2015, ISO 14001:2015, ISO 27001, Zurich Product Liability, AVL Technologies,
        qm-solutions GmbH). Retain this certificate for warranty and after-sales reference.
    </div>
@endsection
