import React, { useState, useEffect } from 'react';
import { AlterationRecord, Company } from '../../types';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Phone,
  User,
  Scissors,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface AlterationNotifyModalProps {
  alteration: AlterationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkNotified: (id: string, timestamp?: string) => void;
  activeCompany: Company;
}

export const AlterationNotifyModal: React.FC<AlterationNotifyModalProps> = ({
  alteration,
  isOpen,
  onClose,
  onMarkNotified,
  activeCompany,
}) => {
  const [phone, setPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (alteration) {
      setPhone(alteration.customerPhone || '');
      setSentSuccess(false);

      const firmName = (activeCompany?.name || 'Garment OS').toUpperCase();
      const defaultText = `
================================
*${firmName} - ALTERATION READY*
================================
Dear ${alteration.customerName},

Great news! Your garment alteration is completed and READY FOR PICKUP at our store.

* Garment: ${alteration.garmentName} [Size: ${alteration.size}, ${alteration.color}]
* Invoice Ref: ${alteration.invoiceNumber}
* Alteration Done: ${alteration.alterationNotes}

Store Address: ${activeCompany.address}
Store Contact: ${activeCompany.phone}
Store Hours: 10:30 AM - 9:30 PM

Please show your bill or alteration slip at the cash counter to collect your garment.
Thank you for choosing ${activeCompany.name || 'our store'}!
================================
      `.trim();

      setCustomMessage(defaultText);
    }
  }, [alteration, activeCompany]);

  if (!isOpen || !alteration) return null;

  const getCleanPhone = () => {
    const raw = phone.replace(/[^0-9]/g, '');
    return raw.length === 10 ? `91${raw}` : raw;
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = getCleanPhone();
    const encodedText = encodeURIComponent(customMessage.trim());
    const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    onMarkNotified(alteration.id);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1500);
  };

  const handleSendSMS = () => {
    const cleanPhone = getCleanPhone();
    const encodedText = encodeURIComponent(customMessage.trim());
    const url = `sms:${cleanPhone}?body=${encodedText}`;
    window.location.href = url;

    onMarkNotified(alteration.id);
    setSentSuccess(true);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customMessage.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <MessageCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Send Alteration Pickup Notification
              </h3>
              <p className="text-xs text-emerald-800 font-medium">
                Notify customer their garment is ready for collection
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

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Quick Customer Strip */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Customer
              </span>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{alteration.customerName}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Garment Item
              </span>
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5 truncate">
                <Scissors className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">
                  {alteration.garmentName} ({alteration.size})
                </span>
              </div>
            </div>
          </div>

          {/* Recipient Phone input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              WhatsApp / Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Will send directly to +{getCleanPhone()}
            </p>
          </div>

          {/* Message Preview & Customizer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Message Content (Formatted for WhatsApp & SMS)
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 font-mono text-[11px] leading-relaxed bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none text-slate-800"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Free of special emoji surrogates to guarantee 100% clean delivery without replacement characters (?).
            </p>
          </div>

          {/* Sent Success Feedback */}
          {sentSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Customer pickup message dispatched and marked as notified!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSendSMS}
              title="Open default SMS app"
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-slate-500" />
              <span>SMS App</span>
            </button>

            <button
              onClick={handleCopyText}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>Send via WhatsApp</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
