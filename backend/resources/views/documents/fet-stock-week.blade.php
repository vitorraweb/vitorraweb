@extends('documents._layout', ['docTitle' => 'FET devices out'])

{{-- Weekly stock-out sheet for Finance: what left stock, who picked it up,
     and where each model stands at the end of the week. Printed and signed. --}}
@section('content')
    <table class="meta">
        <tr><td class="label">Week</td><td>{{ $start->format('l j F Y') }} &ndash; {{ $end->format('l j F Y') }}</td></tr>
        @php
            $soldOut = -$out->where('type', 'sold')->sum('quantity');
            $corrected = -$out->where('type', 'adjustment')->sum('quantity');
        @endphp
        <tr><td class="label">Devices out</td><td><strong>{{ $soldOut }}</strong>@if ($corrected) &nbsp;<span style="color: #999;">(and {{ $corrected }} removed in a stock-count correction)</span>@endif</td></tr>
        <tr><td class="label">Printed by</td><td>{{ $printedBy ?? '—' }}</td></tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 70px;">Date</th>
                <th>Model</th>
                <th class="amount" style="width: 40px;">Qty</th>
                <th>Taken from</th>
                <th>Picked up by</th>
                <th>Reference</th>
                <th>Note</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($out as $m)
                <tr>
                    <td>{{ $m->moved_on->format('D j M') }}</td>
                    <td>{{ $models[$m->model]['label'] ?? $m->model }}@if ($m->type === 'adjustment')<br><span style="font-size: 9px; color: #999;">Stock-count correction</span>@endif</td>
                    <td class="amount"><strong>{{ -$m->quantity }}</strong></td>
                    <td>{{ $m->holder ?: '—' }}</td>
                    <td>{{ $m->picked_by ?: '—' }}</td>
                    <td>{{ $m->reference ?: '—' }}</td>
                    <td style="font-size: 10px; color: #454545;">{{ $m->note ?: '' }}</td>
                </tr>
            @empty
                <tr><td colspan="7" style="color: #999; padding: 16px 10px;">No devices went out of stock this week.</td></tr>
            @endforelse
        </tbody>
    </table>

    <p style="margin-top: 28px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #7A6020; font-weight: bold;">Stock for the week, per model</p>
    <table class="items" style="margin-top: 6px;">
        <thead>
            <tr>
                <th>Model</th>
                <th class="amount">Opening</th>
                <th class="amount">Received</th>
                <th class="amount">Out</th>
                <th class="amount">Returned</th>
                <th class="amount">Corrected</th>
                <th class="amount">Closing</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($summary as $row)
                <tr>
                    <td>{{ $row['label'] }}</td>
                    <td class="amount">{{ $row['opening'] }}</td>
                    <td class="amount">{{ $row['received'] ?: '–' }}</td>
                    <td class="amount">{{ $row['out'] ?: '–' }}</td>
                    <td class="amount">{{ $row['returned'] ?: '–' }}</td>
                    <td class="amount">{{ $row['adjusted'] ? sprintf('%+d', $row['adjusted']) : '–' }}</td>
                    <td class="amount"><strong>{{ $row['closing'] }}</strong></td>
                </tr>
            @endforeach
            <tr>
                <td><strong>All FET</strong></td>
                <td class="amount">{{ collect($summary)->sum('opening') }}</td>
                <td class="amount">{{ collect($summary)->sum('received') ?: '–' }}</td>
                <td class="amount">{{ collect($summary)->sum('out') ?: '–' }}</td>
                <td class="amount">{{ collect($summary)->sum('returned') ?: '–' }}</td>
                <td class="amount">{{ collect($summary)->sum('adjusted') ? sprintf('%+d', collect($summary)->sum('adjusted')) : '–' }}</td>
                <td class="amount"><strong>{{ collect($summary)->sum('closing') }}</strong></td>
            </tr>
        </tbody>
    </table>

    <table style="width: 100%; margin-top: 48px; font-size: 11px;">
        <tr>
            <td style="width: 33%; padding-right: 18px;"><div style="border-top: 1px solid #1E1E1E; padding-top: 6px;">Prepared by (Finance)</div></td>
            <td style="width: 33%; padding: 0 9px;"><div style="border-top: 1px solid #1E1E1E; padding-top: 6px;">Checked by</div></td>
            <td style="width: 33%; padding-left: 18px;"><div style="border-top: 1px solid #1E1E1E; padding-top: 6px;">Date</div></td>
        </tr>
    </table>
@endsection
