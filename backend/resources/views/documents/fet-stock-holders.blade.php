@extends('documents._layout', ['docTitle' => 'Where our FET devices are kept'])

{{-- Custody summary for Finance: every person or office holding FET devices
     right now, per model, with the Operations office (the main store) first.
     Each holder signs that the count in their keeping is right. --}}
@section('content')
    @php
        $total = collect($holders)->sum('total');
        $main  = collect($holders)->firstWhere('main', true);
    @endphp
    <table class="meta">
        <tr><td class="label">As at</td><td>{{ $asAt->format('l j F Y, H:i') }}</td></tr>
        <tr><td class="label">Devices held</td><td><strong>{{ $total }}</strong>@if ($main) &nbsp;<span style="color: #999;">({{ $main['total'] }} in the main store, {{ $total - $main['total'] }} with others)</span>@endif</td></tr>
        <tr><td class="label">Printed by</td><td>{{ $printedBy ?? '—' }}</td></tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Kept by / at</th>
                @foreach ($models as $m)
                    <th class="amount">{{ $m['label'] }}</th>
                @endforeach
                <th class="amount">Total</th>
                <th style="width: 70px;">Last movement</th>
                <th style="width: 120px;">Confirmed by holder</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($holders as $h)
                <tr>
                    <td>@if ($h['main'])<strong>{{ $h['holder'] }}</strong><br><span style="font-size: 9px; color: #7A6020;">Main store</span>@else{{ $h['holder'] }}@endif</td>
                    @foreach ($models as $code => $m)
                        <td class="amount" @if ($h['models'][$code] < 0) style="color: #B00020;" @endif>{{ $h['models'][$code] ?: '–' }}</td>
                    @endforeach
                    <td class="amount"><strong>{{ $h['total'] }}</strong></td>
                    <td>{{ $h['last_moved_on'] ? \Carbon\CarbonImmutable::parse($h['last_moved_on'])->format('j M Y') : '—' }}</td>
                    <td style="border-bottom: 1px solid #CCC;"></td>
                </tr>
            @endforeach
            <tr>
                <td><strong>All FET</strong></td>
                @foreach ($models as $code => $m)
                    <td class="amount"><strong>{{ collect($holders)->sum(fn ($h) => $h['models'][$code]) }}</strong></td>
                @endforeach
                <td class="amount"><strong>{{ $total }}</strong></td>
                <td></td><td></td>
            </tr>
        </tbody>
    </table>

    @if (collect($holders)->contains(fn ($h) => min($h['models']) < 0))
        <p style="margin-top: 14px; font-size: 10px; color: #B00020;">A figure in red is below zero: devices were recorded as leaving this holder before they were recorded as reaching them. Correct the entry in Accounting &rarr; Stock.</p>
    @endif

    <table style="width: 100%; margin-top: 48px; font-size: 11px;">
        <tr>
            <td style="width: 33%; padding-right: 18px;"><div style="border-top: 1px solid #1E1E1E; padding-top: 6px;">Prepared by (Finance)</div></td>
            <td style="width: 33%; padding: 0 9px;"><div style="border-top: 1px solid #1E1E1E; padding-top: 6px;">Head of Operations</div></td>
            <td style="width: 33%; padding-left: 18px;"><div style="border-top: 1px solid #1E1E1E; padding-top: 6px;">Date</div></td>
        </tr>
    </table>
@endsection
