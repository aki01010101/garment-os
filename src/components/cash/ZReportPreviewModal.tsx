import React, { useRef, useState } from 'react';
import { Company, DayEndRegister, PettyExpense } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  Printer,
  X,
  Copy,
  Check,
  FileSpreadsheet,
  Banknote,
  Receipt,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface ZReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayRegister: DayEndRegister;
  salesTotals: {
    cash: number;
    upi: number;
    card: number;
    grandTotal: number;
    taxTotal: number;
  };
  todaySalesCount: number;
  totalPettyExpenses: number;
  totalCashDrops?: number;
  expectedCashInDrawer: number;
  countedCash?: number;
  discrepancy?: number;
  activeCompany: Company;
}

export const ZReportPreviewModal: React.FC<ZReportPreviewModalProps> = ({
  isOpen,
  onClose,
  dayRegister,
  salesTotals,
  todaySalesCount,
  totalPettyExpenses,
  totalCashDrops,
  expectedCashInDrawer,
  countedCash,
  discrepancy,
  activeCompany,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isBoldThermal, setIsBoldThermal] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('thermal_bold_print');
      return saved !== null ? saved === 'true' : true; // Default to true for Z-Reports
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

  if (!isOpen) return null;

  const now = new Date();
  const printTimestamp = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' ' + now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const actualCounted =
    countedCash !== undefined
      ? countedCash
      : dayRegister.closingCashCounted !== undefined
      ? dayRegister.closingCashCounted
      : undefined;

  const actualDiscrepancy =
    discrepancy !== undefined
      ? discrepancy
      : actualCounted !== undefined
      ? actualCounted - expectedCashInDrawer
      : undefined;

  const handlePrint = () => {
    if (receiptRef.current) {
      printThermalReceiptHtml(receiptRef.current.innerHTML, isBoldThermal);
    } else {
      window.focus();
      window.print();
    }
  };

  const generateReportText = () => {
    return `
================================
*DAY-END REGISTER Z-REPORT (58MM)*
*${activeCompany.name.toUpperCase()}*
================================
Store: ${activeCompany.address}
Tel: ${activeCompany.phone}
${activeCompany.taxId && activeCompany.taxId !== 'RETAIL-CASH-UNREG' ? `GSTIN: ${activeCompany.taxId}` : 'Retail Cash Operations'}
--------------------------------
Date: ${dayRegister.date}
Printed: ${printTimestamp}
Register Status: ${dayRegister.status.toUpperCase()}
Completed Transactions: ${todaySalesCount}
--------------------------------
*SALES BY TENDER:*
* Cash Sales:   Rs. ${salesTotals.cash.toFixed(2)}
* UPI Sales:    Rs. ${salesTotals.upi.toFixed(2)}
* Card Sales:   Rs. ${salesTotals.card.toFixed(2)}
*Total Revenue: Rs. ${salesTotals.grandTotal.toFixed(2)}*
Tax Collected: Rs. ${salesTotals.taxTotal.toFixed(2)}
--------------------------------
*CASH DRAWER RECONCILIATION:*
* Opening Float:      Rs. ${dayRegister.openingCash.toFixed(2)}
* (+) Cash Sales In:  +Rs. ${salesTotals.cash.toFixed(2)}
* (-) Petty Outlays:  -Rs. ${totalPettyExpenses.toFixed(2)}
${totalCashDrops !== undefined && totalCashDrops > 0 ? `* (-) Safe Skims:     -Rs. ${totalCashDrops.toFixed(2)}\n` : ''}*Expected In Till:  Rs. ${expectedCashInDrawer.toFixed(2)}*
${actualCounted !== undefined ? `* Actual Counted:     Rs. ${actualCounted.toFixed(2)}\n* Over / (Short):     Rs. ${actualDiscrepancy !== undefined ? actualDiscrepancy.toFixed(2) : '0.00'}` : ''}
--------------------------------
*PETTY EXPENSES (${dayRegister.expenses.length}):*
${dayRegister.expenses.length === 0 ? '* None' : dayRegister.expenses.map((e: PettyExpense) => `* ${e.time} [Rs. ${e.amount}] ${e.category} (${e.paidTo}) - ${e.notes}`).join('\n')}
--------------------------------
${dayRegister.closingNotes ? `Note: "${dayRegister.closingNotes}"\n--------------------------------\n` : ''}*VERIFIED BY CASHIER & STORE MANAGER*
================================
    `.trim();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReportText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col my-6">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
              <Banknote className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">58mm Thermal Z-Report Preview</h3>
              <p className="text-xs text-slate-500 font-mono">
                {activeCompany.name} · {dayRegister.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alert Banner */}
        <div className="px-5 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                dayRegister.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-slate-700">
              Drawer Status: {dayRegister.status.toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {todaySalesCount} Sales Today
          </span>
        </div>

        {/* Realistic 58mm Thermal Paper Preview Box */}
        <div className="p-6 bg-slate-200/70 flex flex-col items-center justify-center overflow-y-auto max-h-[60vh]">
          <div className="w-full max-w-[340px] mb-2.5 flex items-center justify-between px-1">
            <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>58mm Thermal Roll Format</span>
            </div>
            <button
              type="button"
              onClick={toggleBoldThermal}
              title="Toggle heavy bold text for faint thermal paper"
              className={`px-2 py-0.5 rounded text-[10.5px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                isBoldThermal
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs ring-1 ring-slate-800"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              }`}
            >
              <span>{isBoldThermal ? "🖨️ Bold: ON" : "🖨️ Bold: OFF"}</span>
            </button>
          </div>

          <div
            ref={receiptRef}
            className={`thermal-receipt-58mm thermal-receipt-50mm shadow-xl rounded-xs border border-neutral-300 relative bg-white ${
              isBoldThermal ? 'thermal-bold' : ''
            }`}
          >
            {/* Top jagged tear edge effect */}
            <div className="w-full text-center text-[7px] text-neutral-400 select-none pb-1 tracking-widest no-print">
              - - - - - - TEAR HERE - - - - - -
            </div>

            {/* Header */}
            <div className="text-center mb-1">
              <div className="receipt-title uppercase tracking-tight">{activeCompany.name}</div>
              <div className="receipt-sub mt-0.5">{activeCompany.address}</div>
              <div className="receipt-sub">Ph: {activeCompany.phone}</div>
              {activeCompany.taxId && activeCompany.taxId !== 'RETAIL-CASH-UNREG' ? (
                <div className="receipt-sub font-bold">GSTIN: {activeCompany.taxId}</div>
              ) : (
                <div className="receipt-sub text-[8px]">RETAIL STORE OPERATIONS</div>
              )}
            </div>

            <hr />

            {/* Title & Metadata */}
            <div className="text-center py-0.5">
              <div className="text-[11px] font-bold tracking-wider">*** DAY-END Z-REPORT ***</div>
              <div className="text-[8px] text-neutral-600 font-mono mt-0.5">
                GENERATED: {printTimestamp}
              </div>
            </div>

            <hr />

            <div className="text-[9px] leading-tight space-y-0.5 font-mono">
              <div className="receipt-row">
                <span>BUSINESS DATE:</span>
                <span className="font-bold">{dayRegister.date}</span>
              </div>
              <div className="receipt-row">
                <span>REGISTER STATUS:</span>
                <span className="font-bold">{dayRegister.status.toUpperCase()}</span>
              </div>
              {dayRegister.closedAt && (
                <div className="receipt-row">
                  <span>CLOSED AT:</span>
                  <span>{dayRegister.closedAt}</span>
                </div>
              )}
              <div className="receipt-row">
                <span>TOTAL BILLS:</span>
                <span className="font-bold">{todaySalesCount}</span>
              </div>
            </div>

            <hr />

            {/* Tender Breakdown - XL Size for Items & Amounts */}
            <div className="receipt-tender-block font-mono">
              <div className="receipt-tender-header">SALES BY TENDER:</div>
              <div className="receipt-tender-row">
                <span className="tender-label">CASH SALES:</span>
                <span className="tender-amount">₹{salesTotals.cash.toFixed(2)}</span>
              </div>
              <div className="receipt-tender-row">
                <span className="tender-label">UPI DIGITAL:</span>
                <span className="tender-amount">₹{salesTotals.upi.toFixed(2)}</span>
              </div>
              <div className="receipt-tender-row">
                <span className="tender-label">CARD / POS:</span>
                <span className="tender-amount">₹{salesTotals.card.toFixed(2)}</span>
              </div>
              <div className="receipt-tender-total">
                <span className="tender-total-label">TOTAL SALES:</span>
                <span className="tender-total-amount">₹{salesTotals.grandTotal.toFixed(2)}</span>
              </div>
              {salesTotals.taxTotal > 0 && (
                <div className="receipt-tender-gst">
                  <span>GST COLLECTED:</span>
                  <span>₹{salesTotals.taxTotal.toFixed(2)}</span>
                </div>
              )}
            </div>

            <hr />

            {/* Cash Drawer Reconciliation */}
            <div className="text-[9px] leading-tight space-y-0.5 font-mono">
              <div className="font-bold text-[9.5px] mb-1">DRAWER RECONCILIATION:</div>
              <div className="receipt-row">
                <span>OPENING FLOAT:</span>
                <span>₹{dayRegister.openingCash.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>(+) CASH SALES:</span>
                <span>+₹{salesTotals.cash.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>(-) PETTY OUTLAYS:</span>
                <span>-₹{totalPettyExpenses.toFixed(2)}</span>
              </div>
              {totalCashDrops !== undefined && totalCashDrops > 0 && (
                <div className="receipt-row text-amber-900">
                  <span>(-) SAFE SKIMS:</span>
                  <span>-₹{totalCashDrops.toFixed(2)}</span>
                </div>
              )}
              <div
                className="receipt-row font-bold text-[10px] pt-1"
                style={{ borderTop: '1px dashed #000', marginTop: '2px' }}
              >
                <span>EXPECTED IN TILL:</span>
                <span>₹{expectedCashInDrawer.toFixed(2)}</span>
              </div>

              {actualCounted !== undefined && (
                <>
                  <div className="receipt-row font-bold">
                    <span>ACTUAL COUNTED:</span>
                    <span>₹{actualCounted.toFixed(2)}</span>
                  </div>
                  <div
                    className="receipt-row font-bold"
                    style={{
                      color:
                        (actualDiscrepancy || 0) < 0
                          ? '#b91c1c'
                          : (actualDiscrepancy || 0) > 0
                          ? '#047857'
                          : '#111827',
                    }}
                  >
                    <span>OVER / (SHORT):</span>
                    <span>
                      {(actualDiscrepancy || 0) >= 0
                        ? `+₹${(actualDiscrepancy || 0).toFixed(2)}`
                        : `-₹${Math.abs(actualDiscrepancy || 0).toFixed(2)}`}
                    </span>
                  </div>
                </>
              )}
            </div>

            <hr />

            {/* Petty Expenses Detail */}
            <div className="text-[8.5px] leading-tight space-y-1 font-mono">
              <div className="font-bold text-[9px]">PETTY CASH EXPENSES ({dayRegister.expenses.length}):</div>
              {dayRegister.expenses.length === 0 ? (
                <div className="text-neutral-500 italic">No petty expenses recorded.</div>
              ) : (
                dayRegister.expenses.map((e: PettyExpense) => (
                  <div key={e.id} className="border-b border-dashed border-neutral-200 pb-0.5">
                    <div className="receipt-row font-semibold">
                      <span>{e.category}</span>
                      <span>₹{e.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-[7.5px] text-neutral-600">
                      {e.time} · Paid to: {e.paidTo}
                    </div>
                    {e.notes && <div className="text-[7.5px] text-neutral-500">"{e.notes}"</div>}
                  </div>
                ))
              )}
              <div className="receipt-row font-bold pt-0.5">
                <span>TOTAL EXPENSES:</span>
                <span>₹{totalPettyExpenses.toFixed(2)}</span>
              </div>
            </div>

            <hr />

            {/* Signatures & Verification */}
            <div className="text-[8px] leading-tight space-y-2 py-1">
              {dayRegister.closingNotes && (
                <div className="text-[8px] italic text-neutral-700 bg-neutral-50 p-1 rounded-xs border border-neutral-200 font-sans">
                  "Remarks: {dayRegister.closingNotes}"
                </div>
              )}
              <div className="pt-2 flex justify-between font-mono text-[7.5px]">
                <div>
                  Cashier Sig: ____________
                </div>
                <div>
                  Manager: ____________
                </div>
              </div>
            </div>

            <hr />

            {/* Footer Barcode */}
            <div
              className="receipt-footer text-center pt-1 space-y-1"
              style={{ textAlign: 'center', margin: '4px auto 0 auto', width: '100%' }}
            >
              <BarcodeSvg
                value={`ZREP${dayRegister.date.replace(/-/g, '')}`}
                width={120}
                height={22}
                showText={false}
              />
              <div
                className="receipt-thanks text-[9px] font-bold tracking-wider pt-0.5"
                style={{ textAlign: 'center', margin: '2px auto 0 auto', width: '100%', display: 'block' }}
              >
                *** END OF Z-REPORT ***
              </div>
              <div
                className="receipt-brand text-[7px] text-neutral-500 font-mono"
                style={{ textAlign: 'center', margin: '1px auto 0 auto', width: '100%', display: 'block' }}
              >
                58MM THERMAL AUDIT ARCHIVE
              </div>
            </div>

            {/* Bottom jagged tear edge effect */}
            <div className="w-full text-center text-[7px] text-neutral-400 select-none pt-2 tracking-widest no-print">
              - - - - - - TEAR HERE - - - - - -
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopyText}
            title="Copy plain-text summary for WhatsApp or records"
            className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Report Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Report Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Z-Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
