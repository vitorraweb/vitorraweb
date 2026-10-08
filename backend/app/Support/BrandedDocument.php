<?php

namespace App\Support;

use App\Models\Invoice;
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
        $business = $doc->business === 'coffee' ? 'coffee' : 'fet';
        $kind = $isQuote ? 'quotation' : ($doc->kind === 'commercial' ? 'commercial' : ($doc->kind === 'final' ? 'final' : 'invoice'));
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

        $subtotal = (int) $rows->sum('raw_total');
        $taxRate = (int) $doc->tax_rate;
        $tax = (int) round($subtotal * $taxRate / 100);
        $total = $subtotal + $tax;
        $deposit = $doc->deposit_percent ? (int) round($total * $doc->deposit_percent / 100) : null;

        $fill = fn (?string $text) => strtr((string) $text, [
            '{deposit}' => $deposit !== null ? self::money($c, $deposit) : '',
            '{balance}' => $deposit !== null ? self::money($c, $total - $deposit) : '',
        ]);

        $issue = self::date($doc->issue_date);
        $second = $isQuote ? $doc->valid_until : $doc->due_date;

        $info = $business === 'coffee'
            ? [
                [$isQuote ? 'Quotation No.' : 'Invoice No.', $doc->number],
                [$isQuote ? 'Quotation Date' : 'Invoice Date', $issue],
                [$isQuote ? 'Valid Until' : 'Due Date', self::date($second)],
                [$isQuote ? 'Incoterms' : 'Incoterm', $doc->incoterms],
                ...($isQuote ? [['Payment Terms', $fill($doc->payment_terms)]] : []),
                ['Port of Loading', $doc->port_of_loading],
                ['Sales Contact', $doc->sales_contact],
                ['Currency', $c],
                ...($isQuote ? [] : [['Payment Terms', $fill($doc->payment_terms)]]),
            ]
            : [
                [$isQuote ? 'Quotation No.' : 'Invoice No.', $doc->number],
                [$isQuote ? 'Quotation Date' : 'Invoice Date', $issue],
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

        $taxLabel = $doc->tax_label ?: ($business === 'coffee'
            ? ($taxRate === 0 ? 'TAXES (0% EXPORT)' : "TAXES ({$taxRate}% VAT)")
            : "TAX ({$taxRate}%)");
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
            $validity = $doc->issue_date && $doc->valid_until
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
            'info_title'     => $isQuote ? 'QUOTATION INFORMATION' : 'INVOICE INFORMATION',
            'customer'   => $customer,
            'info'       => $info,
            'currency'   => $c,
            'items'      => $rows->all(),
            'totals'     => [
                [$business === 'coffee' ? 'UNTAXED AMOUNT' : 'SUBTOTAL', self::money($c, $subtotal)],
                [$taxLabel, $business === 'coffee' ? self::money($c, $tax) : self::number($c, $tax)],
                [$totalLabel, self::money($c, $total)],
            ],
            'terms'      => $terms,
            'bank'       => $bank,
            'notes'      => $notes,
            'conditions' => $conditions,
            'acceptance' => $isQuote
                ? ($business === 'coffee' ? [['Name', 'Signature'], ['Date', 'Company Stamp']] : [['Name', 'Signature'], ['Date', 'Sales Contact']])
                : null,
            'footer_tab' => $isQuote ? 'Quotation – Non-binding unless otherwise stated' : 'Thank you for your business!',
        ];
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
