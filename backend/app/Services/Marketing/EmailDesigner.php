<?php

namespace App\Services\Marketing;

use App\Support\SignatureHtml;
use Illuminate\Support\Str;

/**
 * The campaign designer's engine: a design is JSON (global settings + a list
 * of blocks), and this class is the only thing that turns it into email.
 *
 *   normalise()  Validates and clamps every value before it is stored, so the
 *                renderer can trust what it reads: colours are #hex, sizes are
 *                within range, fonts come from an email-safe list, links are
 *                http(s)/mailto/tel, rich text is sanitised. Nothing a user
 *                types can reach a style attribute unchecked.
 *   render()     Email-safe HTML: nested tables and inline styles only, the
 *                way Outlook and Gmail need it. Preview, test and the real
 *                send all come from here, so what Marketing sees is what the
 *                customer gets.
 *
 * The rendered HTML carries placeholders the sender fills per recipient:
 * {name}/{company} (personalisation) and {{unsubscribe_url}}.
 */
class EmailDesigner
{
    public const UNSUBSCRIBE_PLACEHOLDER = '{{unsubscribe_url}}';

    /** Email-safe font stacks; the key is what the design stores. */
    public const FONTS = [
        'arial'     => 'Arial,Helvetica,sans-serif',
        'helvetica' => 'Helvetica,Arial,sans-serif',
        'verdana'   => 'Verdana,Geneva,sans-serif',
        'tahoma'    => 'Tahoma,Geneva,sans-serif',
        'trebuchet' => "'Trebuchet MS',Helvetica,sans-serif",
        'georgia'   => "Georgia,'Times New Roman',serif",
        'times'     => "'Times New Roman',Times,serif",
    ];

    public const BLOCK_TYPES = ['logo', 'heading', 'text', 'image', 'button', 'divider', 'spacer', 'columns'];

    private const MAX_BLOCKS = 60;

    /* ── Normalise ───────────────────────────────────────────────────────── */

    /**
     * @param  array<string,mixed>  $design
     * @return array{settings: array<string,mixed>, blocks: list<array<string,mixed>>}
     */
    public static function normalise(array $design, int|string $ownerKey = 'design'): array
    {
        $s = $design['settings'] ?? [];
        $settings = [
            'canvas'      => self::color($s['canvas'] ?? null, '#F2F2F2'),
            'background'  => self::color($s['background'] ?? null, '#FFFFFF'),
            'width'       => self::int($s['width'] ?? null, 600, 480, 720),
            'font'        => self::font($s['font'] ?? null),
            'textColor'   => self::color($s['textColor'] ?? null, '#454545'),
            'linkColor'   => self::color($s['linkColor'] ?? null, '#7A6020'),
            'footerBackground' => self::color($s['footerBackground'] ?? null, '#1E1E1E'),
            'footerText'  => self::color($s['footerText'] ?? null, '#BDBDBD'),
        ];

        $blocks = [];
        foreach (array_slice((array) ($design['blocks'] ?? []), 0, self::MAX_BLOCKS) as $b) {
            if (! is_array($b) || ! in_array($b['type'] ?? null, self::BLOCK_TYPES, true)) {
                continue;
            }
            $blocks[] = self::normaliseBlock($b, $ownerKey);
        }

        return ['settings' => $settings, 'blocks' => $blocks];
    }

    private static function normaliseBlock(array $b, int|string $ownerKey): array
    {
        $p = (array) ($b['props'] ?? []);
        $common = [
            'background' => self::color($p['background'] ?? null, null),
            'paddingY'   => self::int($p['paddingY'] ?? null, 12, 0, 80),
            'paddingX'   => self::int($p['paddingX'] ?? null, 32, 0, 80),
        ];
        $align = fn ($v, $d = 'left') => in_array($v, ['left', 'center', 'right'], true) ? $v : $d;

        $props = match ($b['type']) {
            'logo' => [
                'src'   => self::url($p['src'] ?? null, null) ?? self::siteUrl('/logo.png'),
                'width' => self::int($p['width'] ?? null, 96, 32, 300),
                'align' => $align($p['align'] ?? null, 'center'),
                'link'  => self::url($p['link'] ?? null, null),
            ],
            'heading' => [
                'text'   => Str::limit(trim(strip_tags((string) ($p['text'] ?? 'Heading'))), 300, ''),
                'size'   => self::int($p['size'] ?? null, 28, 14, 56),
                'color'  => self::color($p['color'] ?? null, '#1E1E1E'),
                'align'  => $align($p['align'] ?? null),
                'font'   => self::font($p['font'] ?? null, 'georgia'),
                'weight' => in_array($p['weight'] ?? null, ['normal', 'bold'], true) ? $p['weight'] : 'normal',
            ],
            'text' => [
                'html'       => self::richText((string) ($p['html'] ?? ''), $ownerKey),
                'size'       => self::int($p['size'] ?? null, 15, 11, 28),
                'color'      => self::color($p['color'] ?? null, null),
                'align'      => $align($p['align'] ?? null),
                'lineHeight' => self::float($p['lineHeight'] ?? null, 1.6, 1.1, 2.2),
                'font'       => self::font($p['font'] ?? null, null),
            ],
            'image' => [
                'src'    => self::url($p['src'] ?? null, null),
                'alt'    => Str::limit(trim(strip_tags((string) ($p['alt'] ?? ''))), 200, ''),
                'width'  => self::int($p['width'] ?? null, 100, 10, 100),   // % of the content width
                'align'  => $align($p['align'] ?? null, 'center'),
                'link'   => self::url($p['link'] ?? null, null),
                'radius' => self::int($p['radius'] ?? null, 0, 0, 40),
            ],
            'button' => [
                'label'     => Str::limit(trim(strip_tags((string) ($p['label'] ?? 'Request a quote'))), 80, ''),
                'url'       => self::url($p['url'] ?? null, null) ?? self::siteUrl('/enquire'),
                'color'     => self::color($p['color'] ?? null, '#1E1E1E'),
                'textColor' => self::color($p['textColor'] ?? null, '#FFFFFF'),
                'size'      => self::int($p['size'] ?? null, 15, 12, 22),
                'align'     => $align($p['align'] ?? null),
                'radius'    => self::int($p['radius'] ?? null, 4, 0, 30),
                'fullWidth' => (bool) ($p['fullWidth'] ?? false),
            ],
            'divider' => [
                'color'     => self::color($p['color'] ?? null, '#C5B27A'),
                'thickness' => self::int($p['thickness'] ?? null, 1, 1, 8),
                'width'     => self::int($p['width'] ?? null, 100, 10, 100),
            ],
            'spacer' => [
                'height' => self::int($p['height'] ?? null, 24, 4, 120),
            ],
            'columns' => [
                'src'       => self::url($p['src'] ?? null, null),
                'alt'       => Str::limit(trim(strip_tags((string) ($p['alt'] ?? ''))), 200, ''),
                'link'      => self::url($p['link'] ?? null, null),
                'html'      => self::richText((string) ($p['html'] ?? ''), $ownerKey),
                'imageSide' => ($p['imageSide'] ?? 'left') === 'right' ? 'right' : 'left',
                'imageWidth' => self::int($p['imageWidth'] ?? null, 45, 25, 65), // % of the row
                'size'      => self::int($p['size'] ?? null, 15, 11, 24),
                'color'     => self::color($p['color'] ?? null, null),
            ],
        };

        if ($b['type'] === 'spacer') {
            $common['paddingY'] = 0;
            $common['paddingX'] = 0;
        }

        return [
            'id'    => preg_match('/^[A-Za-z0-9_-]{1,40}$/', (string) ($b['id'] ?? '')) ? $b['id'] : Str::random(10),
            'type'  => $b['type'],
            'props' => $props + $common,
        ];
    }

    /* ── Render ──────────────────────────────────────────────────────────── */

    /** @param  array{settings: array, blocks: list<array>}  $design  already normalised */
    public static function render(array $design, string $subject, ?string $preheader = null): string
    {
        $s = $design['settings'];
        $font = self::FONTS[$s['font']];
        $rows = '';
        foreach ($design['blocks'] as $b) {
            $rows .= self::renderBlock($b, $s);
        }

        $e = fn (?string $v) => e((string) $v);
        $pre = $preheader ? '<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:'.$s['canvas'].';">'.$e($preheader).'</div>' : '';
        $site = self::siteUrl('');
        $width = $s['width'];

        return <<<HTML
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>{$e($subject)}</title>
<!--[if mso]><style>table,td,p,a,li,h1,h2,h3{font-family:Arial,Helvetica,sans-serif !important;}</style><![endif]-->
<style>a{color:{$s['linkColor']};} @media (max-width:620px){.v-col{display:block !important;width:100% !important;} .v-col-pad{padding:0 0 16px !important;}}</style>
</head>
<body style="margin:0;padding:0;background:{$s['canvas']};-webkit-text-size-adjust:100%;">
{$pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{$s['canvas']};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="{$width}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:{$width}px;background:{$s['background']};font-family:{$font};color:{$s['textColor']};">
{$rows}
<tr><td style="background:{$s['footerBackground']};padding:26px 32px;font-family:{$font};">
<p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#C5B27A;">Vitorra Holdings Limited</p>
<p style="margin:0 0 12px;font-size:12px;line-height:1.7;color:{$s['footerText']};">Padre Pio House, Plot 32, Lumumba Avenue, Kampala, Uganda<br><a href="tel:+256740026294" style="color:{$s['footerText']};text-decoration:none;">+256 740 026 294</a> &nbsp;&middot;&nbsp; <a href="{$site}" style="color:#C5B27A;text-decoration:none;">vitorra.org</a></p>
<p style="margin:0;font-size:11px;line-height:1.6;color:{$s['footerText']};opacity:.85;">You are receiving this because Vitorra Holdings identified your organisation as a possible fit for our products. <a href="{{unsubscribe_url}}" style="color:{$s['footerText']};text-decoration:underline;">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }

    private static function renderBlock(array $b, array $s): string
    {
        $p = $b['props'];
        $font = self::FONTS[$p['font'] ?? $s['font']] ?? self::FONTS[$s['font']];
        $bg = $p['background'] ? "background:{$p['background']};" : '';
        $td = fn (string $inner, string $align = 'left') => "<tr><td align=\"{$align}\" style=\"{$bg}padding:{$p['paddingY']}px {$p['paddingX']}px;\">{$inner}</td></tr>\n";
        $inner = $s['width'] - 2 * $p['paddingX'];
        $e = fn ($v) => e((string) $v);
        $wrapLink = fn (string $html, ?string $url) => $url ? "<a href=\"{$e($url)}\" style=\"text-decoration:none;\">{$html}</a>" : $html;

        switch ($b['type']) {
            case 'logo':
                $img = "<img src=\"{$e($p['src'])}\" width=\"{$p['width']}\" alt=\"Vitorra Holdings\" style=\"display:inline-block;width:{$p['width']}px;max-width:100%;height:auto;border:0;\">";

                return $td($wrapLink($img, $p['link'] ?? self::siteUrl('')), $p['align']);

            case 'heading':
                $weight = $p['weight'] === 'bold' ? 'bold' : 'normal';
                $f = self::FONTS[$p['font']];

                return $td("<h1 style=\"margin:0;font-family:{$f};font-size:{$p['size']}px;line-height:1.25;font-weight:{$weight};color:{$p['color']};text-align:{$p['align']};\">{$e($p['text'])}</h1>", $p['align']);

            case 'text':
                $color = $p['color'] ?? $s['textColor'];
                $html = self::styleParagraphs($p['html']);

                return $td("<div style=\"font-family:{$font};font-size:{$p['size']}px;line-height:{$p['lineHeight']};color:{$color};text-align:{$p['align']};\">{$html}</div>", $p['align']);

            case 'image':
                if (! $p['src']) {
                    return '';
                }
                $w = (int) round($inner * $p['width'] / 100);
                $img = "<img src=\"{$e($p['src'])}\" width=\"{$w}\" alt=\"{$e($p['alt'])}\" style=\"display:block;width:{$w}px;max-width:100%;height:auto;border:0;border-radius:{$p['radius']}px;margin:".($p['align'] === 'center' ? '0 auto' : ($p['align'] === 'right' ? '0 0 0 auto' : '0')).';">';

                return $td($wrapLink($img, $p['link']), $p['align']);

            case 'button':
                $width = $p['fullWidth'] ? ' width="100%"' : '';
                $pad = round($p['size'] * 0.9).'px '.round($p['size'] * 1.8).'px';

                return $td(
                    "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" align=\"{$p['align']}\"{$width}><tr>"
                    ."<td align=\"center\" bgcolor=\"{$p['color']}\" style=\"background:{$p['color']};border-radius:{$p['radius']}px;\">"
                    ."<a href=\"{$e($p['url'])}\" style=\"display:block;padding:{$pad};font-family:{$font};font-size:{$p['size']}px;font-weight:bold;color:{$p['textColor']};text-decoration:none;border-radius:{$p['radius']}px;\">{$e($p['label'])}</a>"
                    .'</td></tr></table>',
                    $p['align']
                );

            case 'divider':
                return $td(
                    "<table role=\"presentation\" width=\"{$p['width']}%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" align=\"center\"><tr>"
                    ."<td style=\"border-top:{$p['thickness']}px solid {$p['color']};font-size:0;line-height:0;\">&nbsp;</td></tr></table>",
                    'center'
                );

            case 'spacer':
                return "<tr><td style=\"{$bg}height:{$p['height']}px;font-size:0;line-height:0;\">&nbsp;</td></tr>\n";

            case 'columns':
                $imgW = (int) round(($inner - 24) * $p['imageWidth'] / 100);
                $color = $p['color'] ?? $s['textColor'];
                $imgCell = $p['src']
                    ? $wrapLink("<img src=\"{$e($p['src'])}\" width=\"{$imgW}\" alt=\"{$e($p['alt'])}\" style=\"display:block;width:100%;max-width:{$imgW}px;height:auto;border:0;\">", $p['link'])
                    : '';
                $text = "<div style=\"font-family:{$font};font-size:{$p['size']}px;line-height:1.6;color:{$color};\">".self::styleParagraphs($p['html']).'</div>';
                $img = "<td class=\"v-col v-col-pad\" width=\"{$p['imageWidth']}%\" valign=\"top\" style=\"padding-right:24px;\">{$imgCell}</td>";
                $txt = '<td class="v-col" valign="top">'.$text.'</td>';
                if ($p['imageSide'] === 'right') {
                    $img = str_replace('padding-right:24px', 'padding-left:24px', $img);
                }

                return $td('<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
                    .($p['imageSide'] === 'left' ? $img.$txt : $txt.$img).'</tr></table>');
        }

        return '';
    }

    /** Give bare paragraphs and lists email-safe spacing (Outlook ignores CSS margins on <p> otherwise inconsistent). */
    private static function styleParagraphs(string $html): string
    {
        $html = preg_replace('/<p(?![^>]*style=)([^>]*)>/i', '<p$1 style="margin:0 0 12px;">', $html);
        $html = preg_replace('/<(ul|ol)(?![^>]*style=)([^>]*)>/i', '<$1$2 style="margin:0 0 12px;padding-left:22px;">', $html);

        return $html;
    }

    /* ── Plain text alternative ──────────────────────────────────────────── */

    public static function plainText(array $design): string
    {
        $lines = [];
        foreach ($design['blocks'] as $b) {
            $p = $b['props'];
            $lines[] = match ($b['type']) {
                'heading' => mb_strtoupper($p['text']),
                'text', 'columns' => trim(html_entity_decode(strip_tags(preg_replace('/<br\s*\/?>|<\/(p|div|li)>/i', "\n", $p['html'])))),
                'button'  => "{$p['label']}: {$p['url']}",
                default   => null,
            };
        }

        return trim(implode("\n\n", array_filter($lines)))
            ."\n\n--\nVitorra Holdings Limited · Padre Pio House, Plot 32, Lumumba Avenue, Kampala\nUnsubscribe: ".self::UNSUBSCRIBE_PLACEHOLDER;
    }

    /* ── Helpers ─────────────────────────────────────────────────────────── */

    private static function richText(string $html, int|string $ownerKey): string
    {
        $html = trim($html);
        if ($html === '') {
            return '';
        }
        // Shared sanitiser: strips scripts/handlers/js: URLs, keeps formatting,
        // and moves pasted base64 images to real files.
        return SignatureHtml::process(Str::limit($html, 40000, ''), $ownerKey, 'campaign-images');
    }

    private static function color(mixed $v, ?string $default): ?string
    {
        return is_string($v) && preg_match('/^#[0-9A-Fa-f]{6}$/', $v) ? strtoupper($v) : $default;
    }

    private static function font(mixed $v, ?string $default = 'arial'): ?string
    {
        return is_string($v) && isset(self::FONTS[$v]) ? $v : $default;
    }

    private static function int(mixed $v, int $default, int $min, int $max): int
    {
        return is_numeric($v) ? max($min, min($max, (int) round((float) $v))) : $default;
    }

    private static function float(mixed $v, float $default, float $min, float $max): float
    {
        return is_numeric($v) ? round(max($min, min($max, (float) $v)), 2) : $default;
    }

    /** http(s), mailto: and tel: only — and an absolute URL, since an email has no "current site". */
    private static function url(mixed $v, ?string $default): ?string
    {
        if (! is_string($v) || ($v = trim($v)) === '') {
            return $default;
        }
        if (str_starts_with($v, '/')) {
            $v = self::siteUrl($v);
        }

        return preg_match('#^(https?://[^\s"<>]+|mailto:[^\s"<>]+|tel:[+\d\s-]+)$#i', $v) ? Str::limit($v, 1000, '') : $default;
    }

    public static function siteUrl(string $path): string
    {
        $site = rtrim((string) config('services.frontend.url', 'https://vitorra.org'), '/');
        if (! str_starts_with($site, 'https://')) {
            $site = 'https://vitorra.org'; // a localhost link is no use in an inbox
        }

        return $site.$path;
    }
}
