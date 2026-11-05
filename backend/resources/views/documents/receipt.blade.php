{{--
    Official receipt for money received from a customer (App\Support\BrandedDocument::receiptData).
    A classic receipt: letterhead, number and date, who paid, the sum in figures and in words,
    what it was for, how it was paid, the account after this payment, and signatures.
--}}
@php($r = $d['receipt'])
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @include('documents.partials.letterhead-styles', ['art' => $d['art']])
    .amount-box { border: 2px solid #111; padding: 10px 14px; text-align: right; }
    .amount-box .cur { font-size: 10px; letter-spacing: .12em; color: #6b6b6b; text-transform: uppercase; }
    .amount-box .fig { font-size: 20px; white-space: nowrap; font-weight: bold; color: #111; line-height: 1.15; }
    .field td { padding: 7px 0; vertical-align: top; }
    .field .k { width: 150px; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #6b6b6b; padding-top: 9px; }
    .field .v { font-size: 13px; border-bottom: 1px dotted #9a9a9a; }
    .sum td { padding: 6px 12px; font-size: 11.5px; border-bottom: 1px solid #ece7dc; }
    .sum td.n { text-align: right; white-space: nowrap; }
    .sum tr.hl td { background: #f6f1e6; font-weight: bold; }
    .sum tr.due td { font-weight: bold; font-size: 12.5px; border-bottom: 2px solid #111; }
    .stamp { display: inline-block; border: 3px double; padding: 6px 14px; font-weight: bold; font-size: 15px; letter-spacing: .12em; transform: rotate(-6deg); }
    .stamp.full { color: #1f7a3a; border-color: #1f7a3a; }
    .stamp.part { color: #9c6416; border-color: #9c6416; }
    .stamp.void { color: #b42318; border-color: #b42318; }
    .sig td { padding: 0 14px 0 0; vertical-align: bottom; font-size: 10.5px; color: #3a3a3a; }
</style>
</head>
<body>
@if($r['void'])<div class="void-mark">VOID</div>@endif

<div class="foot">
    {{ $d['company']['name'] }} · {{ implode(' ', $d['company']['address']) }}@if(!empty($d['company']['tin'])) · TIN {{ $d['company']['tin'] }}@endif<br>
    This receipt is computer-generated and valid for the amount stated only. Please keep it for your records.
</div>

@include('documents.partials.letterhead', ['art' => $d['art'], 'company' => $d['company']])

<table style="width:100%; margin-top:20px;">
    <tr>
        <td style="vertical-align:top;">
            <p class="title">OFFICIAL RECEIPT</p>
            <div class="sub">{{ $d['brand'] }}</div>
        </td>
        <td style="vertical-align:top; text-align:right;">
            <table class="meta" style="margin-left:auto;">
                <tr><td class="k">Receipt No.</td><td class="v">{{ $d['number'] }}</td></tr>
                <tr><td class="k">Date</td><td class="v">{{ $d['date'] }}</td></tr>
                <tr><td class="k">{{ $d['doc_label'] }}</td><td class="v">{{ $d['doc_number'] }}</td></tr>
            </table>
        </td>
    </tr>
</table>

<table style="width:100%; margin-top:22px;">
    <tr>
        <td style="vertical-align:top; padding-right:22px;">
            <table class="field" style="width:100%;">
                <tr><td class="k">Received from</td><td class="v"><b>{{ $d['customer_name'] }}</b>@if($d['customer_detail'])<br><span class="muted" style="font-size:11px;">{{ $d['customer_detail'] }}</span>@endif</td></tr>
                <tr><td class="k">The sum of</td><td class="v"><i>{{ $d['amount_words'] }}</i></td></tr>
                <tr><td class="k">Being payment for</td><td class="v">{{ $d['for'] }}</td></tr>
                <tr><td class="k">Paid by</td><td class="v">{{ $d['method'] ?: '—' }}@if($d['reference']) &nbsp;·&nbsp; Ref. {{ $d['reference'] }}@endif</td></tr>
            </table>
        </td>
        <td style="vertical-align:top; width:220px;">
            <div class="amount-box">
                <div class="cur">Amount received</div>
                <div class="fig">{{ $d['amount'] }}</div>
            </div>
            <div style="text-align:center; margin-top:18px;">
                <span class="stamp {{ $r['void'] ? 'void' : ($r['full'] ? 'full' : 'part') }}">{{ $r['status'] }}</span>
            </div>
        </td>
    </tr>
</table>

<div class="label" style="margin-top:26px;">Account summary</div>
<table class="sum" style="width:100%;">
    @foreach($r['rows'] as $i => [$k, $v])
        <tr class="{{ $i === 2 ? 'hl' : ($i === count($r['rows']) - 1 ? 'due' : '') }}"><td>{{ $k }}</td><td class="n">{{ $v }}</td></tr>
    @endforeach
</table>
<p style="margin:10px 0 0; font-size:11px;" class="muted">{{ $r['next'] }}</p>

<table class="sig" style="width:100%; margin-top:54px;">
    <tr>
        <td style="width:50%;"><div class="line"></div>Received by{{ $d['issued_by'] ? ': '.$d['issued_by'] : '' }}</td>
        <td style="width:50%;"><div class="line"></div>Authorised signature &amp; company stamp</td>
    </tr>
</table>

<p style="margin-top:34px; text-align:center; font-size:12px;" class="gold"><b>Thank you for your business.</b></p>
</body>
</html>
