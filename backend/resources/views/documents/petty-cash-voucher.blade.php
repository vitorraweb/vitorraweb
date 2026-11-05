{{--
    Petty cash voucher (App\Http\Controllers\Api\PettyCashController::pdf), after
    Finance's own form: number and date, who was paid and why, the items with
    their department and amount, the total in figures and words, and three
    signatures — prepared, approved, received.
--}}
@php($v = $d['v'])
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @include('documents.partials.letterhead-styles', ['art' => $d['art']])
    .field td { padding: 6px 0; vertical-align: top; }
    .field .k { width: 120px; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #6b6b6b; padding-top: 8px; }
    .field .v { font-size: 12.5px; border-bottom: 1px dotted #9a9a9a; }
    table.items { width: 100%; margin-top: 16px; }
    table.items th { background: #1c1c1c; color: #fff; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; text-align: left; padding: 7px 10px; }
    table.items th.n, table.items td.n { text-align: right; }
    table.items th.c, table.items td.c { text-align: center; }
    table.items td { padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #e3ddd0; height: 18px; }
    table.items tr.alt td { background: #faf7f0; }
    table.items tr.total td { border-top: 2px solid #111; border-bottom: 2px solid #111; font-weight: bold; font-size: 13px; background: #f6f1e6; }
    .words { margin-top: 10px; font-size: 11.5px; }
    .sig { width: 100%; margin-top: 40px; }
    .sig td { width: 33.33%; vertical-align: top; padding-right: 18px; }
    .sig .role { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #9c6416; font-weight: bold; border-bottom: 2px solid #b8862b; padding-bottom: 4px; margin-bottom: 8px; }
    .sig .row { font-size: 10.5px; color: #6b6b6b; margin-top: 12px; }
    .sig .row span { display: block; border-bottom: 1px solid #9a9a9a; min-height: 18px; color: #1c1c1c; font-size: 12px; padding-bottom: 2px; }
</style>
</head>
<body>
@if($d['void'])<div class="void-mark">VOID</div>@endif

<div class="foot">
    {{ $d['company']['name'] }} · {{ implode(' ', $d['company']['address']) }}@if(!empty($d['company']['tin'])) · TIN {{ $d['company']['tin'] }}@endif<br>
    Attach the receipts for these payments to this voucher. Computer-generated in the Vitorra console.
</div>

@include('documents.partials.letterhead', ['art' => $d['art'], 'company' => $d['company']])

<table style="width:100%; margin-top:20px;">
    <tr>
        <td style="vertical-align:top;">
            <p class="title">PETTY CASH VOUCHER</p>
            <div class="sub">Finance</div>
        </td>
        <td style="vertical-align:top; text-align:right;">
            <table class="meta" style="margin-left:auto;">
                <tr><td class="k">Voucher No.</td><td class="v" style="color:#b42318;">{{ $v->number }}</td></tr>
                <tr><td class="k">Date</td><td class="v">{{ $d['date'] }}</td></tr>
                @if($v->department)<tr><td class="k">Department</td><td class="v">{{ $v->department }}</td></tr>@endif
            </table>
        </td>
    </tr>
</table>

<table class="field" style="width:100%; margin-top:16px;">
    <tr><td class="k">Paid to</td><td class="v"><b>{{ $v->paid_to }}</b></td></tr>
    @if($v->purpose)<tr><td class="k">Purpose</td><td class="v">{{ $v->purpose }}</td></tr>@endif
</table>

<table class="items">
    <thead>
        <tr>
            <th class="c" style="width:44px;">S/N</th>
            <th>Description</th>
            <th style="width:150px;">Department</th>
            <th class="n" style="width:150px;">Amount ({{ $v->currency }})</th>
        </tr>
    </thead>
    <tbody>
        @foreach($d['items'] as $i => $it)
            <tr class="{{ $i % 2 ? 'alt' : '' }}"><td class="c">{{ $it['no'] }}</td><td>{{ $it['description'] }}</td><td>{{ $it['department'] ?: ($v->department ?? '') }}</td><td class="n">{{ $it['amount'] }}</td></tr>
        @endforeach
        {{-- A few ruled lines under short vouchers, so it reads as the familiar form. --}}
        @for($i = count($d['items']); $i < 5; $i++)
            <tr class="{{ $i % 2 ? 'alt' : '' }}"><td></td><td></td><td></td><td></td></tr>
        @endfor
        <tr class="total"><td></td><td colspan="2">TOTAL</td><td class="n">{{ $d['total'] }}</td></tr>
    </tbody>
</table>
<p class="words"><span class="muted">Amount in words:</span> <i>{{ $d['words'] }}</i></p>

<table class="sig">
    <tr>
        @foreach([['Prepared by', $v->prepared_by], ['Approved by', $v->approved_by], ['Received by', $v->received_by]] as [$role, $name])
            <td>
                <div class="role">{{ $role }}</div>
                <div class="row">Name<span>{{ $name }}</span></div>
                <div class="row">Signature<span>&nbsp;</span></div>
                <div class="row">Date<span>&nbsp;</span></div>
            </td>
        @endforeach
    </tr>
</table>
</body>
</html>
