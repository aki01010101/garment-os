import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  Printer,
  Bluetooth,
  Usb,
  Share2,
  AlertCircle,
  FileText,
  CheckCircle2,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { Customer, CustomerCreditPayment } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatCreditPaymentReceiptToEscPos,
  printViaLocalBridge,
  printViaWebUsb,
  printViaWebBluetooth,
} from '../../utils/escpos';
import { printThermalReceiptHtml } from '../../utils/printReceipt';

interface SettleKhataModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (payment: CustomerCreditPayment) => void;
}

export const SettleKhataModal: React.FC<SettleKhataModalProps> = ({
  customer,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const {
    activeCompany,
    recordCreditPayment,
    getCustomerKhata,
    currentUser,
  } = useApp();

  const khata = useMemo(() => getCustomerKhata(customer.id), [customer.id, getCustomerKhata]);
  const currentOutstanding = customer.outstandingCredit ?? khata.totalOutstanding ?? 0;

  const [paymentAmount, setPaymentAmount] = useState<string>(() =>
    currentOutstanding > 0 ? currentOutstanding.toString() : ''
  );
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Cheque'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [completedPayment, setCompletedPayment] = useState<CustomerCreditPayment | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const amountVal = parseFloat(paymentAmount) || 0;
  const newBalance = Math.max(0, currentOutstanding - amountVal);

  // Unpaid invoices preview and FIFO allocation simulation
  const unpaidSales = useMemo(() => {
    return khata.creditSales
      .filter((s) => (s.creditRemainingBalance === undefined ? (s.creditAmount || s.grandTotal) : s.creditRemainingBalance) > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [khata.creditSales]);

  const simulatedAllocations = useMemo(() => {
    let remaining = amountVal;
    return unpaidSales.map((sale) => {
      const currentBal = sale.creditRemainingBalance !== undefined ? sale.creditRemainingBalance : (sale.creditAmount || sale.grandTotal);
      const allocated = Math.min(remaining, currentBal);
      const remainingAfter = Math.max(0, currentBal - allocated);
      remaining -= allocated;
      return {
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        date: sale.date,
        currentBal,
        allocated,
        remainingAfter,
      };
    });
  }, [unpaidSales, amountVal]);

  if (!isOpen) return null;

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountVal <= 0) {
      alert('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    try {
      const payment = recordCreditPayment({
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        companyId: activeCompany.id,
        companyName: activeCompany.name,
        amount: amountVal,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        date: new Date().toISOString(),
        collectedBy: currentUser.fullName || currentUser.username || 'Cashier',
        customerPreviousBalance: currentOutstanding,
        customerNewBalance: newBalance,
        allocations: [],
      });

      setCompletedPayment(payment);
      if (onPaymentSuccess) onPaymentSuccess(payment);
    } catch (err: any) {
      alert(err.message || 'Failed to record credit payment.');
    }
  };

  const handlePrintEscpos = async (method: 'usb' | 'bluetooth') => {
    if (!completedPayment) return;
    setIsPrinting(true);
    setPrintStatus(`Formatting receipt for ${method.toUpperCase()}...`);

    try {
      const escposData = formatCreditPaymentReceiptToEscPos(completedPayment, {
        columns: 32, // standard 58mm
      });

      if (method === 'usb') {
        setPrintStatus('Sending to USB Direct thermal printer...');
        let res = await printViaLocalBridge(escposData);
        if (!res.success) {
          res = await printViaWebUsb(escposData);
        }
        if (res.success) {
          setPrintStatus('Printed successfully via USB direct!');
        } else {
          setPrintStatus(`USB Print notice: ${res.error || 'Failed to print'}. Falling back to browser print...`);
          handleBrowserPrint();
        }
      } else {
        setPrintStatus('Connecting to Bluetooth printer...');
        const res = await printViaWebBluetooth(escposData);
        if (res.success) {
          setPrintStatus('Printed successfully via Bluetooth!');
        } else {
          setPrintStatus(`Bluetooth notice: ${res.error || 'Failed to print'}.`);
        }
      }
    } catch (err: any) {
      setPrintStatus(`Print error: ${err.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBrowserPrint = () => {
    if (!completedPayment) return;
    const printHtml = `
      <div style="font-family: monospace; width: 280px; padding: 10px; margin: 0 auto; font-size: 11px; line-height: 1.3;">
        <div style="text-align: center; font-weight: bold; font-size: 13px;">${activeCompany.name.toUpperCase()}</div>
        <div style="text-align: center; font-size: 10px;">${activeCompany.address}</div>
        <div style="text-align: center; font-size: 10px;">Tel: ${activeCompany.phone}</div>
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div style="text-align: center; font-weight: bold;">*** KHATA PAYMENT RECEIPT ***</div>
        <div style="text-align: center; font-size: 10px;">Receipt #: ${completedPayment.receiptNumber}</div>
        <div style="text-align: center; font-size: 10px;">Date: ${new Date(completedPayment.date).toLocaleString('en-IN')}</div>
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div><strong>Customer:</strong> ${completedPayment.customerName}</div>
        <div><strong>Phone:</strong> ${completedPayment.customerPhone}</div>
        <div><strong>Mode:</strong> ${completedPayment.paymentMode} ${completedPayment.referenceNumber ? `(${completedPayment.referenceNumber})` : ''}</div>
        <div><strong>Collected By:</strong> ${completedPayment.collectedBy}</div>
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
          <span>AMOUNT RECEIVED:</span>
          <span>Rs. ${completedPayment.amount.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px;">
          <span>Previous Debt:</span>
          <span>Rs. ${completedPayment.customerPreviousBalance.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>REMAINING BALANCE:</span>
          <span>Rs. ${completedPayment.customerNewBalance.toFixed(2)}</span>
        </div>
        ${
          completedPayment.allocations && completedPayment.allocations.length > 0
            ? `
          <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
          <div style="font-size: 10px; font-weight: bold;">INVOICE ALLOCATIONS (FIFO):</div>
          ${completedPayment.allocations
            .map(
              (a) => `
            <div style="display: flex; justify-content: space-between; font-size: 9.5px;">
              <span>Bill #${a.invoiceNumber}:</span>
              <span>-Rs. ${a.amountAllocated.toFixed(2)} (Bal: Rs. ${a.remainingOnInvoice.toFixed(2)})</span>
            </div>
          `
            )
            .join('')}
        `
            : ''
        }
        <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
        <div style="text-align: center; margin-top: 52px;">
          <div style="font-size: 7px; color: #888; font-style: italic; margin-bottom: 4px;">(Sign above this line)</div>
          <div style="border-bottom: 1px solid #000; width: 140px; margin: 0 auto 3px auto;"></div>
          <div style="font-size: 9px; font-weight: bold;">Authorized Cashier Signature</div>
        </div>
        <div style="text-align: center; font-size: 9px; margin-top: 10px;">
          Thank you for settling your Khata with us!
        </div>
      </div>
    `;

    printThermalReceiptHtml(printHtml);
  };

  const handleShareWhatsApp = () => {
    if (!completedPayment) return;
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const text = `*KHATA PAYMENT RECEIPT*\n` +
      `Store: *${activeCompany.name}*\n` +
      `Receipt No: *${completedPayment.receiptNumber}*\n` +
      `Date: ${new Date(completedPayment.date).toLocaleDateString('en-IN')}\n\n` +
      `Dear ${customer.name},\n` +
      `We have received your payment of *₹${completedPayment.amount.toLocaleString('en-IN')}* via ${completedPayment.paymentMode}.\n\n` +
      `• Previous Balance: ₹${completedPayment.customerPreviousBalance.toLocaleString('en-IN')}\n` +
      `• Amount Paid: ₹${completedPayment.amount.toLocaleString('en-IN')}\n` +
      `• *Current Balance: ₹${completedPayment.customerNewBalance.toLocaleString('en-IN')}*\n\n` +
      `Thank you for your business!`;

    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {completedPayment ? 'Payment Receipt (Khata Jama Pawti)' : 'Collect Khata Debt Payment'}
              </h2>
              <p className="text-xs text-slate-300">
                Customer: <span className="text-white font-semibold">{customer.name}</span> ({customer.phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed State */}
        {completedPayment ? (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Payment Successfully Recorded!</h3>
              <p className="text-xs text-slate-500 font-mono">
                Receipt Number: <span className="font-bold text-slate-800">{completedPayment.receiptNumber}</span>
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                <span>Amount Paid:</span>
                <span className="font-mono text-emerald-600 text-base">₹{completedPayment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-800">{completedPayment.paymentMode}</span>
              </div>
              {completedPayment.referenceNumber && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Reference / UTR:</span>
                  <span className="font-mono text-slate-800">{completedPayment.referenceNumber}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-600">
                <span>Previous Balance:</span>
                <span className="font-mono text-slate-800">₹{completedPayment.customerPreviousBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>New Remaining Balance:</span>
                <span className="font-mono text-indigo-700 text-sm">₹{completedPayment.customerNewBalance.toFixed(2)}</span>
              </div>
            </div>

            {/* Print Status Feedback */}
            {printStatus && (
              <div className="p-2.5 bg-blue-50 text-blue-800 rounded-lg text-xs font-mono border border-blue-200">
                {printStatus}
              </div>
            )}

            {/* Action Buttons: 203 DPI USB, Bluetooth, Browser, WhatsApp */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintEscpos('usb')}
                  disabled={isPrinting}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Usb className="w-4 h-4 text-emerald-400" />
                  <span>USB Direct Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintEscpos('bluetooth')}
                  disabled={isPrinting}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Bluetooth className="w-4 h-4 text-white" />
                  <span>Bluetooth Print</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleBrowserPrint}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Browser Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Receipt</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Close & Return to Khata
              </button>
            </div>
          </div>
        ) : (
          /* Payment Collection Form */
          <form onSubmit={handleSettle} className="p-6 space-y-4">
            {/* Outstanding Balance Banner */}
            <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                  Current Khata Balance
                </span>
                <div className="text-2xl font-black font-mono text-indigo-950 mt-0.5">
                  ₹{currentOutstanding.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-semibold block">Unpaid Bills</span>
                <span className="text-xs font-mono font-bold text-slate-700">{unpaidSales.length} bills</span>
              </div>
            </div>

            {/* Amount Tender Input & Quick Chips */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Amount Received (₹):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={currentOutstanding * 2}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount..."
                  required
                  className="w-full pl-8 pr-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Quick Amount Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(currentOutstanding.toString())}
                  className="px-2 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg cursor-pointer transition-colors"
                >
                  Full (₹{currentOutstanding.toLocaleString('en-IN')})
                </button>
                {[500, 1000, 2000, 5000].map((amt) => {
                  if (amt >= currentOutstanding && amt !== currentOutstanding) return null;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPaymentAmount(amt.toString())}
                      className="px-2 py-1 text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tender Mode Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Payment Mode:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'Cash', icon: Banknote, label: 'Cash' },
                  { id: 'UPI', icon: QrCode, label: 'UPI' },
                  { id: 'Bank Transfer', icon: Building2, label: 'Bank' },
                  { id: 'Card', icon: CreditCard, label: 'Card' },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id as any)}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-[10px] sm:text-[11px]">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference Number / UTR input (for UPI / Bank / Card) */}
            {paymentMode !== 'Cash' && (
              <div className="space-y-1 animate-in fade-in">
                <label className="block text-xs font-medium text-slate-700">
                  Reference / UTR / Auth Code (Optional):
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UPI Ref # or Bank Txn ID"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>
            )}

            {/* Notes / Remarks */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Notes / Remarks (Optional):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid in full against Diwali credit"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Smart FIFO Invoice Allocation Preview */}
            {amountVal > 0 && simulatedAllocations.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Automatic FIFO Bill Clearing:
                  </span>
                  <span className="text-[10px] text-slate-500">Oldest bills cleared first</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {simulatedAllocations.map((alloc) => (
                    <div
                      key={alloc.saleId}
                      className="flex items-center justify-between text-[11px] p-1.5 bg-white rounded border border-slate-200"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-800">#{alloc.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          {new Date(alloc.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold font-mono">
                          -₹{alloc.allocated.toFixed(0)}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          (Rem: ₹{alloc.remainingAfter.toFixed(0)})
                        </span>
                        {alloc.remainingAfter === 0 ? (
                          <span className="text-[9px] font-bold px-1 bg-emerald-100 text-emerald-800 rounded">
                            PAID
                          </span>
                        ) : alloc.allocated > 0 ? (
                          <span className="text-[9px] font-bold px-1 bg-amber-100 text-amber-800 rounded">
                            PARTIAL
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remaining Balance Summary */}
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Remaining Balance After Payment:</span>
              <span className={`font-mono text-sm ${newBalance === 0 ? 'text-emerald-700' : 'text-indigo-900'}`}>
                ₹{newBalance.toFixed(2)}
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={amountVal <= 0}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Payment & Print Receipt (₹{amountVal.toFixed(2)})</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
