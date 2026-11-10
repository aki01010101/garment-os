import React, { useState, useMemo } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Printer,
  Check,
  Send,
  AlertTriangle,
  Clock,
  QrCode,
  Sparkles,
  ShieldAlert,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatCustomerKhataStatementToEscPos,
  printViaLocalBridge,
  printViaWebUsb,
  printViaWebBluetooth,
} from '../../utils/escpos';
import { printThermalReceiptHtml } from '../../utils/printReceipt';

interface PaymentReminderModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const {
    activeCompany,
    storeUpiId,
    storeUpiName,
    getCustomerKhata,
  } = useApp();

  const khata = useMemo(() => getCustomerKhata(customer.id), [customer.id, getCustomerKhata]);
  const currentOutstanding = customer.outstandingCredit ?? khata.totalOutstanding ?? 0;

  const [tone, setTone] = useState<'gentle' | 'due' | 'firm'>('due');
  const [copied, setCopied] = useState(false);
  const [customMsg, setCustomMsg] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Compute oldest due date & unpaid bills summary
  const unpaidBills = useMemo(() => {
    return khata.creditSales
      .filter((s) => (s.creditRemainingBalance === undefined ? (s.creditAmount || s.grandTotal) : s.creditRemainingBalance) > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [khata.creditSales]);

  const oldestDueDate = useMemo(() => {
    if (unpaidBills.length === 0) return null;
    return unpaidBills[0].creditDueDate || null;
  }, [unpaidBills]);

  // Construct UPI deep-link for instant mobile payments
  const upiPayLink = useMemo(() => {
    if (!storeUpiId) return '';
    return `upi://pay?pa=${storeUpiId}&pn=${encodeURIComponent(storeUpiName || activeCompany.name)}&am=${currentOutstanding}&cu=INR&tn=${encodeURIComponent('Khata ' + customer.name)}`;
  }, [storeUpiId, storeUpiName, activeCompany.name, currentOutstanding, customer.name]);

  // Default messages by tone
  const generatedMessage = useMemo(() => {
    const store = activeCompany.name;
    const phone = activeCompany.phone;
    const amountStr = `₹${currentOutstanding.toLocaleString('en-IN')}`;
    const billsList = unpaidBills
      .slice(0, 3)
      .map((b) => `• Bill #${b.invoiceNumber} (${new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}): ₹${(b.creditRemainingBalance ?? b.creditAmount ?? b.grandTotal).toLocaleString('en-IN')}`)
      .join('\n');

    const upiSection = storeUpiId
      ? `\n📲 *Pay via UPI:* ${storeUpiId}\nOr click to pay: ${upiPayLink}\n`
      : '';

    if (tone === 'gentle') {
      return (
        `Namaste ${customer.name} ji 🙏,\n\n` +
        `Greetings from *${store}*! This is a friendly courtesy check regarding your Khata balance of *${amountStr}*.\n\n` +
        `Pending Bills:\n${billsList}\n` +
        upiSection +
        `\nKindly clear at your convenience or visit our shop. For queries, call ${phone}.\n\n` +
        `Thank you for shopping with us!`
      );
    } else if (tone === 'firm') {
      return (
        `⚠️ *PAYMENT OVERDUE NOTICE* ⚠️\n\n` +
        `Dear ${customer.name},\n` +
        `Your Khata balance of *${amountStr}* at *${store}* is now *OVERDUE* (${khata.oldestCreditDays} days elapsed).\n\n` +
        `Unsettled Invoices:\n${billsList}\n` +
        (oldestDueDate ? `*Promised Due Date was:* ${oldestDueDate}\n` : '') +
        upiSection +
        `\nPlease clear this outstanding amount immediately to avoid disruption in your credit facility. Contact us at ${phone}.\n\n` +
        `Regards,\n*${store}*`
      );
    } else {
      // standard 'due'
      return (
        `Namaste ${customer.name} ji 🙏,\n\n` +
        `This is a gentle payment reminder from *${store}* regarding your Khata balance of *${amountStr}*.\n\n` +
        `Bill Summary:\n${billsList}\n` +
        (oldestDueDate ? `*Due Date:* ${oldestDueDate}\n` : '') +
        upiSection +
        `\nPlease clear the balance via UPI or visit our counter. If already paid, please ignore this message.\n\n` +
        `Contact: ${phone}\n*${store}*`
      );
    }
  }, [tone, customer.name, currentOutstanding, unpaidBills, oldestDueDate, storeUpiId, upiPayLink, activeCompany.name, activeCompany.phone, khata.oldestCreditDays]);

  const activeMessage = customMsg !== null ? customMsg : generatedMessage;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleOpenWhatsApp = () => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(activeMessage)}`;
    window.open(url, '_blank');
  };

  const handlePrintEscpos = async (method: 'usb' | 'bluetooth') => {
    setIsPrinting(true);
    setPrintStatus(`Generating statement for ${method.toUpperCase()}...`);

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
      <div style="font-family: monospace; width: 280px; padding: 10px; margin: 0 auto; font-size: 11px; line-height: 1.3;">
        <div style="text-align: center; font-weight: bold; font-size: 13px;">${activeCompany.name.toUpperCase()}</div>
        <div style="text-align: center; font-size: 10px;">${activeCompany.address}</div>
        <div style="text-align: center; font-size: 10px;">Tel: ${activeCompany.phone}</div>
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div style="text-align: center; font-weight: bold;">*** PAYMENT REMINDER NOTICE ***</div>
        <div style="text-align: center; font-size: 10px;">Date: ${new Date().toLocaleDateString('en-IN')}</div>
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div><strong>Customer:</strong> ${customer.name}</div>
        <div><strong>Phone:</strong> ${customer.phone}</div>
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin: 4px 0;">
          <span>TOTAL DUE:</span>
          <span>Rs. ${currentOutstanding.toFixed(2)}</span>
        </div>
        <div>Days on Khata: ${khata.oldestCreditDays} days</div>
        ${oldestDueDate ? `<div>Promised Due Date: ${oldestDueDate}</div>` : ''}
        <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
        <div style="font-size: 10px; font-weight: bold;">UNSETTLED BILLS:</div>
        ${unpaidBills
          .map(
            (b) => `
          <div style="display: flex; justify-content: space-between; font-size: 9.5px;">
            <span>Bill #${b.invoiceNumber} (${new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}):</span>
            <span>Rs. ${(b.creditRemainingBalance ?? b.creditAmount ?? b.grandTotal).toFixed(2)}</span>
          </div>
        `
          )
          .join('')}
        ${
          storeUpiId
            ? `
          <div style="border-bottom: 1px dashed #000; margin: 6px 0;"></div>
          <div style="text-align: center; font-size: 10px; font-weight: bold;">SCAN & PAY VIA UPI:</div>
          <div style="text-align: center; font-size: 9px; margin-top: 2px;">${storeUpiId}</div>
        `
            : ''
        }
        <div style="border-bottom: 1px dashed #000; margin: 8px 0;"></div>
        <div style="text-align: center; font-size: 9px;">
          Please clear your balance at earliest.<br />Thank you!
        </div>
      </div>
    `;

    printThermalReceiptHtml(printHtml);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Send Khata Payment Reminder
              </h2>
              <p className="text-xs text-emerald-100">
                1-Click WhatsApp & SMS Dispatch to <span className="font-semibold">{customer.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Customer Summary Bar */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Outstanding Khata</span>
              <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                ₹{currentOutstanding.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-semibold block">Age of Oldest Bill</span>
              <div className="flex items-center gap-1 justify-end font-bold text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className={khata.oldestCreditDays > 30 ? 'text-red-700 font-black' : 'text-slate-800'}>
                  {khata.oldestCreditDays} Days
                </span>
              </div>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Reminder Tone & Urgency:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTone('gentle');
                  setCustomMsg(null);
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  tone === 'gentle'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Gentle Check-in</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTone('due');
                  setCustomMsg(null);
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  tone === 'due'
                    ? 'bg-amber-50 text-amber-900 border-amber-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Due Date Notice</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTone('firm');
                  setCustomMsg(null);
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  tone === 'firm'
                    ? 'bg-red-50 text-red-900 border-red-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Firm Overdue</span>
              </button>
            </div>
          </div>

          {/* Editable WhatsApp Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Message Preview (WhatsApp & SMS):</span>
              {customMsg !== null && (
                <button
                  type="button"
                  onClick={() => setCustomMsg(null)}
                  className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-semibold"
                >
                  Reset Template
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                rows={7}
                value={activeMessage}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full p-3 text-xs font-mono leading-relaxed border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
          </div>

          {/* UPI Deep Link Notification */}
          {storeUpiId && (
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-[11px] text-emerald-950">
                  Includes 1-click Pay Link for <strong>{storeUpiId}</strong>
                </span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                PhonePe/GPay Ready
              </span>
            </div>
          )}

          {/* Print Status Feedback */}
          {printStatus && (
            <div className="p-2 bg-blue-50 text-blue-800 rounded-lg text-xs font-mono border border-blue-200">
              {printStatus}
            </div>
          )}

          {/* Actions: Send WhatsApp, Copy Text, Print Slip */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send via WhatsApp (+91 {customer.phone})</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copy Text / SMS</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handlePrintEscpos('usb')}
                disabled={isPrinting}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Notice (USB)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
