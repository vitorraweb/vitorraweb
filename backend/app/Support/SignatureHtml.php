<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Turns HTML pasted from Outlook (or anywhere) into something safe to store
 * and safe to re-embed, unmodified, into an outgoing email or the admin UI.
 * Used both for staff email signatures and for rich message bodies (e.g. a
 * customer pasting formatted content into a portal reply).
 *
 * Two jobs:
 *   1. Sanitize — strip anything that could execute (script/style tags,
 *      on* handlers, javascript: URLs) while keeping ordinary formatting
 *      (inline styles, tables, fonts, links).
 *   2. Extract embedded images — a pasted logo/screenshot normally arrives
 *      as a data:image/...;base64,... URI. Left inline, that full image gets
 *      duplicated into the database row AND (for a signature) into every
 *      single email sent from then on. Pulled out to a real file on the
 *      public disk instead, the HTML just carries a small <img src="https://...">.
 */
class SignatureHtml
{
    /** Tags kept as-is; anything else is unwrapped (content kept, tag dropped). */
    private const ALLOWED_TAGS = [
        'a', 'b', 'strong', 'i', 'em', 'u', 'span', 'div', 'p', 'br', 'hr',
        'img', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'ul', 'ol', 'li',
        'font', 'small', 'sub', 'sup',
    ];

    /** Attributes kept on an allowed tag; everything else is stripped. */
    private const ALLOWED_ATTRS = [
        'href', 'src', 'alt', 'title', 'width', 'height', 'style',
        'colspan', 'rowspan', 'align', 'target', 'rel', 'face', 'size', 'color',
    ];

    private const STRIPPED_TAGS = [
        'script', 'style', 'iframe', 'object', 'embed', 'form',
        'input', 'button', 'textarea', 'link', 'meta',
    ];

    /**
     * @param  int|string  $ownerKey  Distinguishes whose images these are on
     *                                disk — a user id for a signature, a
     *                                communication/customer id for a message.
     * @param  string  $storageFolder Top-level folder under the public disk
     *                                the extracted images are written to
     *                                (e.g. "signatures", "communications").
     */
    public static function process(string $html, int|string $ownerKey, string $storageFolder = 'signatures'): string
    {
        $clean = self::sanitize($html);

        return $clean === '' ? '' : self::extractImages($clean, $ownerKey, $storageFolder);
    }

    private static function sanitize(string $html): string
    {
        if (trim($html) === '') {
            return '';
        }

        // Word/Outlook's HTML export wraps content in namespaced tags
        // (<o:p>, <w:sdt>, <v:shape>...). HTML has no concept of a tag
        // namespace, so libxml's parser mangles "o:p" into a bare "p" —
        // by the time DOMDocument sees it, it's indistinguishable from a
        // real paragraph. Strip the namespace tags themselves here, before
        // parsing, while leaving whatever text they wrapped intact.
        $html = (string) preg_replace('/<\/?[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z0-9]+(?:\s[^>]*)?>/', '', $html);

        libxml_use_internal_errors(true);
        $dom = new \DOMDocument('1.0', 'UTF-8');
        // Force UTF-8 interpretation and wrap so DOMDocument treats this as a
        // fragment rather than trying to build a full <html><body> document.
        $dom->loadHTML(
            '<?xml encoding="UTF-8"><div id="__root__">'.$html.'</div>',
            LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET
        );
        libxml_clear_errors();

        $root = $dom->getElementById('__root__');
        if (! $root) {
            return '';
        }

        self::cleanChildren($root);

        $out = '';
        foreach ($root->childNodes as $child) {
            $out .= $dom->saveHTML($child) ?: '';
        }

        return trim($out);
    }

    private static function cleanChildren(\DOMNode $node): void
    {
        $toUnwrap = [];
        $toRemove = [];

        foreach ($node->childNodes as $child) {
            if (! $child instanceof \DOMElement) {
                continue; // text nodes / comments — left as-is (DOMDocument already escapes text)
            }

            $tag = strtolower($child->tagName);

            if (in_array($tag, self::STRIPPED_TAGS, true)) {
                $toRemove[] = $child;

                continue;
            }

            if (! in_array($tag, self::ALLOWED_TAGS, true)) {
                $toUnwrap[] = $child; // keep the content, drop the wrapper

                continue;
            }

            self::cleanAttributes($child);
            self::cleanChildren($child);
        }

        foreach ($toRemove as $el) {
            $node->removeChild($el);
        }
        foreach ($toUnwrap as $el) {
            self::cleanAttributes($el); // still strip dangerous attrs before unwrapping
            self::cleanChildren($el);
            while ($el->firstChild) {
                $node->insertBefore($el->firstChild, $el);
            }
            $node->removeChild($el);
        }
    }

    private static function cleanAttributes(\DOMElement $el): void
    {
        foreach (iterator_to_array($el->attributes) as $attr) {
            $name = strtolower($attr->name);

            if (str_starts_with($name, 'on') || ! in_array($name, self::ALLOWED_ATTRS, true)) {
                $el->removeAttribute($attr->name);

                continue;
            }

            if (($name === 'href' || $name === 'src') && stripos(trim($attr->value), 'javascript:') === 0) {
                $el->removeAttribute($attr->name);

                continue;
            }

            if ($name === 'style' && (stripos($attr->value, 'javascript:') !== false || stripos($attr->value, 'expression(') !== false)) {
                $el->removeAttribute('style');
            }
        }
    }

    /** Replace inline base64 image data with a real file on the public disk. */
    private static function extractImages(string $html, int|string $ownerKey, string $storageFolder): string
    {
        return (string) preg_replace_callback(
            '/<img([^>]*)\ssrc=["\']data:(image\/(?:png|jpe?g|gif|webp));base64,([^"\']*)["\']([^>]*)>/i',
            function (array $m) use ($ownerKey, $storageFolder) {
                [, $before, $mime, $data, $after] = $m;

                $bytes = base64_decode($data, true);
                if ($bytes === false || $bytes === '') {
                    return ''; // drop an image we can't decode rather than store garbage
                }

                $ext = match ($mime) {
                    'image/png'  => 'png',
                    'image/gif'  => 'gif',
                    'image/webp' => 'webp',
                    default      => 'jpg',
                };
                $path = "{$storageFolder}/{$ownerKey}/".Str::random(24).'.'.$ext;
                Storage::disk('public')->put($path, $bytes);

                return '<img'.$before.' src="'.Storage::disk('public')->url($path).'"'.$after.'>';
            },
            $html
        );
    }
}
