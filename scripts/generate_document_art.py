#!/usr/bin/env python3
"""Cut the quotation / invoice artwork into the pieces the PDF templates use.

Source: the Finance team's approved designs ("Quote Coffee.png", "Quote FET.png",
"Invoice Coffee,FET.png", built into Vitorra_Quote_Invoice_Manager_DESIGN.html).
The two full-resolution quotation pages are kept in scripts/document-art-src/.

The PDFs are real layouts, not text pasted over a picture, so they hold any
number of line items and stay sharp. Only the artwork is taken from the
designs: the logo, the contact icons, the product photography, the section
bars and the totals panel. The words printed on that artwork are painted out
here and set as live text by the Blade template
(backend/resources/views/documents/branded.blade.php).

Output: backend/resources/document-art/*  (read by dompdf from disk)

    python3 scripts/generate_document_art.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "document-art-src"
OUT = ROOT / "backend" / "resources" / "document-art"
OUT.mkdir(parents=True, exist_ok=True)

COFFEE = Image.open(SRC / "coffee-quote.png").convert("RGB")
FET = Image.open(SRC / "fet-quote.png").convert("RGB")


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def erase_rows(im, x0, x1, y0, y1):
    """Paint out text by blending each row between clean pixels either side."""
    px = im.load()
    for y in range(y0, y1):
        left, right = px[x0 - 1, y], px[x1, y]
        for x in range(x0, x1):
            px[x, y] = lerp(left, right, (x - x0) / max(1, x1 - x0))


def erase_cols(im, x0, x1, y0, y1):
    """Paint out text by blending each column between clean pixels above/below."""
    px = im.load()
    for x in range(x0, x1):
        top, bottom = px[x, y0 - 1], px[x, y1]
        for y in range(y0, y1):
            px[x, y] = lerp(top, bottom, (y - y0) / max(1, y1 - y0))


def soften(im, box):
    """Vertical smoothing of a painted-out area, so no row-to-row streaks show."""
    x0, y0, x1, y1 = box
    r = im.crop(box)
    r = r.resize((r.width, max(2, r.height // 6)), Image.BILINEAR).resize(r.size, Image.BILINEAR)
    im.paste(r, (x0, y0))


def column_fill(im, x_src, y0, y1, x0, x1):
    """Fill x0..x1 with the vertical colour profile of one clean column."""
    px = im.load()
    for y in range(y0, y1):
        c = px[x_src, y]
        for x in range(x0, x1):
            px[x, y] = c


def save(im, name, **kw):
    im.save(OUT / name, **kw)
    print("wrote", name, im.size)


# ── Logo and contact icons (identical on every page) ─────────────────────────
save(COFFEE.crop((70, 15, 312, 238)), "logo.png", optimize=True)
for name, box in {
    "ic-pin": (38, 250, 72, 284),
    "ic-phone": (38, 304, 72, 334),
    "ic-mail": (38, 334, 72, 362),
    "ic-building": (38, 360, 72, 392),
}.items():
    save(COFFEE.crop(box), f"{name}.png", optimize=True)

# Gold section icons (on white) and the gold rule under section headings.
save(COFFEE.crop((55, 1090, 100, 1135)), "ic-terms.png", optimize=True)
save(COFFEE.crop((45, 1285, 110, 1330)), "ic-accept.png", optimize=True)
save(COFFEE.crop((46, 1131, 1008, 1136)), "rule-gold.png", optimize=True)

# ── Section bars (icon kept, heading text painted out) ───────────────────────
bar_l = COFFEE.crop((44, 448, 520, 492))
erase_rows(bar_l, 63, 470, 8, 38)          # "CUSTOMER / BUYER"
soften(bar_l, (63, 8, 470, 38))
save(bar_l, "bar-person.png", optimize=True)
bar_r = COFFEE.crop((536, 448, 1012, 492))
erase_rows(bar_r, 68, 470, 5, 40)          # "QUOTATION INFORMATION"
soften(bar_r, (68, 5, 470, 40))
save(bar_r, "bar-document.png", optimize=True)

# Table header: a clean strip; column rules are drawn by the template.
thead = COFFEE.crop((44, 698, 1012, 738))
column_fill(thead, 8, 0, thead.height, 9, thead.width - 4)
save(thead, "table-head.png", optimize=True)

# Totals panel: three rows, labels and figures painted out.
tot = COFFEE.crop((577, 1010, 1011, 1110))
erase_rows(tot, 8, 222, 4, 96)              # label cells
erase_rows(tot, 236, 428, 4, 96)            # value cells
save(tot, "totals.png", optimize=True)

# Footer strip (dark slanted tab, bottom right).
foot = COFFEE.crop((690, 1440, 1054, 1482))
erase_rows(foot, 46, 340, 8, 36)
save(foot, "footer-tab.png", optimize=True)
save(COFFEE.crop((44, 1432, 1010, 1438)), "rule-footer.png", optimize=True)

# ── Headers: product photography + title band, one per business × title ─────
TITLE_FONT = SRC / "Cinzel.ttf"
SUB_FONT = SRC / "Montserrat.ttf"
SCALE = 2


def font(path, size, weight):
    f = ImageFont.truetype(str(path), size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def fit(draw, text, path, weight, max_w, start):
    size = start
    while size > 10:
        f = font(path, size, weight)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return font(path, size, weight)


def tracked(draw, xy_right, text, f, spacing, fill):
    """Right-aligned text with letter-spacing (PIL has no tracking)."""
    widths = [draw.textlength(ch, font=f) for ch in text]
    total = sum(widths) + spacing * (len(text) - 1)
    x, y = xy_right[0] - total, xy_right[1]
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=f, fill=fill)
        x += w + spacing


HEADERS = {
    "coffee": (COFFEE, "VITORRA COFFEE"),
    "fet": (FET, "FUEL ECO TECH (FET)"),
}
TITLES = {
    "quotation": "QUOTATION",
    "invoice": "INVOICE",
    "commercial": "COMMERCIAL INVOICE",
    "final": "FINAL INVOICE",
}

def repaint_band(im):
    """Repaint the inside of the dark title band (which carries the printed
    title) with the band's own colours, sampled row by row from its clean
    right-hand end. The band's slanted edge and gold sweep stay original."""
    w, h = im.size
    px = im.load()
    top, bottom = 350, 441
    profile = {y: px[w - 3, y] for y in range(top, bottom)}
    fill = Image.new("RGB", (w, h))
    fp = fill.load()
    for y in range(top, bottom):
        for x in range(w):
            fp[x, y] = profile[y]
    k = 4  # supersampled mask for a clean anti-aliased diagonal
    mask = Image.new("L", (w * k, h * k), 0)
    ImageDraw.Draw(mask).polygon(
        [(376 * k, top * k), (w * k, top * k), (w * k, bottom * k), (240 * k, bottom * k)], fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    im.paste(fill, (0, 0), mask)


for biz, (page, subtitle) in HEADERS.items():
    head = page.crop((330, 0, page.width, 450))
    # The end of the address line runs into this crop. The photograph fades
    # horizontally there, so blend each row across it.
    erase_rows(head, 1, 86 if biz == "coffee" else 100, 250, 304)
    region = (0, 244, 92, 310)
    head.paste(head.crop(region).filter(ImageFilter.GaussianBlur(5)), region[:2])
    repaint_band(head)
    # On the original page the photograph faded into the artwork behind the
    # contact lines; here it sits on plain white, so fade its left edge out.
    fade = Image.new("L", head.size, 0)
    fd = ImageDraw.Draw(fade)
    for x in range(140):
        fd.line((x, 0, x, 340), fill=int(255 * (1 - x / 140) ** 1.6))
    head.paste((255, 255, 255), (0, 0, head.width, head.height), fade)
    head = head.resize((head.width * SCALE, head.height * SCALE), Image.LANCZOS)
    right = (1016 - 330) * SCALE
    for kind, title in TITLES.items():
        im = head.copy()
        d = ImageDraw.Draw(im)
        tf = fit(d, title, TITLE_FONT, 700, (1016 - 650) * SCALE, 54 * SCALE)
        d.text((right, 405 * SCALE), title, font=tf, fill=(255, 255, 255), anchor="rs")
        sf = font(SUB_FONT, 16 * SCALE, 600)
        tracked(d, (right, 417 * SCALE), subtitle, sf, 9 * SCALE, (231, 184, 79))
        save(im, f"head-{biz}-{kind}.jpg", quality=88, optimize=True)
