import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import { ZReportPreviewModal } from './ZReportPreviewModal';
import { EndOfDaySummaryModal } from './EndOfDaySummaryModal';
import {
  Banknote,
  Plus,
  Printer,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  Lock,
  FileText,
  Sparkles,
  ShieldAlert,
  Vault,
  X,
} from 'lucide-react';
import { CashDrop } from '../../types';

export const DayRegisterManager: React.FC = () => {
  const {
    dayRegister,
    updateOpeningCash,
    addPettyExpense,
    addCashDrop,
    closeDayRegister,
    sales,
    creditPayments,
    activeCompany,
    currentUser,
  } = useApp();

  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<any>('Tea & Refreshments');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePaidTo, setExpensePaidTo] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Cash Drop / Safe Skim State
  const [isCashDropModalOpen, setIsCashDropModalOpen] = useState(false);
  const [dropAmount, setDropAmount] = useState('');
  const [droppedBy, setDroppedBy] = useState(currentUser?.fullName || 'Cashier');
  const [witnessName, setWitnessName] = useState('');
  const [dropReason, setDropReason] = useState('Drawer cash threshold exceeded (₹15,000 limit)');
  const [dropNotes, setDropNotes] = useState('');


  // Day-End Closing State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
  });
  const [manualCountedCash, setManualCountedCash] = useState<string>('');
  const [useDenominations, setUseDenominations] = useState(true);
  const [closeNotes, setCloseNotes] = useState('Evening cash drawer count verified by manager');

  // Compute today's sales by payment mode
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.date.startsWith(todayStr));

  const salesTotals = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let card = 0;
    let grandTotal = 0;
    let taxTotal = 0;

    todaySales.forEach((s) => {
      grandTotal += s.grandTotal;
      taxTotal += s.taxTotal;
      if (s.paymentMode === 'Cash') cash += s.grandTotal;
      else if (s.paymentMode === 'UPI') upi += s.grandTotal;
      else if (s.paymentMode === 'Card') card += s.grandTotal;
      else if (s.paymentMode === 'Credit') {
        // Goods taken on credit do not add to till cash
      } else if (s.paymentMode === 'Split') {
        if (s.splitBreakdown) {
          cash += s.splitBreakdown.cash || 0;
          upi += s.splitBreakdown.upi || 0;
          card += s.splitBreakdown.card || 0;
        } else {
          cash += s.grandTotal;
        }
      }
    });

    return { cash, upi, card, grandTotal, taxTotal };
  }, [todaySales]);

  // Today's Khata / Credit debt recoveries collected in cash
  const todayKhataCashRecoveries = useMemo(() => {
    return (creditPayments || [])
      .filter((cp) => (cp.date || '').startsWith(todayStr) && cp.paymentMode === 'Cash')
      .reduce((sum, cp) => sum + cp.amount, 0);
  }, [creditPayments, todayStr]);

  const totalPettyExpenses = dayRegister.expenses.reduce((s, e) => s + e.amount, 0);
  const totalCashDrops = (dayRegister.cashDrops || []).reduce((s, d) => s + d.amount, 0);
  const expectedCashInDrawer = dayRegister.openingCash + salesTotals.cash + todayKhataCashRecoveries - totalPettyExpenses - totalCashDrops;

  // Compute counted cash
  const denominationTotal = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (Number(count) || 0),
    0
  );
  const countedCash = useDenominations ? denominationTotal : parseFloat(manualCountedCash) || 0;
  const discrepancy = countedCash - expectedCashInDrawer;

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount) || 0;
    if (amt <= 0) return;

    addPettyExpense({
      category: expenseCategory,
      amount: amt,
      paidTo: expensePaidTo || 'Vendor / Staff',
      notes: expenseNotes,
    });

    setIsExpenseModalOpen(false);
    setExpenseAmount('');
    setExpensePaidTo('');
    setExpenseNotes('');
  };

  const handleSaveCashDrop = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(dropAmount) || 0;
    if (amt <= 0) return;

    const newDrop: Omit<CashDrop, 'id' | 'time'> = {
      amount: amt,
      droppedBy: droppedBy.trim() || currentUser?.fullName || 'Cashier',
      witnessName: witnessName.trim() || undefined,
      reason: dropReason,
      notes: dropNotes.trim() || undefined,
    };

    addCashDrop(newDrop);
    setIsCashDropModalOpen(false);
    setDropAmount('');
    setWitnessName('');
    setDropNotes('');
  };

  const handlePrintDropSlip = (drop: CashDrop) => {
    const html = `
      <div class="thermal-receipt-58mm thermal-receipt-50mm thermal-bold">
        <div class="receipt-title">CASH DROP / SAFE SKIM</div>
        <div class="receipt-sub">${activeCompany.name}</div>
        <div class="receipt-sub">DATE: ${dayRegister.date} · TIME: ${drop.time}</div>
        <hr />
        <div style="font-size: 10px; line-height: 1.4; font-family: monospace;">
          <div><strong>REF ID:</strong> ${drop.id}</div>
          <div><strong>AMOUNT SKIMMED:</strong> ₹${drop.amount.toFixed(2)}</div>
          <div><strong>DROPPED BY:</strong> ${drop.droppedBy}</div>
          ${drop.witnessName ? `<div><strong>WITNESSED BY:</strong> ${drop.witnessName}</div>` : ''}
          ${drop.reason ? `<div><strong>REASON:</strong> ${drop.reason}</div>` : ''}
          ${drop.notes ? `<div><strong>NOTES:</strong> ${drop.notes}</div>` : ''}
        </div>
        <hr />
        <div style="font-size: 8.5px; text-align: center; margin: 4px 0;">
          * DEPOSIT ENVELOPE SLIP FOR SAFE *
        </div>
        <div style="padding-top: 18px; display: flex; justify-content: space-between; font-size: 8.5px; font-family: monospace;">
          <div>Cashier: ________</div>
          <div>Manager: ________</div>
        </div>
      </div>
    `;
    printThermalReceiptHtml(html, `Cash-Drop-${drop.id}`);
  };

  const handleConfirmClose = () => {
    closeDayRegister(countedCash, closeNotes);
    setIsCloseModalOpen(false);
    setIsZReportModalOpen(true);
  };

  const handlePrintZReport = () => {
    const html = `
      <div class="thermal-receipt-58mm thermal-receipt-50mm thermal-bold">
        <div class="receipt-title">DAY-END Z-REPORT</div>
        <div class="receipt-sub">${activeCompany.name}</div>
        <div class="receipt-sub">DATE: ${dayRegister.date}</div>
        <hr />
        <div class="text-[9.5px]">
          <div><strong>REGISTER STATUS:</strong> ${dayRegister.status.toUpperCase()}</div>
          <div><strong>TRANSACTIONS TODAY:</strong> ${todaySales.length}</div>
        </div>
        <hr />
        <div class="receipt-tender-block font-mono">
          <div class="receipt-tender-header">SALES BY TENDER:</div>
          <div class="receipt-tender-row"><span class="tender-label">CASH SALES:</span><span class="tender-amount">₹${salesTotals.cash.toFixed(2)}</span></div>
          <div class="receipt-tender-row"><span class="tender-label">UPI SALES:</span><span class="tender-amount">₹${salesTotals.upi.toFixed(2)}</span></div>
          <div class="receipt-tender-row"><span class="tender-label">CARD SALES:</span><span class="tender-amount">₹${salesTotals.card.toFixed(2)}</span></div>
          <div class="receipt-tender-total">
            <span class="tender-total-label">TOTAL REVENUE:</span><span class="tender-total-amount">₹${salesTotals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
        <hr />
        <div class="text-[9.5px]">
          <div><strong>CASH DRAWER RECONCILIATION:</strong></div>
          <div class="receipt-row"><span>OPENING FLOAT:</span><span>₹${dayRegister.openingCash.toFixed(2)}</span></div>
          <div class="receipt-row"><span>(+) CASH INFLOW:</span><span>+₹${salesTotals.cash.toFixed(2)}</span></div>
          <div class="receipt-row"><span>(-) PETTY EXPENSES:</span><span>-₹${totalPettyExpenses.toFixed(2)}</span></div>
          ${totalCashDrops > 0 ? `<div class="receipt-row"><span>(-) SAFE SKIMS:</span><span>-₹${totalCashDrops.toFixed(2)}</span></div>` : ''}
          <div class="receipt-row font-bold" style="border-top: 1px dashed #000; padding-top: 2px;">
            <span>EXPECTED IN DRAWER:</span><span>₹${expectedCashInDrawer.toFixed(2)}</span>
          </div>
          ${dayRegister.closingCashCounted !== undefined ? `
          <div class="receipt-row font-bold">
            <span>ACTUAL COUNTED:</span><span>₹${dayRegister.closingCashCounted.toFixed(2)}</span>
          </div>
          <div class="receipt-row" style="color: ${dayRegister.closingCashCounted - expectedCashInDrawer < 0 ? '#b91c1c' : '#15803d'}; font-weight: bold;">
            <span>OVER / (SHORT):</span><span>₹${(dayRegister.closingCashCounted - expectedCashInDrawer).toFixed(2)}</span>
          </div>
          ` : ''}
        </div>
        <hr />
        <div class="text-[9px]">
          <div><strong>PETTY OUTLAYS TODAY:</strong></div>
          ${dayRegister.expenses.map((e) => `<div>• ${e.time} - ${e.category}: ₹${e.amount} (${e.notes})</div>`).join('')}
        </div>
        ${(dayRegister.cashDrops && dayRegister.cashDrops.length > 0) ? `
        <hr />
        <div class="text-[9px]">
          <div><strong>SAFE DROPS TODAY:</strong></div>
          ${dayRegister.cashDrops.map((d) => `<div>• ${d.time} - ₹${d.amount} (By: ${d.droppedBy})</div>`).join('')}
        </div>
        ` : ''}
        <hr />
        <div style="text-align: center; font-size: 8px;">VERIFIED BY STORE CASHIER & MANAGER</div>
        <div style="text-align: center; font-size: 9px; font-weight: bold; margin-top: 4px;">*** END OF DAY REGISTER ***</div>
      </div>
    `;
    printThermalReceiptHtml(html, true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-indigo-600" />
            Day-End Cash Drawer & Register Reconciliation (Z-Report)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track opening cash float, petty shop expenses, cash vs. digital sales, and print closing Z-Reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Generate comprehensive summary of total sales, returns, and cash balance"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Generate End-of-Day Summary</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>+ Petty Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCashDropModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Transfer excess cash from till to back-office safe"
          >
            <Vault className="w-4 h-4 text-amber-600" />
            <span>+ Cash Drop (Safe Skim)</span>
          </button>

          <button
            onClick={() => setIsZReportModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print 58mm Z-Report</span>
          </button>

          {dayRegister.status === 'open' ? (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Close Day & Count Cash</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                Register Closed at {dayRegister.closedAt}
              </span>
              <button
                onClick={() => setIsZReportModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>View Z-Report</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Opening Float */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Opening Cash Float
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              ₹{dayRegister.openingCash.toLocaleString('en-IN')}
            </span>
            {dayRegister.status === 'open' && (
              <button
                onClick={() => {
                  const val = prompt('Enter new Opening Cash Float (₹):', dayRegister.openingCash.toString());
                  if (val !== null) updateOpeningCash(parseFloat(val) || 0);
                }}
                className="text-[10px] text-indigo-600 font-semibold hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Small change loaded in till</div>
        </div>

        {/* Cash Inflow */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Cash Sales Collected
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            +₹{salesTotals.cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Digital: ₹{(salesTotals.upi + salesTotals.card).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Petty Expenses */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Petty Expenses Outlay
          </span>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            -₹{totalPettyExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {dayRegister.expenses.length} shop vouchers
          </div>
        </div>

        {/* Safe Cash Drops */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
            <span>Dropped to Safe</span>
            <Vault className="w-3.5 h-3.5 text-amber-600" />
          </span>
          <div className="text-xl font-bold font-mono text-amber-900 mt-1">
            -₹{totalCashDrops.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {(dayRegister.cashDrops || []).length} safe transfer skims
          </div>
        </div>

        {/* Expected Cash in Drawer */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs bg-indigo-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
            Expected in Drawer Till
          </span>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
            ₹{expectedCashInDrawer.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Float + Cash Sales - Outlays - Drops</div>
        </div>
      </div>

      {/* Main Content: Petty Expenses List & Closing Tally Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Petty Expenses Table */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Today Petty Cash Expense Logs ({dayRegister.expenses.length})
            </span>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              + Record Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            {dayRegister.expenses.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No petty expenses recorded today.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Paid To / Recipient</th>
                    <th className="py-2.5 px-3">Description / Purpose</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {dayRegister.expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{exp.time}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{exp.category}</td>
                      <td className="py-2.5 px-3 text-slate-600">{exp.paidTo}</td>
                      <td className="py-2.5 px-3 text-slate-500">{exp.notes}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        ₹{exp.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Safe Cash Drops / Skimming Audit Table */}
          <div className="border-t border-slate-200">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-amber-50/40">
              <div className="flex items-center gap-2">
                <Vault className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Transfers to Store Safe / Anti-Theft Skims ({(dayRegister.cashDrops || []).length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCashDropModalOpen(true)}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Safe Drop</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {(!dayRegister.cashDrops || dayRegister.cashDrops.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No mid-day safe transfers recorded today. Click <strong>+ Record Safe Drop</strong> to skim excess till cash.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Transferred By</th>
                      <th className="py-2.5 px-3">Witness / Manager</th>
                      <th className="py-2.5 px-3">Reason / Envelope Ref</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      <th className="py-2.5 px-3 text-center">Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {dayRegister.cashDrops.map((drop) => (
                      <tr key={drop.id} className="hover:bg-amber-50/20">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{drop.time}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{drop.droppedBy}</td>
                        <td className="py-2.5 px-3 text-slate-500">{drop.witnessName || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div>{drop.reason}</div>
                          {drop.notes && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{drop.notes}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900">
                          ₹{drop.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handlePrintDropSlip(drop)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Print 58mm Thermal Safe Deposit Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Closing Drawer Status Card */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Register Drawer Status</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                dayRegister.status === 'open'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {dayRegister.status.toUpperCase()}
            </span>
          </h3>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Opening Float:</span>
              <span>₹{dayRegister.openingCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Cash Sales Collected:</span>
              <span>+₹{salesTotals.cash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Petty Cash Paid Out:</span>
              <span>-₹{totalPettyExpenses.toFixed(2)}</span>
            </div>
            {totalCashDrops > 0 && (
              <div className="flex justify-between text-amber-800 font-semibold">
                <span>Safe Drops Skimmed:</span>
                <span>-₹{totalCashDrops.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
              <span>Expected Cash in Till:</span>
              <span>₹{expectedCashInDrawer.toFixed(2)}</span>
            </div>

            {dayRegister.closingCashCounted !== undefined && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Counted Cash:</span>
                  <span>₹{dayRegister.closingCashCounted.toFixed(2)}</span>
                </div>
                <div
                  className={`flex justify-between font-bold ${
                    dayRegister.closingCashCounted - expectedCashInDrawer < 0
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }`}
                >
                  <span>Over / (Short):</span>
                  <span>
                    ₹{(dayRegister.closingCashCounted - expectedCashInDrawer).toFixed(2)}
                  </span>
                </div>
                {dayRegister.closingNotes && (
                  <p className="text-[11px] font-sans text-slate-500 italic mt-1">
                    "{dayRegister.closingNotes}"
                  </p>
                )}
              </div>
            )}
          </div>

          {dayRegister.status === 'open' ? (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Perform Evening Cash Count</span>
            </button>
          ) : (
            <button
              onClick={() => setIsZReportModalOpen(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>View & Print Day-End Z-Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Record Petty Cash Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Record Petty Cash Expense</h3>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Tea & Refreshments">Tea & Refreshments</option>
                  <option value="Packaging & Bags">Packaging Bags & Poly</option>
                  <option value="Alteration Fees">Alteration / Tailor Advance</option>
                  <option value="Shop Maintenance">Shop Cleaning / Maintenance</option>
                  <option value="Courier">Courier / Dispatch</option>
                  <option value="Staff Advance">Staff Food / Advance</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paid To *</label>
                <input
                  type="text"
                  required
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  placeholder="e.g. Chai Wala / Packaging Store"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="e.g. 5 cups tea for evening customers"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evening Cash Counting & Closing Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Evening Cash Drawer Reconciliation</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Expected Cash In Till:</span>
                <span className="font-bold text-slate-900">₹{expectedCashInDrawer.toFixed(2)}</span>
              </div>
            </div>

            {/* Denomination Counter */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Count by Denomination:</span>
                <button
                  type="button"
                  onClick={() => setUseDenominations(!useDenominations)}
                  className="text-xs text-indigo-600 underline"
                >
                  {useDenominations ? 'Switch to Total Amount' : 'Switch to Notes Breakdown'}
                </button>
              </div>

              {useDenominations ? (
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {[500, 200, 100, 50, 20, 10].map((d) => (
                    <div key={d} className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-slate-700 w-12">₹{d} x</span>
                      <input
                        type="number"
                        min="0"
                        value={denominations[d] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setDenominations({ ...denominations, [d]: Math.max(0, val) });
                        }}
                        placeholder="0"
                        className="w-16 px-1.5 py-0.5 text-center font-mono text-xs border border-slate-200 rounded bg-white"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Total Physical Cash Counted (₹)
                  </label>
                  <input
                    type="number"
                    value={manualCountedCash}
                    onChange={(e) => setManualCountedCash(e.target.value)}
                    placeholder={expectedCashInDrawer.toString()}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                  />
                </div>
              )}

              {/* Tally Totals */}
              <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 font-mono space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Counted Cash:</span>
                  <span className="font-bold text-base">₹{countedCash.toFixed(2)}</span>
                </div>
                <div
                  className={`flex justify-between font-bold ${
                    discrepancy === 0
                      ? 'text-emerald-700'
                      : discrepancy < 0
                      ? 'text-rose-600'
                      : 'text-amber-700'
                  }`}
                >
                  <span>Discrepancy (Over / Short):</span>
                  <span>{discrepancy >= 0 ? `+₹${discrepancy.toFixed(2)}` : `-₹${Math.abs(discrepancy).toFixed(2)}`}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Closing Remarks</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Close Register & Print Z-Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Safe Cash Drop / Skim Modal */}
      {isCashDropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <Vault className="w-5 h-5 text-amber-700" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Transfer Cash to Safe (Till Skim)</h3>
                  <p className="text-[11px] text-slate-500">Secure excess cash from counter till to main store vault</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCashDropModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Current Till Float In Hand:</span>
                <strong className="font-mono text-slate-900">₹{expectedCashInDrawer.toFixed(2)}</strong>
              </div>
              <p className="text-[10.5px] text-amber-900 leading-tight">
                Recommended: Skim cash when till drawer exceeds ₹15,000–₹20,000 to minimize robbery/loss risk.
              </p>
            </div>

            <form onSubmit={handleSaveCashDrop} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={Math.max(1, expectedCashInDrawer)}
                  value={dropAmount}
                  onChange={(e) => setDropAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-base text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transferred By (Cashier) *</label>
                  <input
                    type="text"
                    required
                    value={droppedBy}
                    onChange={(e) => setDroppedBy(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Witness / Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Store Manager"
                    value={witnessName}
                    onChange={(e) => setWitnessName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Drop Reason *</label>
                <select
                  value={dropReason}
                  onChange={(e) => setDropReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Drawer cash threshold exceeded (₹15,000 limit)">Till float limit exceeded (over ₹15,000)</option>
                  <option value="Mid-day routine afternoon safe deposit">Routine afternoon safe deposit</option>
                  <option value="Change of cashier shift handoff">Shift transition handoff</option>
                  <option value="Advance supplier cash settlement preparation">Preparation for vendor cash payout</option>
                  <option value="Other">Other security transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Safe Envelope / Vault Reference</label>
                <input
                  type="text"
                  value={dropNotes}
                  onChange={(e) => setDropNotes(e.target.value)}
                  placeholder="e.g. Placed in Tamper-evident Envelope #408"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCashDropModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Vault className="w-3.5 h-3.5" />
                  <span>Confirm Safe Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 58mm Thermal Z-Report Preview Modal */}
      <ZReportPreviewModal
        isOpen={isZReportModalOpen}
        onClose={() => setIsZReportModalOpen(false)}
        dayRegister={dayRegister}
        salesTotals={salesTotals}
        todaySalesCount={todaySales.length}
        totalPettyExpenses={totalPettyExpenses}
        totalCashDrops={totalCashDrops}
        expectedCashInDrawer={expectedCashInDrawer}
        countedCash={
          dayRegister.closingCashCounted !== undefined
            ? dayRegister.closingCashCounted
            : countedCash > 0
            ? countedCash
            : undefined
        }
        discrepancy={
          dayRegister.closingCashCounted !== undefined
            ? dayRegister.closingCashCounted - expectedCashInDrawer
            : countedCash > 0
            ? discrepancy
            : undefined
        }
        activeCompany={activeCompany}
      />

      {/* End-of-Day Business Summary Modal */}
      <EndOfDaySummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        defaultDate={dayRegister.date}
      />
    </div>
  );
};

