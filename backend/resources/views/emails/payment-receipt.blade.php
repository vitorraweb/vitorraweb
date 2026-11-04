@php($money = fn ($a) => \App\Support\BrandedDocument::money($r->currency, (int) $a))
@if($team)
@if($customerSent)
{{ $sender?->name ?? 'A colleague' }} has sent receipt {{ $r->number }} to the customer, and copied you.
@else
{{ $sender?->name ?? 'A colleague' }} has shared receipt {{ $r->number }} with you.

The customer has NOT received it.
@endif

Customer: {{ $doc->customer_name }}
{{ $label }}: {{ $doc->number }}
Received: {{ $money($r->amount) }} on {{ $r->paid_on->format('j F Y') }}
Balance remaining: {{ $money($r->balance_after) }}
@if($note)

Note from {{ $sender?->name ?? 'the sender' }}:
{{ $note }}
@endif

The receipt is attached. Open it in the console:
{{ $link }}
@else
Hello {{ $doc->customer_name }},

Thank you for your payment. Please find attached receipt {{ $r->number }}.

{{ $label }}: {{ $doc->number }}
Amount received: {{ $money($r->amount) }}
Date received: {{ $r->paid_on->format('j F Y') }}
@if($r->isFullySettled())

This {{ mb_strtolower($label) }} is now paid in full.
@else
Balance remaining: {{ $money($r->balance_after) }}
@if($doc instanceof \App\Models\Invoice && $doc->due_date)
Due date: {{ $doc->due_date->format('j F Y') }}
@endif
@endif
@if($note)

{{ $note }}
@endif

Thank you,
Vitorra Holdings Limited
@endif
