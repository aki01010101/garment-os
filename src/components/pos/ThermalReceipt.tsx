import React, { useRef, useState } from 'react';
import { SaleTransaction, QR_SIZE_PIXELS } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { UpiPaymentQr } from '../common/UpiPaymentQr';
import { useApp } from '../../context/AppContext';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  Printer,
  X,
  Barcode,
  QrCode,
  Smartphone,
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
} from 'lucide-react';

interface ThermalReceiptProps {
  receipt: SaleTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrinterGuide?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  receipt,
  isOpen,
  onClose,
  onOpenPrinterGuide,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const tailorSlipRef = useRef<HTMLDivElement>(null);
  const {
    codePrintType,
    setCodePrintType,
    qrPrintSize,
    setQrPrintSize,
    storeUpiId,
    storeUpiName,
    storeGoogleReviewUrl,
    enableEReceiptQr,
  } = useApp();

  const activeQrPixelSize = QR_SIZE_PIXELS[qrPrintSize] || 130;

  const [copied, setCopied] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>('');
  const [includeUpiQr, setIncludeUpiQr] = useState<boolean>(true);
  const [isBoldThermal, setIsBoldThermal] = useState<boolean>(() => {
    try {
      return localStorage.getItem('thermal_bold_print') !== 'false';
    } catch {
      return true;
    }
  });

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

  const handlePrint = () => {
    if (receiptRef.current) {
      printThermalReceiptHtml(receiptRef.current.innerHTML, isBoldThermal);
    } else {
      window.focus();
      window.print();
    }
  };

  const handlePrintTailorSlip = () => {
    if (tailorSlipRef.current) {
      printThermalReceiptHtml(tailorSlipRef.current.innerHTML, isBoldThermal);
    }
  };

  const generateReceiptText = () => {
    const paymentModeLabel =
      receipt.paymentMode === 'Split' && receipt.splitBreakdown
        ? `Split: Cash Rs. ${receipt.splitBreakdown.cash.toFixed(2)}, UPI Rs. ${receipt.splitBreakdown.upi.toFixed(2)}, Card Rs. ${receipt.splitBreakdown.card.toFixed(2)}`
        : receipt.paymentMode;

    return `
================================
*${receipt.companyName.toUpperCase()}*
================================
Store: ${receipt.companyAddress}
Tel: ${receipt.companyPhone}
${receipt.companyTaxId && receipt.companyTaxId !== 'RETAIL-CASH-UNREG' ? `GSTIN: ${receipt.companyTaxId}` : 'Retail Cash Memo'}
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
${receipt.itemDiscountsTotal > 0 ? `*Discount:* -Rs. ${receipt.itemDiscountsTotal.toFixed(2)}\n` : ''}${Boolean(receipt.promoDiscountAmount && receipt.promoDiscountAmount > 0) ? `*Offer/Promo (${receipt.promoTitleApplied || 'Special Deal'}):* -Rs. ${receipt.promoDiscountAmount!.toFixed(2)}\n` : ''}${receipt.loyaltyDiscountAmount > 0 ? `*Loyalty Redeemed:* -Rs. ${receipt.loyaltyDiscountAmount.toFixed(2)}\n` : ''}${Boolean(receipt.couponDiscountAmount && receipt.couponDiscountAmount > 0) ? `*Coupon:* -Rs. ${receipt.couponDiscountAmount!.toFixed(2)}\n` : ''}${Boolean(receipt.creditNoteDiscountAmount && receipt.creditNoteDiscountAmount > 0) ? `*Credit Note:* -Rs. ${receipt.creditNoteDiscountAmount!.toFixed(2)}\n` : ''}${receipt.taxTotal > 0 ? `*GST:* Rs. ${receipt.taxTotal.toFixed(2)}\n` : ''}*NET PAID:* Rs. ${receipt.grandTotal.toFixed(2)} (${paymentModeLabel})
--------------------------------
${hasAlterations ? '*Alteration in Progress:* Check delivery date with store.\n--------------------------------\n' : ''}*Return Policy:* ${receipt.companyReturnPolicy}
*Thank you for shopping with us!*
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 md:p-6 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Modal Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">Sale Completed</h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {receipt.invoiceNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {receipt.companyName} • {formattedDate} {formattedTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPrinterGuide && (
              <button
                onClick={onOpenPrinterGuide}
                title="58mm Thermal Printer Settings Guide"
                className="text-xs text-indigo-700 hover:text-indigo-900 flex items-center gap-1 font-semibold px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>58mm Guide</span>
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
          <div className="w-full md:w-[380px] lg:w-[410px] bg-slate-100/90 border-b md:border-b-0 md:border-r border-slate-200 p-5 flex flex-col items-center overflow-y-auto shrink-0 select-text">
            {/* Quick Settings Bar: Format, Bold, UPI, & QR Size */}
            <div className="w-full flex flex-col gap-1.5 mb-2.5 px-0.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>58mm Roll</span>
                </div>
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
                </div>
              </div>

              {/* QR Print Size Selector (shows if UPI QR is active OR codePrintType is QR) */}
              {(includeUpiQr || codePrintType === 'qr') && (
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
                  <div className="receipt-sub font-bold">GSTIN: {receipt.companyTaxId}</div>
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

                {receipt.taxTotal > 0 && (
                  <>
                    <div className="receipt-row text-[8px] text-neutral-600">
                      <span>CGST:</span>
                      <span>₹{(receipt.taxTotal / 2).toFixed(2)}</span>
                    </div>
                    <div className="receipt-row text-[8px] text-neutral-600">
                      <span>SGST:</span>
                      <span>₹{(receipt.taxTotal / 2).toFixed(2)}</span>
                    </div>
                  </>
                )}

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
                  <span className="font-bold">{receipt.paymentMode === 'Split' ? 'SPLIT PAYMENT' : receipt.paymentMode.toUpperCase()}</span>
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
                  </div>
                )}
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

              {/* Barcode & Footer Notice */}
              <div
                className="receipt-footer text-center pt-1 space-y-1"
                style={{ textAlign: 'center', margin: '4px auto 0 auto', width: '100%' }}
              >
                <BarcodeSvg
                  value={receipt.invoiceNumber.replace(/[^0-9A-Z]/gi, '')}
                  width={140}
                  height={28}
                  qrSize={activeQrPixelSize}
                  showText={codePrintType === 'barcode'}
                />
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

                {/* Digital E-Receipt & 5-Star Review Prompt */}
                {enableEReceiptQr && (
                  <div
                    style={{
                      textAlign: 'center',
                      margin: '4px auto',
                      width: '100%',
                      borderTop: '1px dashed #777',
                      paddingTop: '3px',
                    }}
                  >
                    <div style={{ fontSize: '8px', fontWeight: 'bold' }}>RATE YOUR FIT 5★ ON GOOGLE</div>
                    <div style={{ fontSize: '7px', color: '#444' }}>{storeGoogleReviewUrl}</div>
                  </div>
                )}

                <div
                  className="receipt-brand text-[7.5px] text-neutral-500"
                  style={{ textAlign: 'center', margin: '1px auto 0 auto', width: '100%', display: 'block' }}
                >
                  Visit Again · Garment OS Retail POS
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
                onClick={handlePrint}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
