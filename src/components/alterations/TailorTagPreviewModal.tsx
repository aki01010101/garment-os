import React, { useRef, useState } from 'react';
import { AlterationRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  Printer,
  X,
  Copy,
  Check,
  Scissors,
  Receipt,
} from 'lucide-react';

interface TailorTagPreviewModalProps {
  alteration: AlterationRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TailorTagPreviewModal: React.FC<TailorTagPreviewModalProps> = ({
  alteration,
  isOpen,
  onClose,
}) => {
  const { activeCompany } = useApp();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !alteration) return null;

  const firmName = (activeCompany?.name || 'Garment OS Apparel').toUpperCase();

  const handlePrint = () => {
    if (receiptRef.current) {
      printThermalReceiptHtml(receiptRef.current.innerHTML);
    } else {
      window.focus();
      window.print();
    }
  };

  const generateTagText = () => {
    return `
✂️ *${firmName} - ALTERATION TAG*
--------------------------------
📅 Booked: ${alteration.createdDate}
👕 Garment: ${alteration.garmentName} [Size: ${alteration.size}, ${alteration.color}]
✂️ Alteration Instructions: ${alteration.alterationNotes}
⏰ Ready By: ${alteration.promisedDate}
--------------------------------
📌 STAPLE TO GARMENT
    `.trim();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateTagText()).then(() => {
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
              <Scissors className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Garment Alteration Tag</h3>
              <p className="text-xs text-slate-500 font-mono">Job #{alteration.id.slice(-6)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic Thermal Paper Preview Box */}
        <div className="p-6 bg-slate-200/70 flex flex-col items-center justify-center overflow-y-auto max-h-[60vh]">
          <div className="text-[11px] font-medium text-slate-600 mb-2.5 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            <span>Garment Workshop Tag (Staple Format)</span>
          </div>

          <div
            ref={receiptRef}
            className="thermal-receipt-50mm shadow-xl rounded-xs border border-neutral-300 relative bg-white"
          >
            {/* Tear edge */}
            <div className="w-full text-center text-[7px] text-neutral-400 select-none pb-1 tracking-widest no-print">
              - - - - - - TEAR HERE - - - - - -
            </div>

            {/* Header: Updated with dynamic firm name */}
            <div className="text-center mb-1">
              <div className="receipt-title">{firmName}</div>
              <div className="receipt-sub mt-0.5">ALTERATION JOB TICKET</div>
              <div className="receipt-sub text-[8px]">ATTACH SECURELY TO GARMENT</div>
            </div>

            <hr />

            {/* Garment Details & Date */}
            <div className="text-[9.5px] leading-tight space-y-1 font-mono">
              <div className="receipt-row text-[9px]">
                <span>BOOKED:</span>
                <span>{alteration.createdDate}</span>
              </div>

              <div className="font-bold text-[10px] pt-1">{alteration.garmentName}</div>
              <div className="text-[8.5px] text-neutral-700">
                Size: {alteration.size} · Color: {alteration.color}
              </div>

              {/* Alteration Instructions Box */}
              <div
                style={{
                  margin: '4px 0',
                  padding: '4px',
                  border: '1px dashed #000',
                  backgroundColor: '#fbfbfb',
                }}
              >
                <div className="font-bold text-[8.5px] uppercase">Alteration Instructions:</div>
                <div className="text-[9.5px] font-sans font-semibold mt-0.5 text-black">
                  {alteration.alterationNotes}
                </div>
              </div>

              <div className="receipt-row font-bold text-[10.5px] pt-0.5">
                <span>READY BY:</span>
                <span>{alteration.promisedDate}</span>
              </div>
            </div>

            <hr />

            {/* Barcode & Footer */}
            <div
              className="receipt-footer text-center pt-1 space-y-1"
              style={{ textAlign: 'center', margin: '4px auto 0 auto', width: '100%' }}
            >
              <BarcodeSvg
                value={`ALT${alteration.id.slice(-6)}`}
                width={120}
                height={22}
                showText={false}
              />
              <div
                className="receipt-thanks text-[8px] font-bold tracking-wider pt-0.5"
                style={{ textAlign: 'center', margin: '2px auto 0 auto', width: '100%', display: 'block' }}
              >
                *** STAPLE TO GARMENT ***
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={handleCopyText}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/80 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
