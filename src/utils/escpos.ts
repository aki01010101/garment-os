/**
 * ESC/POS Thermal Printer Protocol Engine & Driver for Garment OS.
 * Supports:
 * - Everycom (EC-58, EC-80, POS-58, POS-80) & all standard ESC/POS thermal printers.
 * - Direct Web Bluetooth API (Zero external apps needed on Android / Chrome).
 * - Instant 1-Click RawBT Android Intent (for Classic Bluetooth / SPP / USB OTG).
 * - 58mm (32 columns) and 80mm (48 columns) paper roll formats.
 */

import {
  SaleTransaction,
  AlterationRecord,
  CreditNote,
  CustomerCreditPayment,
  Customer,
  KhataLedgerEntry,
} from '../types';
import { buildUpiPaymentUri } from './upi';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export interface EscPosOptions {
  columns?: 32 | 48; // 32 for 58mm (2-inch), 48 for 80mm (3-inch)
  codePrintType?: 'barcode' | 'qr'; // invoice code format (default: 'barcode')
  includeInvoiceCode?: boolean; // whether to print invoice barcode or QR (default: true)
  includeUpiQr?: boolean; // whether to print UPI payment QR (default: true)
  storeUpiId?: string;
  storeUpiName?: string;
  upiAmount?: number;
  includeReviewQr?: boolean;
  reviewUrl?: string;
  reviewPromptText?: string;
  autoCut?: boolean;
  kickDrawer?: boolean;
  isCompositionGst?: boolean;
}

// Common Bluetooth GATT Services for ESC/POS Thermal Printers (Everycom, TVS, Epson, MPT-II, POS-58)
export const THERMAL_PRINTER_BLUETOOTH_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer GATT Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Common OEM Thermal Printer Service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART (Everycom EC-58, EC-80, POS-58)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2540 Serial Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Custom SPP-over-BLE Service
];

/**
 * Low-level ESC/POS Binary Command Builder
 */
export class EscPosBuilder {
  private buffer: number[] = [];
  private columns: number;

  constructor(columns: 32 | 48 = 32) {
    this.columns = columns;
  }

  // Initialize printer (clears print buffer and resets modes)
  initialize(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  // Text alignment: 0=Left, 1=Center, 2=Right
  align(alignment: 'left' | 'center' | 'right'): this {
    const val = alignment === 'center' ? 0x01 : alignment === 'right' ? 0x02 : 0x00;
    this.buffer.push(0x1b, 0x61, val); // ESC a n
    return this;
  }

  // Bold mode
  bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  // Text size multipliers
  textSize(size: 'normal' | 'double-height' | 'double-width' | 'double'): this {
    let val = 0x00;
    if (size === 'double-height') val = 0x01;
    else if (size === 'double-width') val = 0x10;
    else if (size === 'double') val = 0x11;
    this.buffer.push(0x1d, 0x21, val); // GS ! n
    return this;
  }

  // Underline
  underline(enable: boolean): this {
    this.buffer.push(0x1b, 0x2d, enable ? 0x01 : 0x00); // ESC - n
    return this;
  }

  // Clean ASCII converter that safely handles ₹ (INR), quotes, dashes
  private sanitizeText(text: string): string {
    return text
      .replace(/[₹\u20B9]/g, 'Rs. ')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2022]/g, '*');
  }

  // Append raw text string
  text(str: string): this {
    const clean = this.sanitizeText(str);
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      this.buffer.push(code <= 255 ? code : 63); // 63 = '?' fallback
    }
    return this;
  }

  // Append text followed by line feed
  line(str: string = ''): this {
    if (str) this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  // Horizontal divider rule
  separator(char: string = '-'): this {
    const bar = char.repeat(this.columns);
    return this.line(bar);
  }

  // Double horizontal divider rule
  doubleSeparator(): this {
    return this.separator('=');
  }

  // Two-column row (e.g. "Label:" on left, "Value" on right)
  twoColumnRow(left: string, right: string, bold: boolean = false): this {
    const cleanLeft = this.sanitizeText(left);
    const cleanRight = this.sanitizeText(right);
    const spaceNeeded = this.columns - cleanLeft.length - cleanRight.length;

    if (bold) this.bold(true);
    if (spaceNeeded > 0) {
      this.line(cleanLeft + ' '.repeat(spaceNeeded) + cleanRight);
    } else {
      this.line(cleanLeft + ' ' + cleanRight);
    }
    if (bold) this.bold(false);
    return this;
  }

  // Formatted multi-column table row
  tableRow(columns: { text: string; width: number; align?: 'left' | 'center' | 'right' }[]): this {
    let rowStr = '';
    columns.forEach((col) => {
      const clean = this.sanitizeText(col.text).slice(0, col.width);
      const pad = col.width - clean.length;
      if (pad <= 0) {
        rowStr += clean;
      } else if (col.align === 'right') {
        rowStr += ' '.repeat(pad) + clean;
      } else if (col.align === 'center') {
        const leftPad = Math.floor(pad / 2);
        const rightPad = pad - leftPad;
        rowStr += ' '.repeat(leftPad) + clean + ' '.repeat(rightPad);
      } else {
        rowStr += clean + ' '.repeat(pad);
      }
    });
    return this.line(rowStr);
  }

  // ESC/POS Native 2D QR Code (Model 2)
  qrCode(data: string, sizeMultiplier: number = 7): this {
    if (!data) return this;
    const cleanData = this.sanitizeText(data);
    const len = cleanData.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. Set QR Code Model (Model 2)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

    // 2. Set QR Code Size (1 to 16, default 7 for 58mm ~32mm full-size, 10 for 80mm ~45mm)
    const validSize = Math.max(1, Math.min(16, sizeMultiplier));
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, validSize);

    // 3. Set Error Correction Level (48 = L 7%, 49 = M 15%)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);

    // 4. Store Data in QR Symbol Storage Area
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < cleanData.length; i++) {
      this.buffer.push(cleanData.charCodeAt(i));
    }

    // 5. Print the QR Code
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    this.buffer.push(0x0a);
    return this;
  }

  // ESC/POS Code 128 1D Barcode
  barcode128(data: string, height: number = 44, showText: boolean = true): this {
    if (!data) return this;
    const cleanData = data.replace(/[^0-9A-Za-z_-]/g, '').trim();
    if (!cleanData) return this;

    this.align('center');

    // 1. Set barcode height (1 to 255 dots)
    this.buffer.push(0x1d, 0x68, Math.min(255, Math.max(20, height)));

    // 2. Set barcode module width (2 = standard for 58mm, 3 for 80mm)
    this.buffer.push(0x1d, 0x77, this.columns === 48 ? 0x03 : 0x02);

    // 3. Set HRI characters print position (0 = none, 2 = below)
    this.buffer.push(0x1d, 0x48, showText ? 0x02 : 0x00);

    // 4. Set HRI font (1 = Font B, clean smaller mono)
    this.buffer.push(0x1d, 0x66, 0x01);

    // 5. Print Code 128 (GS k 73 len {B data)
    const codeSetB = [0x7B, 0x42]; // '{B' selects Code 128 subset B (alphanumeric)
    const dataBytes: number[] = [];
    for (let i = 0; i < cleanData.length; i++) {
      dataBytes.push(cleanData.charCodeAt(i));
    }

    const payload = [...codeSetB, ...dataBytes];
    this.buffer.push(0x1d, 0x6b, 0x49, payload.length, ...payload);
    this.buffer.push(0x0a);
    return this;
  }

  // Feed n lines
  feed(lines: number = 3): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  // Auto Guillotine Paper Cut
  cut(partial: boolean = false): this {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, partial ? 0x01 : 0x00); // GS V 0 or GS V 1
    return this;
  }

  // Kick Cash Drawer (Pin 2 or Pin 5)
  kickDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
    return this;
  }

  /**
   * ESC/POS Raster Bit Image (GS v 0) - Pitch-black 203 DPI pixel-perfect graphic printing.
   * Directly sends 1-bit monochrome pixel array to Everycom & standard ESC/POS printers.
   * Produces an exact replica of what is drawn on canvas with zero halftoning artifacts.
   */
  rasterImage(canvas: HTMLCanvasElement): this {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return this;

      const width = canvas.width;
      const height = canvas.height;
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Width in bytes (each byte represents 8 horizontal dots, MSB first)
      const widthBytes = Math.ceil(width / 8);
      const xL = widthBytes & 0xff;
      const xH = (widthBytes >> 8) & 0xff;
      const yL = height & 0xff;
      const yH = (height >> 8) & 0xff;

      // Reset line spacing (ESC 2) and left alignment (ESC a 0)
      this.buffer.push(0x1b, 0x32);
      this.buffer.push(0x1b, 0x61, 0x00);

      // GS v 0 m xL xH yL yH d1...dk
      // m = 0: Normal mode (1 dot = 1 printer pixel at 203 DPI)
      this.buffer.push(0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH);

      for (let y = 0; y < height; y++) {
        for (let bx = 0; bx < widthBytes; bx++) {
          let byteVal = 0;
          for (let bit = 0; bit < 8; bit++) {
            const x = bx * 8 + bit;
            if (x < width) {
              const offset = (y * width + x) * 4;
              const r = data[offset];
              const g = data[offset + 1];
              const b = data[offset + 2];
              const a = data[offset + 3];

              // Pixel is printed if opaque and dark (luminance < 175)
              const isDark = a >= 128 && (0.299 * r + 0.587 * g + 0.114 * b < 175);
              if (isDark) {
                byteVal |= 1 << (7 - bit);
              }
            }
          }
          this.buffer.push(byteVal);
        }
      }
    } catch (err) {
      console.warn('EscPosBuilder.rasterImage error:', err);
    }
    return this;
  }

  // Export finalized byte array
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Format a Sale Transaction into ESC/POS thermal printer bytes
 */
export function formatSaleToEscPos(receipt: SaleTransaction, options: EscPosOptions = {}): Uint8Array {
  const columns = options.columns || 32;
  const builder = new EscPosBuilder(columns);

  const formattedDate = new Date(receipt.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(receipt.date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalItemsCount = receipt.items.reduce((sum, item) => sum + item.qty, 0);
  const paymentModeLabel =
    receipt.paymentMode === 'Split' && receipt.splitBreakdown
      ? `Split (Cash: Rs.${receipt.splitBreakdown.cash.toFixed(0)}, UPI: Rs.${receipt.splitBreakdown.upi.toFixed(0)}, Card: Rs.${receipt.splitBreakdown.card.toFixed(0)})`
      : receipt.paymentMode;

  builder.initialize();

  // Kick cash drawer if cash sale
  if (options.kickDrawer || receipt.paymentMode === 'Cash') {
    builder.kickDrawer();
  }

  // 1. STORE HEADER
  builder
    .align('center')
    .bold(true)
    .textSize(columns === 48 ? 'double-width' : 'normal')
    .line((receipt.companyName || 'GARMENT STORE').toUpperCase())
    .textSize('normal')
    .bold(false);

  if (receipt.companyAddress) {
    builder.line(receipt.companyAddress);
  }
  if (receipt.companyPhone) {
    builder.line(`Tel: ${receipt.companyPhone}`);
  }
  if (options.isCompositionGst) {
    if (receipt.companyTaxId && receipt.companyTaxId !== 'RETAIL-CASH-UNREG') {
      builder.line(`GSTIN: ${receipt.companyTaxId}`);
    }
    builder.bold(true).line('BILL OF SUPPLY').bold(false);
    builder.line('(Composition Scheme - Tax Not Charged)');
  } else if (receipt.companyTaxId && receipt.companyTaxId !== 'RETAIL-CASH-UNREG') {
    builder.line(`GSTIN: ${receipt.companyTaxId}`);
  } else {
    builder.line('Retail Cash Memo');
  }

  // 2. INVOICE METADATA
  builder.doubleSeparator();
  builder
    .align('left')
    .twoColumnRow('Invoice No:', receipt.invoiceNumber, true)
    .twoColumnRow('Date/Time:', `${formattedDate} ${formattedTime}`)
    .twoColumnRow('Customer:', receipt.customerName || 'Walk-in Customer');

  if (receipt.customerPhone && receipt.customerPhone !== 'N/A') {
    builder.twoColumnRow('Phone:', receipt.customerPhone);
  }

  // 2b. INVOICE CODE (BARCODE / QR)
  if (options.includeInvoiceCode !== false && receipt.invoiceNumber) {
    const isQr = options.codePrintType === 'qr';
    const invoiceClean = receipt.invoiceNumber.replace(/[^0-9A-Za-z_-]/gi, '');

    builder.line();
    if (isQr) {
      builder.align('center');
      builder.qrCode(invoiceClean, columns === 48 ? 10 : 7);
      builder.bold(true).line(receipt.invoiceNumber).bold(false);
    } else {
      builder.barcode128(invoiceClean, 44, true);
    }
  }

  // 3. ITEMS TABLE
  builder.separator('-');
  if (columns === 32) {
    // 58mm (32 chars): ITEM(14) | QTY(4) | RATE(6) | TOTAL(8)
    builder.bold(true);
    builder.tableRow([
      { text: 'ITEM', width: 14, align: 'left' },
      { text: 'QTY', width: 4, align: 'center' },
      { text: 'RATE', width: 6, align: 'right' },
      { text: 'TOTAL', width: 8, align: 'right' },
    ]);
    builder.bold(false);
    builder.separator('-');

    receipt.items.forEach((item) => {
      // First line: Garment name
      builder.bold(true).line(item.name).bold(false);

      // Second line: Variant + Table columns
      const variantText = `[${item.size}/${item.color}]`.slice(0, 14);
      builder.tableRow([
        { text: variantText, width: 14, align: 'left' },
        { text: `${item.qty}`, width: 4, align: 'center' },
        { text: `${item.unitPrice.toFixed(0)}`, width: 6, align: 'right' },
        { text: `${item.total.toFixed(0)}`, width: 8, align: 'right' },
      ]);

      if (item.discountAmount > 0) {
        builder.line(`  * Disc: -Rs.${item.discountAmount.toFixed(0)} (${item.discountPercent || 0}%)`);
      }
      if (item.alteration?.needed) {
        builder.line(`  * Alter: ${item.alteration.notes}`);
      }
    });
  } else {
    // 80mm (48 chars): ITEM(20) | SIZE/COL(10) | QTY(4) | RATE(6) | TOTAL(8)
    builder.bold(true);
    builder.tableRow([
      { text: 'ITEM', width: 20, align: 'left' },
      { text: 'VARIANTS', width: 10, align: 'left' },
      { text: 'QTY', width: 4, align: 'center' },
      { text: 'RATE', width: 6, align: 'right' },
      { text: 'TOTAL', width: 8, align: 'right' },
    ]);
    builder.bold(false);
    builder.separator('-');

    receipt.items.forEach((item) => {
      builder.tableRow([
        { text: item.name, width: 20, align: 'left' },
        { text: `${item.size}/${item.color}`, width: 10, align: 'left' },
        { text: `${item.qty}`, width: 4, align: 'center' },
        { text: `${item.unitPrice.toFixed(0)}`, width: 6, align: 'right' },
        { text: `${item.total.toFixed(0)}`, width: 8, align: 'right' },
      ]);

      if (item.discountAmount > 0) {
        builder.line(`  * Disc: -Rs.${item.discountAmount.toFixed(2)} (${item.discountPercent || 0}%)`);
      }
      if (item.alteration?.needed) {
        builder.line(`  * Alteration: ${item.alteration.notes} (Due: ${item.alteration.promisedDate})`);
      }
    });
  }

  // 4. FINANCIAL SUMMARY
  builder.separator('-');
  builder.twoColumnRow(`Subtotal (${totalItemsCount} pcs):`, `Rs. ${receipt.subtotal.toFixed(2)}`);

  if (receipt.itemDiscountsTotal > 0) {
    builder.twoColumnRow('Item Discounts:', `-Rs. ${receipt.itemDiscountsTotal.toFixed(2)}`);
  }
  if (receipt.promoDiscountAmount && receipt.promoDiscountAmount > 0) {
    builder.twoColumnRow(
      `Offer (${receipt.promoTitleApplied || 'Promo'}):`,
      `-Rs. ${receipt.promoDiscountAmount.toFixed(2)}`
    );
  }
  if (receipt.couponDiscountAmount && receipt.couponDiscountAmount > 0) {
    builder.twoColumnRow('Coupon Discount:', `-Rs. ${receipt.couponDiscountAmount.toFixed(2)}`);
  }
  if (receipt.loyaltyDiscountAmount && receipt.loyaltyDiscountAmount > 0) {
    builder.twoColumnRow('Loyalty Redeemed:', `-Rs. ${receipt.loyaltyDiscountAmount.toFixed(2)}`);
  }
  if (receipt.creditNoteDiscountAmount && receipt.creditNoteDiscountAmount > 0) {
    builder.twoColumnRow('Credit Note Used:', `-Rs. ${receipt.creditNoteDiscountAmount.toFixed(2)}`);
  }
  // GST Notice (Never print tax breakdown amounts on consumer receipts)
  builder.twoColumnRow('GST:', 'Included in Price');

  // 5. NET PAYABLE (HIGHLIGHTED)
  builder.doubleSeparator();
  builder
    .bold(true)
    .twoColumnRow('NET PAYABLE:', `Rs. ${receipt.grandTotal.toFixed(2)}`, true)
    .twoColumnRow('Paid via:', receipt.paymentMode, true)
    .bold(false);

  if (receipt.paymentMode === 'Split' && receipt.splitBreakdown) {
    if (receipt.splitBreakdown.cash > 0) {
      builder.twoColumnRow(' - Cash Paid:', `Rs. ${receipt.splitBreakdown.cash.toFixed(2)}`);
    }
    if (receipt.splitBreakdown.upi > 0) {
      builder.twoColumnRow(' - UPI Paid:', `Rs. ${receipt.splitBreakdown.upi.toFixed(2)}`);
    }
    if (receipt.splitBreakdown.card > 0) {
      builder.twoColumnRow(' - Card Paid:', `Rs. ${receipt.splitBreakdown.card.toFixed(2)}`);
    }
    if (receipt.splitBreakdown.credit && receipt.splitBreakdown.credit > 0) {
      builder.twoColumnRow(' - On Khata/Credit:', `Rs. ${receipt.splitBreakdown.credit.toFixed(2)}`);
    }
  }

  // Credit / Udhaar Notice, Debt Acknowledgment & Signature
  const isCreditSale =
    receipt.paymentMode === 'Credit' ||
    Boolean(receipt.creditAmount && receipt.creditAmount > 0) ||
    Boolean(receipt.splitBreakdown?.credit && receipt.splitBreakdown.credit > 0);
  const hasPrevBalance = Boolean(receipt.customerPreviousBalance && receipt.customerPreviousBalance > 0);
  const showKhataMemo = isCreditSale || hasPrevBalance || Boolean(receipt.customerSignature);

  if (showKhataMemo) {
    const prevBal = receipt.customerPreviousBalance || 0;
    const thisCredit =
      receipt.creditAmount !== undefined
        ? receipt.creditAmount
        : receipt.paymentMode === 'Credit'
          ? receipt.grandTotal
          : (receipt.splitBreakdown?.credit || 0);
    const totalOutstanding =
      receipt.customerNewBalance !== undefined
        ? receipt.customerNewBalance
        : prevBal + thisCredit;

    builder.separator('-');
    builder.align('center').bold(true).line('*** KHATA / UDHAAR ACKNOWLEDGMENT ***').bold(false);
    builder.align('left');
    if (prevBal > 0) {
      builder.twoColumnRow('Previous Khata:', `Rs. ${prevBal.toFixed(2)}`);
    }
    if (thisCredit > 0) {
      builder.twoColumnRow('This Bill Credit:', `Rs. ${thisCredit.toFixed(2)}`, true);
    }
    builder.bold(true).twoColumnRow('TOTAL OUTSTANDING:', `Rs. ${totalOutstanding.toFixed(2)}`, true).bold(false);
    if (receipt.creditDueDate) {
      builder.twoColumnRow('Promised Due Date:', receipt.creditDueDate, true);
    }
    builder.separator('-');
    builder.align('center');
    builder.line('I acknowledge the balance above and');
    builder.line('agree to clear the outstanding debt.');

    if (receipt.customerSignature) {
      builder.feed(1);
      builder.bold(true).line('[ DIGITALLY SIGNED BY CUSTOMER ]').bold(false);
      builder.line(`Customer: ${receipt.customerName}`);
      if (receipt.customerSignedAt) {
        const signDate = new Date(receipt.customerSignedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        builder.line(`Signed: ${signDate}`);
      }
    } else {
      builder.feed(1);
      builder.line('Customer Signature: __________________');
      builder.line(`(${receipt.customerName})`);
    }
  }

  // 6. SAVINGS CALLOUT
  const totalSavings =
    (receipt.itemDiscountsTotal || 0) +
    (receipt.promoDiscountAmount || 0) +
    (receipt.couponDiscountAmount || 0) +
    (receipt.loyaltyDiscountAmount || 0);

  if (totalSavings > 0) {
    builder.separator('-');
    builder
      .align('center')
      .bold(true)
      .line(`*** YOU SAVED Rs. ${totalSavings.toFixed(2)} ON THIS BILL! ***`)
      .bold(false);
  }

  // 6b. DYNAMIC UPI PAYMENT QR CODE
  const upiId = (options.storeUpiId || '').trim();
  const shouldPrintUpi = options.includeUpiQr !== false && Boolean(upiId);

  if (shouldPrintUpi && upiId) {
    const payeeName = (options.storeUpiName || receipt.companyName || 'Store Merchant').trim();
    const upiAmount =
      options.upiAmount !== undefined
        ? options.upiAmount
        : receipt.paymentMode === 'UPI'
        ? receipt.grandTotal
        : (receipt.splitBreakdown?.upi || receipt.grandTotal);

    const upiUri = buildUpiPaymentUri({
      upiId,
      payeeName,
      amount: upiAmount,
      transactionNote: `Bill ${receipt.invoiceNumber}`,
    });

    if (upiUri) {
      builder.separator('-');
      builder
        .align('center')
        .bold(true)
        .line('SCAN & PAY VIA UPI')
        .bold(false)
        .qrCode(upiUri, columns === 48 ? 10 : 7)
        .bold(true)
        .line(`Rs. ${upiAmount.toFixed(2)} · ${upiId}`)
        .bold(false)
        .line('GPay · PhonePe · Paytm · BHIM');
    }
  }

  // 7. GOOGLE REVIEW QR / PROMPT
  const reviewUrl = options.reviewUrl || receipt.googleReviewUrl;
  if (options.includeReviewQr !== false && reviewUrl) {
    builder.separator('-');
    builder
      .align('center')
      .bold(true)
      .line(options.reviewPromptText || 'RATE US 5 STARS ON GOOGLE!')
      .bold(false)
      .line('Scan QR with your phone camera:')
      .qrCode(reviewUrl, columns === 48 ? 10 : 7);
  }

  // 8. STORE POLICY & FOOTER
  builder.separator('-');
  builder
    .align('center')
    .line(`Policy: ${receipt.companyReturnPolicy || 'Exchange within 7 days with tag intact'}`)
    .bold(true)
    .line('Thank you for shopping with us!')
    .bold(false)
    .line(`Visit Again · ${receipt.companyName || 'Store'}`);

  // Cut receipt
  if (options.autoCut !== false) {
    builder.cut();
  } else {
    builder.feed(4);
  }

  return builder.build();
}

/**
 * Generate a quick test receipt for printer testing
 */
export function formatTestReceipt(options: EscPosOptions = {}): Uint8Array {
  const columns = options.columns || 32;
  const builder = new EscPosBuilder(columns);

  builder
    .initialize()
    .align('center')
    .bold(true)
    .textSize(columns === 48 ? 'double-width' : 'normal')
    .line('EVERYCOM THERMAL PRINTER')
    .textSize('normal')
    .line('Garment OS Print Test')
    .doubleSeparator()
    .align('left')
    .twoColumnRow('Printer Model:', columns === 32 ? 'Everycom EC-58 (58mm)' : 'Everycom EC-80 (80mm)')
    .twoColumnRow('Paper Width:', columns === 32 ? '58mm / 32 Columns' : '80mm / 48 Columns')
    .twoColumnRow('Connection:', 'Direct Web Bluetooth / RawBT')
    .twoColumnRow('Status:', 'ONLINE & VERIFIED OK', true)
    .twoColumnRow('Timestamp:', new Date().toLocaleTimeString())
    .separator('-')
    .align('center')
    .line('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    .line('abcdefghijklmnopqrstuvwxyz')
    .line('0123456789 - Rs. 1,299.00')
    .separator('-')
    .line('Testing 2D QR Code:')
    .qrCode('https://garment-os-sandy.vercel.app', columns === 48 ? 6 : 4)
    .doubleSeparator()
    .line('READY FOR HIGH-SPEED RETAIL BILLING')
    .feed(3)
    .cut();

  return builder.build();
}

/**
 * Trigger Instant One-Click Print via RawBT Android App
 * Uses the standard rawbt:base64,<data> URI scheme registered by the RawBT Print Service app.
 */
export function printViaRawBT(payload: Uint8Array): { success: boolean; error?: string } {
  try {
    let binary = '';
    const bytes = payload;
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);

    // Create temporary link to trigger Android intent
    const link = document.createElement('a');
    link.href = `rawbt:base64,${base64Data}`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);

    return { success: true };
  } catch (err: any) {
    console.error('RawBT print error:', err);
    return { success: false, error: err.message || 'Failed to trigger RawBT intent' };
  }
}

// In-memory cache for paired Bluetooth device to avoid asking every single bill
let cachedBluetoothDevice: any = null;
let cachedWriteCharacteristic: any = null;

// In-memory cache for WebUSB printer device
let cachedUsbDevice: any = null;
let cachedUsbEndpointNumber: number | null = null;
let cachedUsbInterfaceNumber: number = 0;

// In-memory cache for Web Serial port (for Bluetooth SPP / COM ports like COM4)
let cachedSerialPort: any = null;

/**
 * Check if Web Bluetooth API is supported in the current browser
 */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Check if WebUSB API is supported in the current browser
 */
export function isWebUsbSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/**
 * Check if Web Serial API is supported in the current browser (Chrome, Edge, Opera on Windows/Mac/Linux)
 */
export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

/**
 * Query the local Garment OS server bridge for detected thermal printers and COM ports
 */
export async function detectLocalPrinters(): Promise<{
  printers: Array<{ Name: string; DriverName: string; PortName: string }>;
  ports: Array<{ DeviceID: string; Name: string; Description: string }>;
}> {
  try {
    const res = await fetch('/api/printers');
    if (!res.ok) return { printers: [], ports: [] };
    return await res.json();
  } catch {
    return { printers: [], ports: [] };
  }
}

/**
 * Direct Local Bridge Print (Calls local Vite dev server / native Windows spooler)
 * Directly writes raw binary ESC/POS bytecode to Windows thermal printer (Everycom-58-Series) or COM port (COM4)
 * with zero halftoning, 203 DPI dark quality, and 100% reliability.
 */
export async function printViaLocalBridge(
  payload: Uint8Array,
  options?: { printerName?: string; portName?: string },
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  try {
    onStatusUpdate?.('Sending ESC/POS payload to Everycom spooler...');
    let binary = '';
    const len = payload.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(payload[i]);
    }
    const base64Data = btoa(binary);

    const res = await fetch('/api/print-thermal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: base64Data,
        printerName: options?.printerName || 'Everycom-58-Series',
        portName: options?.portName,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Local print returned status ${res.status}`);
    }

    onStatusUpdate?.('Print complete!');
    return { success: true, deviceName: data.target || options?.printerName || 'Everycom-58-Series' };
  } catch (err: any) {
    console.warn('Local bridge print error:', err);
    return { success: false, error: err.message || 'Local printer communication failed.' };
  }
}

/**
 * Web Serial API Print (Direct connection to Bluetooth SPP COM ports like COM4 or USB Serial on PC)
 */
export async function printViaWebSerial(
  payload: Uint8Array,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  if (!isWebSerialSupported()) {
    return {
      success: false,
      error: 'Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge.',
    };
  }

  const navSerial = (navigator as any).serial;
  let port = cachedSerialPort;

  try {
    if (!port) {
      const ports = await navSerial.getPorts();
      if (ports && ports.length > 0) {
        port = ports[0];
      }
    }

    if (!port) {
      onStatusUpdate?.('Select Bluetooth printer port (e.g. Standard Serial / COM4)...');
      port = await navSerial.requestPort();
      if (!port) {
        return { success: false, error: 'No serial port selected.' };
      }
    }

    cachedSerialPort = port;

    onStatusUpdate?.('Connecting to serial port...');
    if (!port.readable || !port.writable) {
      try {
        await port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
      } catch (openErr: any) {
        console.warn('Port open notice:', openErr);
      }
    }

    onStatusUpdate?.('Streaming ESC/POS to printer...');
    const writer = port.writable.getWriter();
    await writer.write(payload);
    writer.releaseLock();

    onStatusUpdate?.('Print complete!');
    return { success: true, deviceName: 'Bluetooth / Serial Port' };
  } catch (err: any) {
    console.error('Web Serial print error:', err);
    cachedSerialPort = null;
    if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
      return { success: false, error: 'Port selection was cancelled.' };
    }
    return { success: false, error: err.message || 'Serial printing failed.' };
  }
}

/**
 * Helper to inspect primary services and locate a writable ESC/POS characteristic
 */
async function findWritableCharacteristic(server: any): Promise<any> {
  // Try known printer services first
  for (const serviceUuid of THERMAL_PRINTER_BLUETOOTH_SERVICES) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          return char;
        }
      }
    } catch {}
  }

  // Fallback: scan all available primary services
  try {
    const services = await server.getPrimaryServices();
    for (const service of services) {
      try {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            return char;
          }
        }
      } catch {}
    }
  } catch {}

  return null;
}

/**
 * Direct Web Bluetooth Print
 * Automatically detects whether to use Local Bridge (COM4 for Bluetooth Classic on Windows),
 * Web Serial, or Web Bluetooth (for BLE devices).
 */
export async function printViaWebBluetooth(
  payload: Uint8Array,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  // 1. On Windows with local server, Bluetooth thermal printers connect to COM4 / COM3.
  // Try printing directly via local bridge to COM4 first if available!
  onStatusUpdate?.('Connecting to Bluetooth Thermal Printer (COM4)...');
  const bridgeRes = await printViaLocalBridge(payload, { portName: 'COM4' }, onStatusUpdate);
  if (bridgeRes.success) {
    return { success: true, deviceName: 'Everycom Bluetooth (COM4)' };
  }

  // 2. If local bridge was unreachable, try Web Serial API (Chrome/Edge native port picker for Bluetooth SPP)
  if (isWebSerialSupported()) {
    onStatusUpdate?.('Attempting Bluetooth via Web Serial API...');
    const serialRes = await printViaWebSerial(payload, onStatusUpdate);
    if (serialRes.success) {
      return serialRes;
    }
  }

  // 3. Fallback to Web Bluetooth (BLE GATT) for Android or BLE-capable thermal printers
  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      error: 'Bluetooth printing failed. Ensure the printer is paired over Bluetooth (COM4) or use the USB Direct print method.',
    };
  }

  const navBluetooth = (navigator as any).bluetooth;
  let device = cachedBluetoothDevice;
  let server: any = null;

  try {
    if (device) {
      try {
        if (!device.gatt?.connected) {
          onStatusUpdate?.(`Reconnecting to paired printer (${device.name || 'Bluetooth Printer'})...`);
          server = await device.gatt.connect();
        } else {
          server = device.gatt;
        }
      } catch (reconnectErr) {
        console.warn('Reconnecting to cached Bluetooth device failed:', reconnectErr);
        device = null;
        cachedBluetoothDevice = null;
        cachedWriteCharacteristic = null;
      }
    }

    if (!device) {
      onStatusUpdate?.('Requesting Everycom / Bluetooth Printer...');
      device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: THERMAL_PRINTER_BLUETOOTH_SERVICES,
      });

      if (!device) {
        return { success: false, error: 'No printer device selected.' };
      }

      cachedBluetoothDevice = device;

      device.addEventListener('gattserverdisconnected', () => {
        console.log('Printer GATT disconnected; retaining paired device reference');
        cachedWriteCharacteristic = null;
      });

      onStatusUpdate?.(`Connecting to ${device.name || 'Everycom Printer'}...`);
      server = await device.gatt.connect();
    }

    onStatusUpdate?.('Discovering printer communication channel...');
    let writeChar = await findWritableCharacteristic(server);

    if (!writeChar && (!server || !server.connected)) {
      server = await device.gatt.connect();
      writeChar = await findWritableCharacteristic(server);
    }

    if (!writeChar) {
      return {
        success: false,
        deviceName: device.name,
        error: `Could not find a writable ESC/POS channel on ${device.name || 'printer'}. Ensure printer is powered on and in ESC/POS mode.`,
      };
    }

    cachedWriteCharacteristic = writeChar;

    onStatusUpdate?.(`Printing to ${device.name || 'Everycom Printer'}...`);

    const CHUNK_SIZE = 64;
    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      try {
        if (writeChar.properties.writeWithoutResponse) {
          await writeChar.writeValueWithoutResponse(chunk);
        } else {
          await writeChar.writeValue(chunk);
        }
      } catch (writeErr: any) {
        console.warn('GATT write failed, attempting reconnect...', writeErr);
        server = await device.gatt.connect();
        writeChar = await findWritableCharacteristic(server);
        cachedWriteCharacteristic = writeChar;
        if (!writeChar) throw writeErr;

        if (writeChar.properties.writeWithoutResponse) {
          await writeChar.writeValueWithoutResponse(chunk);
        } else {
          await writeChar.writeValue(chunk);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    onStatusUpdate?.('Print complete!');
    return { success: true, deviceName: device.name || 'Everycom Printer' };
  } catch (err: any) {
    console.error('Web Bluetooth print error:', err);
    cachedWriteCharacteristic = null;

    if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
      cachedBluetoothDevice = null;
      return { success: false, error: 'Printer connection was cancelled.' };
    }
    return { success: false, error: err.message || 'Bluetooth printing failed. Ensure printer is turned on and in range.' };
  }
}

/**
 * Direct USB Print
 * Tries local bridge to Windows Everycom driver first (bypassing GDI halftoning for pure 203 DPI dark print),
 * then falls back to WebUSB API if bridge is not available.
 */
export async function printViaWebUsb(
  payload: Uint8Array,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  // 1. Try local Windows RAW Spooler API first (100% reliable on Windows, zero driver dithering, instant!)
  onStatusUpdate?.('Connecting to Everycom USB Printer...');
  const bridgeRes = await printViaLocalBridge(payload, { printerName: 'Everycom-58-Series' }, onStatusUpdate);
  if (bridgeRes.success) {
    return { success: true, deviceName: 'Everycom-58-Series (USB)' };
  }

  // 2. If local bridge was unreachable, try WebUSB (for Android or systems with WinUSB driver)
  if (!isWebUsbSupported()) {
    return {
      success: false,
      error: bridgeRes.error || 'USB printing failed. Please ensure the Everycom USB printer is plugged in and turned on.',
    };
  }

  const navUsb = (navigator as any).usb;
  let device = cachedUsbDevice;

  try {
    if (!device || !device.opened) {
      onStatusUpdate?.('Requesting USB Thermal Printer...');
      device = await navUsb.requestDevice({ filters: [] });
      if (!device) {
        return { success: false, error: 'No USB printer device selected.' };
      }

      onStatusUpdate?.(`Opening ${device.productName || 'USB Thermal Printer'}...`);
      await device.open();
    }

    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    let interfaceNumber = cachedUsbInterfaceNumber;
    let endpointNumber = cachedUsbEndpointNumber;

    if (endpointNumber === null) {
      const interfaces = device.configuration?.interfaces || [];
      for (const iface of interfaces) {
        for (const alt of iface.alternates || []) {
          const outEp = alt.endpoints?.find(
            (ep: any) => ep.direction === 'out' && (ep.type === 'bulk' || ep.type === 'interrupt')
          );
          if (outEp) {
            interfaceNumber = iface.interfaceNumber;
            endpointNumber = outEp.endpointNumber;
            break;
          }
        }
        if (endpointNumber !== null) break;
      }
    }

    if (endpointNumber === null) {
      return {
        success: false,
        deviceName: device.productName,
        error: 'No USB OUT data channel found on printer.',
      };
    }

    try {
      await device.claimInterface(interfaceNumber);
    } catch (claimErr: any) {
      console.warn('USB interface claim notice:', claimErr);
    }

    cachedUsbDevice = device;
    cachedUsbInterfaceNumber = interfaceNumber;
    cachedUsbEndpointNumber = endpointNumber;

    onStatusUpdate?.(`Streaming ESC/POS to ${device.productName || 'USB Printer'}...`);

    const CHUNK_SIZE = 512;
    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      await device.transferOut(endpointNumber, chunk);
    }

    onStatusUpdate?.('USB print complete!');
    return { success: true, deviceName: device.productName || 'USB Thermal Printer' };
  } catch (err: any) {
    console.error('WebUSB print error:', err);
    cachedUsbDevice = null;
    cachedUsbEndpointNumber = null;

    if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
      return { success: false, error: 'USB printer selection was cancelled.' };
    }
    return {
      success: false,
      error: err.message?.includes('Access denied')
        ? 'USB Port Locked: The Windows Everycom driver has locked the USB port. The local bridge has been engaged.'
        : err.message || 'USB printing failed.',
    };
  }
}

/**
 * Disconnect and forget cached Bluetooth / Serial printer
 */
export function disconnectBluetoothPrinter(): void {
  try {
    if (cachedBluetoothDevice && cachedBluetoothDevice.gatt && cachedBluetoothDevice.gatt.connected) {
      cachedBluetoothDevice.gatt.disconnect();
    }
  } catch {}
  try {
    if (cachedSerialPort && cachedSerialPort.close) {
      cachedSerialPort.close();
    }
  } catch {}
  cachedBluetoothDevice = null;
  cachedWriteCharacteristic = null;
  cachedSerialPort = null;
}

export function forgetBluetoothPrinter(): void {
  disconnectBluetoothPrinter();
}

/**
 * Disconnect and close cached USB printer
 */
export function disconnectUsbPrinter(): void {
  try {
    if (cachedUsbDevice && cachedUsbDevice.opened) {
      cachedUsbDevice.close();
    }
  } catch {}
  cachedUsbDevice = null;
  cachedUsbEndpointNumber = null;
}

export interface PriceTagItem {
  product: {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    category?: string;
    subCategory?: string;
    size?: string;
    color?: string;
    sellingPrice: number;
  };
  brandTitle?: string;
  contactNumber?: string;
  codeType?: 'barcode' | 'qr';
  saleOfferPercentage?: number;
  rollSize?: '50x25' | '50x32';
}

/**
 * Render an apparel price tag (50mm x 25mm or 50mm x 32mm) onto an HTML5 Canvas at 203 DPI.
 * Standard 50x25mm uses 384 x 192 px; 50x32mm uses 384 x 240 px.
 * Matches the live screen UI preview pixel-for-pixel:
 * - Brand Name & Contact Number header with divider line
 * - Garment Name, Category, and Color
 * - Left: 2D QR Code (or 1D Barcode) with scannable modules and code string underneath
 * - Right: Size (clean text display), Price label, big selling price (or strikethrough original + discounted price), and (INCL. TAXES)
 */
export function renderTagToCanvas(
  tag: PriceTagItem,
  options?: { rollSize?: '50x25' | '50x32' }
): HTMLCanvasElement {
  const rollSize = options?.rollSize || tag.rollSize || '50x25';
  const is25mm = rollSize === '50x25';

  const canvas = document.createElement('canvas');
  canvas.width = 384; // 48mm printable width at 203 DPI (8 dots/mm)
  canvas.height = is25mm ? 192 : 240; // 24mm height for 50x25, 30mm height for 50x32
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Crisp white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.textBaseline = 'top';

  const {
    product,
    brandTitle = 'FANTASY',
    contactNumber = '+919416109928',
    codeType = 'qr',
    saleOfferPercentage = 0,
  } = tag;

  const discountedPrice =
    saleOfferPercentage > 0
      ? Math.round(product.sellingPrice * (1 - saleOfferPercentage / 100))
      : product.sellingPrice;

  const leftX = 10;
  const rightX = 374;

  if (is25mm) {
    // 50mm x 25mm Compact Layout (192 dots height)

    // 1. TOP HEADER: Brand Title (left) & Phone Number (right)
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((brandTitle || 'FANTASY').toUpperCase(), leftX, 3);

    ctx.font = 'bold 11px "JetBrains Mono", Courier, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(contactNumber, rightX, 5);

    // Top header rule
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(leftX, 19);
    ctx.lineTo(rightX, 19);
    ctx.stroke();

    // 2. PRODUCT NAME (Bold, single line, truncated with ellipsis if exceeding label width)
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    let name = product.name || 'Apparel Item';
    const maxNameWidth = rightX - leftX;
    if (ctx.measureText(name).width > maxNameWidth) {
      while (ctx.measureText(name + '...').width > maxNameWidth && name.length > 3) {
        name = name.slice(0, -1);
      }
      name = name + '...';
    }
    ctx.fillText(name, leftX, 22);

    // 3. CATEGORY & COLOR
    const catParts = [product.category, product.subCategory].filter((c) => c && c !== 'General');
    const catText = (catParts.length > 0 ? catParts.join(' · ') : 'GARMENT').toUpperCase();
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    ctx.fillText(catText, leftX, 38);

    if (product.color) {
      ctx.font = 'bold 10px "JetBrains Mono", Courier, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(product.color, rightX, 38);
    }

    // Subheader dividing rule
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX, 50);
    ctx.lineTo(rightX, 50);
    ctx.stroke();

    // 4. BOTTOM SPLIT (y = 53 to 188)
    const codeValue = (product.barcode || product.sku || '000000').trim();

    if (codeType === 'qr') {
      try {
        const qr = QRCode.create(codeValue, { errorCorrectionLevel: 'M' });
        const size = qr.modules.size;
        const targetSize = 88;
        const cellSize = Math.floor(targetSize / size);
        const actualSize = cellSize * size;
        const qrStartX = leftX + 4;
        const qrStartY = 54;

        ctx.fillStyle = '#000000';
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (qr.modules.get(r, c)) {
              ctx.fillRect(qrStartX + c * cellSize, qrStartY + r * cellSize, cellSize, cellSize);
            }
          }
        }

        // Center text under QR code
        ctx.font = 'bold 10px "JetBrains Mono", Courier, monospace';
        ctx.textAlign = 'center';
        const textCenterX = qrStartX + Math.floor(actualSize / 2);
        ctx.fillText(codeValue, textCenterX, qrStartY + actualSize + 4);
      } catch (err) {
        console.warn('QR canvas render error:', err);
      }
    } else {
      // 1D Barcode (Code 128)
      try {
        const Code128Module = (JsBarcode as any).getModule
          ? (JsBarcode as any).getModule('CODE128')
          : null;

        if (Code128Module) {
          const encoder = new Code128Module(codeValue, {});
          const encoded = encoder.encode();
          const bitString: string = encoded.data || '';

          if (bitString) {
            const barcodeWidth = 135;
            const barcodeHeight = 55;
            const barWidth = barcodeWidth / bitString.length;
            const barStartX = leftX + 4;
            const barStartY = 64;

            ctx.fillStyle = '#000000';
            for (let i = 0; i < bitString.length; i++) {
              if (bitString[i] === '1') {
                ctx.fillRect(barStartX + i * barWidth, barStartY, Math.ceil(barWidth), barcodeHeight);
              }
            }

            ctx.font = 'bold 10px "JetBrains Mono", Courier, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(codeValue, barStartX + barcodeWidth / 2, barStartY + barcodeHeight + 4);
          }
        }
      } catch (err) {
        console.warn('Barcode render error:', err);
      }
    }

    // 4. BOTTOM 3 COLUMNS:
    // LEFT: QR Code / 1D Barcode (centered under code)
    // CENTER: PRICE (Label, Value, (INCL. TAXES))
    // RIGHT: SIZE (Label, Value)

    // CENTER COLUMN: SELLING PRICE
    const centerX = 205;
    ctx.textAlign = 'center';

    // PRICE LABEL
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('PRICE', centerX, 64);

    // PRICE VALUES
    if (saleOfferPercentage > 0) {
      // Strikethrough original price
      const origPriceStr = `₹${product.sellingPrice}`;
      ctx.font = 'bold 10px "JetBrains Mono", Courier, monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(origPriceStr, centerX, 78);
      const strikeWidth = ctx.measureText(origPriceStr).width;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centerX - strikeWidth / 2, 84);
      ctx.lineTo(centerX + strikeWidth / 2, 84);
      ctx.stroke();

      // Discounted price
      ctx.font = 'bold 22px "JetBrains Mono", Courier, monospace';
      ctx.fillStyle = '#000000';
      ctx.fillText(`₹${discountedPrice}`, centerX, 92);

      // Taxes
      ctx.font = 'bold 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('(INCL. TAXES)', centerX, 122);
    } else {
      // Standard price
      ctx.font = 'bold 26px "JetBrains Mono", Courier, monospace';
      ctx.fillStyle = '#000000';
      ctx.fillText(`₹${product.sellingPrice}`, centerX, 80);

      // Taxes
      ctx.font = 'bold 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('(INCL. TAXES)', centerX, 120);
    }

    // RIGHT COLUMN: SIZE
    ctx.textAlign = 'right';
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('SIZE', rightX, 64);

    const sizeVal = (product.size || 'FREE').toUpperCase();
    ctx.font = sizeVal.length > 4
      ? 'bold 13px "JetBrains Mono", Courier, monospace'
      : 'bold 24px "JetBrains Mono", Courier, monospace';
    ctx.fillStyle = '#000000';
    ctx.fillText(sizeVal, rightX, 82);
  } else {
    // 50mm x 32mm Layout (240 dots height)

  // 1. TOP HEADER: Brand Title (left) & Phone Number (right)
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((brandTitle || 'FANTASY').toUpperCase(), leftX, 6);

  ctx.font = 'bold 12px "JetBrains Mono", Courier, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(contactNumber, rightX, 8);

  // Top header rule
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftX, 25);
  ctx.lineTo(rightX, 25);
  ctx.stroke();

  // 2. PRODUCT NAME (Bold, single line, truncated with ellipsis if exceeding label width)
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  let name = product.name || 'Apparel Item';
  const maxNameWidth = rightX - leftX;
  if (ctx.measureText(name).width > maxNameWidth) {
    while (ctx.measureText(name + '...').width > maxNameWidth && name.length > 3) {
      name = name.slice(0, -1);
    }
    name = name + '...';
  }
  ctx.fillText(name, leftX, 29);

  // 3. CATEGORY & COLOR
  const catParts = [product.category, product.subCategory].filter((c) => c && c !== 'General');
  const catText = (catParts.length > 0 ? catParts.join(' · ') : 'GARMENT').toUpperCase();
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  ctx.fillText(catText, leftX, 48);

  if (product.color) {
    ctx.font = 'bold 11px "JetBrains Mono", Courier, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(product.color, rightX, 48);
  }

  // Subheader dividing rule
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftX, 64);
  ctx.lineTo(rightX, 64);
  ctx.stroke();

  // 4. BOTTOM SPLIT:
  // LEFT COLUMN: QR Code (or 1D Barcode) + Code Value
  // RIGHT COLUMN: SIZE, PRICE, TAXES
  const codeValue = (product.barcode || product.sku || '000000').trim();

  if (codeType === 'qr') {
    try {
      const qr = QRCode.create(codeValue, { errorCorrectionLevel: 'M' });
      const size = qr.modules.size;
      const targetSize = 104;
      const cellSize = Math.floor(targetSize / size);
      const actualSize = cellSize * size;
      const qrStartX = leftX + 4;
      const qrStartY = 70;

      ctx.fillStyle = '#000000';
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (qr.modules.get(r, c)) {
            ctx.fillRect(qrStartX + c * cellSize, qrStartY + r * cellSize, cellSize, cellSize);
          }
        }
      }

      // Center text under QR code
      ctx.font = 'bold 11px "JetBrains Mono", Courier, monospace';
      ctx.textAlign = 'center';
      const textCenterX = qrStartX + Math.floor(actualSize / 2);
      ctx.fillText(codeValue, textCenterX, qrStartY + actualSize + 5);
    } catch (err) {
      console.warn('QR canvas render error:', err);
    }
  } else {
    // 1D Barcode (Code 128)
    try {
      const Code128Module = (JsBarcode as any).getModule
        ? (JsBarcode as any).getModule('CODE128')
        : null;

      if (Code128Module) {
        const encoder = new Code128Module(codeValue, {});
        const encoded = encoder.encode();
        const bitString: string = encoded.data || '';

        if (bitString) {
          const barcodeWidth = 145;
          const barcodeHeight = 70;
          const barWidth = barcodeWidth / bitString.length;
          const barStartX = leftX + 4;
          const barStartY = 82;

          ctx.fillStyle = '#000000';
          for (let i = 0; i < bitString.length; i++) {
            if (bitString[i] === '1') {
              ctx.fillRect(barStartX + i * barWidth, barStartY, Math.ceil(barWidth), barcodeHeight);
            }
          }

          ctx.font = 'bold 11px "JetBrains Mono", Courier, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(codeValue, barStartX + barcodeWidth / 2, barStartY + barcodeHeight + 4);
        }
      }
    } catch (err) {
      console.warn('Barcode canvas render error:', err);
    }
  }

  // 4. BOTTOM 3 COLUMNS:
  // LEFT: QR Code / 1D Barcode (centered under code)
  // CENTER: PRICE (Label, Value, (INCL. TAXES))
  // RIGHT: SIZE (Label, Value)

  // CENTER COLUMN: SELLING PRICE
  const centerX32 = 205;
  ctx.textAlign = 'center';

  // PRICE LABEL
  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('PRICE', centerX32, 80);

  // PRICE VALUES
  if (saleOfferPercentage > 0) {
    // Strikethrough original price
    const origPriceStr = `₹${product.sellingPrice}`;
    ctx.font = 'bold 12px "JetBrains Mono", Courier, monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(origPriceStr, centerX32, 98);
    const strikeWidth = ctx.measureText(origPriceStr).width;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(centerX32 - strikeWidth / 2, 104);
    ctx.lineTo(centerX32 + strikeWidth / 2, 104);
    ctx.stroke();

    // Discounted price
    ctx.font = 'bold 26px "JetBrains Mono", Courier, monospace';
    ctx.fillStyle = '#000000';
    ctx.fillText(`₹${discountedPrice}`, centerX32, 112);

    // Taxes
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('(INCL. TAXES)', centerX32, 152);
  } else {
    // Standard price
    ctx.font = 'bold 30px "JetBrains Mono", Courier, monospace';
    ctx.fillStyle = '#000000';
    ctx.fillText(`₹${product.sellingPrice}`, centerX32, 98);

    // Taxes
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('(INCL. TAXES)', centerX32, 144);
  }

  // RIGHT COLUMN: SIZE
  ctx.textAlign = 'right';
  ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('SIZE', rightX, 80);

  const sizeVal32 = (product.size || 'FREE').toUpperCase();
  ctx.font = sizeVal32.length > 4
    ? 'bold 15px "JetBrains Mono", Courier, monospace'
    : 'bold 28px "JetBrains Mono", Courier, monospace';
  ctx.fillStyle = '#000000';
  ctx.fillText(sizeVal32, rightX, 102);
}

  return canvas;
}

/**
 * Format apparel price tags to native ESC/POS binary commands (50x25mm / 50x32mm tag roll).
 * Delivers 100% pixel-perfect 203 DPI raster printing via USB or Bluetooth:
 * exactly identical to the on-screen UI preview with 2-column layout (QR on left, Size + Price on right).
 */
export function formatPriceTagsToEscPos(
  tags: PriceTagItem[],
  options?: { columns?: 32 | 48; rollSize?: '50x25' | '50x32' }
): Uint8Array {
  const columns = options?.columns || 32;
  const rollSize = options?.rollSize || tags[0]?.rollSize || '50x25';
  const builder = new EscPosBuilder(columns);
  builder.initialize();

  // If in browser environment with Canvas support, render raster graphics for 100% UI match!
  if (typeof document !== 'undefined') {
    tags.forEach((tag, idx) => {
      const canvas = renderTagToCanvas(tag, { rollSize });
      builder.rasterImage(canvas);
      if (idx < tags.length - 1) {
        builder.feed(1); // Advance ~2-3mm across the gap to the next sticker
      } else {
        builder.feed(2);
      }
    });
    return builder.build();
  }

  // Fallback for headless environments without DOM
  tags.forEach((tag, idx) => {
    const {
      product,
      brandTitle = 'FANTASY',
      contactNumber = '+919416109928',
      codeType = 'qr',
      saleOfferPercentage = 0,
    } = tag;

    const price =
      saleOfferPercentage > 0
        ? Math.round(product.sellingPrice * (1 - saleOfferPercentage / 100))
        : product.sellingPrice;

    const displayPrice = price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);

    builder.initialize();
    builder.bold(true);
    builder.twoColumnRow((brandTitle || 'FANTASY').toUpperCase(), contactNumber, true);
    builder.bold(false);
    builder.separator('-');
    builder.bold(true).line(product.name).bold(false);

    const catParts = [product.category, product.subCategory].filter((c) => c && c !== 'General');
    if (catParts.length > 0) {
      builder.line(`Category: ${catParts.join(' · ')}`);
    }

    const sizeColorParts = [
      product.size ? `Size: ${product.size}` : '',
      product.color ? `Color: ${product.color}` : '',
    ].filter(Boolean);
    if (sizeColorParts.length > 0) {
      builder.line(sizeColorParts.join('  |  '));
    }

    const codeValue = (product.barcode || product.sku || '').trim();
    if (codeValue) {
      if (codeType === 'qr') {
        builder.align('center');
        builder.qrCode(codeValue, columns === 48 ? 8 : 6);
        builder.bold(true).line(codeValue).bold(false);
      } else {
        builder.barcode128(codeValue, 36, true);
      }
    }

    builder
      .align('center')
      .bold(true)
      .line(
        saleOfferPercentage > 0
          ? `OFFER: Rs. ${displayPrice} (Was Rs. ${product.sellingPrice})`
          : `Rs. ${displayPrice}`
      )
      .bold(false)
      .align('left');

    builder.separator('-');
    if (idx < tags.length - 1) {
      builder.feed(1);
    } else {
      builder.feed(2);
    }
  });

  return builder.build();
}

/**
 * Format Store Credit Note voucher to native ESC/POS binary commands (58mm/80mm roll).
 * Delivers pitch-black 203 DPI printing via USB or Bluetooth with full-size barcode.
 */
export function formatCreditNoteToEscPos(
  creditNote: CreditNote,
  options?: { columns?: 32 | 48 }
): Uint8Array {
  const columns = options?.columns || 32;
  const builder = new EscPosBuilder(columns);
  builder.initialize();

  // Header
  builder.bold(true).align('center');
  builder.line((creditNote.companyName || 'STORE').toUpperCase());
  builder.line('STORE CREDIT VOUCHER');
  builder.bold(false).line('RETAIL CUSTOMER EXCHANGE');
  builder.separator('=');

  // Voucher Details
  builder.align('left');
  builder.twoColumnRow('VOUCHER NO:', creditNote.code, true);
  builder.twoColumnRow('ISSUED:', creditNote.issuedDate);
  builder.twoColumnRow('VALID UNTIL:', creditNote.expiryDate, true);
  builder.twoColumnRow('ORIGINAL BILL:', creditNote.originalInvoiceNumber);
  builder.twoColumnRow('CUSTOMER:', creditNote.customerName);
  if (creditNote.customerPhone && creditNote.customerPhone !== 'N/A') {
    builder.twoColumnRow('PHONE:', creditNote.customerPhone);
  }
  builder.separator('-');

  // Credit Value (Prominent Bold Center)
  builder.align('center');
  builder.line('STORE CREDIT VALUE');
  builder.bold(true).textSize('double-height');
  builder.line(`Rs. ${creditNote.amount.toFixed(2)}`);
  builder.textSize('normal').bold(false);
  if (creditNote.remainingAmount !== creditNote.amount) {
    builder.line(`(Remaining: Rs. ${creditNote.remainingAmount.toFixed(2)})`);
  }
  builder.separator('-');

  // Returned Items
  builder.align('left').bold(true).line('RETURNED MERCHANDISE:').bold(false);
  creditNote.itemsReturned.forEach((item) => {
    builder.twoColumnRow(item.productName, `Rs. ${item.amount.toFixed(2)}`, true);
    const details = [
      item.size ? `Size: ${item.size}` : '',
      item.color ? `Color: ${item.color}` : '',
      `Qty: ${item.qty}`,
    ].filter(Boolean).join('  |  ');
    if (details) builder.line(details);
    if (item.reason) builder.line(`Reason: ${item.reason}`);
  });
  builder.separator('-');

  // Barcode / Code
  const barcodeValue = creditNote.code.replace(/[^0-9A-Z]/gi, '');
  builder.align('center');
  builder.barcode128(barcodeValue, 36, true);
  builder.feed(1);

  // Policy & Footer Notice
  builder.line('Present voucher at checkout to redeem.');
  builder.line('Non-refundable for cash.');
  builder.bold(true);
  builder.line(`*** ${(creditNote.companyName || 'STORE').toUpperCase()} STORE CREDIT ***`);
  builder.bold(false);
  builder.feed(3);
  builder.cut();

  return builder.build();
}

/**
 * Format Garment Alteration Workshop Ticket / Tailor Tag to native ESC/POS binary commands.
 * Delivers pitch-black 203 DPI printing via USB or Bluetooth to staple on garments.
 */
export function formatTailorSlipToEscPos(
  alteration: AlterationRecord,
  options?: { columns?: 32 | 48; companyName?: string }
): Uint8Array {
  const columns = options?.columns || 32;
  const company = (options?.companyName || 'ALTERATION WORKSHOP').toUpperCase();
  const builder = new EscPosBuilder(columns);
  builder.initialize();

  // Header
  builder.bold(true).align('center');
  builder.line(company);
  builder.line('ALTERATION JOB TICKET');
  builder.bold(false).line('ATTACH SECURELY TO GARMENT');
  builder.separator('=');

  // Job Details
  builder.align('left');
  builder.twoColumnRow('JOB NO:', `#${alteration.id.slice(-6)}`, true);
  builder.twoColumnRow('BOOKED:', alteration.createdDate);
  builder.separator('-');

  // Garment Details (Normal size styling)
  builder.bold(true).line(alteration.garmentName).bold(false);
  const sizeColor = [
    alteration.size ? `Size: ${alteration.size}` : '',
    alteration.color ? `Color: ${alteration.color}` : '',
  ].filter(Boolean).join('  |  ');
  if (sizeColor) builder.line(sizeColor);

  if (alteration.customerName) {
    builder.twoColumnRow('CUSTOMER:', alteration.customerName);
  }
  if (alteration.customerPhone && alteration.customerPhone !== 'N/A') {
    builder.twoColumnRow('PHONE:', alteration.customerPhone);
  }
  builder.separator('-');

  // Alteration Instructions Box
  builder.bold(true).line('ALTERATION INSTRUCTIONS:');
  builder.line(alteration.alterationNotes);
  builder.bold(false);
  builder.separator('-');

  // Promised Date (Prominent)
  builder.align('center');
  builder.bold(true).textSize('double-height');
  builder.line(`READY BY: ${alteration.promisedDate}`);
  builder.textSize('normal').bold(false);
  builder.separator('-');

  // Barcode
  const barcodeValue = `ALT${alteration.id.slice(-6)}`;
  builder.align('center');
  builder.barcode128(barcodeValue, 32, true);
  builder.feed(1);

  builder.bold(true).line('*** STAPLE TO GARMENT ***').bold(false);
  builder.feed(3);
  builder.cut();

  return builder.build();
}

export interface ZReportEscPosData {
  dayRegister: {
    date: string;
    status: string;
    openingCash: number;
    closingCashCounted?: number;
    closingNotes?: string;
    expenses?: Array<{ time: string; amount: number; category: string; paidTo: string; notes: string }>;
    cashDrops?: Array<{ time: string; amount: number; droppedBy: string; notes?: string }>;
  };
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyTaxId?: string;
  printTimestamp: string;
  todaySalesCount: number;
  salesTotals: {
    cash: number;
    upi: number;
    card: number;
    grandTotal: number;
    taxTotal: number;
  };
  expectedCashInDrawer: number;
  actualCounted?: number;
  discrepancy?: number;
  totalPettyExpenses: number;
  totalCashDrops?: number;
}

/**
 * Format Day-End Register Z-Report to native ESC/POS binary commands.
 * Delivers pitch-black 203 DPI printing via USB or Bluetooth with full cashier audit log.
 */
export function formatZReportToEscPos(
  data: ZReportEscPosData,
  options?: { columns?: 32 | 48 }
): Uint8Array {
  const columns = options?.columns || 32;
  const builder = new EscPosBuilder(columns);
  builder.initialize();

  // Header
  builder.bold(true).align('center');
  builder.line(data.companyName.toUpperCase());
  builder.line('DAY-END REGISTER Z-REPORT');
  builder.bold(false);
  if (data.companyAddress) builder.line(data.companyAddress);
  if (data.companyPhone) builder.line(`Tel: ${data.companyPhone}`);
  if (data.companyTaxId && data.companyTaxId !== 'RETAIL-CASH-UNREG') {
    builder.line(`GSTIN: ${data.companyTaxId}`);
  }
  builder.separator('=');

  // Metadata
  builder.align('left');
  builder.twoColumnRow('DATE:', data.dayRegister.date);
  builder.twoColumnRow('PRINTED:', data.printTimestamp);
  builder.twoColumnRow('REGISTER:', data.dayRegister.status.toUpperCase(), true);
  builder.twoColumnRow('TRANSACTIONS:', `${data.todaySalesCount} completed`, true);
  builder.separator('-');

  // Tender Breakdown
  builder.bold(true).line('SALES BY TENDER:').bold(false);
  builder.twoColumnRow('CASH SALES:', `Rs. ${data.salesTotals.cash.toFixed(2)}`);
  builder.twoColumnRow('UPI SALES:', `Rs. ${data.salesTotals.upi.toFixed(2)}`);
  builder.twoColumnRow('CARD SALES:', `Rs. ${data.salesTotals.card.toFixed(2)}`);
  builder.separator('-');
  builder.bold(true);
  builder.twoColumnRow('TOTAL REVENUE:', `Rs. ${data.salesTotals.grandTotal.toFixed(2)}`, true);
  builder.bold(false);
  builder.separator('-');

  // Cash Drawer Reconciliation
  builder.bold(true).line('CASH DRAWER RECONCILIATION:').bold(false);
  builder.twoColumnRow('OPENING FLOAT:', `Rs. ${data.dayRegister.openingCash.toFixed(2)}`);
  builder.twoColumnRow('(+) CASH IN:', `+Rs. ${data.salesTotals.cash.toFixed(2)}`);
  builder.twoColumnRow('(-) PETTY OUT:', `-Rs. ${data.totalPettyExpenses.toFixed(2)}`);
  if (data.totalCashDrops && data.totalCashDrops > 0) {
    builder.twoColumnRow('(-) SAFE SKIMS:', `-Rs. ${data.totalCashDrops.toFixed(2)}`);
  }
  builder.separator('-');
  builder.bold(true);
  builder.twoColumnRow('EXPECTED IN DRAWER:', `Rs. ${data.expectedCashInDrawer.toFixed(2)}`, true);
  if (data.actualCounted !== undefined) {
    builder.twoColumnRow('ACTUAL COUNTED:', `Rs. ${data.actualCounted.toFixed(2)}`, true);
    const diff = data.discrepancy !== undefined ? data.discrepancy : (data.actualCounted - data.expectedCashInDrawer);
    const diffStr = diff >= 0 ? `+Rs. ${diff.toFixed(2)} (OVER)` : `-Rs. ${Math.abs(diff).toFixed(2)} (SHORT)`;
    builder.twoColumnRow('VARIANCE:', diffStr, true);
  }
  builder.bold(false);
  builder.separator('-');

  // Petty Expenses
  const expenses = data.dayRegister.expenses || [];
  if (expenses.length > 0) {
    builder.bold(true).line(`PETTY OUTLAYS (${expenses.length}):`).bold(false);
    expenses.forEach((e) => {
      builder.twoColumnRow(`${e.time} ${e.category}`, `Rs. ${e.amount.toFixed(2)}`);
      if (e.notes) builder.line(`  Note: ${e.notes}`);
    });
    builder.separator('-');
  }

  // Barcode
  const barcodeValue = `ZREP${data.dayRegister.date.replace(/-/g, '')}`;
  builder.align('center');
  builder.barcode128(barcodeValue, 28, true);
  builder.feed(1);

  builder.line('VERIFIED BY CASHIER & STORE MANAGER');
  builder.bold(true).line('*** END OF Z-REPORT ***').bold(false);
  builder.feed(3);
  builder.cut();

  return builder.build();
}

/**
 * Format Customer Khata Payment Receipt (Money Receipt / Pawti) to native ESC/POS binary commands.
 * Delivers pitch-black 203 DPI printing via USB or Bluetooth.
 */
export function formatCreditPaymentReceiptToEscPos(
  payment: CustomerCreditPayment,
  options?: { columns?: 32 | 48 }
): Uint8Array {
  const columns = options?.columns || 32;
  const builder = new EscPosBuilder(columns);
  builder.initialize();

  // Header
  builder.bold(true).align('center');
  builder.line((payment.companyName || 'STORE').toUpperCase());
  builder.line('PAYMENT RECEIPT (KHATA JAMA PAWTI)');
  builder.bold(false);
  builder.separator('=');

  // Details
  builder.align('left');
  builder.twoColumnRow('RECEIPT NO:', payment.receiptNumber, true);
  const formattedDate = new Date(payment.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  builder.twoColumnRow('DATE:', formattedDate);
  builder.twoColumnRow('CUSTOMER:', payment.customerName, true);
  if (payment.customerPhone && payment.customerPhone !== 'N/A') {
    builder.twoColumnRow('PHONE:', payment.customerPhone);
  }
  builder.separator('-');

  // Amount Received (Prominent Center)
  builder.align('center');
  builder.line('AMOUNT RECEIVED');
  builder.bold(true).textSize('double-height');
  builder.line(`Rs. ${payment.amount.toFixed(2)}`);
  builder.textSize('normal').bold(false);
  builder.line(`Mode: ${payment.paymentMode.toUpperCase()}${payment.referenceNumber ? ` (${payment.referenceNumber})` : ''}`);
  builder.separator('-');

  // Balance Reconciliation
  builder.align('left');
  builder.twoColumnRow('PREVIOUS BALANCE:', `Rs. ${payment.customerPreviousBalance.toFixed(2)}`);
  builder.twoColumnRow('AMOUNT PAID (-):', `Rs. ${payment.amount.toFixed(2)}`, true);
  builder.separator('-');
  builder.bold(true);
  builder.twoColumnRow('CURRENT REMAINING:', `Rs. ${payment.customerNewBalance.toFixed(2)}`, true);
  builder.bold(false);

  // Invoices Settled / Allocated
  if (payment.allocations && payment.allocations.length > 0) {
    builder.separator('-');
    builder.bold(true).line('CREDITED TO BILLS:').bold(false);
    payment.allocations.forEach((alloc) => {
      builder.twoColumnRow(alloc.invoiceNumber, `Rs. ${alloc.amountAllocated.toFixed(2)}`);
    });
  }

  if (payment.notes) {
    builder.separator('-');
    builder.line(`Note: ${payment.notes}`);
  }

  // Barcode
  const barcodeValue = payment.receiptNumber.replace(/[^0-9A-Z]/gi, '');
  builder.separator('-');
  builder.align('center');
  builder.barcode128(barcodeValue, 28, true);
  builder.feed(1);

  builder.twoColumnRow('Customer Sign', 'Cashier Sign');
  builder.feed(1);
  builder.bold(true).line('Thank you for your prompt payment!').bold(false);
  builder.line(`Visit Again · ${payment.companyName || 'Store'}`);
  builder.feed(3);
  builder.cut();

  return builder.build();
}

/**
 * Format Customer Khata Account Statement to native ESC/POS commands (with UPI QR code).
 */
export function formatCustomerKhataStatementToEscPos(
  data: {
    customer: Customer;
    companyName: string;
    companyPhone?: string;
    companyAddress?: string;
    ledger: KhataLedgerEntry[];
    totalOutstanding: number;
    storeUpiId?: string;
    storeUpiName?: string;
  },
  options?: { columns?: 32 | 48 }
): Uint8Array {
  const columns = options?.columns || 32;
  const builder = new EscPosBuilder(columns);
  builder.initialize();

  // Header
  builder.bold(true).align('center');
  builder.line(data.companyName.toUpperCase());
  builder.line('CUSTOMER KHATA STATEMENT');
  builder.bold(false);
  if (data.companyPhone) builder.line(`Tel: ${data.companyPhone}`);
  builder.separator('=');

  // Customer Summary
  builder.align('left');
  builder.twoColumnRow('CUSTOMER:', data.customer.name, true);
  builder.twoColumnRow('PHONE:', data.customer.phone);
  builder.twoColumnRow('STATEMENT DATE:', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
  builder.separator('-');

  // Total Outstanding
  builder.align('center');
  builder.line('TOTAL OUTSTANDING BALANCE');
  builder.bold(true).textSize('double-height');
  builder.line(`Rs. ${data.totalOutstanding.toFixed(2)}`);
  builder.textSize('normal').bold(false);
  builder.separator('-');

  // Recent Transactions (Up to last 8)
  builder.align('left').bold(true).line('RECENT TRANSACTIONS:').bold(false);
  const recent = data.ledger.slice(0, 8);
  recent.forEach((item) => {
    const symbol = item.type === 'DEBIT' ? '+' : '-';
    builder.twoColumnRow(
      `${item.date.slice(5)} ${item.referenceNumber}`,
      `${symbol}Rs. ${item.amount.toFixed(0)}`,
      item.type === 'DEBIT'
    );
  });

  // Dynamic UPI Payment QR Code
  if (data.storeUpiId && data.totalOutstanding > 0) {
    const upiUri = buildUpiPaymentUri({
      upiId: data.storeUpiId,
      payeeName: data.storeUpiName || data.companyName,
      amount: data.totalOutstanding,
      transactionNote: `Khata ${data.customer.name}`,
    });

    if (upiUri) {
      builder.separator('-');
      builder.align('center').bold(true).line('SCAN & CLEAR KHATA VIA UPI').bold(false);
      builder.qrCode(upiUri, columns === 48 ? 10 : 7);
      builder.bold(true).line(`Rs. ${data.totalOutstanding.toFixed(2)} · ${data.storeUpiId}`).bold(false);
      builder.line('PhonePe · GPay · Paytm · BHIM');
    }
  }

  builder.separator('-');
  builder.align('center');
  builder.line('Please clear balance at your earliest convenience.');
  builder.bold(true).line(`Thank you! · ${data.companyName}`).bold(false);
  builder.feed(3);
  builder.cut();

  return builder.build();
}
