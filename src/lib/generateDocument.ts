import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order } from '../context/CMSContext';
import { VITORRA_LOGO_BASE64 } from './logoData';

/* ═══════════════════════════════════════════════════════════════════
   Vitorra Document Generator v2
   Generates structured, numbered-section PDF documents inspired by
   professional trade proforma invoices.

   Sections:
   1. Invoice No / Date
   2. Customer Details
   3. Item Details (with pricing breakdown)
   4. Shipping / Freight
   5. Payment (bank details — proforma) / Payment Received (invoice)
   6. Documents
   7. Terms & Conditions
   8. Contact
   9. Notes
   ═══════════════════════════════════════════════════════════════════ */

export interface CompanySettings {
  general: {
    companyName: string;
    supportEmail: string;
    supportPhone: string;
    address: string;
    registrationNumber?: string;
  };
  banking: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchName: string;
    swiftCode: string;
    currency: string;
    additionalInstructions?: string;
  };
  invoicing: {
    companyTIN?: string;
    invoicePrefix: string;
    proformaPrefix: string;
    invoiceFooter: string;
    proformaValidityDays: number;
    showBankDetailsOnInvoice: boolean;
  };
  financials: {
    currency: string;
  };
}

type DocType = 'proforma' | 'invoice';

const GOLD = [180, 155, 50] as const;
const DARK = [15, 18, 25] as const;
const MUTED = [120, 125, 135] as const;
const WHITE = [255, 255, 255] as const;
const BLACK = [30, 30, 30] as const;
const LIGHT_BG = [248, 248, 250] as const;
const SECTION_LABEL_BG = [235, 235, 240] as const;
const PAYMENT_BG = [255, 252, 235] as const;    // Warm yellow tint for payment box
const GREEN = [34, 139, 34] as const;
const GREEN_BG = [240, 250, 240] as const;

function formatPrice(amount: number, currency = 'UGX'): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/* ─── Section Label Helper ──────────────────────────────────── */
function drawSectionLabel(
  doc: jsPDF, sectionNum: number, label: string,
  x: number, y: number, width: number
): number {
  doc.setFillColor(...SECTION_LABEL_BG);
  doc.rect(x, y, width * 0.28, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...BLACK);
  doc.text(`${sectionNum}. ${label}`, x + 2, y + 4.2);
  return y + 8;
}

/* ─── Row helper (label : value on a line) ──────────────────── */
function drawRow(
  doc: jsPDF, label: string, value: string,
  x: number, y: number, labelW = 35, bold = false
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`${label}:`, x, y);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text(value, x + labelW, y);
  return y + 5;
}

/* ─── Check page overflow ───────────────────────────────────── */
function checkPage(doc: jsPDF, y: number, needed: number, margin: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 25) {
    doc.addPage();
    return margin;
  }
  return y;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════ */
export function generateDocument(
  order: Order,
  type: DocType,
  settings: CompanySettings
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const currency = settings.financials.currency || 'UGX';
  const rightCol = pageWidth - margin;

  const title = type === 'proforma' ? 'PROFORMA INVOICE' : 'INVOICE';
  const docNumber = type === 'proforma'
    ? `${settings.invoicing.proformaPrefix}${order.id.replace(/[^0-9]/g, '').slice(-6)}`
    : `${settings.invoicing.invoicePrefix}${order.id.replace(/[^0-9]/g, '').slice(-6)}`;

  let y = margin;

  /* ────────────────────────────────────────────────────────────────
     HEADER — Logo left, Company info right
     ──────────────────────────────────────────────────────────────── */
  const logoSize = 18;

  // Logo (top-left)
  try {
    doc.addImage(VITORRA_LOGO_BASE64, 'PNG', margin, y - 3, logoSize, logoSize);
  } catch { /* logo load failed, skip silently */ }

  // Document type title (next to logo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  doc.text(title, margin + logoSize + 4, y + 6);

  // Company name (right aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GOLD);
  doc.text(settings.general.companyName, rightCol, y + 4, { align: 'right' });

  // Company details (right aligned, below name)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  const companyLines = [
    settings.general.address,
    `TEL: ${settings.general.supportPhone}  EMAIL: ${settings.general.supportEmail}`,
  ];
  if (settings.invoicing.companyTIN) {
    companyLines.push(`TIN: ${settings.invoicing.companyTIN}`);
  }
  companyLines.forEach((line, i) => {
    doc.text(line, rightCol, y + 9 + i * 3.5, { align: 'right' });
  });

  y += 20 + companyLines.length * 2;

  // Gold line separator
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(margin, y, rightCol, y);
  y += 3;

  // Thin dark line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, y, rightCol, y);
  y += 6;

  /* ────────────────────────────────────────────────────────────────
     SECTION 1 — INVOICE NO / DATE
     ──────────────────────────────────────────────────────────────── */
  y = drawSectionLabel(doc, 1, 'Invoice No.', margin, y, contentWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(docNumber, margin + 2, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Date: ${formatDate(order.date || order.createdAt)}`, rightCol, y, { align: 'right' });
  y += 8;

  /* ────────────────────────────────────────────────────────────────
     SECTION 2 — CUSTOMER
     ──────────────────────────────────────────────────────────────── */
  y = drawSectionLabel(doc, 2, 'Customer', margin, y, contentWidth);

  // Customer No
  y = drawRow(doc, 'Customer No', order.customerId || 'N/A', margin + 2, y, 28);
  y = drawRow(doc, 'Name', order.customerName || 'Customer', margin + 2, y, 28, true);

  if (order.billingAddress || order.shippingAddress) {
    const addr = order.billingAddress || order.shippingAddress;
    const addrLines = doc.splitTextToSize(addr, contentWidth - 35);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Address:', margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    doc.text(addrLines, margin + 30, y);
    y += addrLines.length * 4 + 1;
  }

  if (order.phone) y = drawRow(doc, 'Tel', order.phone, margin + 2, y, 28);
  if (order.customerEmail) y = drawRow(doc, 'E-mail', order.customerEmail, margin + 2, y, 28);

  y += 4;

  /* ────────────────────────────────────────────────────────────────
     SECTION 3 — DETAILS (ITEMS TABLE)
     ──────────────────────────────────────────────────────────────── */
  y = checkPage(doc, y, 50, margin);
  y = drawSectionLabel(doc, 3, 'Details', margin, y, contentWidth);

  // Items table
  const tableData = order.items.map((item, idx) => [
    (idx + 1).toString(),
    item.name,
    item.quantity.toString(),
    formatPrice(item.price, currency),
    formatPrice(item.price * item.quantity, currency),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: [...BLACK] as [number, number, number],
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [...DARK] as [number, number, number],
      textColor: [...WHITE] as [number, number, number],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [...LIGHT_BG] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // Subtotal / Tax / Total rows (right-aligned)
  const totalsX = rightCol - 70;
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = order.total - subtotal;

  // Subtotal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.15);
  doc.line(totalsX, y, rightCol, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Subtotal', totalsX, y);
  doc.setTextColor(...BLACK);
  doc.text(formatPrice(subtotal, currency), rightCol, y, { align: 'right' });
  y += 5;

  if (tax > 0) {
    doc.setTextColor(...MUTED);
    doc.text('Tax/Duties', totalsX, y);
    doc.setTextColor(...BLACK);
    doc.text(formatPrice(tax, currency), rightCol, y, { align: 'right' });
    y += 5;
  }

  // Shipping
  doc.setTextColor(...MUTED);
  doc.text('Shipping', totalsX, y);
  doc.setTextColor(...BLACK);
  doc.text('Included', rightCol, y, { align: 'right' });
  y += 3;

  // Total bar
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, rightCol, y);
  y += 2;
  doc.setFillColor(...DARK);
  doc.roundedRect(totalsX - 2, y - 1, 74, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text('TOTAL', totalsX + 3, y + 5.5);
  doc.setTextColor(...GOLD);
  doc.text(formatPrice(order.total, currency), rightCol, y + 5.5, { align: 'right' });
  y += 16;

  /* ────────────────────────────────────────────────────────────────
     SECTION 4 — SHIPPING / FREIGHT
     ──────────────────────────────────────────────────────────────── */
  y = checkPage(doc, y, 25, margin);
  y = drawSectionLabel(doc, 4, 'Shipping', margin, y, contentWidth);

  const shipMethod = order.shippingMethod === 'pickup' ? 'Self Pickup from Warehouse' : 'Vitorra Logistics Delivery';
  y = drawRow(doc, 'Method', shipMethod, margin + 2, y, 32);

  if (order.shippingAddress) {
    const shipAddr = doc.splitTextToSize(order.shippingAddress, contentWidth - 35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Delivery to:', margin + 2, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    doc.text(shipAddr, margin + 34, y);
    y += shipAddr.length * 4 + 1;
  }

  if (order.carrier) {
    y = drawRow(doc, 'Carrier', order.carrier, margin + 2, y, 32);
  }
  if (order.trackingNumber) {
    y = drawRow(doc, 'Tracking No', order.trackingNumber, margin + 2, y, 32, true);
  }
  if (order.estimatedDelivery) {
    y = drawRow(doc, 'Est. Delivery', formatDate(order.estimatedDelivery), margin + 2, y, 32);
  }

  y += 4;

  /* ────────────────────────────────────────────────────────────────
     SECTION 5 — PAYMENT
     ──────────────────────────────────────────────────────────────── */
  y = checkPage(doc, y, 55, margin);

  if (type === 'proforma' && settings.invoicing.showBankDetailsOnInvoice) {
    y = drawSectionLabel(doc, 5, 'Payment', margin, y, contentWidth);

    // Payment instruction header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text(`Please remit ${formatPrice(order.total, currency)} to:`, margin + 2, y);
    y += 6;

    // Bank details box (yellow-tinted like reference)
    const bankBoxH = 42;
    doc.setFillColor(...PAYMENT_BG);
    doc.roundedRect(margin, y, contentWidth, bankBoxH, 2, 2, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, bankBoxH, 2, 2, 'S');

    const bank = settings.banking;
    const bx = margin + 4;
    let by = y + 5;

    const bankRows = [
      { label: 'Account name', value: bank.accountName },
      { label: 'Account', value: bank.accountNumber },
      { label: 'Bank name', value: bank.bankName },
      { label: 'Bank branch', value: bank.branchName },
      { label: 'Swift code', value: bank.swiftCode },
      { label: 'Bank charges', value: 'Sender pays (Bank transfer fees are not included in this amount)' },
      { label: 'Message', value: `Invoice No. ${docNumber}` },
    ];

    bankRows.forEach(row => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(`${row.label}:`, bx, by);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...BLACK);
      const valLines = doc.splitTextToSize(row.value, contentWidth - 50);
      doc.text(valLines, bx + 32, by);
      by += valLines.length * 4 + 1.5;
    });

    y += bankBoxH + 6;
  }

  if (type === 'invoice') {
    y = drawSectionLabel(doc, 5, 'Payment Received', margin, y, contentWidth);

    const payBoxH = 28;
    doc.setFillColor(...GREEN_BG);
    doc.roundedRect(margin, y, contentWidth, payBoxH, 2, 2, 'F');
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, payBoxH, 2, 2, 'S');

    const payRows = [
      { label: 'Amount Paid', value: formatPrice(order.paymentAmount || order.total, currency) },
      { label: 'Method', value: (order.paymentMethod || 'Bank Transfer').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) },
      { label: 'Reference', value: order.paymentReference || order.id },
      { label: 'Date', value: formatDate(order.paymentDate || order.date || order.createdAt) },
    ];

    const px = margin + 4;
    let py = y + 5;
    payRows.forEach(row => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(`${row.label}:`, px, py);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...BLACK);
      doc.text(row.value, px + 30, py);
      py += 6;
    });

    y += payBoxH + 6;
  }

  /* ────────────────────────────────────────────────────────────────
     SECTION 6 — DOCUMENTS
     ──────────────────────────────────────────────────────────────── */
  y = checkPage(doc, y, 18, margin);
  y = drawSectionLabel(doc, 6, 'Documents', margin, y, contentWidth);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLACK);
  const docsText = type === 'proforma'
    ? 'This proforma invoice is provided for quotation purposes. A final invoice will be issued upon payment confirmation.'
    : 'This invoice serves as confirmation of the completed transaction. All documents are sent digitally via email.';
  const docsLines = doc.splitTextToSize(docsText, contentWidth - 5);
  doc.text(docsLines, margin + 2, y);
  y += docsLines.length * 4 + 4;

  /* ────────────────────────────────────────────────────────────────
     SECTION 7 — TERMS & CONDITIONS
     ──────────────────────────────────────────────────────────────── */
  y = checkPage(doc, y, 20, margin);
  y = drawSectionLabel(doc, 7, type === 'proforma' ? 'Terms' : 'Terms & Conditions', margin, y, contentWidth);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);

  if (type === 'proforma') {
    const terms = [
      `Shipping starts after FULL payment is received.`,
      `The quoted price does not include import duties or local handling charges unless stated otherwise.`,
      `All prices are in ${currency}.`,
    ];
    terms.forEach(t => {
      doc.text(t, margin + 2, y);
      y += 4;
    });
  } else {
    doc.text('All sales are final. Returns and refunds are subject to Vitorra Holdings policy.', margin + 2, y);
    y += 4;
    doc.text(`All amounts are stated in ${currency}.`, margin + 2, y);
    y += 4;
  }

  y += 2;

  /* ────────────────────────────────────────────────────────────────
     SECTION 8 — CONTACT
     ──────────────────────────────────────────────────────────────── */
  y = checkPage(doc, y, 14, margin);
  y = drawSectionLabel(doc, 8, 'Contact', margin, y, contentWidth);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLACK);
  doc.text(
    `Contact us by email at ${settings.general.supportEmail} or by phone at ${settings.general.supportPhone}.`,
    margin + 2, y
  );
  y += 6;

  /* ────────────────────────────────────────────────────────────────
     SECTION 9 — NOTES / REGULATIONS
     ──────────────────────────────────────────────────────────────── */
  if (order.notes || order.adminNotes) {
    y = checkPage(doc, y, 18, margin);
    y = drawSectionLabel(doc, 9, 'Notes', margin, y, contentWidth);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    const noteText = order.adminNotes || order.notes || '';
    const noteLines = doc.splitTextToSize(noteText, contentWidth - 5);
    doc.text(noteLines, margin + 2, y);
    y += noteLines.length * 4 + 4;
  }

  /* ────────────────────────────────────────────────────────────────
     VALIDITY (proforma only)
     ──────────────────────────────────────────────────────────────── */
  if (type === 'proforma') {
    y = checkPage(doc, y, 12, margin);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    doc.line(margin, y, rightCol, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    doc.text(
      `Validity of quotation: ${settings.invoicing.proformaValidityDays} days`,
      pageWidth / 2, y,
      { align: 'center' }
    );
    y += 8;
  }

  /* ────────────────────────────────────────────────────────────────
     FOOTER — Company tagline + generation date
     ──────────────────────────────────────────────────────────────── */
  const pageH = doc.internal.pageSize.getHeight();
  const footerY = pageH - 16;

  // Thin separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.15);
  doc.line(margin, footerY, rightCol, footerY);

  // Footer tagline (italic, centered)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  const footerText = settings.invoicing.invoiceFooter.replace(/[^\x20-\x7E]/g, '');
  doc.text(footerText, pageWidth / 2, footerY + 5, { align: 'center' });

  // Small generation timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text(
    `${settings.general.companyName} - Generated ${formatDate(new Date().toISOString())}`,
    pageWidth / 2, footerY + 10,
    { align: 'center' }
  );

  /* ────────────────────────────────────────────────────────────────
     SAVE
     ──────────────────────────────────────────────────────────────── */
  const filename = `${title.replace(/\s+/g, '_')}_${docNumber}.pdf`;
  doc.save(filename);
}
