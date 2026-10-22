Hello {{ $quotation->customer_attention ?: $quotation->customer_name }},

@if($quotation->isOrderConfirmation())
Thank you for your order. Please find attached order confirmation {{ $quotation->number }} from Vitorra Holdings.

Total: {{ \App\Support\BrandedDocument::money($quotation->currency, $quotation->total) }}

Please check the items and terms. To confirm, sign the confirmation section and send it back, or simply reply to this email to confirm in writing. If anything needs changing, reply and we will correct it.
@else
Thank you for your interest. Please find attached quotation {{ $quotation->number }} from Vitorra Holdings.

Total: {{ \App\Support\BrandedDocument::money($quotation->currency, $quotation->total) }}
@if($quotation->valid_until)
Valid until: {{ $quotation->valid_until->format('j F Y') }}
@endif

To accept, sign the acceptance section and send it back, or simply reply to this email to confirm in writing. If you have any questions about the specification or terms, reply and we will help.
@endif

Kind regards,
{{ $quotation->sales_contact ?: 'The Vitorra team' }}
Vitorra Holdings Limited
