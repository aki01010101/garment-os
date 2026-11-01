import React, { useRef, useState } from 'react';
import { CreditNote } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  Printer,
  X,
  Copy,
  Check,
  CreditCard,
  Receipt,
  Calendar,
} from 'lucide-react';

interface CreditNotePreviewModalProps {
  creditNote: CreditNote | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CreditNotePreviewModal: React.FC<CreditNotePreviewModalProps> = ({
  creditNote,
  isOpen,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !creditNote) return null;

  const handlePrint = () => {
    if (receiptRef.current) {
      printThermalReceiptHtml(receiptRef.current.innerHTML);
    } else {
      window.focus();
      window.print();
    }
  };

  const generateVoucherText = () => {
    return `
================================
*STORE CREDIT VOUCHER*
*${creditNote.companyName.toUpperCase()}*
================================
Voucher Code: *${creditNote.code}*
*Credit Amount: Rs. ${creditNote.amount}.00*
Issued Date: ${creditNote.issuedDate}
Valid Until: ${creditNote.expiryDate}
Original Invoice: ${creditNote.originalInvoiceNumber}
Customer: ${creditNote.customerName} (${creditNote.customerPhone})
--------------------------------
*RETURNED ITEMS:*
${creditNote.itemsReturned.map((i) => `* ${i.qty}x ${i.productName} [${i.size}] (Rs. ${i.amount.toFixed(2)})`).join('\n')}
--------------------------------
*Terms:* Present this voucher code at checkout to redeem against any clothing purchase. Non-refundable for cash.
*GARMENT OS STORE CREDIT*
================================
    `.trim();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateVoucherText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden flex flex-col my-6">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">58mm Credit Note Preview</h3>
              <p className="text-xs text-slate-500 font-mono">{creditNote.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic 58mm Thermal Paper Preview Box */}
        <div className="p-6 bg-slate-200/70 flex flex-col items-center justify-center overflow-y-auto max-h-[60vh]">
          <div className="text-[11px] font-medium text-slate-600 mb-2.5 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            <span>58mm Thermal Roll Format (48mm Printable Area)</span>
          </div>

          <div
            ref={receiptRef}
            className="thermal-receipt-50mm shadow-xl rounded-xs border border-neutral-300 relative bg-white"
          >
            {/* Jagged tear edge effect */}
            <div className="w-full text-center text-[7px] text-neutral-400 select-none pb-1 tracking-widest no-print">
              - - - - - - TEAR HERE - - - - - -
            </div>

            {/* Header */}
            <div className="text-center mb-1">
              <div className="receipt-title uppercase tracking-tight">{creditNote.companyName}</div>
              <div className="receipt-sub mt-0.5">STORE CREDIT VOUCHER</div>
              <div className="receipt-sub text-[8px]">RETAIL CUSTOMER EXCHANGE</div>
            </div>

            <hr />

            {/* Voucher Details */}
            <div className="text-[9px] leading-tight space-y-0.5 font-mono">
              <div className="receipt-row font-bold">
                <span>VOUCHER NO:</span>
                <span className="text-[11px] text-indigo-950">{creditNote.code}</span>
              </div>
              <div className="receipt-row">
                <span>ISSUED:</span>
                <span>{creditNote.issuedDate}</span>
              </div>
              <div className="receipt-row">
                <span>VALID UNTIL:</span>
                <span className="font-bold">{creditNote.expiryDate}</span>
              </div>
              <div className="receipt-row">
                <span>ORIGINAL BILL:</span>
                <span>{creditNote.originalInvoiceNumber}</span>
              </div>
              <div className="receipt-row">
                <span>CUSTOMER:</span>
                <span className="truncate max-w-[120px] text-right">{creditNote.customerName}</span>
              </div>
              <div className="receipt-row">
                <span>PHONE:</span>
                <span>{creditNote.customerPhone}</span>
              </div>
            </div>

            <hr />

            {/* Credit Value Highlight */}
            <div className="text-center py-1">
              <div className="text-[9px] text-neutral-600 uppercase font-mono">STORE CREDIT VALUE</div>
              <div className="text-[15px] font-bold font-mono py-0.5">
                ₹{creditNote.amount}.00
              </div>
              <div className="text-[8px] text-neutral-500">
                (Remaining: ₹{creditNote.remainingAmount}.00)
              </div>
            </div>

            <hr />

            {/* Items Returned */}
            <div className="text-[8.5px] leading-tight space-y-1 font-mono">
              <div className="font-bold text-[9px]">RETURNED MERCHANDISE:</div>
              {creditNote.itemsReturned.map((item, idx) => (
                <div key={idx} className="border-b border-dashed border-neutral-200 pb-0.5">
                  <div className="receipt-row font-semibold">
                    <span>{item.productName}</span>
                    <span>₹{item.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-[7.5px] text-neutral-600">
                    Size: {item.size} · Color: {item.color} · Qty: {item.qty}
                  </div>
                  <div className="text-[7.5px] text-neutral-500">
                    Reason: {item.reason}
                  </div>
                </div>
              ))}
            </div>

            <hr />

            {/* Barcode & Notice */}
            <div
              className="receipt-footer text-center pt-1 space-y-1"
              style={{ textAlign: 'center', margin: '4px auto 0 auto', width: '100%' }}
            >
              <BarcodeSvg
                value={creditNote.code.replace(/[^0-9A-Z]/gi, '')}
                width={125}
                height={26}
                showText={false}
              />
              <div
                className="receipt-policy text-[7.5px] leading-tight text-neutral-600 px-1 font-sans"
                style={{ textAlign: 'center', margin: '3px auto 1px auto', width: '100%', display: 'block' }}
              >
                Present this original voucher barcode at checkout to redeem store credit. Non-refundable for cash.
              </div>
              <div
                className="receipt-thanks text-[9px] font-bold tracking-wider pt-0.5"
                style={{ textAlign: 'center', margin: '2px auto 0 auto', width: '100%', display: 'block' }}
              >
                *** GARMENT OS CREDIT ***
              </div>
            </div>

            {/* Bottom tear */}
            <div className="w-full text-center text-[7px] text-neutral-400 select-none pt-2 tracking-widest no-print">
              - - - - - - TEAR HERE - - - - - -
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <button
            onClick={handleCopyText}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Voucher</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
