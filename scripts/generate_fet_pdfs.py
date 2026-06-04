"""
Generate the two downloadable FET PDFs served from the site:
  - frontend/public/downloads/vitorra-fet-application-guide.pdf
  - frontend/public/downloads/vitorra-fet-datasheet.pdf

Source data: the FET application overviews + line pricing in the project root.
IMPORTANT: these public documents deliberately OMIT the base RRP (margin) column
and any customer PII. The datasheet shows only the public Kampala selling prices.

Run:  python scripts/generate_fet_pdfs.py   (requires reportlab)
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable,
)
from reportlab.lib.enums import TA_LEFT
from PIL import Image as PILImage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "frontend", "public", "downloads")
LOGO = os.path.join(ROOT, "frontend", "public", "logo.png")
os.makedirs(OUT, exist_ok=True)

GOLD       = colors.HexColor("#C5B27A")
GOLD_DARK  = colors.HexColor("#7A6020")
CHARCOAL   = colors.HexColor("#1E1E1E")
IVORY      = colors.HexColor("#F2F2F2")
LIGHTROW   = colors.HexColor("#FAFAF8")
BODY       = colors.HexColor("#454545")
MUTED      = colors.HexColor("#8A8A8A")
WHITE      = colors.white

CONTACT = "vitorra.org   ·   support@vitorra.org   ·   +256 740 026 118"
ADDRESS = "Vitorra Holdings Limited · Padre Pio House, Plot 32, Lumumba Avenue, Kampala, Uganda"

# ── Styles ────────────────────────────────────────────────────────────────
def styles():
    return {
        "title":   ParagraphStyle("title", fontName="Times-Bold", fontSize=21, leading=24, textColor=CHARCOAL),
        "sub":     ParagraphStyle("sub", fontName="Helvetica", fontSize=9.5, leading=13, textColor=MUTED),
        "eyebrow": ParagraphStyle("eyebrow", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=GOLD_DARK),
        "h2":      ParagraphStyle("h2", fontName="Times-Bold", fontSize=14, leading=17, textColor=GOLD_DARK, spaceBefore=10, spaceAfter=5),
        "body":    ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=14, textColor=BODY, alignment=TA_LEFT),
        "cellH":   ParagraphStyle("cellH", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=WHITE),
        "cell":    ParagraphStyle("cell", fontName="Helvetica", fontSize=8.5, leading=11, textColor=BODY),
        "cellB":   ParagraphStyle("cellB", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=CHARCOAL),
        "note":    ParagraphStyle("note", fontName="Helvetica-Oblique", fontSize=8, leading=11, textColor=MUTED),
    }

def logo_flowable(h_mm=16):
    w, h = PILImage.open(LOGO).size
    height = h_mm * mm
    width = height * (w / h)
    return Image(LOGO, width=width, height=height)

def header(title, subtitle, S):
    return [
        logo_flowable(),
        Spacer(1, 6),
        Paragraph(title, S["title"]),
        Paragraph(subtitle, S["sub"]),
        Spacer(1, 4),
        HRFlowable(width="100%", thickness=2, color=GOLD, spaceBefore=2, spaceAfter=10),
    ]

def data_table(headers, rows, S, col_widths):
    body_rows = [[Paragraph(c, S["cellH"]) for c in headers]]
    for r in rows:
        body_rows.append([Paragraph(c, S["cellB"] if i == len(r) - 1 else S["cell"]) for i, c in enumerate(r)])
    t = Table(body_rows, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), CHARCOAL),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#E6E2D8")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    for i in range(1, len(body_rows)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), LIGHTROW))
    t.setStyle(TableStyle(style))
    return t

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#E6E2D8"))
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 16 * mm, A4[0] - 18 * mm, 16 * mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 11 * mm, CONTACT)
    canvas.drawRightString(A4[0] - 18 * mm, 11 * mm, f"Page {doc.page}")
    canvas.setFont("Helvetica", 6.5)
    canvas.drawString(18 * mm, 7.5 * mm, ADDRESS)
    canvas.restoreState()

def build(path, flowables):
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=22 * mm,
        title=os.path.basename(path),
    )
    doc.build(flowables, onFirstPage=footer, onLaterPages=footer)
    print("wrote", path)

# ── Document 1: Vehicle Application Guide ─────────────────────────────────
def application_guide():
    S = styles()
    W = A4[0] - 36 * mm
    cw = [W * 0.22, W * 0.18, W * 0.40, W * 0.20]
    flow = header("Fuel Eco Tech — Vehicle Application Guide",
                  "Which FET fits your vehicle? · A quick reference for fleets and owners", S)

    flow.append(Paragraph(
        "Fuel Eco Tech fits petrol and diesel engines right across the range — from small cars, "
        "mini-buses, and vans, through SUVs and light trucks, up to heavy long-haul trucks of 40 tonnes. "
        "Four device sizes (FI–FIV) cover every class. The exact fit for your specific vehicles is "
        "confirmed during your free fuel-savings assessment.", S["body"]))
    flow.append(Spacer(1, 10))

    flow.append(Paragraph("Passenger cars, SUVs &amp; sports", S["h2"]))
    flow.append(data_table(
        ["Vehicle class", "Engine", "Typical vehicles", "FET model"],
        [
            ["Small cars", "1.0L", "Polo, Fiesta, Picanto", "FET-PRO-FI"],
            ["Compact class", "1.4–2.0L", "Golf, A3, Corolla, GTI", "FET-PRO-FI"],
            ["Mid-range", "2.0L", "Passat, 3-Series", "FET-PRO-FI"],
            ["Mid-range performance", "2.5L", "Audi RS3", "FET-PRO-FII"],
            ["Compact &amp; large SUV", "1.5–3.0L", "Tiguan, Q3, RAV4, X5, GLE", "FET-PRO-FII"],
            ["Upper class", "3.0L", "5-Series, E-Class", "FET-PRO-FII"],
            ["Sports cars", "2.0–3.0L", "Supra, Porsche 911", "FET-PRO-FII"],
            ["Performance V8 / luxury", "4.0L", "S-Class, X5M, G63", "FET-PRO-FIII"],
            ["Super-sports", "4.0–6.5L", "Ferrari, Lamborghini", "FET-PRO-FIII"],
        ], S, cw))
    flow.append(Spacer(1, 12))

    flow.append(Paragraph("Vans, buses &amp; trucks", S["h2"]))
    flow.append(data_table(
        ["Vehicle class", "Weight / size", "Typical application", "FET model"],
        [
            ["Mini-bus / Van", "up to 3.5t · 1.6–2.0L", "Shuttle, taxi, standard transport", "FET-PRO-FI"],
            ["Mini-bus / Van", "up to 3.5t · 2.2–3.0L", "Payload-oriented, trailer / hills", "FET-PRO-FII"],
            ["Transporter / Sprinter", "3.5–5.0t", "Local transport, 5t-class", "FET-PRO-FII"],
            ["Light trucks", "5–12t · 3.0–6.7L", "City &amp; distribution traffic", "FET-PRO-FIII"],
            ["Medium trucks", "12–18t · 7.7–9.0L", "Regional &amp; long-distance", "FET-PRO-FIII"],
            ["Heavy trucks", "up to 40t · 10–16L", "Long-haul &amp; heavy load", "FET-PRO-FIV"],
        ], S, cw))
    flow.append(Spacer(1, 10))

    flow.append(Paragraph(
        "Class is assigned from the fuel-line inner diameter, flow rate, engine power and displacement, "
        "injection system, and typical usage. Fitting sizes (SAE 5/16\"–3/4\") and final selection are "
        "confirmed at assessment. Where supply lines are metal, they are procured in advance for installation.",
        S["note"]))
    flow.append(Spacer(1, 6))
    flow.append(Paragraph(
        "<b>Ready to start?</b> Request a free fuel-savings assessment at vitorra.org/enquire — we'll confirm "
        "the right device for your fleet and share tailored pricing.", S["body"]))

    build(os.path.join(OUT, "vitorra-fet-application-guide.pdf"), flow)

# ── Document 2: Product Datasheet ─────────────────────────────────────────
def datasheet():
    S = styles()
    W = A4[0] - 36 * mm
    flow = header("Fuel Eco Tech — Product Datasheet",
                  "Validated fuel-saving technology for fleets and vehicles", S)

    flow.append(Paragraph("What it is", S["h2"]))
    flow.append(Paragraph(
        "Fuel Eco Tech (FET) is a physical fuel-optimisation device fitted into the fuel line, between the "
        "fuel pump and filter — outside the high-pressure system. Its patented swirl chamber improves how the "
        "air-fuel mixture is prepared, so combustion is cleaner and more complete on every cycle. There is no "
        "modification to the engine, injection system, or electronics, and the manufacturer warranty is not "
        "affected. Fitted in under an hour.", S["body"]))

    flow.append(Paragraph("Proven results — independent field test", S["h2"]))
    flow.append(Paragraph(
        "In an official test report by CTI GmbH (Lippstadt, Germany), a VW T5 recorded a "
        "<b>13.9% reduction</b> in fuel consumption in the first full month after installation — from "
        "11.52 to 9.92 litres/100km over a 13,468 km verified baseline. Signed by Holger Walprecht, "
        "10 November 2025.", S["body"]))

    flow.append(Paragraph("The range &amp; pricing", S["h2"]))
    cw = [W * 0.20, W * 0.50, W * 0.30]
    flow.append(data_table(
        ["Model", "Fits", "From (per device, installed)"],
        [
            ["FET-PRO-FI",   "Compact &amp; mid cars, mini-buses, vans (1.4–2.0L)", "EUR 365.40"],
            ["FET-PRO-FII",  "SUVs, large cars, Sprinter vans (1.5–3.0L)",          "EUR 630.71"],
            ["FET-PRO-FIII", "Light &amp; medium trucks (3.0–9.0L)",                "EUR 1,028.69"],
            ["FET-PRO-FIV",  "Heavy trucks up to 40 tonnes (10–16L)",               "EUR 1,957.30"],
        ], S, cw))
    flow.append(Spacer(1, 4))
    flow.append(Paragraph(
        "Prices are per device, landed in Kampala and including professional installation. Larger fleets "
        "qualify for volume pricing, applied at the quote stage.", S["note"]))

    flow.append(Paragraph("Benefits", S["h2"]))
    for b in [
        "<b>Lower fuel costs</b> — reduce diesel and petrol consumption across your fleet.",
        "<b>Extended engine life</b> — a cleaner burn means fewer deposits and less wear.",
        "<b>Reduced emissions</b> — more efficient combustion lowers harmful exhaust output.",
        "<b>Measurable ROI</b> — we benchmark consumption before and after, so savings are visible.",
    ]:
        flow.append(Paragraph("•&nbsp;&nbsp;" + b, S["body"]))

    flow.append(Paragraph("Certifications", S["h2"]))
    flow.append(Paragraph(
        "ISO 9001:2015 · ISO 14001:2015 · ISO 27001 · Zurich product liability · "
        "Independently lab-validated by AVL Technologies · German-certified by qm-solutions GmbH.", S["body"]))
    flow.append(Spacer(1, 4))
    flow.append(Paragraph("Warranty: 1 year. Returns accepted when the product is undamaged.", S["note"]))

    flow.append(Spacer(1, 8))
    flow.append(Paragraph(
        "<b>Request a free fuel-savings assessment</b> at vitorra.org/enquire — no obligation, reply within 24 hours.",
        S["body"]))

    build(os.path.join(OUT, "vitorra-fet-datasheet.pdf"), flow)

if __name__ == "__main__":
    application_guide()
    datasheet()
