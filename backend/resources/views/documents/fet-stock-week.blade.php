@extends('documents._report', [
    'docTitle'    => 'FET Status',
    'docSubtitle' => 'Week of '.$start->format('j M').' – '.$end->format('j M Y'),
    'docRef'      => 'FET-WK-'.$start->format('Y-m-d'),
])

{{-- Weekly FET status sheet for Finance: what left stock, who picked it up,
     and where each model stands at the end of the week. Printed and signed. --}}
@section('content')
    @php
        $soldOut   = -$out->where('type', 'sold')->sum('quantity');
        $corrected = -$out->where('type', 'adjustment')->sum('quantity');
        $all       = collect($summary);
    @endphp

    <table class="meta">
        <tr>
            <td><div class="k">Period</div><div class="v">{{ $start->format('l j F') }} – {{ $end->format('l j F Y') }}</div></td>
            <td><div class="k">Main store</div><div class="v">{{ \App\Models\FetStockMovement::MAIN_HOLDER }}</div></td>
            <td><div class="k">Printed by</div><div class="v">{{ $printedBy ?? '—' }}</div></td>
        </tr>
    </table>

    <table class="kpis">
        <tr>
            <td><div class="k">Opening stock</div><div class="v">{{ $all->sum('opening') }}</div><div class="n">devices on {{ $start->format('j M') }}</div></td>
            <td><div class="k">Received</div><div class="v">{{ $all->sum('received') + $all->sum('returned') }}</div><div class="n">incl. {{ $all->sum('returned') }} returned</div></td>
            <td><div class="k">Out</div><div class="v">{{ $soldOut }}</div><div class="n">@if ($corrected) and {{ $corrected }} removed in a count @else sold or installed @endif</div></td>
            <td class="dark"><div class="k">Closing stock</div><div class="v">{{ $all->sum('closing') }}</div><div class="n">devices on {{ $end->format('j M') }}</div></td>
        </tr>
    </table>

    <h3>Devices out this week</h3>
    <table class="report">
        <thead>
            <tr>
                <th style="width: 62px;">Date</th>
                <th>Model</th>
                <th class="num" style="width: 34px;">Qty</th>
                <th>Taken from</th>
                <th>Picked up by</th>
                <th>Reference</th>
                <th>Note</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($out as $i => $m)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $m->moved_on->format('D j M') }}</td>
                    <td>{{ $models[$m->model]['label'] ?? $m->model }}@if ($m->type === 'adjustment')<br><span class="tag grey">Count correction</span>@endif</td>
                    <td class="num"><strong>{{ -$m->quantity }}</strong></td>
                    <td>{{ $m->holder ?: '—' }}</td>
                    <td>{{ $m->picked_by ?: '—' }}</td>
                    <td class="nw">{{ $m->reference ?: '—' }}</td>
                    <td class="dim">{{ $m->note ?: '' }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="empty">No devices went out of stock this week.</td></tr>
            @endforelse
        </tbody>
    </table>

    <h3>Stock per model</h3>
    <table class="report">
        <thead>
            <tr>
                <th>Model</th>
                <th class="num">Opening</th>
                <th class="num">Received</th>
                <th class="num">Out</th>
                <th class="num">Returned</th>
                <th class="num">Corrected</th>
                <th class="num">Closing</th>
            </tr>
        </thead>
        <tbody>
            @foreach (array_values($summary) as $i => $row)
                <tr class="{{ $i % 2 ? 'alt' : '' }}">
                    <td>{{ $row['label'] }}</td>
                    <td class="num">{{ $row['opening'] }}</td>
                    <td class="num {{ $row['received'] ? '' : 'dim' }}">{{ $row['received'] ?: '–' }}</td>
                    <td class="num {{ $row['out'] ? '' : 'dim' }}">{{ $row['out'] ?: '–' }}</td>
                    <td class="num {{ $row['returned'] ? '' : 'dim' }}">{{ $row['returned'] ?: '–' }}</td>
                    <td class="num {{ $row['adjusted'] ? '' : 'dim' }}">{{ $row['adjusted'] ? sprintf('%+d', $row['adjusted']) : '–' }}</td>
                    <td class="num"><strong>{{ $row['closing'] }}</strong></td>
                </tr>
            @endforeach
            <tr class="total">
                <td>All FET</td>
                <td class="num">{{ $all->sum('opening') }}</td>
                <td class="num">{{ $all->sum('received') ?: '–' }}</td>
                <td class="num">{{ $all->sum('out') ?: '–' }}</td>
                <td class="num">{{ $all->sum('returned') ?: '–' }}</td>
                <td class="num">{{ $all->sum('adjusted') ? sprintf('%+d', $all->sum('adjusted')) : '–' }}</td>
                <td class="num">{{ $all->sum('closing') }}</td>
            </tr>
        </tbody>
    </table>

    <table class="signoff">
        <tr>
            <td><div class="role">Prepared by &middot; Finance</div><div class="line"></div><div class="lbl">Name &amp; signature</div><div class="line"></div><div class="lbl">Date</div></td>
            <td><div class="role">Confirmed by &middot; Operations</div><div class="line"></div><div class="lbl">Name &amp; signature</div><div class="line"></div><div class="lbl">Date</div></td>
            <td><div class="role">Approved by</div><div class="line"></div><div class="lbl">Name &amp; signature</div><div class="line"></div><div class="lbl">Date</div></td>
        </tr>
    </table>
@endsection
