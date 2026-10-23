<?php

namespace App\Support;

use App\Models\Contract;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdf;
use Illuminate\Support\Carbon;

/**
 * Lays a contract out once, as a list of numbered sections made of simple
 * blocks (paragraphs, bullets, label/value rows, tick boxes). The PDF and the
 * client's online signing page both render this same structure, so what the
 * client reads on screen is word for word what they sign, and its hash is
 * the fingerprint recorded at signature.
 */
class ContractDocument
{
    public static function build(Contract $c): array
    {
        $money = fn (?int $a) => $a === null ? null : BrandedDocument::money($c->currency ?: 'UGX', $a);
        $date = fn ($d) => $d ? Carbon::parse($d)->format('j F Y') : null;

        $sections = [];
        foreach (array_values($c->clauses ?? []) as $i => $clause) {
            $text = self::blocks((string) ($clause['body'] ?? ''));
            $blocks = match ($clause['key'] ?? null) {
                'product' => [self::rows([
                    ['Product', 'Fuel Eco Tech (FET) Module'],
                    ['Quantity', $c->quantity ? (string) $c->quantity : null],
                    ['Model Number', $c->model_number],
                    ['Serial Number', $c->serial_number],
                    ['Vehicle(s)/Equipment Description', $c->vehicle_description],
                    ['Registration Number(s)', $c->registration_numbers],
                    ['Chassis/VIN Number(s)', $c->chassis_numbers],
                    ['Engine Number(s)', $c->engine_numbers],
                    ['Installation Location', $c->installation_location],
                    ['Installation Date', $date($c->installation_date)],
                ]), ...$text],
                'price' => [...$text, self::rows([
                    ['FET Module Unit Cost', $money($c->unit_cost)],
                    ['Total Contract Value', $money($c->total_amount)],
                    ...($c->price_note ? [['Note', $c->price_note]] : []),
                ], 'TOTAL AMOUNT PAYABLE: '.($money($c->total_amount) ?? 'Not specified'))],
                'payment' => [
                    ['type' => 'p', 'text' => 'The Buyer shall pay according to the following option:'],
                    ['type' => 'checks', 'items' => [
                        [$c->payment_option === 'advance', '100% Advance Payment'],
                        [$c->payment_option === 'instalment', 'Other Arrangement: Monthly instalment of '
                            .($money($c->instalment_amount) ?? '______________________').' monthly'],
                    ]],
                    ['type' => 'p', 'text' => 'Payments shall be made to:'],
                    self::rows([
                        ['Account Name', $c->bank_account_name],
                        ['Bank', $c->bank_name],
                        ['Account Number', $c->bank_account_number],
                        ['Mobile Money', $c->mobile_money],
                    ]),
                    ...$text,
                ],
                default => $text,
            };
            $sections[] = ['no' => $i + 1, 'title' => (string) ($clause['title'] ?? ''), 'blocks' => $blocks];
        }

        return [
            'number'   => $c->number,
            'title'    => ContractTemplate::TITLE,
            'intro'    => 'This Sales and Installation Agreement ("Agreement") is entered into on '
                .($date($c->agreement_date) ?? 'the date it is signed by the Buyer').' by and between:',
            'seller'   => [
                'company' => $c->seller_company,
                'address' => array_values(array_filter(preg_split('/\R/', (string) $c->seller_address) ?: [], 'strlen')),
                'rows'    => [['Represented by', $c->seller_name], ['Title', $c->seller_title]],
            ],
            'buyer'    => self::rows([
                ['Name/Company', $c->buyer_name],
                ['Registration Number (if applicable)', $c->buyer_registration],
                ['Address', $c->buyer_address],
                ['Contact Person', $c->buyer_contact],
                ['Telephone', $c->buyer_phone],
                ['Email', $c->buyer_email],
            ])['rows'],
            'sections' => $sections,
        ];
    }

    /** Fingerprint of exactly what the client was shown and signed. */
    public static function hash(array $doc): string
    {
        return hash('sha256', json_encode($doc, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    public static function pdf(Contract $c): DomPdf
    {
        $doc = self::build($c);

        return Pdf::loadView('documents.contract', [
            'd'    => $doc,
            'c'    => $c,
            'logo' => resource_path('document-art/logo.png'),
            'tz'   => config('contracts.timezone'),
        ])->setPaper('a4')->setOption('dpi', 96)->setOption('defaultFont', 'DejaVu Sans');
    }

    /** Plain text → paragraphs and bullet lists ("- " starts a bullet). */
    private static function blocks(string $body): array
    {
        $blocks = [];
        foreach (preg_split('/\R/', $body) ?: [] as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            if (str_starts_with($line, '- ') || str_starts_with($line, '• ')) {
                $item = trim(mb_substr($line, 2));
                $last = array_key_last($blocks);
                if ($last !== null && $blocks[$last]['type'] === 'ul') {
                    $blocks[$last]['items'][] = $item;
                } else {
                    $blocks[] = ['type' => 'ul', 'items' => [$item]];
                }
            } else {
                $blocks[] = ['type' => 'p', 'text' => $line];
            }
        }

        return $blocks;
    }

    private static function rows(array $rows, ?string $footer = null): array
    {
        return ['type' => 'rows', 'rows' => array_map(fn ($r) => [$r[0], filled($r[1]) ? (string) $r[1] : 'Not specified'], $rows), 'footer' => $footer];
    }
}
