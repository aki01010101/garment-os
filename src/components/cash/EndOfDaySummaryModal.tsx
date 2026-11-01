import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  FileText,
  Printer,
  Copy,
  Check,
  X,
  Calendar,
  Banknote,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Receipt,
  CreditCard,
  QrCode,
  DollarSign,
  Share2,
} from 'lucide-react';

interface EndOfDaySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export const EndOfDaySummaryModal: React.FC<EndOfDaySummaryModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
}) => {
  const { sales, creditNotes, dayRegister, activeCompany, currentUser } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return defaultDate || new Date().toISOString().split('T')[0];
  });
  const [copied, setCopied] = useState(false);

  // Filter sales for the selected date
  const filteredSales = useMemo(() => {
    return sales.filter((s) => s.date.startsWith(selectedDate));
  }, [sales, selectedDate]);

  // Filter returns / credit notes issued on this date
  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter((cn) => cn.issuedDate.startsWith(selectedDate));
  }, [creditNotes, selectedDate]);

  // Aggregate Sales Figures
  const salesSummary = useMemo(() => {
    let grossTotal = 0;
    let netTotal = 0;
    let taxTotal = 0;
    let totalDiscount = 0;
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let splitSales = 0;
    let itemsSold = 0;
    let cashCount = 0;
    let upiCount = 0;
    let cardCount = 0;

    filteredSales.forEach((s) => {
      netTotal += s.grandTotal;
      grossTotal += s.subtotal;
      taxTotal += s.taxTotal;
      totalDiscount +=
        (s.itemDiscountsTotal || 0) +
        (s.loyaltyDiscountAmount || 0) +
        (s.couponDiscountAmount || 0) +
        (s.creditNoteDiscountAmount || 0);

      itemsSold += s.items.reduce((sum, item) => sum + item.qty, 0);

      if (s.paymentMode === 'Cash') {
        cashSales += s.grandTotal;
        cashCount++;
      } else if (s.paymentMode === 'UPI') {
        upiSales += s.grandTotal;
        upiCount++;
      } else if (s.paymentMode === 'Card') {
        cardSales += s.grandTotal;
        cardCount++;
      } else if (s.paymentMode === 'Split') {
        splitSales += s.grandTotal;
        if (s.splitBreakdown) {
          cashSales += s.splitBreakdown.cash || 0;
          upiSales += s.splitBreakdown.upi || 0;
          cardSales += s.splitBreakdown.card || 0;
          if (s.splitBreakdown.cash > 0) cashCount++;
          if (s.splitBreakdown.upi > 0) upiCount++;
          if (s.splitBreakdown.card > 0) cardCount++;
        } else {
          cashSales += s.grandTotal;
          cashCount++;
        }
      } else {
        splitSales += s.grandTotal;
      }
    });

    return {
      grossTotal,
      netTotal,
      taxTotal,
      totalDiscount,
      cashSales,
      upiSales,
      cardSales,
      splitSales,
      itemsSold,
      billCount: filteredSales.length,
      cashCount,
      upiCount,
      cardCount,
      averageBillValue: filteredSales.length > 0 ? netTotal / filteredSales.length : 0,
    };
  }, [filteredSales]);

  // Aggregate Returns Figures
  const returnsSummary = useMemo(() => {
    let totalReturnValue = 0;
    let itemsReturnedCount = 0;
    let defectiveCount = 0;

    filteredCreditNotes.forEach((cn) => {
      totalReturnValue += cn.amount;
      cn.itemsReturned.forEach((item) => {
        itemsReturnedCount += item.qty;
        if (item.isDefective) defectiveCount += item.qty;
      });
    });

    // Credit notes redeemed towards sales on this date
    const creditNotesRedeemedValue = filteredSales.reduce(
      (sum, s) => sum + (s.creditNoteDiscountAmount || 0),
      0
    );

    return {
      returnCount: filteredCreditNotes.length,
      totalReturnValue,
      itemsReturnedCount,
      defectiveCount,
      restockedCount: itemsReturnedCount - defectiveCount,
      creditNotesRedeemedValue,
    };
  }, [filteredCreditNotes, filteredSales]);

  // Cash Drawer Reconciliation for this date
  const cashReconciliation = useMemo(() => {
    // Use register's opening float if date matches register date, else default
    const openingFloat =
      dayRegister.date === selectedDate ? dayRegister.openingCash : 5000;
    const cashInflow = salesSummary.cashSales;
    const pettyExpenses =
      dayRegister.date === selectedDate
        ? dayRegister.expenses.reduce((sum, e) => sum + e.amount, 0)
        : 0;

    const expectedCash = openingFloat + cashInflow - pettyExpenses;
    const actualCounted =
      dayRegister.date === selectedDate && dayRegister.closingCashCounted !== undefined
        ? dayRegister.closingCashCounted
        : undefined;

    const discrepancy =
      actualCounted !== undefined ? actualCounted - expectedCash : undefined;

    return {
      openingFloat,
      cashInflow,
      pettyExpenses,
      expectedCash,
      actualCounted,
      discrepancy,
      status: dayRegister.date === selectedDate ? dayRegister.status : 'historical',
      closedAt: dayRegister.date === selectedDate ? dayRegister.closedAt : undefined,
    };
  }, [dayRegister, selectedDate, salesSummary]);

  if (!isOpen) return null;

  const displayDateFormatted = new Date(selectedDate).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const generateSummaryText = () => {
    return `
========================================
*END-OF-DAY BUSINESS SUMMARY*
*${activeCompany.name.toUpperCase()}*
Date: ${displayDateFormatted}
Generated by: ${currentUser.fullName} (${currentUser.role})
========================================

1. SALES PERFORMANCE
----------------------------------------
• Net Sales Revenue:  ₹${salesSummary.netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
• Total Invoices:     ${salesSummary.billCount} bills
• Items / Units Sold: ${salesSummary.itemsSold} pcs
• Average Bill Value: ₹${salesSummary.averageBillValue.toFixed(2)}
• Total Discounts:    ₹${salesSummary.totalDiscount.toFixed(2)}
• GST Tax Collected:  ₹${salesSummary.taxTotal.toFixed(2)}

TENDER BREAKDOWN:
• Cash Sales:  ₹${salesSummary.cashSales.toFixed(2)} (${salesSummary.cashCount} bills)
• UPI Sales:   ₹${salesSummary.upiSales.toFixed(2)} (${salesSummary.upiCount} bills)
• Card Sales:  ₹${salesSummary.cardSales.toFixed(2)} (${salesSummary.cardCount} bills)

2. RETURNS & EXCHANGES
----------------------------------------
• Return Vouchers Issued: ${returnsSummary.returnCount}
• Total Return Value:     ₹${returnsSummary.totalReturnValue.toFixed(2)}
• Units Returned:         ${returnsSummary.itemsReturnedCount} pcs (${returnsSummary.restockedCount} restocked, ${returnsSummary.defectiveCount} defective)
• Credit Notes Redeemed:  ₹${returnsSummary.creditNotesRedeemedValue.toFixed(2)}

3. CASH DRAWER RECONCILIATION
----------------------------------------
• Opening Cash Float:    ₹${cashReconciliation.openingFloat.toFixed(2)}
• (+) Cash Sales Inflow: +₹${cashReconciliation.cashInflow.toFixed(2)}
• (-) Petty Expenses:    -₹${cashReconciliation.pettyExpenses.toFixed(2)}
----------------------------------------
• EXPECTED IN DRAWER:    ₹${cashReconciliation.expectedCash.toFixed(2)}
${
  cashReconciliation.actualCounted !== undefined
    ? `• ACTUAL COUNTED CASH:   ₹${cashReconciliation.actualCounted.toFixed(2)}
• OVER / (SHORT):        ₹${cashReconciliation.discrepancy?.toFixed(2)}`
    : '• ACTUAL COUNTED CASH:   [Pending Evening Closing]'
}
========================================
Printed from Garment OS Terminal
    `.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateSummaryText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrintThermalSummary = () => {
    const html = `
      <div class="thermal-receipt-58mm thermal-receipt-50mm thermal-bold">
        <div class="receipt-title">END-OF-DAY SUMMARY</div>
        <div class="receipt-sub">${activeCompany.name}</div>
        <div class="receipt-sub">${displayDateFormatted}</div>
        <hr />

        <div class="text-[9.5px]">
          <div class="receipt-row font-bold"><span>NET REVENUE:</span><span>₹${salesSummary.netTotal.toFixed(2)}</span></div>
          <div class="receipt-row"><span>BILLS / UNITS:</span><span>${salesSummary.billCount} / ${salesSummary.itemsSold} pcs</span></div>
          <div class="receipt-row"><span>AVG BILL VALUE:</span><span>₹${salesSummary.averageBillValue.toFixed(0)}</span></div>
          <div class="receipt-row"><span>DISCOUNTS:</span><span>-₹${salesSummary.totalDiscount.toFixed(2)}</span></div>
          <div class="receipt-row"><span>TAX (GST):</span><span>₹${salesSummary.taxTotal.toFixed(2)}</span></div>
        </div>

        <hr />
        <div class="receipt-tender-block font-mono">
          <div class="receipt-tender-header">SALES BY TENDER:</div>
          <div class="receipt-tender-row"><span class="tender-label">• CASH:</span><span class="tender-amount">₹${salesSummary.cashSales.toFixed(2)} (${salesSummary.cashCount})</span></div>
          <div class="receipt-tender-row"><span class="tender-label">• UPI:</span><span class="tender-amount">₹${salesSummary.upiSales.toFixed(2)} (${salesSummary.upiCount})</span></div>
          <div class="receipt-tender-row"><span class="tender-label">• CARD:</span><span class="tender-amount">₹${salesSummary.cardSales.toFixed(2)} (${salesSummary.cardCount})</span></div>
        </div>

        <hr />
        <div class="text-[9px]">
          <div class="font-bold">RETURNS & CREDIT NOTES:</div>
          <div class="receipt-row"><span>• RETURNS ISSUED:</span><span>${returnsSummary.returnCount} (₹${returnsSummary.totalReturnValue.toFixed(2)})</span></div>
          <div class="receipt-row"><span>• PIECES RETURNED:</span><span>${returnsSummary.itemsReturnedCount} pcs</span></div>
          <div class="receipt-row"><span>• CN REDEEMED:</span><span>₹${returnsSummary.creditNotesRedeemedValue.toFixed(2)}</span></div>
        </div>

        <hr />
        <div class="text-[9.5px]">
          <div class="font-bold">CASH DRAWER RECONCILIATION:</div>
          <div class="receipt-row"><span>OPENING FLOAT:</span><span>₹${cashReconciliation.openingFloat.toFixed(2)}</span></div>
          <div class="receipt-row"><span>(+) CASH INFLOW:</span><span>+₹${cashReconciliation.cashInflow.toFixed(2)}</span></div>
          <div class="receipt-row"><span>(-) PETTY OUTLAYS:</span><span>-₹${cashReconciliation.pettyExpenses.toFixed(2)}</span></div>
          <div class="receipt-row font-bold" style="border-top: 1px dashed #000; padding-top: 2px;">
            <span>EXPECTED CASH:</span><span>₹${cashReconciliation.expectedCash.toFixed(2)}</span>
          </div>
          ${
            cashReconciliation.actualCounted !== undefined
              ? `
          <div class="receipt-row font-bold">
            <span>COUNTED CASH:</span><span>₹${cashReconciliation.actualCounted.toFixed(2)}</span>
          </div>
          <div class="receipt-row" style="color: ${(cashReconciliation.discrepancy || 0) < 0 ? '#b91c1c' : '#15803d'}; font-weight: bold;">
            <span>VARIANCE:</span><span>₹${(cashReconciliation.discrepancy || 0).toFixed(2)}</span>
          </div>
          `
              : ''
          }
        </div>

        <hr />
        <div style="text-align: center; font-size: 8px;">AUDITED BY STORE MANAGER</div>
        <div style="text-align: center; font-size: 9px; font-weight: bold; margin-top: 4px;">*** DAILY CLOSING COMPLETED ***</div>
      </div>
    `;
    printThermalReceiptHtml(html, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">End-of-Day Business Summary</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 border border-indigo-700/50">
                  {cashReconciliation.status === 'closed' ? 'Closed' : 'Live / Open'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeCompany.name} • {displayDateFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Date Picker */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 text-slate-800">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Net Sales */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  Total Sales Revenue
                </span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold font-mono text-indigo-950">
                  ₹{salesSummary.netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-indigo-600 mt-1 flex items-center justify-between font-medium">
                  <span>{salesSummary.billCount} invoices</span>
                  <span>{salesSummary.itemsSold} garments</span>
                </div>
              </div>
            </div>

            {/* Total Returns */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Returns & Exchanges
                </span>
                <RotateCcw className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold font-mono text-amber-950">
                  ₹{returnsSummary.totalReturnValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-amber-700 mt-1 flex items-center justify-between font-medium">
                  <span>{returnsSummary.returnCount} credit notes</span>
                  <span>{returnsSummary.itemsReturnedCount} garments</span>
                </div>
              </div>
            </div>

            {/* Cash in Drawer */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Expected Cash in Till
                </span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold font-mono text-emerald-950">
                  ₹{cashReconciliation.expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-emerald-700 mt-1 flex items-center justify-between font-medium">
                  <span>Inflow: +₹{salesSummary.cashSales.toFixed(0)}</span>
                  <span>Outlay: -₹{cashReconciliation.pettyExpenses.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Detailed Sales Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-3">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>Sales Tender Breakdown & Taxes</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">Cash Payments</div>
                    <div className="text-[10px] text-slate-500">{salesSummary.cashCount} bills</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-xs text-slate-900">
                  ₹{salesSummary.cashSales.toFixed(2)}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">UPI Payments</div>
                    <div className="text-[10px] text-slate-500">{salesSummary.upiCount} bills</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-xs text-slate-900">
                  ₹{salesSummary.upiSales.toFixed(2)}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">Card Payments</div>
                    <div className="text-[10px] text-slate-500">{salesSummary.cardCount} bills</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-xs text-slate-900">
                  ₹{salesSummary.cardSales.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-100 font-mono">
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Subtotal (Gross)</span>
                <span className="font-bold text-slate-900">₹{salesSummary.grossTotal.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Total Discounts</span>
                <span className="font-bold text-rose-600">-₹{salesSummary.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">GST Collected</span>
                <span className="font-bold text-indigo-600">₹{salesSummary.taxTotal.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Avg Bill Value</span>
                <span className="font-bold text-slate-900">₹{salesSummary.averageBillValue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Returns & Exchanges */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-3">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Customer Returns & Credit Notes</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">
                  Credit Notes Issued
                </span>
                <div className="text-lg font-bold font-mono text-amber-950 mt-0.5">
                  ₹{returnsSummary.totalReturnValue.toFixed(2)}
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  {returnsSummary.returnCount} customer vouchers created
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">
                  Garments Returned
                </span>
                <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                  {returnsSummary.itemsReturnedCount} pcs
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {returnsSummary.restockedCount} restocked · {returnsSummary.defectiveCount} defective
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-800 uppercase block">
                  Credit Notes Redeemed
                </span>
                <div className="text-lg font-bold font-mono text-indigo-950 mt-0.5">
                  ₹{returnsSummary.creditNotesRedeemedValue.toFixed(2)}
                </div>
                <div className="text-[11px] text-indigo-700 mt-0.5">
                  Used as tender toward today's sales
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cash Drawer Reconciliation */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-3">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Cash Drawer Audit & Till Reconciliation</span>
            </h4>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-sans">Opening Cash Float:</span>
                <span className="font-bold text-slate-900">₹{cashReconciliation.openingFloat.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 text-emerald-700">
                <span className="font-sans">(+) Cash Inflow from Sales:</span>
                <span className="font-bold">+₹{cashReconciliation.cashInflow.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 text-rose-600">
                <span className="font-sans">(-) Petty Shop Expenses:</span>
                <span className="font-bold">-₹{cashReconciliation.pettyExpenses.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b-2 border-slate-900 font-bold text-sm text-slate-900 bg-slate-50 px-2 rounded">
                <span className="font-sans">Expected Closing Cash in Till:</span>
                <span>₹{cashReconciliation.expectedCash.toFixed(2)}</span>
              </div>

              {cashReconciliation.actualCounted !== undefined && (
                <>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-slate-900">
                    <span className="font-sans font-semibold">Actual Counted Cash:</span>
                    <span className="font-bold">₹{cashReconciliation.actualCounted.toFixed(2)}</span>
                  </div>
                  <div
                    className={`flex items-center justify-between p-2 rounded text-xs font-bold font-sans ${
                      (cashReconciliation.discrepancy || 0) < 0
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : (cashReconciliation.discrepancy || 0) > 0
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {(cashReconciliation.discrepancy || 0) === 0 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      )}
                      <span>
                        {(cashReconciliation.discrepancy || 0) === 0
                          ? 'Drawer Perfectly Balanced (Zero Discrepancy)'
                          : (cashReconciliation.discrepancy || 0) > 0
                          ? 'Till Cash Surplus (Over)'
                          : 'Till Cash Shortfall (Under)'}
                      </span>
                    </span>
                    <span className="font-mono">
                      {(cashReconciliation.discrepancy || 0) >= 0 ? '+' : ''}
                      ₹{(cashReconciliation.discrepancy || 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied Summary!' : 'Copy Summary Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrintThermalSummary}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print 58mm Summary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
