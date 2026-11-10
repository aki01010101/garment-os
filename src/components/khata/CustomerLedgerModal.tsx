import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Bluetooth,
  Usb,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Share2,
  Receipt,
  PlusCircle,
} from 'lucide-react';
import { Customer, KhataLedgerEntry } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatCustomerKhataStatementToEscPos,
  printViaLocalBridge,
  printViaWebUsb,
  printViaWebBluetooth,
} from '../../utils/escpos';
import { printThermalReceiptHtml } from '../../utils/printReceipt';

interface CustomerLedgerModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettleModal?: () => void;
  onOpenReminderModal?: () => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  customer,
  isOpen,
  onClose,
  onOpenSettleModal,
  onOpenReminderModal,
}) => {
  const {
    activeCompany,
    storeUpiId,
    storeUpiName,
    getCustomerKhata,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const khata = useMemo(() => getCustomerKhata(customer.id), [customer.id, getCustomerKhata]);
  const currentOutstanding = customer.outstandingCredit ?? khata.totalOutstanding ?? 0;

  const totalDebited = useMemo(() => {
    return khata.ledger
      .filter((e) => e.type === 'DEBIT')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [khata.ledger]);

  const totalCredited = useMemo(() => {
    return khata.ledger
      .filter((e) => e.type === 'CREDIT')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [khata.ledger]);

  const filteredEntries = useMemo(() => {
    if (activeFilter === 'debit') return khata.ledger.filter((e) => e.type === 'DEBIT');
    if (activeFilter === 'credit') return khata.ledger.filter((e) => e.type === 'CREDIT');
    return khata.ledger;
  }, [khata.ledger, activeFilter]);

  if (!isOpen) return null;

  const handlePrintEscpos = async (method: 'usb' | 'bluetooth') => {
    setIsPrinting(true);
    setPrintStatus(`Formatting statement for ${method.toUpperCase()}...`);

    try {
      const escposData = formatCustomerKhataStatementToEscPos({
        customer,
        companyName: activeCompany.name,
        companyPhone: activeCompany.phone,
        companyAddress: activeCompany.address,
        ledger: khata.ledger,
        totalOutstanding: currentOutstanding,
        storeUpiId,
        storeUpiName,
      }, { columns: 32 });

      if (method === 'usb') {
        setPrintStatus('Sending to USB thermal printer...');
        let res = await printViaLocalBridge(escposData);
        if (!res.success) {
          res = await printViaWebUsb(escposData);
        }
        if (res.success) {
          setPrintStatus('Printed statement successfully via USB direct!');
        } else {
          setPrintStatus(`USB Notice: ${res.error || 'Failed to print'}. Falling back to browser print...`);
          handleBrowserPrint();
        }
      } else {
        setPrintStatus('Connecting to Bluetooth printer...');
        const res = await printViaWebBluetooth(escposData);
        if (res.success) {
          setPrintStatus('Printed statement successfully via Bluetooth!');
        } else {
          setPrintStatus(`Bluetooth Notice: ${res.error || 'Failed to print'}.`);
        }
      }
    } catch (err: any) {
      setPrintStatus(`Print error: ${err.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBrowserPrint = () => {
    const printHtml = `
      <div style="font-family: monospace; width: 300px; padding: 10px; margin: 0 auto; font-size: 11px; line-height: 1.3;">
        <div style="text-align: center; font-weight: bold; font-size: 13px;">${activeCompany.name.toUpperCase()}</div>
        <div style="text-align: center; font-size: 10px;">${activeCompany.address}</div>
        <div style="text-align: center; font-size: 10px;">Tel: ${activeCompany.phone}</div>
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div style="text-align: center; font-weight: bold;">CUSTOMER KHATA STATEMENT</div>
        <div style="text-align: center; font-size: 10px;">Customer: ${customer.name} (${customer.phone})</div>
        <div style="text-align: center; font-size: 10px;">Date: ${new Date().toLocaleDateString('en-IN')}</div>
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin: 4px 0;">
          <span>CURRENT OUTSTANDING:</span>
          <span>Rs. ${currentOutstanding.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9.5px;">
          <span>Total Purchases on Credit:</span>
          <span>Rs. ${totalDebited.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9.5px;">
          <span>Total Repayments:</span>
          <span>Rs. ${totalCredited.toFixed(2)}</span>
        </div>
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">RECENT TRANSACTIONS:</div>
        ${khata.ledger
          .slice(-10)
          .map(
            (e) => `
          <div style="margin-bottom: 4px; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">
            <div style="display: flex; justify-content: space-between; font-size: 9.5px;">
              <span>${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${e.referenceNumber}</span>
              <span style="font-weight: bold; color: ${e.type === 'DEBIT' ? '#000' : '#15803d'};">
                ${e.type === 'DEBIT' ? '+' : '-'}Rs. ${e.amount.toFixed(2)}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: #555;">
              <span>${e.description}</span>
              <span>Bal: Rs. ${e.runningBalance.toFixed(2)}</span>
            </div>
          </div>
        `
          )
          .join('')}
        ${
          storeUpiId
            ? `
          <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
          <div style="text-align: center; font-size: 10px; font-weight: bold;">SCAN & PAY VIA ANY UPI APP:</div>
          <div style="text-align: center; font-size: 9px; margin-top: 2px;">${storeUpiId}</div>
        `
            : ''
        }
        <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
        <div style="text-align: center; font-size: 9px;">
          Thank you for your trusted relationship!
        </div>
      </div>
    `;

    printThermalReceiptHtml(printHtml);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {customer.name}'s Khata Ledger
                </h2>
                {customer.isVip && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                    VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Phone: <span className="font-mono text-white">{customer.phone}</span>
                {customer.creditLimit ? ` · Credit Limit: ₹${customer.creditLimit.toLocaleString('en-IN')}` : ''}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                Current Outstanding
              </span>
              <div className="text-2xl font-black font-mono text-indigo-950 mt-0.5">
                ₹{currentOutstanding.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
                {khata.oldestCreditDays} days on credit
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Credit Taken
              </span>
              <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                ₹{totalDebited.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                {khata.creditSales.length} credit invoices
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Total Recovered
              </span>
              <div className="text-xl font-black font-mono text-emerald-950 mt-0.5">
                ₹{totalCredited.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                {khata.payments.length} payments received
              </span>
            </div>
          </div>

          {/* Aging Buckets Bar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Aging Breakdown of Active Debt:</span>
              <span className="text-[10px] text-slate-500 font-normal">Calculated by days elapsed</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 block">0–15 Days</span>
                <span className="text-xs font-mono font-black text-emerald-950">
                  ₹{khata.agingBuckets['0-15'].toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 block">16–30 Days</span>
                <span className="text-xs font-mono font-black text-amber-950">
                  ₹{khata.agingBuckets['16-30'].toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                <span className="text-[10px] font-bold text-orange-800 block">31–60 Days</span>
                <span className="text-xs font-mono font-black text-orange-950">
                  ₹{khata.agingBuckets['31-60'].toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                <span className="text-[10px] font-bold text-red-800 block">60+ Days</span>
                <span className="text-xs font-mono font-black text-red-950">
                  ₹{khata.agingBuckets['60+'].toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Table Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Transaction History</span>
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  ({filteredEntries.length})
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('debit')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeFilter === 'debit'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Purchases (+)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('credit')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    activeFilter === 'credit'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Payments (-)
                </button>
              </div>
            </div>

            {/* Ledger Entries List */}
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No transactions recorded under this filter.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          entry.type === 'DEBIT'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {entry.type === 'DEBIT' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {entry.referenceNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(entry.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {entry.description}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono font-black text-sm ${
                          entry.type === 'DEBIT' ? 'text-slate-900' : 'text-emerald-600'
                        }`}
                      >
                        {entry.type === 'DEBIT' ? '+' : '-'}₹{entry.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Bal: ₹{entry.runningBalance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Print Feedback */}
          {printStatus && (
            <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-xs font-mono border border-blue-200">
              {printStatus}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrintEscpos('usb')}
              disabled={isPrinting}
              className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Usb className="w-3.5 h-3.5 text-emerald-400" />
              <span>Statement (USB)</span>
            </button>
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Browser Print / PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReminderModal && currentOutstanding > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReminderModal();
                }}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Reminder</span>
              </button>
            )}

            {onOpenSettleModal && currentOutstanding > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettleModal();
                }}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Collect Payment</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
