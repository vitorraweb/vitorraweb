@php
    $local = fn ($t) => $t ? $t->copy()->setTimezone($tz)->format('j F Y, H:i').' (Kampala time)' : null;
    $signed = $c->status === 'signed';
@endphp
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { margin: 34px 46px 54px 46px; }
    body { font-family: 'DejaVu Sans', sans-serif; font-size: 10.2px; color: #2b2b2b; line-height: 1.5; }
    .logo { text-align: center; margin-bottom: 8px; }
    .logo img { width: 104px; }
    h1 { font-family: 'DejaVu Serif', serif; font-size: 15px; text-align: center; color: #1E1E1E; letter-spacing: 0.5px; margin: 6px 40px 4px; }
    .ref { text-align: center; color: #7A6020; font-size: 9px; letter-spacing: 1px; margin-bottom: 14px; }
    .rule { border-top: 1px solid #C5B27A; margin: 10px 0 12px; }
    h2 { font-size: 11px; color: #7A6020; margin: 14px 0 5px; letter-spacing: 0.4px; page-break-after: avoid; }
    p { margin: 0 0 5px; }
    ul { margin: 0 0 6px 0; padding-left: 16px; }
    li { margin-bottom: 1px; }
    table.rows { width: 100%; border-collapse: collapse; margin: 4px 0 8px; }
    table.rows td { padding: 4px 7px; border-bottom: 1px solid #e6e2d6; vertical-align: top; }
    table.rows td.k { width: 38%; color: #6b6b6b; }
    .total { font-weight: bold; margin: 2px 0 8px; }
    .party { width: 100%; border-collapse: collapse; }
    .party td { vertical-align: top; width: 50%; padding-right: 14px; }
    .label { font-weight: bold; font-size: 11px; color: #1E1E1E; margin-bottom: 3px; }
    .sig td { vertical-align: top; width: 50%; padding: 8px 14px 0 0; }
    .sig .line { border-bottom: 1px solid #999; height: 46px; margin: 2px 0 4px; }
    .sig img { max-height: 54px; max-width: 220px; }
    .typed { font-family: 'DejaVu Serif', serif; font-style: italic; font-size: 20px; color: #1E1E1E; }
    .muted { color: #777; font-size: 9px; }
    .record td { padding: 4px 7px; border-bottom: 1px solid #e6e2d6; vertical-align: top; font-size: 9.4px; }
    .record td.k { width: 30%; color: #6b6b6b; }
    .mono { font-family: 'DejaVu Sans Mono', monospace; font-size: 8.6px; word-break: break-all; }
    .footer { position: fixed; bottom: -36px; left: 0; right: 0; font-size: 8px; color: #999; text-align: center; }
    .draft { position: fixed; top: 300px; left: 0; right: 0; text-align: center; font-size: 70px; color: rgba(197,178,122,0.13); transform: rotate(-30deg); }
</style>
</head>
<body>
<div class="footer">{{ $d['number'] }} · {{ $signed ? 'Signed '.$local($c->signed_at) : 'Vitorra Holdings Limited · '.$d['title'] }}</div>
@if($c->status === 'void')<div class="draft">VOID</div>@endif

<div class="logo"><img src="{{ $logo }}"></div>
<h1>{{ $d['title'] }}</h1>
<div class="ref">CONTRACT {{ $d['number'] ?: 'DRAFT' }}</div>

<p>{{ $d['intro'] }}</p>
<div class="rule"></div>

<table class="party"><tr>
    <td>
        <div class="label">SELLER</div>
        <p><b>{{ $d['seller']['company'] }}</b><br>{!! collect($d['seller']['address'])->map(fn ($l) => e($l))->implode('<br>') !!}</p>
        @foreach($d['seller']['rows'] as [$k, $v])<p>{{ $k }}: {{ $v ?: '—' }}</p>@endforeach
        <p class="muted">(Hereinafter referred to as the "Seller" or "Vitorra")</p>
    </td>
    <td>
        <div class="label">BUYER</div>
        @foreach($d['buyer'] as [$k, $v])<p>{{ $k }}: {{ $v }}</p>@endforeach
        <p class="muted">(Hereinafter referred to as the "Buyer")</p>
    </td>
</tr></table>
<p>The Seller and Buyer shall collectively be referred to as the "Parties."</p>

@foreach($d['sections'] as $s)
    <h2>{{ $s['no'] }}. {{ $s['title'] }}</h2>
    @foreach($s['blocks'] as $b)
        @if($b['type'] === 'p')
            <p>{{ $b['text'] }}</p>
        @elseif($b['type'] === 'ul')
            <ul>@foreach($b['items'] as $it)<li>{{ $it }}</li>@endforeach</ul>
        @elseif($b['type'] === 'rows')
            <table class="rows">@foreach($b['rows'] as [$k, $v])<tr><td class="k">{{ $k }}</td><td>{!! nl2br(e($v)) !!}</td></tr>@endforeach</table>
            @if(!empty($b['footer']))<p class="total">{{ $b['footer'] }}</p>@endif
        @elseif($b['type'] === 'checks')
            @foreach($b['items'] as [$on, $label])<p>[{{ $on ? 'X' : '  ' }}] {{ $label }}</p>@endforeach
        @endif
    @endforeach
@endforeach

<div class="rule"></div>
<h2>SIGNATURES</h2>
<table class="sig" style="width:100%; border-collapse:collapse;"><tr>
    <td>
        <div class="label">SELLER</div>
        <p>{{ $d['seller']['company'] }}</p>
        <p>Name: {{ $c->seller_name ?: '—' }}</p>
        <p>Position: {{ $c->seller_title ?: '—' }}</p>
        <p>Signature:</p>
        @if($c->sent_at)
            <p class="muted">Issued electronically by {{ $d['seller']['company'] }} on {{ $local($c->sent_at) }}.</p>
        @else
            <div class="line"></div>
        @endif
    </td>
    <td>
        <div class="label">BUYER</div>
        <p>Name: {{ $c->signer_name ?: '' }}</p>
        <p>Position: {{ $c->signer_position ?: '' }}</p>
        <p>Signature:</p>
        @if($signed && $c->signature_type === 'drawn')
            <img src="{{ $c->signature_data }}">
        @elseif($signed)
            <div class="typed">{{ $c->signature_data }}</div>
        @else
            <div class="line"></div>
        @endif
        <p>Date: {{ $signed ? $c->signed_at->copy()->setTimezone($tz)->format('j F Y') : '' }}</p>
    </td>
</tr></table>

@if($signed)
    <div style="page-break-before: always;"></div>
    <h2>ELECTRONIC SIGNATURE RECORD</h2>
    <p>This contract was reviewed and signed online through a private signing link sent by email to the Buyer. The details below were recorded at the moment of signature.</p>
    <table class="record" style="width:100%; border-collapse:collapse;">
        <tr><td class="k">Contract</td><td>{{ $d['number'] }}</td></tr>
        <tr><td class="k">Signed by</td><td>{{ $c->signer_name }}{{ $c->signer_position ? ', '.$c->signer_position : '' }}</td></tr>
        <tr><td class="k">On behalf of</td><td>{{ $c->buyer_name }}</td></tr>
        <tr><td class="k">Signature</td><td>{{ $c->signature_type === 'drawn' ? 'Drawn on screen' : 'Typed name' }}, with "I have read and agree to this Agreement" confirmed</td></tr>
        <tr><td class="k">Signing link sent to</td><td>{{ $c->sent_to }} on {{ $local($c->sent_at) }}</td></tr>
        <tr><td class="k">First opened</td><td>{{ $local($c->viewed_at) ?? '—' }}</td></tr>
        <tr><td class="k">Signed at</td><td>{{ $local($c->signed_at) }}</td></tr>
        <tr><td class="k">IP address</td><td>{{ $c->signer_ip }}</td></tr>
        <tr><td class="k">Device</td><td>{{ \Illuminate\Support\Str::limit($c->signer_agent, 160) }}</td></tr>
        <tr><td class="k">Document fingerprint (SHA-256)</td><td class="mono">{{ $c->signed_hash }}</td></tr>
    </table>
    <p class="muted">The fingerprint is calculated from the full text and details of this contract as shown to the Buyer. Any later change to the wording would produce a different fingerprint.</p>
@endif
</body>
</html>
