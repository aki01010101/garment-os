import React, { useRef, useState, useEffect } from 'react';
import { SaleTransaction, QR_SIZE_PIXELS } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { UpiPaymentQr } from '../common/UpiPaymentQr';
import { GoogleReviewQr } from '../common/GoogleReviewQr';
import { useApp } from '../../context/AppContext';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  formatSaleToEscPos,
  printViaWebBluetooth,
  printViaWebUsb,
  printViaWebSerial,
  printViaLocalBridge,
  printViaRawBT,
  isWebBluetoothSupported,
  isWebUsbSupported,
  isWebSerialSupported,
  detectLocalPrinters,
  disconnectBluetoothPrinter,
  disconnectUsbPrinter,
  EscPosBuilder,
} from '../../utils/escpos';
import {
  Printer,
  X,
  Barcode,
  QrCode,
  Smartphone,
  Star,
  HelpCircle,
  CheckCircle,
  Copy,
  Check,
  Share2,
  Scissors,
  MessageCircle,
  ShoppingBag,
  CreditCard,
  User,
  Phone,
  Calendar,
  FileText,
  Sparkles,
  Bluetooth,
  Usb,
  Zap,
  ExternalLink,
  Loader2,
  FileSignature,
  PenTool,
} from 'lucide-react';
import { SignaturePadModal } from '../common/SignaturePadModal';

interface ThermalReceiptProps {
  receipt: SaleTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrinterGuide?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  receipt: initialReceipt,
  isOpen,
  onClose,
  onOpenPrinterGuide,
}) => {
  const [currentReceipt, setCurrentReceipt] = useState<SaleTransaction | null>(initialReceipt);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  useEffect(() => {
    setCurrentReceipt(initialReceipt);
  }, [initialReceipt]);

  const receipt = currentReceipt || initialReceipt;

  const receiptRef = useRef<HTMLDivElement>(null);
  const tailorSlipRef = useRef<HTMLDivElement>(null);
  const {
    updateSale,
    codePrintType,
    setCodePrintType,
    qrPrintSize,
    setQrPrintSize,
    storeUpiId,
    storeUpiName,
    storeGoogleReviewUrl,
    googleReviewPromptText,
    enableReceiptReviewQr,
    enableEReceiptQr,
    activeCompany,
  } = useApp();

  const effectiveReviewUrl =
    receipt?.googleReviewUrl || activeCompany?.googleReviewUrl || storeGoogleReviewUrl;

  const activeQrPixelSize = QR_SIZE_PIXELS[qrPrintSize] || 165;

  const [copied, setCopied] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>('');
  const [includeUpiQr, setIncludeUpiQr] = useState<boolean>(true);
  const [includeReviewQr, setIncludeReviewQr] = useState<boolean>(() => {
    return enableReceiptReviewQr !== false;
  });
  const [isBoldThermal, setIsBoldThermal] = useState<boolean>(() => {
    try {
      return localStorage.getItem('thermal_bold_print') !== 'false';
    } catch {
      return true;
    }
  });

  // Thermal Printer Method: 'bluetooth' | 'usb' | 'rawbt' | 'browser'
  const [printMethod, setPrintMethod] = useState<'bluetooth' | 'usb' | 'rawbt' | 'browser'>(() => {
    try {
      const saved = localStorage.getItem('thermal_print_method');
      if (saved === 'bluetooth' || saved === 'usb' || saved === 'rawbt' || saved === 'browser') return saved;
      return isWebBluetoothSupported() ? 'bluetooth' : isWebUsbSupported() ? 'usb' : 'browser';
    } catch {
      return 'browser';
    }
  });

  // Composition Scheme GST state (default from receipt or active company; can be toggled on receipt)
  const [isCompositionGst, setIsCompositionGst] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('receipt_composition_gst');
      if (saved !== null) return saved === 'true';
    } catch {}
    return receipt?.isCompositionScheme ?? activeCompany?.isCompositionScheme ?? false;
  });

  const toggleCompositionGst = () => {
    setIsCompositionGst((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('receipt_composition_gst', String(next));
      } catch {}
      return next;
    });
  };

  // Paper width: 32 columns (58mm / 2-inch) or 48 columns (80mm / 3-inch)
  const [paperColumns, setPaperColumns] = useState<32 | 48>(() => {
    try {
      const saved = localStorage.getItem('thermal_paper_columns');
      return saved === '48' ? 48 : 32;
    } catch {
      return 32;
    }
  });

  const [bluetoothStatus, setBluetoothStatus] = useState<string | null>(null);
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState<boolean>(false);
  const [detectedPrinters, setDetectedPrinters] = useState<{
    printers: Array<{ Name: string; DriverName: string; PortName: string }>;
    ports: Array<{ DeviceID: string; Name: string; Description: string }>;
  }>({ printers: [], ports: [] });

  useEffect(() => {
    if (isOpen) {
      detectLocalPrinters().then((data) => {
        if (data && (data.printers?.length || data.ports?.length)) {
          setDetectedPrinters(data);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  const setAndSavePrintMethod = (method: 'bluetooth' | 'usb' | 'rawbt' | 'browser') => {
    setPrintMethod(method);
    try {
      localStorage.setItem('thermal_print_method', method);
    } catch {}
  };

  const setAndSavePaperColumns = (cols: 32 | 48) => {
    setPaperColumns(cols);
    try {
      localStorage.setItem('thermal_paper_columns', String(cols));
    } catch {}
  };

  const toggleBoldThermal = () => {
    setIsBoldThermal((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('thermal_bold_print', String(next));
      } catch {}
      return next;
    });
  };

  if (!isOpen || !receipt) return null;

  const formattedDate = new Date(receipt.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(receipt.date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasAlterations = receipt.items.some((i) => i.alteration?.needed);
  const totalItemsCount = receipt.items.reduce((sum, item) => sum + item.qty, 0);

  const handleSaveSignature = (sigDataUrl: string) => {
    if (!receipt) return;
    const updated: SaleTransaction = {
      ...receipt,
      customerSignature: sigDataUrl,
      customerSignedAt: new Date().toISOString(),
    };
    setCurrentReceipt(updated);
    updateSale(updated);
    setIsSignatureModalOpen(false);
  };

  const handleClearSignature = () => {
    if (!receipt) return;
    const updated: SaleTransaction = {
      ...receipt,
      customerSignature: undefined,
      customerSignedAt: undefined,
    };
    setCurrentReceipt(updated);
    updateSale(updated);
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      printThermalReceiptHtml(receiptRef.current.innerHTML, isBoldThermal);
    } else {
      window.focus();
      window.print();
    }
  };

  const handlePrintTailorSlip = async () => {
    if (!receipt) return;
    if (printMethod === 'browser') {
      if (tailorSlipRef.current) {
        printThermalReceiptHtml(tailorSlipRef.current.innerHTML, isBoldThermal);
      }
      return;
    }

    const alterationItems = receipt.items.filter((i) => i.alteration?.needed);
    if (alterationItems.length === 0) return;

    setIsBluetoothPrinting(true);
    setBluetoothStatus(`Printing ${alterationItems.length} tailor tag(s)...`);

    try {
      const builder = new EscPosBuilder(paperColumns);
      builder.initialize();

      alterationItems.forEach((item, idx) => {
        builder.bold(true).align('center');
        builder.line((receipt.companyName || 'STORE').toUpperCase());
        builder.line('TAILOR ALTERATION SLIP');
        builder.bold(false).line('ATTACH SECURELY TO GARMENT');
        builder.separator('=');

        builder.align('left');
        builder.twoColumnRow('BILL NO:', receipt.invoiceNumber, true);
        builder.twoColumnRow('CUSTOMER:', receipt.customerName);
        if (receipt.customerPhone && receipt.customerPhone !== 'N/A') {
          builder.twoColumnRow('PHONE:', receipt.customerPhone);
        }
        builder.twoColumnRow('DATE:', formattedDate);
        builder.separator('-');

        builder.bold(true).line(item.name).bold(false);
        builder.line(`Size: ${item.size}  |  Color: ${item.color}`);
        builder.separator('-');

        builder.bold(true).line('ALTERATION INSTRUCTIONS:');
        builder.line(item.alteration?.notes || 'Standard fitting');
        builder.bold(false);
        builder.separator('-');

        if (item.alteration?.promisedDate) {
          builder.align('center').bold(true).textSize('double-height');
          builder.line(`READY BY: ${item.alteration.promisedDate}`);
          builder.textSize('normal').bold(false);
          builder.separator('-');
        }

        builder.align('center');
        builder.barcode128(receipt.invoiceNumber.replace(/[^0-9A-Z]/gi, ''), 30, true);
        builder.feed(1);
        builder.bold(true).line('*** STAPLE TO GARMENT ***').bold(false);

        if (idx < alterationItems.length - 1) {
          builder.feed(3);
        } else {
          builder.feed(3);
          builder.cut();
        }
      });

      const payload = builder.build();

      if (printMethod === 'usb') {
        const res = await printViaWebUsb(payload, (status) => setBluetoothStatus(status));
        if (res.success) {
          setBluetoothStatus(`✅ Printed ${alterationItems.length} tailor tag(s) via USB (203 DPI Dark)!`);
        } else {
          setBluetoothStatus(`❌ USB Print Error: ${res.error}`);
        }
      } else if (printMethod === 'bluetooth') {
        const res = await printViaWebBluetooth(payload, (status) => setBluetoothStatus(status));
        if (res.success) {
          setBluetoothStatus(`✅ Printed ${alterationItems.length} tailor tag(s) via Bluetooth!`);
        } else {
          setBluetoothStatus(`❌ Bluetooth Print Error: ${res.error}`);
        }
      } else if (printMethod === 'rawbt') {
        printViaRawBT(payload);
        setBluetoothStatus(`⚡ Sent ${alterationItems.length} tailor tag(s) to RawBT app!`);
      }
    } catch (err: any) {
      setBluetoothStatus(`❌ ${err.message || 'Failed to print tailor slip'}`);
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  const handlePrintBluetooth = async () => {
    if (!receipt) return;
    setIsBluetoothPrinting(true);
    setBluetoothStatus('Connecting to Everycom / Bluetooth Printer...');
    try {
      const payload = formatSaleToEscPos(receipt, {
        columns: paperColumns,
        codePrintType,
        includeInvoiceCode: true,
        includeUpiQr,
        storeUpiId,
        storeUpiName,
        includeReviewQr,
        reviewUrl: effectiveReviewUrl,
        reviewPromptText: googleReviewPromptText,
        isCompositionGst,
      });

      const res = await printViaWebBluetooth(payload, (status) => setBluetoothStatus(status));
      if (res.success) {
        setBluetoothStatus(`✅ Printed to ${res.deviceName || 'Everycom Printer'}!`);
      } else {
        setBluetoothStatus(`❌ ${res.error || 'Print failed'}`);
      }
    } catch (err: any) {
      setBluetoothStatus(`❌ ${err.message || 'Bluetooth error'}`);
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  const handlePrintUsb = async () => {
    if (!receipt) return;
    setIsBluetoothPrinting(true);
    setBluetoothStatus('Connecting to USB Thermal Printer (ESC/POS)...');
    try {
      const payload = formatSaleToEscPos(receipt, {
        columns: paperColumns,
        codePrintType,
        includeInvoiceCode: true,
        includeUpiQr,
        storeUpiId,
        storeUpiName,
        includeReviewQr,
        reviewUrl: effectiveReviewUrl,
        reviewPromptText: googleReviewPromptText,
        isCompositionGst,
      });

      const res = await printViaWebUsb(payload, (status) => setBluetoothStatus(status));
      if (res.success) {
        setBluetoothStatus(`✅ Printed via USB to ${res.deviceName || 'Thermal Printer'} (203 DPI Dark)!`);
      } else {
        setBluetoothStatus(`❌ ${res.error || 'USB Print failed'}`);
      }
    } catch (err: any) {
      setBluetoothStatus(`❌ ${err.message || 'USB print error'}`);
    } finally {
      setIsBluetoothPrinting(false);
    }
  };

  const handlePrintRawBT = () => {
    if (!receipt) return;
    setBluetoothStatus('Sending invoice to RawBT app...');
    const payload = formatSaleToEscPos(receipt, {
      columns: paperColumns,
      codePrintType,
      includeInvoiceCode: true,
      includeUpiQr,
      storeUpiId,
      storeUpiName,
      includeReviewQr,
      reviewUrl: effectiveReviewUrl,
      reviewPromptText: googleReviewPromptText,
      isCompositionGst,
    });
    const res = printViaRawBT(payload);
    if (res.success) {
      setBluetoothStatus('⚡ Sent to RawBT! Printing directly to Everycom.');
    } else {
      setBluetoothStatus(`❌ RawBT error: ${res.error}`);
    }
  };

  const handlePrimaryPrint = () => {
    if (printMethod === 'bluetooth') {
      handlePrintBluetooth();
    } else if (printMethod === 'usb') {
      handlePrintUsb();
    } else if (printMethod === 'rawbt') {
      handlePrintRawBT();
    } else {
      handlePrint();
    }
  };

  const generateReceiptText = () => {
    const isCreditSale =
      receipt.paymentMode === 'Credit' ||
      Boolean(receipt.creditAmount && receipt.creditAmount > 0) ||
      Boolean(receipt.splitBreakdown?.credit && receipt.splitBreakdown.credit > 0);
    const hasPrevBalance = Boolean(receipt.customerPreviousBalance && receipt.customerPreviousBalance > 0);
    const showKhataMemo = isCreditSale || hasPrevBalance || Boolean(receipt.customerSignature);

    const paymentModeLabel =
      receipt.paymentMode === 'Split' && receipt.splitBreakdown
        ? `Split: ${receipt.splitBreakdown.cash ? `Cash Rs. ${receipt.splitBreakdown.cash.toFixed(2)} ` : ''}${receipt.splitBreakdown.upi ? `UPI Rs. ${receipt.splitBreakdown.upi.toFixed(2)} ` : ''}${receipt.splitBreakdown.card ? `Card Rs. ${receipt.splitBreakdown.card.toFixed(2)} ` : ''}${receipt.splitBreakdown.credit ? `Khata Rs. ${receipt.splitBreakdown.credit.toFixed(2)}` : ''}`.trim()
        : receipt.paymentMode === 'Credit'
          ? `KHATA / UDHAAR (Due: ${receipt.creditDueDate || '15 Days'})`
          : receipt.paymentMode;

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

    return `
================================
*${receipt.companyName.toUpperCase()}*
================================
Store: ${receipt.companyAddress}
Tel: ${receipt.companyPhone}
${receipt.companyTaxId && receipt.companyTaxId !== 'RETAIL-CASH-UNREG' ? `GSTIN: ${receipt.companyTaxId}${isCompositionGst ? '\n*BILL OF SUPPLY (COMPOSITION SCHEME)*' : ''}` : 'Retail Cash Memo'}
--------------------------------
*Invoice:* ${receipt.invoiceNumber}
*Date:* ${formattedDate}, ${formattedTime}
*Customer:* ${receipt.customerName}
${receipt.customerPhone && receipt.customerPhone !== 'N/A' ? `*Phone:* ${receipt.customerPhone}\n` : ''}--------------------------------
*ITEMS PURCHASED:*
${receipt.items.map((i) => `* ${i.qty}x ${i.name} [Size: ${i.size}, ${i.color}] - Rs. ${i.total.toFixed(2)}`).join('\n')}
--------------------------------
*Subtotal:* Rs. ${receipt.subtotal.toFixed(2)}
*Total Items:* ${totalItemsCount} pcs
${receipt.itemDiscountsTotal > 0 ? `*Discount:* -Rs. ${receipt.itemDiscountsTotal.toFixed(2)}\n` : ''}${Boolean(receipt.promoDiscountAmount && receipt.promoDiscountAmount > 0) ? `*Offer/Promo (${receipt.promoTitleApplied || 'Special Deal'}):* -Rs. ${receipt.promoDiscountAmount!.toFixed(2)}\n` : ''}${receipt.loyaltyDiscountAmount > 0 ? `*Loyalty Redeemed:* -Rs. ${receipt.loyaltyDiscountAmount.toFixed(2)}\n` : ''}${Boolean(receipt.couponDiscountAmount && receipt.couponDiscountAmount > 0) ? `*Coupon:* -Rs. ${receipt.couponDiscountAmount!.toFixed(2)}\n` : ''}${Boolean(receipt.creditNoteDiscountAmount && receipt.creditNoteDiscountAmount > 0) ? `*Credit Note:* -Rs. ${receipt.creditNoteDiscountAmount!.toFixed(2)}\n` : ''}*GST:* Included in Price
*NET PAID:* Rs. ${receipt.grandTotal.toFixed(2)} (${paymentModeLabel})
--------------------------------
${showKhataMemo ? `*KHATA / UDHAAR ACKNOWLEDGMENT*
${prevBal > 0 ? `*Previous Khata:* Rs. ${prevBal.toFixed(2)}\n` : ''}${thisCredit > 0 ? `*This Bill Credit:* Rs. ${thisCredit.toFixed(2)}\n` : ''}*Net Outstanding Debt:* Rs. ${totalOutstanding.toFixed(2)}
${receipt.creditDueDate ? `*Promised Due Date:* ${receipt.creditDueDate}\n` : ''}"I acknowledge the balance above and agree to clear the outstanding debt."
${receipt.customerSignature ? `*Customer Signature:* Digitally Signed by ${receipt.customerName}\n` : `*Customer Signature:* __________________ (${receipt.customerName})\n`}--------------------------------\n` : ''}${hasAlterations ? '*Alteration in Progress:* Check delivery date with store.\n--------------------------------\n' : ''}*Return Policy:* ${receipt.companyReturnPolicy}
*Thank you for shopping with us!*
*Visit Again · ${receipt.companyName || 'Store'}*
================================
    `.trim();
  };

  const handleCopyTextReceipt = () => {
    navigator.clipboard.writeText(generateReceiptText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendWhatsApp = () => {
    const rawPhone = (whatsAppPhone.trim() || receipt.customerPhone).replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const text = encodeURIComponent(generateReceiptText());
    const url = `https://wa.me/${cleanPhone}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Modal Top Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">Sale Completed</h3>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {receipt.invoiceNumber}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-none">
                {receipt.companyName} • {formattedDate} {formattedTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {onOpenPrinterGuide && (
              <button
                onClick={onOpenPrinterGuide}
                title="58mm Thermal Printer Settings Guide"
                className="text-xs text-indigo-700 hover:text-indigo-900 flex items-center gap-1 font-semibold px-2 sm:px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">58mm Guide</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Column Body: Left = Scrollable Receipt, Right = Controls & Actions */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* LEFT COLUMN: Receipt Preview (Scrollable & Fully Visible) */}
          <div className="w-full md:w-[380px] lg:w-[410px] bg-slate-100/90 border-b md:border-b-0 md:border-r border-slate-200 p-3 sm:p-5 flex flex-col items-center overflow-y-auto shrink-0 select-text max-h-[45vh] md:max-h-none">
            {/* Quick Settings Bar: Format, Bold, UPI, & QR Size */}
            <div className="w-full flex flex-col gap-1.5 mb-2.5 px-0.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setAndSavePaperColumns(paperColumns === 32 ? 48 : 32)}
                  title="Click to toggle between 58mm (2-inch) and 80mm (3-inch) paper width"
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 hover:border-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{paperColumns === 32 ? '58mm Roll' : '80mm Roll'}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  {/* Code Format Toggle (Barcode / QR) */}
                  <button
                    type="button"
                    onClick={() => setCodePrintType(codePrintType === 'barcode' ? 'qr' : 'barcode')}
                    title="Toggle between 1D Barcode and 2D QR Code on receipts"
                    className="px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    {codePrintType === 'qr' ? (
                      <>
                        <QrCode className="w-3 h-3 text-indigo-600" />
                        <span>QR Mode</span>
                      </>
                    ) : (
                      <>
                        <Barcode className="w-3 h-3 text-indigo-600" />
                        <span>Barcode</span>
                      </>
                    )}
                  </button>

                  {/* Bold Thermal Print Toggle */}
                  <button
                    type="button"
                    onClick={toggleBoldThermal}
                    title="Toggle heavy bold text for faint thermal paper"
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                      isBoldThermal
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs ring-1 ring-slate-800"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isBoldThermal ? "🖨️ Bold: ON" : "🖨️ Bold: OFF"}</span>
                  </button>

                  {/* UPI QR Print Toggle */}
                  <button
                    type="button"
                    onClick={() => setIncludeUpiQr(!includeUpiQr)}
                    title="Toggle dynamic UPI Payment QR code on thermal bill"
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                      includeUpiQr
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>{includeUpiQr ? "UPI QR: ON" : "UPI QR: OFF"}</span>
                  </button>

                  {/* Composition GST Mode Toggle */}
                  <button
                    type="button"
                    onClick={toggleCompositionGst}
                    title="Toggle Composition GST: When ON, suppresses CGST/SGST tax breakdown lines and shows 'GST: Included in Price'"
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                      isCompositionGst
                        ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{isCompositionGst ? "✨ Comp. GST: ON" : "✨ Comp. GST: OFF"}</span>
                  </button>

                  {/* Google Review QR Print Toggle */}
                  {effectiveReviewUrl && (
                    <button
                      type="button"
                      onClick={() => setIncludeReviewQr(!includeReviewQr)}
                      title="Toggle Google Profile / Review QR code on thermal bill to increase customer Google ratings"
                      className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                        includeReviewQr
                          ? "bg-amber-500 text-slate-950 border-amber-600 shadow-2xs font-extrabold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Star className="w-3 h-3 fill-current text-amber-950" />
                      <span>{includeReviewQr ? "Review QR: ON" : "Review QR: OFF"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* QR Print Size Selector (shows if UPI QR is active OR codePrintType is QR OR Review QR is active) */}
              {(includeUpiQr || codePrintType === 'qr' || includeReviewQr) && (
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-indigo-600" />
                    <span>QR Size:</span>
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                    {[
                      { key: 'compact', label: 'S (80px)' },
                      { key: 'medium', label: 'M (105px)' },
                      { key: 'large', label: 'L (130px)' },
                      { key: 'xlarge', label: 'XL (155px)' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setQrPrintSize(item.key as any)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                          qrPrintSize === item.key
                            ? 'bg-indigo-600 text-white font-black shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Thermal Receipt Paper Card */}
            <div
              ref={receiptRef}
              className={`thermal-receipt-58mm thermal-receipt-50mm shadow-lg rounded-xs border border-neutral-300 relative bg-white transition-all select-text ${isBoldThermal ? 'thermal-bold' : ''}`}
            >
              {/* Top Jagged Tear Edge */}
              <div className="w-full text-center text-[7px] text-neutral-400 select-none pb-1 tracking-widest no-print">
                - - - - - - TEAR HERE - - - - - -
              </div>

              {/* Store & Legal Header */}
              <div className="text-center mb-1">
                <div className="receipt-title uppercase tracking-tight">{receipt.companyName}</div>
                <div className="receipt-sub mt-0.5">{receipt.companyAddress}</div>
                <div className="receipt-sub">Ph: {receipt.companyPhone}</div>
                {receipt.companyTaxId && receipt.companyTaxId !== 'RETAIL-CASH-UNREG' ? (
                  <>
                    <div className="receipt-sub font-bold">GSTIN: {receipt.companyTaxId}</div>
                    {isCompositionGst && (
                      <div className="receipt-sub font-extrabold tracking-tight text-[8px] uppercase">
                        BILL OF SUPPLY (COMPOSITION SCHEME)
                      </div>
                    )}
                  </>
                ) : (
                  <div className="receipt-sub text-[8px]">RETAIL CASH MEMO</div>
                )}
              </div>

              <hr />

              {/* Bill Details */}
              <div className="text-[9px] leading-tight space-y-0.5">
                <div className="receipt-row font-bold">
                  <span>INVOICE:</span>
                  <span className="font-mono">{receipt.invoiceNumber}</span>
                </div>
                <div className="receipt-row">
                  <span>DATE/TIME:</span>
                  <span>{formattedDate} {formattedTime}</span>
                </div>
                <div className="receipt-row">
                  <span>CUSTOMER:</span>
                  <span className="truncate max-w-[120px] text-right">{receipt.customerName}</span>
                </div>
                {receipt.customerPhone && receipt.customerPhone !== 'N/A' && (
                  <div className="receipt-row">
                    <span>PHONE:</span>
                    <span>{receipt.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Invoice Barcode / QR (Below Phone Number & Above Items Table) */}
              <div
                className="invoice-barcode-top text-center my-1.5"
                style={{ textAlign: 'center', margin: '4px auto 3px auto', width: '100%' }}
              >
                <BarcodeSvg
                  value={receipt.invoiceNumber.replace(/[^0-9A-Z]/gi, '')}
                  width={140}
                  height={28}
                  qrSize={activeQrPixelSize}
                  showText={codePrintType === 'barcode'}
                />
              </div>

              <hr />

              {/* Items Table Header */}
              <div className="receipt-row receipt-table-header uppercase">
                <span className="w-[18mm]">ITEM / SIZE</span>
                <span className="w-[12mm] text-center">QTYxRATE</span>
                <span className="w-[14mm] text-right">TOTAL</span>
              </div>

              {/* Item Lines */}
              <div className="space-y-1.5 py-1">
                {receipt.items.map((item, i) => (
                  <div key={i} className="text-[9px] leading-tight">
                    <div className="font-semibold text-[9.5px]">
                      {item.name}
                    </div>
                    <div className="text-[8px] text-neutral-600">
                      {[item.color, item.size ? `Size: ${item.size}` : ''].filter(Boolean).join(' · ')}
                    </div>
                    <div className="receipt-row text-[9px] font-mono">
                      <span>
                        {item.qty} x ₹{item.unitPrice.toFixed(0)}
                        {item.discountPercent > 0 && ` (-${item.discountPercent}%)`}
                      </span>
                      <span className="font-bold">₹{item.total.toFixed(2)}</span>
                    </div>

                    {item.alteration?.needed && (
                      <div className="text-[7.5px] text-indigo-950 bg-indigo-50 px-1 py-0.5 rounded mt-0.5 font-sans">
                        ✂️ Alteration: {item.alteration.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <hr />

              {/* Financial Summary */}
              <div className="text-[9px] space-y-0.5 font-mono">
                <div className="receipt-row">
                  <span>SUBTOTAL:</span>
                  <span>₹{receipt.subtotal.toFixed(2)}</span>
                </div>

                {/* Total number of items cleanly displayed right under SUBTOTAL */}
                <div className="receipt-row text-neutral-700">
                  <span>TOTAL ITEMS:</span>
                  <span>{totalItemsCount} pcs</span>
                </div>

                {receipt.itemDiscountsTotal > 0 && (
                  <div className="receipt-row text-neutral-700">
                    <span>ITEM DISCOUNTS:</span>
                    <span>-₹{receipt.itemDiscountsTotal.toFixed(2)}</span>
                  </div>
                )}

                {Boolean(receipt.promoDiscountAmount && receipt.promoDiscountAmount > 0) && (
                  <div className="receipt-row text-emerald-700 font-bold">
                    <span>OFFER ({receipt.promoTitleApplied || 'PROMO'}):</span>
                    <span>-₹{receipt.promoDiscountAmount!.toFixed(2)}</span>
                  </div>
                )}

                {receipt.loyaltyDiscountAmount > 0 && (
                  <div className="receipt-row text-neutral-700">
                    <span>POINTS REDEEMED:</span>
                    <span>-₹{receipt.loyaltyDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                {Boolean(receipt.couponDiscountAmount && receipt.couponDiscountAmount > 0) && (
                  <div className="receipt-row text-indigo-700">
                    <span>COUPON ({receipt.couponCodeApplied}):</span>
                    <span>-₹{receipt.couponDiscountAmount!.toFixed(2)}</span>
                  </div>
                )}

                {Boolean(receipt.creditNoteDiscountAmount && receipt.creditNoteDiscountAmount > 0) && (
                  <div className="receipt-row text-indigo-700">
                    <span>CREDIT NOTE ({receipt.creditNoteCodeApplied}):</span>
                    <span>-₹{receipt.creditNoteDiscountAmount!.toFixed(2)}</span>
                  </div>
                )}

                {/* GST Notice (GST is included in price; no separate tax breakdown amount printed) */}
                <div className="receipt-row text-[9px] font-bold text-black py-0.5">
                  <span>GST:</span>
                  <span>INCLUDED IN PRICE</span>
                </div>

                <hr />

                {/* XL Net Payable Amount Banner */}
                <div
                  className="receipt-row receipt-net-payable font-black py-1 my-0.5"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '2.5px 0',
                    margin: '2px 0',
                    width: '100%',
                  }}
                >
                  <span
                    className="net-label"
                    style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.4px', textTransform: 'uppercase' }}
                  >
                    NET PAYABLE:
                  </span>
                  <span
                    className="net-amount font-mono"
                    style={{ fontSize: '17.5px', fontWeight: 900, letterSpacing: '-0.3px' }}
                  >
                    ₹{receipt.grandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="receipt-row text-[8.5px]">
                  <span>PAYMENT MODE:</span>
                  <span className="font-bold">
                    {receipt.paymentMode === 'Split'
                      ? 'SPLIT PAYMENT'
                      : receipt.paymentMode === 'Credit'
                        ? 'KHATA / CREDIT'
                        : receipt.paymentMode.toUpperCase()}
                  </span>
                </div>
                {receipt.paymentMode === 'Split' && receipt.splitBreakdown && (
                  <div className="text-[8px] pl-1.5 space-y-0.5 text-neutral-800 font-mono">
                    {receipt.splitBreakdown.cash > 0 && (
                      <div className="receipt-row">
                        <span>• CASH:</span>
                        <span>₹{receipt.splitBreakdown.cash.toFixed(2)}</span>
                      </div>
                    )}
                    {receipt.splitBreakdown.upi > 0 && (
                      <div className="receipt-row">
                        <span>• UPI:</span>
                        <span>₹{receipt.splitBreakdown.upi.toFixed(2)}</span>
                      </div>
                    )}
                    {receipt.splitBreakdown.card > 0 && (
                      <div className="receipt-row">
                        <span>• CARD:</span>
                        <span>₹{receipt.splitBreakdown.card.toFixed(2)}</span>
                      </div>
                    )}
                    {receipt.splitBreakdown.credit !== undefined && receipt.splitBreakdown.credit > 0 && (
                      <div className="receipt-row font-bold text-black">
                        <span>• KHATA / CREDIT:</span>
                        <span>₹{receipt.splitBreakdown.credit.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
                {/* Credit / Udhaar Memo Details & Customer Signature */}
                {(() => {
                  const isCreditSale =
                    receipt.paymentMode === 'Credit' ||
                    Boolean(receipt.creditAmount && receipt.creditAmount > 0) ||
                    Boolean(receipt.splitBreakdown?.credit && receipt.splitBreakdown.credit > 0);
                  const hasPrevBalance = Boolean(receipt.customerPreviousBalance && receipt.customerPreviousBalance > 0);
                  const showKhataMemo = isCreditSale || hasPrevBalance || Boolean(receipt.customerSignature);

                  if (!showKhataMemo) return null;

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

                  return (
                    <div className="mt-1.5 pt-1.5 border-t-2 border-dashed border-neutral-500 text-[8px] space-y-0.5">
                      <div className="text-center font-bold text-black text-[8.5px] tracking-wide pb-0.5">
                        *** KHATA / UDHAAR ACKNOWLEDGMENT ***
                      </div>

                      {hasPrevBalance && (
                        <div className="receipt-row text-neutral-800">
                          <span>PREVIOUS KHATA:</span>
                          <span className="font-mono">₹{prevBal.toFixed(2)}</span>
                        </div>
                      )}

                      {thisCredit > 0 && (
                        <div className="receipt-row font-bold text-neutral-900">
                          <span>THIS BILL CREDIT:</span>
                          <span className="font-mono">₹{thisCredit.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="receipt-row font-extrabold text-black text-[8.5px] pt-0.5 border-t border-dotted border-neutral-400">
                        <span>NET OUTSTANDING:</span>
                        <span className="font-mono">₹{totalOutstanding.toFixed(2)}</span>
                      </div>

                      {receipt.creditDueDate && (
                        <div className="receipt-row text-neutral-700">
                          <span>AGREED DUE DATE:</span>
                          <span className="font-mono font-semibold">{receipt.creditDueDate}</span>
                        </div>
                      )}

                      <div className="text-[7px] text-center text-neutral-700 italic pt-1 leading-tight px-1">
                        "I acknowledge the previous & current balance above and agree to clear the outstanding debt."
                      </div>

                      {/* Customer Signature: Digital or Paper Line */}
                      <div className="pt-2 text-center text-[7.5px] text-neutral-900">
                        {receipt.customerSignature ? (
                          <div className="space-y-0.5">
                            <img
                              src={receipt.customerSignature}
                              alt="Customer Signature"
                              className="max-h-12 max-w-[140px] mx-auto object-contain my-0.5"
                            />
                            <div className="border-b border-black w-36 mx-auto mb-0.5" />
                            <div className="font-bold text-[7.5px] text-black">
                              Digitally Signed by {receipt.customerName}
                            </div>
                            {receipt.customerSignedAt && (
                              <div className="text-[6.5px] text-neutral-600 font-mono">
                                {new Date(receipt.customerSignedAt).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="pt-1">
                            <div className="border-b border-black w-36 mx-auto mb-1" />
                            <div className="font-semibold text-black">Customer Signature</div>
                            <div className="text-[7px] text-neutral-600">({receipt.customerName})</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Dynamic UPI Payment QR Code on Receipt */}
              {includeUpiQr && storeUpiId && (
                <>
                  <hr />
                  <div
                    className="upi-receipt-qr-block text-center py-1 space-y-0.5"
                    style={{ textAlign: 'center', margin: '2px auto', width: '100%' }}
                  >
                    <div
                      className="text-[8px] font-bold uppercase tracking-wider text-black"
                      style={{ textAlign: 'center', display: 'block', width: '100%' }}
                    >
                      Scan & Pay via UPI
                    </div>
                    <UpiPaymentQr
                      upiId={storeUpiId}
                      payeeName={storeUpiName || receipt.companyName}
                      amount={
                        receipt.paymentMode === 'UPI'
                          ? receipt.grandTotal
                          : (receipt.splitBreakdown?.upi || receipt.grandTotal)
                      }
                      transactionNote={`Bill ${receipt.invoiceNumber}`}
                      size={activeQrPixelSize}
                      isThermalReceipt={true}
                      showDetails={false}
                    />
                    <div
                      className="text-[7.5px] font-mono font-bold text-black"
                      style={{ textAlign: 'center', display: 'block', width: '100%', margin: '1px auto 0 auto' }}
                    >
                      ₹{(receipt.paymentMode === 'UPI' ? receipt.grandTotal : (receipt.splitBreakdown?.upi || receipt.grandTotal)).toFixed(2)} · {storeUpiId}
                    </div>
                    <div
                      className="text-[6.5px] text-neutral-600 font-sans"
                      style={{ textAlign: 'center', display: 'block', width: '100%', margin: '0 auto' }}
                    >
                      GPay · PhonePe · Paytm · BHIM
                    </div>
                  </div>
                </>
              )}

              <hr />

              {/* Footer Notice */}
              <div
                className="receipt-footer text-center pt-1 space-y-1"
                style={{ textAlign: 'center', margin: '4px auto 0 auto', width: '100%' }}
              >
                <div
                  className="receipt-policy text-[7.5px] leading-tight px-1 text-neutral-600"
                  style={{ textAlign: 'center', margin: '4px auto 2px auto', width: '100%', display: 'block' }}
                >
                  {receipt.companyReturnPolicy}
                </div>
                <div
                  className="receipt-thanks text-[9px] font-bold tracking-wider pt-0.5"
                  style={{ textAlign: 'center', margin: '3px auto 1px auto', width: '100%', display: 'block' }}
                >
                  *** THANK YOU ***
                </div>

                {/* Google Review QR Code on Bill (Increases Google Business Reviews) */}
                {includeReviewQr && effectiveReviewUrl && (
                  <>
                    <hr />
                    <GoogleReviewQr
                      reviewUrl={effectiveReviewUrl}
                      size={activeQrPixelSize}
                      isThermalReceipt={true}
                      title={googleReviewPromptText || 'Rate Us 5★ On Google'}
                      subTitle="Scan with camera to review us"
                    />
                  </>
                )}

                <div
                  className="receipt-brand text-[7.5px] font-semibold text-neutral-600"
                  style={{ textAlign: 'center', margin: '1px auto 0 auto', width: '100%', display: 'block' }}
                >
                  Visit Again · {receipt.companyName || 'Store'}
                </div>
              </div>
            </div>

            {/* Hidden Tailor Companion Slip (for printing) */}
            {hasAlterations && (
              <div ref={tailorSlipRef} style={{ display: 'none' }} className="thermal-receipt-58mm thermal-receipt-50mm">
                <div className="receipt-title">TAILOR ALTERATION SLIP</div>
                <div className="receipt-sub">STAPLE TO GARMENT</div>
                <hr />
                <div className="text-[9px]">
                  <div><strong>BILL:</strong> {receipt.invoiceNumber}</div>
                  <div><strong>CUSTOMER:</strong> {receipt.customerName} ({receipt.customerPhone})</div>
                  <div><strong>DATE:</strong> {formattedDate}</div>
                </div>
                <hr />
                {receipt.items
                  .filter((i) => i.alteration?.needed)
                  .map((item, idx) => (
                    <div key={idx} className="text-[9px] my-1 border-b border-black/20 pb-1">
                      <div><strong>ITEM:</strong> {item.name}</div>
                      <div><strong>SIZE:</strong> {item.size} · {item.color}</div>
                      <div><strong>NOTES:</strong> {item.alteration?.notes}</div>
                      <div><strong>READY BY:</strong> {item.alteration?.promisedDate}</div>
                    </div>
                  ))}
                <hr />
                <div
                  className="receipt-center text-center text-[8px] font-bold"
                  style={{ textAlign: 'center', margin: '3px auto 0 auto', width: '100%', display: 'block' }}
                >
                  {(receipt.companyName || 'STORE').toUpperCase()} ALTERATIONS
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Action Buttons & Transaction Summary */}
          <div className="flex-1 bg-white p-6 flex flex-col justify-between overflow-y-auto space-y-5">
            <div className="space-y-4">
              {/* Quick Transaction Overview Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Net Paid Amount
                  </span>
                  <div className="text-xl font-extrabold font-mono text-emerald-950 mt-0.5">
                    ₹{receipt.grandTotal.toFixed(2)}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 block">
                    Mode: {receipt.paymentMode}
                  </span>
                  {receipt.paymentMode === 'Split' && receipt.splitBreakdown && (
                    <div className="text-[10px] font-mono text-emerald-900 mt-1 flex flex-wrap gap-x-2 border-t border-emerald-200/60 pt-1">
                      {receipt.splitBreakdown.cash > 0 && <span>Cash: ₹{receipt.splitBreakdown.cash.toFixed(2)}</span>}
                      {receipt.splitBreakdown.upi > 0 && <span>UPI: ₹{receipt.splitBreakdown.upi.toFixed(2)}</span>}
                      {receipt.splitBreakdown.card > 0 && <span>Card: ₹{receipt.splitBreakdown.card.toFixed(2)}</span>}
                      {Boolean(receipt.splitBreakdown.credit && receipt.splitBreakdown.credit > 0) && (
                        <span>Khata: ₹{receipt.splitBreakdown.credit!.toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Items & Garments
                  </span>
                  <div className="text-xl font-extrabold font-mono text-slate-900 mt-0.5">
                    {totalItemsCount} pcs
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {receipt.items.length} apparel variants
                  </span>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{receipt.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{receipt.customerPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Invoice
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {receipt.invoiceNumber}
                  </span>
                </div>
              </div>

              {/* Digital E-Receipt & WhatsApp Share Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Send Digital E-Receipt via WhatsApp</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Instant E-Bill
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={whatsAppPhone || (receipt.customerPhone !== 'N/A' ? receipt.customerPhone : '')}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Copy Plain-Text Receipt Option */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800">Copy Receipt Text</div>
                  <div className="text-[11px] text-slate-500">
                    Copy invoice summary text for messaging or email records.
                  </div>
                </div>
                <button
                  onClick={handleCopyTextReceipt}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              {/* Alterations Tag Button (Conditional) */}
              {hasAlterations && (
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Garment Alterations Included</span>
                    </div>
                    <div className="text-[11px] text-indigo-800 mt-0.5">
                      Print separate 58mm tailor slip to staple onto customer garment.
                    </div>
                  </div>
                  <button
                    onClick={handlePrintTailorSlip}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-100 border border-indigo-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Print Tailor Tag</span>
                  </button>
                </div>
              )}

              {/* Customer Khata Signature Management Card */}
              {(() => {
                const isCreditSale =
                  receipt.paymentMode === 'Credit' ||
                  Boolean(receipt.creditAmount && receipt.creditAmount > 0) ||
                  Boolean(receipt.splitBreakdown?.credit && receipt.splitBreakdown.credit > 0);
                const hasPrevBalance = Boolean(receipt.customerPreviousBalance && receipt.customerPreviousBalance > 0);
                const showKhataMemo = isCreditSale || hasPrevBalance || Boolean(receipt.customerSignature);

                if (!showKhataMemo) return null;

                return (
                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          receipt.customerSignature ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <FileSignature className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span>Customer Khata Signature</span>
                          {receipt.customerSignature ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                              Signed ✓
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full">
                              Paper Sign
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {receipt.customerSignature
                            ? `Digitally captured at ${new Date(
                                receipt.customerSignedAt || receipt.date
                              ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Sign on touch screen/stylus or sign on printed paper.'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsSignatureModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>{receipt.customerSignature ? 'Re-sign' : 'Capture Signature'}</span>
                      </button>
                      {receipt.customerSignature && (
                        <button
                          type="button"
                          onClick={handleClearSignature}
                          className="px-2 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove signature (revert to paper line)"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Everycom & Thermal Printer Connection Panel */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Printer className="w-4 h-4 text-indigo-600" />
                    <span>Printer Output Mode</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {paperColumns === 32 ? '58mm / 2"' : '80mm / 3"'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Paper Width Toggle */}
                    <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setAndSavePaperColumns(32)}
                        className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                          paperColumns === 32 ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-600'
                        }`}
                        title="58mm roll (Everycom EC-58 / 32 columns)"
                      >
                        58mm
                      </button>
                      <button
                        type="button"
                        onClick={() => setAndSavePaperColumns(48)}
                        className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                          paperColumns === 48 ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-600'
                        }`}
                        title="80mm roll (Everycom EC-80 / 48 columns)"
                      >
                        80mm
                      </button>
                    </div>

                    {onOpenPrinterGuide && (
                      <button
                        type="button"
                        onClick={onOpenPrinterGuide}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        title="Open Everycom & Android Setup Guide"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Setup Guide</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Print Method Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setAndSavePrintMethod('bluetooth')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      printMethod === 'bluetooth'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Bluetooth className={`w-4 h-4 ${printMethod === 'bluetooth' ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                        Zero-App
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <div className="text-xs font-bold text-slate-900 leading-tight">Bluetooth</div>
                      <div className="text-[10px] text-slate-500">Everycom Direct</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAndSavePrintMethod('usb')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      printMethod === 'usb'
                        ? 'border-cyan-600 bg-cyan-50/70 ring-1 ring-cyan-500 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Usb className={`w-4 h-4 ${printMethod === 'usb' ? 'text-cyan-600' : 'text-slate-500'}`} />
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800">
                        Dark 203 DPI
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <div className="text-xs font-bold text-slate-900 leading-tight">USB Direct</div>
                      <div className="text-[10px] text-slate-500">Raw ESC/POS</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAndSavePrintMethod('rawbt')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      printMethod === 'rawbt'
                        ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-400 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Zap className={`w-4 h-4 ${printMethod === 'rawbt' ? 'text-amber-500 fill-current' : 'text-slate-500'}`} />
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                        1-Tap
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <div className="text-xs font-bold text-slate-900 leading-tight">RawBT App</div>
                      <div className="text-[10px] text-slate-500">Android Bridge</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAndSavePrintMethod('browser')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      printMethod === 'browser'
                        ? 'border-slate-800 bg-slate-100 ring-1 ring-slate-800 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Printer className={`w-4 h-4 ${printMethod === 'browser' ? 'text-slate-900' : 'text-slate-500'}`} />
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        System
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <div className="text-xs font-bold text-slate-900 leading-tight">Browser</div>
                      <div className="text-[10px] text-slate-500">Windows Dialog</div>
                    </div>
                  </button>
                </div>

                {/* Detected Hardware Auto-Discovery Bar */}
                {(detectedPrinters.printers.length > 0 || detectedPrinters.ports.length > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[10px] text-emerald-900">
                    <span className="font-bold flex items-center gap-1 text-emerald-800 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Ready Hardware:
                    </span>
                    {detectedPrinters.printers.map((p, idx) => (
                      <span key={idx} className="bg-white px-1.5 py-0.2 rounded border border-emerald-200 font-mono text-[9.5px] font-bold text-emerald-950">
                        🖨️ USB: {p.Name}
                      </span>
                    ))}
                    {detectedPrinters.ports.map((port, idx) => (
                      <span key={idx} className="bg-white px-1.5 py-0.2 rounded border border-emerald-200 font-mono text-[9.5px] font-bold text-indigo-950">
                        📶 BT: {port.DeviceID}
                      </span>
                    ))}
                  </div>
                )}

                {/* Helpful tips & disconnect option */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 px-0.5">
                  <span>
                    {printMethod === 'bluetooth' && '⚡ Paired printer auto-reconnects seamlessly on every new bill.'}
                    {printMethod === 'usb' && '⚡ USB Direct sends native ESC/POS commands with zero Windows spooler halftoning.'}
                    {printMethod === 'rawbt' && '⚡ Sends invoice intent directly to RawBT driver service.'}
                    {printMethod === 'browser' && '⚡ Opens Windows Print Spooler with high-contrast zero-dither layout.'}
                  </span>
                  {printMethod === 'bluetooth' && (
                    <button
                      type="button"
                      onClick={() => {
                        disconnectBluetoothPrinter();
                        setBluetoothStatus('Bluetooth printer pairing disconnected.');
                      }}
                      className="text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer shrink-0 ml-2"
                    >
                      Reset Pairing
                    </button>
                  )}
                  {printMethod === 'usb' && (
                    <button
                      type="button"
                      onClick={() => {
                        disconnectUsbPrinter();
                        setBluetoothStatus('USB printer disconnected.');
                      }}
                      className="text-cyan-700 hover:text-cyan-900 underline font-semibold cursor-pointer shrink-0 ml-2"
                    >
                      Reset USB
                    </button>
                  )}
                </div>

                {/* Status Message */}
                {bluetoothStatus && (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 flex items-center justify-between">
                    <span className="truncate">{bluetoothStatus}</span>
                    <button
                      onClick={() => setBluetoothStatus(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold ml-1.5 text-xs shrink-0 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Primary Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center"
              >
                Close & Next Sale
              </button>

              <button
                type="button"
                onClick={handlePrimaryPrint}
                disabled={isBluetoothPrinting}
                className={`w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold text-white rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                  printMethod === 'bluetooth'
                    ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-600/25'
                    : printMethod === 'usb'
                    ? 'bg-cyan-700 hover:bg-cyan-800 active:bg-cyan-900 shadow-cyan-700/25'
                    : printMethod === 'rawbt'
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/25'
                    : 'bg-slate-900 hover:bg-slate-800 active:bg-black shadow-slate-900/20'
                }`}
              >
                {isBluetoothPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Communicating with Printer...</span>
                  </>
                ) : printMethod === 'bluetooth' ? (
                  <>
                    <Bluetooth className="w-4 h-4 text-white" />
                    <span>Print via Bluetooth (Everycom)</span>
                  </>
                ) : printMethod === 'usb' ? (
                  <>
                    <Usb className="w-4 h-4 text-white" />
                    <span>Print via USB (ESC/POS Direct)</span>
                  </>
                ) : printMethod === 'rawbt' ? (
                  <>
                    <Zap className="w-4 h-4 text-white fill-current" />
                    <span>Print via RawBT (Android)</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Print Thermal Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Signature Pad Modal */}
      {receipt && (
        <SignaturePadModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          customerName={receipt.customerName}
          customerPhone={receipt.customerPhone}
          previousBalance={receipt.customerPreviousBalance || 0}
          creditAmount={
            receipt.creditAmount !== undefined
              ? receipt.creditAmount
              : receipt.paymentMode === 'Credit'
                ? receipt.grandTotal
                : (receipt.splitBreakdown?.credit || 0)
          }
          totalNewBalance={
            receipt.customerNewBalance !== undefined
              ? receipt.customerNewBalance
              : (receipt.customerPreviousBalance || 0) +
                (receipt.creditAmount !== undefined
                  ? receipt.creditAmount
                  : receipt.paymentMode === 'Credit'
                    ? receipt.grandTotal
                    : (receipt.splitBreakdown?.credit || 0))
          }
          dueDate={receipt.creditDueDate}
          onConfirm={handleSaveSignature}
          onSignOnPaper={() => {
            handleClearSignature();
            setIsSignatureModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
