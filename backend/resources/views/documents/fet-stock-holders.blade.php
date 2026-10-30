@extends('documents._report', [
    'docTitle'    => 'FET Custody Summary',
    'docSubtitle' => 'Where our devices are kept · '.$asAt->format('j M Y'),
    'docRef'      => 'FET-CUST-'.$asAt->format('Y-m-d'),
])

{{-- Custody summary for Finance: every person or office holding FET devices
     right now, per model, with the Operations office (the main store) first.
     Each holder signs that the count in their keeping is right. --}}
@section('content')
    @php
        $list  = collect($holders);
        $total = $list->sum('total');
        $main  = $list->firstWhere('main', true);
        $inMain = $main['total'] ?? 0;
        $others = $list->where('main', false)->filter(fn ($h) => $h['total'] > 0)->count();
    @endphp

    <table class="meta">
        <tr>
            <td><div class="k">As at</div><div class="v">{{ $asAt->format('l j F Y, H:i') }}</div></td>
            <td><div class="k">Main store</div><div class="v">{{ \App\Models\FetStockMovement::MAIN_HOLDER }}</div></td>
            <td><div class="k">Printed by</div><div class="v">{{ $printedBy ?? '—' }}</div></td>
        </tr>
    </table>

    <table class="kpis">
        <tr>
            <td class="dark"><div class="k">Devices held</div><div class="v">{{ $total }}</div><div class="n">all models and samples</div></td>
            <td><div class="k">In the main store</div><div class="v">{{ $inMain }}</div><div class="n">{{ $total ? round($inMain / $total * 100) : 0 }}% of all devices</div></td>
            <td><div class="k">With others</div><div class="v">{{ $total - $inMain }}</div><div class="n">across {{ $others }} {{ $others === 1 ? 'holder' : 'holders' }}</div></td>
        </tr>
    </table>

    <h3>Devices per holder</h3>
    <table class="report">
        <thead>
            <tr>
                <th>Kept by / at</th>
                @foreach ($models as $m)
                    <th class="num">{{ $m['label'] }}</th>
                @endforeach
                <th class="num">Total</th>
                <th style="width: 62px;">Last movement</th>
                <th style="width: 104px;">Holder&rsquo;s signature</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($list->values() as $i => $h)
                <tr class="{{ $h['main'] ? 'main' : ($i % 2 ? 'alt' : '') }}">
                    <td>@if ($h['main'])<strong>{{ $h['holder'] }}</strong><br><span class="tag gold">Main store</span>@else{{ $h['holder'] }}@endif</td>
                    @foreach ($models as $code => $m)
                        @php $n = $h['models'][$code] ?? 0; @endphp
                        <td class="num {{ $n < 0 ? 'neg' : ($n ? '' : 'dim') }}">{{ $n ?: '–' }}</td>
                    @endforeach
                    <td class="num"><strong>{{ $h['total'] }}</strong></td>
                    <td>{{ $h['last_moved_on'] ? \Carbon\CarbonImmutable::parse($h['last_moved_on'])->format('j M Y') : '—' }}</td>
                    <td style="border-bottom: 0.6px solid #9a9a9a;"></td>
                </tr>
            @endforeach
            <tr class="total">
                <td>All FET</td>
                @foreach ($models as $code => $m)
                    <td class="num">{{ $list->sum(fn ($h) => $h['models'][$code] ?? 0) }}</td>
                @endforeach
                <td class="num">{{ $total }}</td>
                <td></td><td></td>
            </tr>
        </tbody>
    </table>

    @if ($list->contains(fn ($h) => min($h['models']) < 0))
        <div class="note">A figure in red is below zero: devices were recorded as leaving this holder before they were recorded as reaching them. Correct the entry in Accounting &rarr; Stock before signing.</div>
    @endif

    <table class="signoff">
        <tr>
            <td><div class="role">Prepared by &middot; Finance</div><div class="line"></div><div class="lbl">Name &amp; signature</div><div class="line"></div><div class="lbl">Date</div></td>
            <td><div class="role">Head of Operations</div><div class="line"></div><div class="lbl">Name &amp; signature</div><div class="line"></div><div class="lbl">Date</div></td>
            <td><div class="role">Approved by</div><div class="line"></div><div class="lbl">Name &amp; signature</div><div class="line"></div><div class="lbl">Date</div></td>
        </tr>
    </table>
@endsection
