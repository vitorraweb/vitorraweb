@extends('documents._layout', ['docTitle' => 'Proven Savings Certificate'])

@php
    $money = function ($amount) use ($installation) {
        if ($amount === null) return null;
        return $installation->currency === 'UGX'
            ? 'UGX ' . number_format($amount)
            : ($installation->currency === 'USD' ? '$' : '€') . number_format($amount / 100, 2);
    };
@endphp

@section('content')
    <table class="meta">
        <tr><td class="label">Certificate Ref</td><td>{{ $installation->reference }}</td></tr>
        <tr><td class="label">Customer</td><td>{{ $installation->customer_name }}@if($installation->company) — {{ $installation->company }}@endif</td></tr>
        <tr><td class="label">Vehicle</td><td>{{ $installation->vehicle ?? $tierLabel }} ({{ $tierLabel }})</td></tr>
        <tr><td class="label">Device</td><td>{{ $installation->device_model }}</td></tr>
        @if ($installation->installed_on)
            <tr><td class="label">Installed</td><td>{{ $installation->installed_on->format('d M Y') }}</td></tr>
        @endif
    </table>

    @if ($summary['has_enough_data'])
        <table class="items">
            <thead>
                <tr><th>Measured result</th><th class="amount">Value</th></tr>
            </thead>
            <tbody>
                <tr><td>Fuel use before FET (baseline)</td><td class="amount">{{ number_format($summary['baseline_l_per_100'], 2) }} l/100km</td></tr>
                <tr><td>Fuel use with FET (measured)</td><td class="amount">{{ number_format($summary['measured_l_per_100'], 2) }} l/100km</td></tr>
                <tr><td><strong>Fuel reduction</strong></td><td class="amount"><strong>{{ number_format($summary['reduction_pct'], 1) }}%</strong></td></tr>
                <tr><td>Distance measured over</td><td class="amount">{{ number_format($summary['distance_km']) }} km</td></tr>
                <tr><td>Fuel saved</td><td class="amount">{{ number_format($summary['litres_saved'], 1) }} litres</td></tr>
                @if ($summary['money_saved'] !== null)
                    <tr><td>Money saved</td><td class="amount">{{ $money($summary['money_saved']) }}</td></tr>
                @endif
                <tr><td>CO₂ avoided</td><td class="amount">{{ number_format($summary['co2_saved_kg'], 1) }} kg</td></tr>
            </tbody>
        </table>

        <div class="notice">
            <strong>Measured on this vehicle</strong> from {{ $summary['after_log_count'] }} fuel
            reading(s) recorded after installation, compared against a
            {{ $summary['baseline_source'] }} baseline. The independent CTI GmbH field test
            (VW T5, Germany) measured a {{ number_format($summary['verified_pct'], 1) }}% reduction;
            the figures above are this vehicle's own results. Vitorra's Fuel Eco Tech range is
            independently certified (ISO 9001:2015, ISO 14001:2015, ISO 27001, Zurich Product
            Liability, AVL Technologies, qm-solutions GmbH).
        </div>
    @else
        <div class="notice">
            Savings for {{ $installation->reference }} will appear here once enough fuel readings
            have been recorded after installation (at least two odometer readings spanning real
            distance). Keep logging each fill-up to build the measured result.
        </div>
    @endif
@endsection
