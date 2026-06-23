@php
    $money = function ($currency, $amount) {
        if ($amount === null) {
            return null;
        }
        return $currency === 'UGX'
            ? 'UGX '.number_format($amount)
            : ($currency === 'USD' ? '$' : '€').number_format($amount / 100, 2);
    };
    $staleVehicles = collect($vehicles)->where('stale', true);
    $dataVehicles  = collect($vehicles)->where('has_data', true);
@endphp
Hello {{ $customerName }},

@if ($hasData)
Here is the fuel your Fuel Eco Tech {{ $fleet['vehicles'] > 1 ? 'fleet is' : 'device is' }} saving you, measured from the readings recorded so far.

@if ($fleet['avg_reduction_pct'] !== null)
FUEL REDUCTION: {{ number_format($fleet['avg_reduction_pct'], 1) }}% on average across {{ $fleet['vehicles_with_data'] }} vehicle(s) with data.
@endif
@foreach ($fleet['by_currency'] as $currency => $totals)
@if ($totals['money_saved'] > 0)
MONEY SAVED ({{ $currency }}): {{ $money($currency, $totals['money_saved']) }}
@endif
@endforeach
FUEL SAVED: {{ number_format($fleet['total_litres_saved'], 1) }} litres
CO2 AVOIDED: {{ number_format($fleet['total_co2_saved_kg'], 1) }} kg

@if ($fleet['vehicles'] > 1)
By vehicle:
@foreach ($dataVehicles as $v)
- {{ $v['label'] }} ({{ $v['reference'] }}): {{ number_format($v['reduction_pct'], 1) }}% less fuel{{ $v['money_saved'] !== null ? ', '.$money($v['currency'], $v['money_saved']).' saved' : '' }}
@endforeach
@endif
@else
Your Fuel Eco Tech savings aren't measurable yet — we just need a few fuel readings to get started.
@endif

@if ($reminder)
KEEP IT UP TO DATE
@foreach ($staleVehicles as $v)
- {{ $v['label'] }} ({{ $v['reference'] }}): {{ $v['last_reading'] ? 'last reading '.\Illuminate\Support\Carbon::parse($v['last_reading'])->format('j M Y') : 'no readings yet' }}
@endforeach

Log each fill-up (odometer + litres) and your savings update automatically.
@endif

See the full picture and log a fill-up here:
https://vitorra.org/account/fet

These figures are measured from your own vehicle readings.

Thank you,
Vitorra Holdings Limited
