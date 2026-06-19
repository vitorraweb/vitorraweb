@php
    $money = fn ($a) => $invoice->currency === 'UGX' ? 'UGX '.number_format($a) : ($invoice->currency === 'USD' ? '$' : '€').number_format($a / 100, 2);
@endphp
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { font-family: DejaVu Sans, sans-serif; }
  body { color: #1E1E1E; font-size: 12px; margin: 0; }
  .wrap { padding: 40px 44px; }
  .brand { font-size: 22px; font-weight: bold; }
  .gold { color: #C5B27A; }
  .muted { color: #888; }
  h1 { font-size: 26px; margin: 0; letter-spacing: -0.5px; }
  table { width: 100%; border-collapse: collapse; }
  .items th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; border-bottom: 2px solid #1E1E1E; padding: 8px 6px; }
  .items td { padding: 8px 6px; border-bottom: 1px solid #eee; }
  .right { text-align: right; }
  .totals td { padding: 5px 6px; }
  .totals .grand { font-size: 15px; font-weight: bold; border-top: 2px solid #1E1E1E; }
</style></head>
<body><div class="wrap">

  <table style="margin-bottom: 30px;"><tr>
    <td>
      <div class="brand">Vitorra<span class="gold"> Holdings</span></div>
      <div class="muted">Vitorra Holdings Limited · vitorra.org</div>
    </td>
    <td class="right">
      <h1>INVOICE</h1>
      <div class="muted">{{ $invoice->number }}</div>
    </td>
  </tr></table>

  <table style="margin-bottom: 26px;"><tr>
    <td style="width: 55%;">
      <div class="muted" style="text-transform: uppercase; font-size: 10px;">Bill to</div>
      <div style="font-weight: bold; font-size: 14px;">{{ $invoice->customer_name }}</div>
      @if($invoice->customer_email)<div class="muted">{{ $invoice->customer_email }}</div>@endif
      @if($invoice->customer_address)<div class="muted">{!! nl2br(e($invoice->customer_address)) !!}</div>@endif
    </td>
    <td class="right">
      <div><span class="muted">Issued:</span> {{ optional($invoice->issue_date)->format('j M Y') }}</div>
      @if($invoice->due_date)<div><span class="muted">Due:</span> {{ $invoice->due_date->format('j M Y') }}</div>@endif
      <div><span class="muted">Status:</span> {{ ucfirst($invoice->status) }}</div>
    </td>
  </tr></table>

  <table class="items"><thead><tr>
    <th>Description</th><th class="right">Qty</th><th class="right">Unit</th><th class="right">VAT</th><th class="right">Amount</th>
  </tr></thead><tbody>
    @foreach($invoice->items as $it)
    <tr>
      <td>{{ $it->description }}</td>
      <td class="right">{{ $it->quantity }}</td>
      <td class="right">{{ $money($it->unit_price) }}</td>
      <td class="right">{{ $it->vat_rate }}%</td>
      <td class="right">{{ $money($it->line_total) }}</td>
    </tr>
    @endforeach
  </tbody></table>

  <table style="margin-top: 18px;"><tr>
    <td style="width: 55%;"></td>
    <td><table class="totals">
      <tr><td class="muted">Subtotal</td><td class="right">{{ $money($invoice->subtotal) }}</td></tr>
      <tr><td class="muted">VAT</td><td class="right">{{ $money($invoice->vat_total) }}</td></tr>
      <tr><td class="grand">Total</td><td class="right grand">{{ $money($invoice->total) }}</td></tr>
      @if($invoice->amount_paid > 0)
      <tr><td class="muted">Paid</td><td class="right">{{ $money($invoice->amount_paid) }}</td></tr>
      <tr><td style="font-weight: bold;">Balance due</td><td class="right" style="font-weight: bold;">{{ $money($invoice->total - $invoice->amount_paid) }}</td></tr>
      @endif
    </table></td>
  </tr></table>

  @if($invoice->notes)<p style="margin-top: 24px;"><strong>Notes:</strong> {{ $invoice->notes }}</p>@endif
  @if($invoice->terms)<p class="muted" style="margin-top: 8px;">{{ $invoice->terms }}</p>@endif

  <p class="muted" style="margin-top: 36px; text-align: center; font-size: 11px;">Thank you for your business · Vitorra Holdings Limited</p>
</div></body></html>
