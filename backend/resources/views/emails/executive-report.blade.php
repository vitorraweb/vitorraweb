@php
    $trend = function ($d) {
        if ($d['delta_pct'] === null) return $d['previous'] == 0 ? '' : '';
        $p = $d['delta_pct'];
        if ($p > 0) return " (up {$p}% vs previous)";
        if ($p < 0) return " (down ".abs($p)."% vs previous)";
        return ' (no change)';
    };
@endphp
VITORRA HOLDINGS — BUSINESS SUMMARY
{{ $s['period_label'] }}

MONEY RECEIVED (paid)
@foreach (['UGX','USD'] as $c)
@if($s['revenue'][$c]['current'] > 0 || $s['revenue'][$c]['previous'] > 0)
- {{ $money($c, $s['revenue'][$c]['current']) }}{{ $trend($s['revenue'][$c]) }}
@endif
@endforeach
@if($s['revenue']['UGX']['current'] == 0 && $s['revenue']['USD']['current'] == 0)
- No payments recorded in this period.
@endif

MONEY OWED TO US (orders placed, not yet paid)
- UGX {{ number_format($s['outstanding']['UGX']) }}@if($s['outstanding']['USD'] > 0) and ${{ number_format($s['outstanding']['USD'] / 100, 2) }}@endif

SALES & CUSTOMERS
- New orders: {{ $s['orders']['current'] }}{{ $trend($s['orders']) }}
- New customer enquiries: {{ $s['enquiries']['current'] }}{{ $trend($s['enquiries']) }}
- Enquiries that became sales: {{ $s['enquiries_converted']['current'] }}{{ $trend($s['enquiries_converted']) }}
- Overall conversion rate: {{ $s['conversion_rate'] }}%
@if($s['avg_response_hours'] !== null)
- Average time to first reply: {{ $s['avg_response_hours'] }} hours
@endif

WHAT CUSTOMERS ARE ASKING ABOUT
@forelse ($s['top_interest'] as $i)
- {{ ucfirst(strtolower($i['product'])) }}: {{ $i['count'] }} enquiry/enquiries
@empty
- No new enquiries in this period.
@endforelse

SALES PIPELINE (prospects)
- Total leads: {{ number_format($s['prospects']['total']) }}
- Reached out to: {{ number_format($s['prospects']['reached']) }}
- Converted: {{ number_format($s['prospects']['converted']) }}

—
Full live view: https://vitorra.org/admin/executive
This summary is generated automatically by the Vitorra platform.
