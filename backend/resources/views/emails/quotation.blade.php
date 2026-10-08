Hello {{ $quotation->customer_attention ?: $quotation->customer_name }},

Thank you for your interest. Please find attached quotation {{ $quotation->number }} from Vitorra Holdings.

Total: {{ \App\Support\BrandedDocument::money($quotation->currency, $quotation->total) }}
@if($quotation->valid_until)
Valid until: {{ $quotation->valid_until->format('j F Y') }}
@endif

To accept, sign the acceptance section and send it back, or simply reply to this email to confirm in writing. If you have any questions about the specification or terms, reply and we will help.

Kind regards,
{{ $quotation->sales_contact ?: 'The Vitorra team' }}
Vitorra Holdings Limited
