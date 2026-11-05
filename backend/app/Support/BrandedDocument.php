<?php

namespace App\Support;

use App\Models\Invoice;
use App\Models\PaymentReceipt;
use App\Models\Quotation;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdf;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;

/**
 * The Finance team's branded quotation / invoice templates (Coffee and FET).
 *
 * Takes a Quotation or Invoice — saved, or an unsaved one built from the
 * editor for a live preview — and produces the data
 * resources/views/documents/branded.blade.php prints. Each business has its
 * own information rows, item columns, totals labels and terms sections,
 * exactly as on the approved designs. Invoices without a business keep the
 * plain Vitorra layout (documents.invoice).
 */
class BrandedDocument
{
    public const COMPANY = [
        'name'    => 'Vitorra Holdings Ltd',
        'address' => ['Padre Pio House, Plot 32 Lumumba Avenue,', '1st Floor, Kampala, Uganda'],
        'phone'   => '+256 786 099 800',
    ];

    public static function pdf(Quotation|Invoice $doc, ?iterable $items = null): DomPdf
    {
        if ($doc instanceof Invoice && ! $doc->isBranded()) {
            return Pdf::loadView('documents.invoice', ['invoice' => $doc->loadMissing('items')]);
        }

        // dompdf caches the embedded font's metrics here; make sure it exists
        // on a fresh deploy.
        File::ensureDirectoryExists(storage_path('fonts'));

        return Pdf::loadView('documents.branded', ['d' => self::data($doc, $items)])
            ->setPaper('a4')
            ->setOption('dpi', 96)
            ->setOption('defaultFont', 'DejaVu Sans')
            // Embed only the glyphs used — the branded font stays a few KB.
            ->setOption('isFontSubsettingEnabled', true);
    }

    /** @param iterable|null $items rows with name, details, quantity, unit, unit_price (for unsaved previews) */
    public static function data(Quotation|Invoice $doc, ?iterable $items = null): array
    {
        $isQuote = $doc instanceof Quotation;
        // An accepted quotation sent back as an order confirmation: same
        // layout, its own title, no validity date or "non-binding" wording.
        $isOrder = $isQuote && $doc->isOrderConfirmation();
        $business = $doc->business === 'coffee' ? 'coffee' : 'fet';
        $kind = $isOrder ? 'order' : ($isQuote ? 'quotation' : ($doc->kind === 'commercial' ? 'commercial' : ($doc->kind === 'final' ? 'final' : 'invoice')));
        $c = $doc->currency ?: 'UGX';

        $rows = collect($items ?? $doc->items)->values()->map(function ($it, $i) use ($c, $business) {
            $it = (array) (is_object($it) && method_exists($it, 'toArray') ? $it->toArray() : $it);
            $qty = (int) ($it['quantity'] ?? 0);
            $price = (int) ($it['unit_price'] ?? 0);
            $unit = trim((string) ($it['unit'] ?? ''));
            $total = $qty * $price;

            return [
                'no'         => $i + 1,
                'name'       => (string) ($it['name'] ?? $it['description'] ?? ''),
                'details'    => (string) ($it['details'] ?? ''),
                'qty'        => number_format($qty),
                'unit'       => $unit,
                'qty_unit'   => trim(number_format($qty).' '.$unit),
                'unit_price' => $business === 'coffee'
                    ? self::money($c, $price).(self::isMeasure($unit) ? ' / '.$unit : '')
                    : self::number($c, $price),
                'total'      => $business === 'coffee' ? self::money($c, $total) : self::number($c, $total),
                'raw_total'  => $total,
            ];
        });

        $taxRate = (int) $doc->tax_rate;
        [$subtotal, $tax, $total] = $doc->splitTax((int) $rows->sum('raw_total'), $taxRate);
        $inclusive = (bool) $doc->tax_inclusive;
        $deposit = $doc->deposit_percent ? (int) round($total * $doc->deposit_percent / 100) : null;

        $fill = fn (?string $text) => strtr((string) $text, [
            '{deposit}' => $deposit !== null ? self::money($c, $deposit) : '',
            '{balance}' => $deposit !== null ? self::money($c, $total - $deposit) : '',
        ]);

        $issue = self::date($doc->issue_date);
        $second = $isOrder ? null : ($isQuote ? $doc->valid_until : $doc->due_date);
        [$noLabel, $dateLabel] = match (true) {
            $isOrder => ['Order No.', 'Order Date'],
            $isQuote => ['Quotation No.', 'Quotation Date'],
            default  => ['Invoice No.', 'Invoice Date'],
        };

        $info = $business === 'coffee'
            ? [
                [$noLabel, $doc->number],
                [$dateLabel, $issue],
                [$isQuote ? 'Valid Until' : 'Due Date', self::date($second)],
                [$isQuote ? 'Incoterms' : 'Incoterm', $doc->incoterms],
                ...($isQuote ? [['Payment Terms', $fill($doc->payment_terms)]] : []),
                ['Port of Loading', $doc->port_of_loading],
                ['Sales Contact', $doc->sales_contact],
                ['Currency', $c],
                ...($isQuote ? [] : [['Payment Terms', $fill($doc->payment_terms)]]),
            ]
            : [
                [$noLabel, $doc->number],
                [$dateLabel, $issue],
                [$isQuote ? 'Valid Until' : 'Due Date', self::date($second)],
                ['Sales Contact', $doc->sales_contact],
                ['Reference', $doc->reference],
                ['Currency', $c],
                ['Payment Terms', $fill($doc->payment_terms)],
            ];
        // Empty rows are dropped, except Sales Contact, which the design
        // prints as a blank line to be filled in by hand.
        $info = array_values(array_filter($info, fn ($r) => filled($r[1]) || $r[0] === 'Sales Contact'));

        $customer = array_values(array_filter([
            ['bold', $doc->customer_name],
            ...array_map(fn ($l) => ['', $l], preg_split('/\R/', (string) $doc->customer_address) ?: []),
            $doc->customer_attention ? ['', 'Attn: '.$doc->customer_attention] : null,
            $doc->customer_tax_id ? ['', ($business === 'coffee' ? 'VAT ID: ' : 'TIN: ').$doc->customer_tax_id] : null,
            $doc->customer_phone ? ['', 'Phone: '.$doc->customer_phone] : null,
            $doc->customer_email && $business === 'fet' ? ['', 'E-Mail: '.$doc->customer_email] : null,
        ], fn ($r) => $r && filled($r[1])));

        $taxLabel = $doc->tax_label ?: ($inclusive && $taxRate > 0 ? "VAT ({$taxRate}%, INCLUDED)" : ($business === 'coffee'
            ? ($taxRate === 0 ? 'TAXES (0% EXPORT)' : "TAXES ({$taxRate}% VAT)")
            : "TAX ({$taxRate}%)"));
        $place = trim((string) preg_replace('/\s*\(.*$/', '', (string) $doc->incoterms));
        $totalLabel = $doc->total_label ?: ($business === 'coffee' && $place !== '' ? 'TOTAL ('.mb_strtoupper($place).')' : 'TOTAL');

        $terms = [];
        if ($business === 'coffee') {
            $terms = ['title' => 'PAYMENT TERMS & EXPORT SPECIFICATIONS', 'rows' => array_values(array_filter([
                ['Payment Schedule', $fill($doc->payment_schedule)],
                ['Inspection & Certification', $doc->inspection],
                ['Shipment Schedule', $doc->shipment_schedule],
            ], fn ($r) => filled($r[1])))];
        } elseif ($isQuote) {
            $validity = ! $isOrder && $doc->issue_date && $doc->valid_until
                ? Carbon::parse($doc->issue_date)->diffInDays(Carbon::parse($doc->valid_until)).' days from the quotation date.'
                : null;
            $terms = ['title' => 'COMMERCIAL TERMS', 'rows' => array_values(array_filter([
                ['Payment Terms', $fill($doc->payment_schedule ?: $doc->payment_terms)],
                ['Delivery Terms', $doc->shipment_schedule],
                ['Quotation Validity', $validity],
            ], fn ($r) => filled($r[1])))];
        }

        $bank = null;
        $notes = [];
        $conditions = [];
        if (! $isQuote) {
            // Every invoice says where to pay. (Finance's FET design shows the
            // block; coffee buyers abroad need it too, with the SWIFT code.)
            $s = Setting::resolved();
            $account = $s['bank_account_'.strtolower($c)] ?? '';
            $bank = array_values(array_filter([
                ['Bank Name', $s['bank_name'] ?? ''],
                ['Account Name', $s['bank_account_name'] ?? ''],
                ['Account Number', $account],
                ['Branch', $s['bank_branch'] ?? ''],
                ['SWIFT Code', $s['bank_swift'] ?? ''],
                // Coffee invoices already state the currency in the information
                // box; leaving it out keeps the page to one sheet.
                $business === 'fet' ? ['Currency', $c] : null,
                ['Reference', $doc->number],
            ], fn ($r) => $r && filled($r[1])));
            if (! filled($s['bank_name'] ?? null) || ! filled($account)) {
                $bank = null; // never print a half-filled bank block
            }
        }
        if (! $isQuote && $business === 'fet') {
            $notes = self::lines($doc->notes) ?: [
                'Please make payment in full by the due date.',
                'Include the invoice number in your payment reference.',
                'Bank charges are to be borne by the payer.',
            ];
            $conditions = self::lines($doc->terms) ?: [
                'Goods remain the property of Vitorra Holdings Ltd until full payment is received.',
                'Warranty and usage terms as per FET product guidelines.',
                'This invoice is issued in accordance with the applicable tax regulations in Uganda.',
            ];
        }

        $s = Setting::resolved();

        return [
            'business'   => $business,
            'kind'       => $kind,
            'is_quote'   => $isQuote,
            'number'     => $doc->number ?: 'DRAFT',
            'header'     => resource_path("document-art/head-{$business}-{$kind}.jpg"),
            'art'        => resource_path('document-art'),
            'company'    => self::COMPANY + [
                'email' => $business === 'coffee' ? 'export@vitorra.org' : 'support@vitorra.org',
                'tin'   => $s['company_tin'] ?? '',
            ],
            'customer_title' => $isQuote ? 'CUSTOMER / BUYER' : 'BILL TO',
            'info_title'     => $isOrder ? 'ORDER INFORMATION' : ($isQuote ? 'QUOTATION INFORMATION' : 'INVOICE INFORMATION'),
            'customer'   => $customer,
            'info'       => $info,
            'currency'   => $c,
            'items'      => $rows->all(),
            'totals'     => [
                [$business === 'coffee' ? 'UNTAXED AMOUNT' : ($inclusive && $taxRate > 0 ? 'SUBTOTAL (EXCL. VAT)' : 'SUBTOTAL'), self::money($c, $subtotal)],
                [$taxLabel, $business === 'coffee' ? self::money($c, $tax) : self::number($c, $tax)],
                [$totalLabel, self::money($c, $total)],
            ],
            'terms'      => $terms,
            'bank'       => $bank,
            'notes'      => $notes,
            'conditions' => $conditions,
            'accept_title' => $isOrder ? 'Confirmation' : 'Acceptance',
            'accept_text'  => $isOrder
                ? 'To confirm this order, please sign below and return a copy, or confirm in writing.'
                : 'To accept this quotation, please sign below or confirm acceptance in writing.',
            'acceptance' => $isQuote
                ? ($business === 'coffee' ? [['Name', 'Signature'], ['Date', 'Company Stamp']] : [['Name', 'Signature'], ['Date', 'Sales Contact']])
                : null,
            'receipt'    => null,
            'footer_tab' => match (true) {
                $isOrder => 'Order confirmation – Thank you for your order',
                $isQuote => 'Quotation – Non-binding unless otherwise stated',
                default  => 'Thank you for your business!',
            },
        ];
    }

    /**
     * A payment receipt on the same template as its invoice: who paid, for
     * what, how, and what is still owed. Invoices made before the branded
     * templates take the look of their business line (coffee, else FET).
     */
    public static function receiptPdf(PaymentReceipt $receipt): DomPdf
    {
        File::ensureDirectoryExists(storage_path('fonts'));

        return Pdf::loadView('documents.receipt', ['d' => self::receiptData($receipt)])
            ->setPaper('a4')
            ->setOption('dpi', 96)
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isFontSubsettingEnabled', true);
    }

    public static function receiptData(PaymentReceipt $receipt): array
    {
        // Printed against what it was issued for: the order, or the invoice.
        $order = $receipt->isForOrder();
        $doc = clone $receipt->document()->loadMissing('items');
        $doc->business = in_array($doc->business, ['coffee', 'fet'], true)
            ? $doc->business
            : (($doc->sector ?? null) === 'COFFEE' ? 'coffee' : 'fet');

        $d = self::data($doc);
        $c = $receipt->currency;
        $full = $receipt->isFullySettled();
        $void = $receipt->status === 'void';
        $label = $receipt->documentLabel();
        $noun = $order ? ($doc->isOrderConfirmation() ? 'order' : 'quotation') : 'invoice';
        $status = $void ? 'VOID' : ($full ? 'PAID IN FULL' : ($order && $receipt->paid_before === 0 ? 'DEPOSIT' : 'PART PAYMENT'));

        $next = match (true) {
            $void => 'This receipt has been cancelled because the payment it records was reversed. It is not proof of payment.',
            $full => "This {$noun} is now paid in full. Thank you.",
            default => 'A balance of '.self::money($c, $receipt->balance_after)." remains on this {$noun}"
                .(! $order && $doc->due_date ? ', due by '.self::date($doc->due_date) : '')
                .'. Please quote '.$doc->number.' with your next payment.',
        };

        $items = collect($doc->items)->map(fn ($it) => (string) ($it->name ?? $it->description ?? ''))->filter()->values();
        $what = $items->take(2)->implode(', ').($items->count() > 2 ? ' and '.($items->count() - 2).' more' : '');
        $kindOfPayment = $void ? 'Payment' : ($full ? ($receipt->paid_before > 0 ? 'Final payment' : 'Payment in full') : ($order && $receipt->paid_before === 0 ? 'Deposit' : 'Part payment'));
        $address = trim(preg_replace('/\s*\R\s*/', ', ', (string) $doc->customer_address));

        return array_merge($d, [
            // The formal receipt (documents.receipt).
            'brand'           => match ($d['business']) { 'coffee' => 'Vitorra Coffee', 'fet' => 'Fuel Eco Tech', default => 'Vitorra Holdings' },
            'date'            => self::date($receipt->paid_on),
            'doc_label'       => $order ? ($doc->isOrderConfirmation() ? 'Order No.' : 'Quotation No.') : 'Invoice No.',
            'doc_number'      => $doc->number,
            'customer_name'   => $doc->customer_name,
            'customer_detail' => implode(' · ', array_filter([$address, $doc->customer_email])),
            'amount'          => self::money($c, $receipt->amount),
            'amount_words'    => AmountInWords::format((int) $receipt->amount, $c),
            'for'             => $kindOfPayment.' on '.mb_strtolower($label).' '.$doc->number.($what !== '' ? ' ('.$what.')' : ''),
            'method'          => $receipt->methodLabel(),
            'reference'       => $receipt->payment_reference,
            'issued_by'       => $receipt->issuer?->name,
            'kind'           => 'receipt',
            'is_quote'       => false,
            'number'         => $receipt->number,
            'header'         => resource_path("document-art/head-{$d['business']}-receipt.jpg"),
            'customer_title' => 'RECEIVED FROM',
            'info_title'     => 'RECEIPT INFORMATION',
            'info'           => array_values(array_filter([
                ['Receipt No.', $receipt->number],
                ['Receipt Date', self::date($receipt->paid_on)],
                [$order ? ($doc->isOrderConfirmation() ? 'Order No.' : 'Quotation No.') : 'Invoice No.', $doc->number],
                [$order ? ($doc->isOrderConfirmation() ? 'Order Date' : 'Quotation Date') : 'Invoice Date', self::date($doc->issue_date)],
                ['Payment Method', $receipt->methodLabel()],
                ['Payment Ref.', $receipt->payment_reference],
                ['Currency', $c],
                ['Status', $status],
            ], fn ($r) => filled($r[1]))),
            'totals'         => [
                [mb_strtoupper($noun).' TOTAL', self::money($c, (int) $doc->total)],
                ['AMOUNT RECEIVED', self::money($c, $receipt->amount)],
                ['BALANCE DUE', self::money($c, $receipt->balance_after)],
            ],
            'terms'          => [],
            'bank'           => null,
            'notes'          => [],
            'conditions'     => [],
            'acceptance'     => null,
            'receipt'        => [
                'void'   => $void,
                'status' => $status,
                'full'   => $full,
                'rows'   => [
                    [ucfirst($noun).' total', self::money($c, (int) $doc->total)],
                    ['Paid before this receipt', self::money($c, $receipt->paid_before)],
                    ['Received on this receipt', self::money($c, $receipt->amount)],
                    ['Total paid to date', self::money($c, $receipt->paidToDate())],
                    ['Balance remaining', self::money($c, $receipt->balance_after)],
                ],
                'words'  => 'We acknowledge with thanks receipt of '.self::money($c, $receipt->amount)
                    .' from '.$doc->customer_name.' against '.mb_strtolower($label).' '.$doc->number.'.',
                'next'   => $next,
            ],
            'footer_tab'     => $void ? 'Cancelled receipt – not valid as proof of payment' : 'Payment received – Thank you!',
        ]);
    }

    /* ── formatting ──────────────────────────────────────────────────────── */

    /** Amounts are stored in minor units for USD/EUR and whole shillings for UGX. */
    public static function major(string $currency, int $amount): float
    {
        return $currency === 'UGX' ? (float) $amount : $amount / 100;
    }

    public static function number(string $currency, int $amount): string
    {
        return number_format(self::major($currency, $amount), 2);
    }

    public static function money(string $currency, int $amount): string
    {
        $n = self::number($currency, $amount);

        return match ($currency) {
            'EUR' => '€'.$n,
            'USD' => '$'.$n,
            default => $currency.' '.$n,
        };
    }

    private static function date(mixed $d): string
    {
        if (! $d) {
            return '';
        }
        $d = $d instanceof CarbonInterface ? $d : Carbon::parse($d);

        return $d->format('d F Y');
    }

    private static function isMeasure(string $unit): bool
    {
        return $unit !== '' && ! in_array(strtolower(rtrim($unit, '.')), ['lot', 'pcs', 'pc', 'unit', 'units', 'service', 'set'], true);
    }

    private static function lines(?string $text): array
    {
        return array_values(array_filter(array_map(
            fn ($l) => trim((string) preg_replace('/^\s*(\d+[.)]|[-•])\s*/', '', $l)),
            preg_split('/\R/', (string) $text) ?: []
        )));
    }
}
