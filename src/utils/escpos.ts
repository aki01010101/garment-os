/**
 * ESC/POS Thermal Printer Protocol Engine & Driver for Garment OS.
 * Supports:
 * - Everycom (EC-58, EC-80, POS-58, POS-80) & all standard ESC/POS thermal printers.
 * - Direct Web Bluetooth API (Zero external apps needed on Android / Chrome).
 * - Instant 1-Click RawBT Android Intent (for Classic Bluetooth / SPP / USB OTG).
 * - 58mm (32 columns) and 80mm (48 columns) paper roll formats.
 */

import { SaleTransaction } from '../types';

export interface EscPosOptions {
  columns?: 32 | 48; // 32 for 58mm (2-inch), 48 for 80mm (3-inch)
  includeReviewQr?: boolean;
  reviewUrl?: string;
  reviewPromptText?: string;
  storeUpiId?: string;
  storeUpiName?: string;
  autoCut?: boolean;
  kickDrawer?: boolean;
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
  qrCode(data: string, sizeMultiplier: number = 4): this {
    if (!data) return this;
    const cleanData = this.sanitizeText(data);
    const len = cleanData.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);

    // 1. Set QR Code Model (Model 2)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

    // 2. Set QR Code Size (1 to 16, default 4 for 58mm, 6 for 80mm)
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
  if (receipt.companyTaxId && receipt.companyTaxId !== 'RETAIL-CASH-UNREG') {
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
  if (receipt.taxTotal > 0) {
    const taxNote = receipt.taxInclusive !== false ? '(Incl. in Price)' : '(Added separately)';
    builder.twoColumnRow(`GST Tax ${taxNote}:`, `Rs. ${receipt.taxTotal.toFixed(2)}`);
  }

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
      .qrCode(reviewUrl, columns === 48 ? 6 : 4);
  }

  // 8. STORE POLICY & FOOTER
  builder.separator('-');
  builder
    .align('center')
    .line(`Policy: ${receipt.companyReturnPolicy || 'Exchange within 7 days with tag intact'}`)
    .bold(true)
    .line('Thank you for shopping with us!')
    .bold(false)
    .line('Visit Again · Garment OS');

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

/**
 * Check if Web Bluetooth API is supported in the current browser
 */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Direct Web Bluetooth Print (Zero external apps needed on Chrome/Edge on Android/PC)
 * Connects directly to Everycom Bluetooth thermal printer and streams ESC/POS byte chunks.
 */
export async function printViaWebBluetooth(
  payload: Uint8Array,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      error: 'Web Bluetooth API is not supported in this browser. Please use Google Chrome or Edge on Android/PC over HTTPS, or use the RawBT Print option.',
    };
  }

  try {
    onStatusUpdate?.('Requesting Everycom / Bluetooth Printer...');

    let device = cachedBluetoothDevice;
    let writeChar = cachedWriteCharacteristic;

    // Check if previous connection is still active and writable
    const isDeviceConnected = device && device.gatt && device.gatt.connected;

    if (!isDeviceConnected || !writeChar) {
      // Prompt user to select Everycom or any thermal printer
      const navBluetooth = (navigator as any).bluetooth;
      device = await navBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: THERMAL_PRINTER_BLUETOOTH_SERVICES,
      });

      if (!device) {
        return { success: false, error: 'No printer device selected.' };
      }

      onStatusUpdate?.(`Connecting to ${device.name || 'Everycom Printer'}...`);
      const server = await device.gatt.connect();

      // Find primary service and writable characteristic
      onStatusUpdate?.('Discovering printer communication channel...');
      writeChar = null;

      // Try known services first, then fall back to scanning all services
      const services = await server.getPrimaryServices();

      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }
        } catch {}
        if (writeChar) break;
      }

      if (!writeChar) {
        return {
          success: false,
          deviceName: device.name,
          error: `Could not find a writable ESC/POS channel on ${device.name || 'printer'}. Ensure printer is in ESC/POS mode or use RawBT.`,
        };
      }

      // Cache device and characteristic
      cachedBluetoothDevice = device;
      cachedWriteCharacteristic = writeChar;

      // Handle disconnects
      device.addEventListener('gattserverdisconnected', () => {
        cachedBluetoothDevice = null;
        cachedWriteCharacteristic = null;
      });
    }

    onStatusUpdate?.(`Printing to ${device.name || 'Everycom Printer'}...`);

    // Stream ESC/POS packets in chunks of 64 bytes (safe for BLE MTU buffers on thermal microcontrollers)
    const CHUNK_SIZE = 64;
    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      if (writeChar.properties.writeWithoutResponse) {
        await writeChar.writeValueWithoutResponse(chunk);
      } else {
        await writeChar.writeValue(chunk);
      }
      // Small pause to prevent buffer overrun
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    onStatusUpdate?.('Print complete!');
    return { success: true, deviceName: device.name || 'Everycom Printer' };
  } catch (err: any) {
    console.error('Web Bluetooth print error:', err);
    // Clear cache if connection failed
    cachedBluetoothDevice = null;
    cachedWriteCharacteristic = null;

    if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
      return { success: false, error: 'Printer connection was cancelled.' };
    }
    return { success: false, error: err.message || 'Bluetooth printing failed.' };
  }
}

/**
 * Disconnect and forget cached Bluetooth printer
 */
export function disconnectBluetoothPrinter(): void {
  try {
    if (cachedBluetoothDevice && cachedBluetoothDevice.gatt && cachedBluetoothDevice.gatt.connected) {
      cachedBluetoothDevice.gatt.disconnect();
    }
  } catch {}
  cachedBluetoothDevice = null;
  cachedWriteCharacteristic = null;
}
