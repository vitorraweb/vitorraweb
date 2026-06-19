@php
    $money = fn ($a) => $invoice->currency === 'UGX' ? 'UGX '.number_format($a) : ($invoice->currency === 'USD' ? '$' : '€').number_format($a / 100, 2);
@endphp
Hello {{ $invoice->customer_name }},

@if($reminder)
This is a friendly reminder that invoice {{ $invoice->number }} is awaiting payment.
@else
Please find attached invoice {{ $invoice->number }} from Vitorra Holdings.
@endif

Amount due: {{ $money($invoice->balance()) }}
@if($invoice->due_date)
Due date: {{ $invoice->due_date->format('j F Y') }}
@endif

The full invoice is attached as a PDF. If you've already paid, please disregard this message.

Thank you,
Vitorra Holdings Limited
