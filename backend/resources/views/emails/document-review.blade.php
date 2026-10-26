@if($customerSent)
{{ $sender?->name ?? 'A colleague' }} has sent {{ $label }} {{ $document->number }} to the customer, and copied you.
@else
{{ $sender?->name ?? 'A colleague' }} has shared {{ $label }} {{ $document->number }} with you for review.

The customer has NOT received it.
@endif

Customer: {{ $document->customer_name }}{{ $document->customer_email ? ' <'.$document->customer_email.'>' : '' }}
Total: {{ \App\Support\BrandedDocument::money($document->currency, $document->total) }}
@if($note)

Note from {{ $sender?->name ?? 'the sender' }}:
{{ $note }}
@endif

The PDF is attached. Open it in the console to make changes:
{{ $link }}

Reply to this email to answer {{ $sender?->name ?? 'the sender' }} directly.
