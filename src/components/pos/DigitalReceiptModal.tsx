import React, { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { SaleTransaction } from '../../types';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  QrCode,
  X,
  Share2,
  Printer,
  Star,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Tag,
  Scissors,
  Smartphone,
  Copy,
  Sparkles,
} from 'lucide-react';

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: SaleTransaction | null;
  googleReviewUrl: string;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  googleReviewUrl,
}) => {
  const [copied, setCopied] = useState(false);

  // Digital receipt URL or shareable link
  const digitalReceiptUrl = useMemo(() => {
    if (!receipt) return '';
    // Builds a direct query link that decodes into this invoice receipt
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://garmentos.in';
    return `${origin}/receipt?inv=${encodeURIComponent(receipt.invoiceNumber)}&date=${encodeURIComponent(receipt.date)}`;
  }, [receipt]);

  // Generate SVG QR Code
  const qrSvgString = useMemo(() => {
    if (!digitalReceiptUrl) return '';
    let svgOutput = '';
    try {
      QRCode.toString(
        digitalReceiptUrl,
        {
          type: 'svg',
          margin: 1,
          width: 140,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (err, str) => {
          if (!err) svgOutput = str;
        }
      );
    } catch {
      svgOutput = '';
    }
    return svgOutput;
  }, [digitalReceiptUrl]);

  if (!isOpen || !receipt) return null;

  const totalGarments = receipt.items.reduce((sum, i) => sum + i.qty, 0);
  const totalSavings =
    receipt.itemDiscountsTotal +
    (receipt.promoDiscountAmount || 0) +
    receipt.loyaltyDiscountAmount +
    (receipt.couponDiscountAmount || 0) +
    (receipt.creditNoteDiscountAmount || 0);

  const handleShareWhatsApp = () => {
    const text = `*Digital E-Receipt - ${receipt.companyName}*\nInvoice: ${receipt.invoiceNumber}\nDate: ${new Date(
      receipt.date
    ).toLocaleDateString('en-IN')}\nTotal Paid: ₹${receipt.grandTotal.toFixed(
      2
    )}\n\nView Full Digital Bill & Warranty:\n${digitalReceiptUrl}\n\nLoved your shopping experience? Rate us 5 stars on Google: ${googleReviewUrl}`;

    const cleanPhone = receipt.customerPhone ? receipt.customerPhone.replace(/[\s\-\+]/g, '').slice(-10) : '';
    const waUrl = cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(digitalReceiptUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Instant E-Receipt & QR Gateway</h3>
              <p className="text-[11px] text-slate-500">Contactless digital bill & feedback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Customer QR Presentation Card */}
          <div className="p-4 bg-gradient-to-b from-indigo-50/80 to-purple-50/60 rounded-2xl border border-indigo-100 text-center space-y-3 shadow-xs">
            <div className="text-xs font-bold text-indigo-950 flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Scan to Open Digital Bill on Phone</span>
            </div>

            {/* QR SVG Render */}
            <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl shadow-sm border border-indigo-200 flex items-center justify-center">
              {qrSvgString ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: qrSvgString }}
                />
              ) : (
                <div className="text-slate-400 text-[10px]">Generating QR...</div>
              )}
            </div>

            <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
              Point your smartphone camera to access your tax invoice, alteration status, and digital warranty.
            </p>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <Copy className="w-3 h-3 text-slate-500" />
                <span>{copied ? 'Link Copied!' : 'Copy Bill Link'}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <Share2 className="w-3 h-3" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Google Reviews 5-Star Callout */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                ★ 5.0
              </div>
              <div>
                <div className="font-bold text-amber-950 text-xs flex items-center gap-1">
                  <span>Loved your fit & service today?</span>
                </div>
                <div className="text-[10px] text-amber-800">Support our store with a 5-star Google review!</div>
              </div>
            </div>

            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-extrabold text-[11px] rounded-xl flex items-center gap-1 shadow-sm shrink-0 transition-colors"
            >
              <span>Review Us</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Digital Invoice Preview Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
            {/* Store & Bill Meta */}
            <div className="flex items-start justify-between border-b border-slate-200/80 pb-2.5">
              <div>
                <div className="font-bold text-slate-900 text-sm">{receipt.companyName}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {receipt.companyTaxId} • {receipt.companyAddress}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-indigo-700">{receipt.invoiceNumber}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {new Date(receipt.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Customer Meta */}
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>
                Customer: <strong>{receipt.customerName}</strong>
              </span>
              <span className="font-mono">{receipt.customerPhone}</span>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipt.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.size} • {item.color}
                          {item.discountPercent > 0 && ` (-${item.discountPercent}%)`}
                        </div>
                        {item.alteration?.needed && (
                          <div className="text-[10px] text-indigo-600 flex items-center gap-1 mt-0.5 font-sans">
                            <Scissors className="w-3 h-3" />
                            <span>Alteration: {item.alteration.notes || 'In progress'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600">{item.qty}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs font-mono text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal ({totalGarments} pcs):</span>
                <span>₹{receipt.subtotal.toFixed(2)}</span>
              </div>

              {receipt.itemDiscountsTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Item Discounts:</span>
                  <span>-₹{receipt.itemDiscountsTotal.toFixed(2)}</span>
                </div>
              )}

              {receipt.promoDiscountAmount && receipt.promoDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Special Offer ({receipt.promoTitleApplied || 'Promo'}):</span>
                  <span>-₹{receipt.promoDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {receipt.loyaltyDiscountAmount > 0 && (
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>Loyalty Redeemed:</span>
                  <span>-₹{receipt.loyaltyDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {receipt.taxTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax (CGST + SGST):</span>
                  <span>+₹{receipt.taxTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Net Total Paid:</span>
                <span>₹{receipt.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Savings Callout */}
            {totalSavings > 0 && (
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 text-[11px] font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Total Savings on this Bill:</span>
                </span>
                <span>₹{totalSavings.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[10px] text-slate-400 font-mono">Invoice #{receipt.invoiceNumber}</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close Gateway
          </button>
        </div>
      </div>
    </div>
  );
};

