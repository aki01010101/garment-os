import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GiftVoucher } from '../../types';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  Gift,
  X,
  Plus,
  Search,
  Printer,
  Share2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  QrCode,
  DollarSign,
  History,
  Copy,
  Check,
} from 'lucide-react';

interface GiftVouchersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToSale?: (voucherCode: string) => void;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 3000, 5000, 10000];

export const GiftVouchersModal: React.FC<GiftVouchersModalProps> = ({
  isOpen,
  onClose,
  onApplyToSale,
}) => {
  const { giftVouchers, issueGiftVoucher, activeCompany } = useApp();

  const [activeTab, setActiveTab] = useState<'directory' | 'issue'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoucherForDetails, setSelectedVoucherForDetails] = useState<GiftVoucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Issue Form State
  const [amount, setAmount] = useState<number>(2000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [issuedToName, setIssuedToName] = useState('');
  const [issuedToPhone, setIssuedToPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('Wishing you joyful shopping with love!');
  const [validityMonths, setValidityMonths] = useState<number>(12);
  const [justIssued, setJustIssued] = useState<GiftVoucher | null>(null);

  if (!isOpen) return null;

  // Filter vouchers
  const filteredVouchers = giftVouchers.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      v.code.toLowerCase().includes(q) ||
      v.barcode.toLowerCase().includes(q) ||
      v.issuedToName.toLowerCase().includes(q) ||
      v.issuedToPhone.includes(q) ||
      (v.senderName && v.senderName.toLowerCase().includes(q))
    );
  });

  // Calculate Expiry Date
  const calculateExpiry = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
    if (finalAmount <= 0) {
      alert('Please enter a valid gift card amount.');
      return;
    }
    if (!issuedToName.trim() || !issuedToPhone.trim()) {
      alert('Please provide recipient name and phone number.');
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const storePrefix = (activeCompany?.name || 'FANTASY').replace(/[^a-zA-Z]/g, '').slice(0, 7).toUpperCase();
    const voucherCode = `${storePrefix}-GIFT-${randomSuffix}`;
    const barcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;

    const newVoucher = issueGiftVoucher({
      code: voucherCode,
      barcode,
      initialAmount: finalAmount,
      issuedToName: issuedToName.trim(),
      issuedToPhone: issuedToPhone.trim(),
      senderName: senderName.trim() || undefined,
      message: message.trim() || undefined,
      expiryDate: calculateExpiry(validityMonths),
    });

    setJustIssued(newVoucher);
    // Reset form
    setIssuedToName('');
    setIssuedToPhone('');
    setSenderName('');
    setCustomAmount('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Thermal Print Gift Certificate
  const handlePrintCertificate = (voucher: GiftVoucher) => {
    const slipHtml = `
      <div style="font-family: monospace; font-size: 11px; line-height: 1.3; text-align: center; color: #000; width: 58mm; margin: 0 auto; padding: 4px;">
        <div style="font-weight: bold; font-size: 14px; letter-spacing: 1px;">${(activeCompany?.name || 'VERVE CLOTHING').toUpperCase()}</div>
        <div style="font-size: 9px; margin-top: 1px;">PREMIUM GIFT CERTIFICATE</div>
        <div style="font-size: 8px; color: #333;">Digital Store Credit Card</div>
        <hr style="border: 0; border-top: 1px dashed #000; margin: 5px 0;" />
        
        <div style="font-size: 18px; font-weight: bold; margin: 6px 0; border: 1px solid #000; padding: 4px;">
          Rs. ${voucher.currentBalance.toFixed(2)}
        </div>
        <div style="font-size: 8px;">(Original Value: Rs. ${voucher.initialAmount.toFixed(2)})</div>

        <div style="text-align: left; font-size: 9px; margin-top: 6px;">
          <div><b>Voucher Code:</b> <span style="font-size: 11px; font-weight: bold;">${voucher.code}</span></div>
          <div><b>Recipient:</b> ${voucher.issuedToName}</div>
          <div><b>Mobile:</b> ${voucher.issuedToPhone}</div>
          ${voucher.senderName ? `<div><b>Gifted By:</b> ${voucher.senderName}</div>` : ''}
          <div><b>Valid Till:</b> ${voucher.expiryDate}</div>
        </div>

        ${
          voucher.message
            ? `<div style="margin: 6px 0; font-style: italic; font-size: 8px; border-left: 2px solid #000; padding-left: 4px; text-align: left;">
                "${voucher.message}"
               </div>`
            : ''
        }

        <hr style="border: 0; border-top: 1px dashed #000; margin: 5px 0;" />
        <div style="font-size: 8px; text-align: left; line-height: 1.2;">
          • Redeemable on all garments & apparel.<br/>
          • Partial redemption permitted; balance remains.<br/>
          • Present code or mobile number at counter.<br/>
          • Non-refundable for cash.
        </div>
        <div style="margin-top: 6px; font-size: 9px; font-weight: bold;">Thank You for Shopping with Us!</div>
      </div>
    `;
    printThermalReceiptHtml(slipHtml, '58mm');
  };

  // WhatsApp Share
  const handleShareWhatsApp = (voucher: GiftVoucher) => {
    const text =
      `🎁 *SPECIAL GIFT CARD FOR YOU!*\n\n` +
      `Dear ${voucher.issuedToName},\n` +
      `${voucher.senderName ? `${voucher.senderName} has sent you a special gift card for ` : 'Here is your official digital gift card for '}*${activeCompany?.name || 'our store'}*!\n\n` +
      `💰 *Voucher Value: Rs. ${voucher.currentBalance.toLocaleString('en-IN')}*\n` +
      `🔑 *Voucher Code: ${voucher.code}*\n` +
      `📅 *Valid Until: ${voucher.expiryDate}*\n` +
      (voucher.message ? `\n💌 _"${voucher.message}"_\n` : '') +
      `\n🛍️ Visit our boutique anytime to redeem against any ready-to-wear apparel or bespoke tailoring.\n` +
      `Show this message at the billing counter.`;

    window.open(`https://wa.me/91${voucher.issuedToPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
              <Gift className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Digital Gift Cards & Store Credit Vouchers
                <span className="text-[10px] bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full font-semibold">
                  {giftVouchers.length} Issued
                </span>
              </h2>
              <p className="text-xs text-rose-100">
                Issue branded digital gift cards, track partial redemptions, print 58mm thermal certificates & share via WhatsApp.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('directory');
                setJustIssued(null);
              }}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Vouchers Directory
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('issue');
                setJustIssued(null);
              }}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'issue'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue New Gift Card</span>
            </button>
          </div>

          {activeTab === 'directory' && (
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by code, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'issue' ? (
            <div className="max-w-xl mx-auto space-y-5">
              {justIssued ? (
                <div className="p-6 bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 rounded-2xl text-center space-y-4 shadow-sm animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Gift Card Issued Successfully!
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Ready for redemption at the billing counter or sharing with customer.
                    </p>
                  </div>

                  {/* Luxury Card Preview */}
                  <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-lg text-left relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                          {activeCompany?.name || 'VERVE CLOTHING'} GIFT CARD
                        </span>
                        <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                          {justIssued.issuedToName}
                        </h4>
                      </div>
                      <span className="text-lg font-mono font-extrabold text-amber-300">
                        ₹{justIssued.currentBalance.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Card Voucher Code:</div>
                        <div className="font-mono font-bold text-white tracking-wider flex items-center gap-1.5">
                          <span>{justIssued.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(justIssued.code)}
                            className="p-1 hover:bg-white/10 rounded cursor-pointer"
                          >
                            {copiedCode === justIssued.code ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-300">
                        Valid till: {justIssued.expiryDate}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handlePrintCertificate(justIssued)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-300" />
                      <span>Print 58mm Certificate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(justIssued)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Send WhatsApp Gift</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJustIssued(null)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                      + Issue Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
                  {/* Amount Selection */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      1. Gift Card Amount (₹) *
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PRESET_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setAmount(amt);
                            setCustomAmount('');
                          }}
                          className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                            amount === amt && !customAmount
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          ₹{amt.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-slate-500 text-[11px]">Or Custom Value:</span>
                      <input
                        type="number"
                        min="100"
                        placeholder="e.g. 7500"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      2. Recipient & Sender Information
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Recipient Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={issuedToName}
                          onChange={(e) => setIssuedToName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Recipient WhatsApp Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={issuedToPhone}
                          onChange={(e) => setIssuedToPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Sender / Gifted By (Optional)
                        </label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="e.g. Rohit Sharma / Colleagues"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Card Validity Period
                        </label>
                        <select
                          value={validityMonths}
                          onChange={(e) => setValidityMonths(parseInt(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                        >
                          <option value={6}>6 Months (Valid till {calculateExpiry(6)})</option>
                          <option value={12}>1 Year (Valid till {calculateExpiry(12)})</option>
                          <option value={24}>2 Years (Valid till {calculateExpiry(24)})</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Personal Greeting Message (Included in WhatsApp & Thermal Print)
                      </label>
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. Wishing you joyful shopping on your special day!"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('directory')}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Issue Card (₹{customAmount || amount})</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVouchers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Gift className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                  <p className="text-xs">No gift cards matched your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredVouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {voucher.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(voucher.code)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title="Copy code"
                            >
                              {copiedCode === voucher.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{voucher.issuedToName}</span>
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {voucher.issuedToPhone}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-extrabold font-mono text-emerald-700 block">
                            ₹{voucher.currentBalance.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            of ₹{voucher.initialAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {voucher.message && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{voucher.message}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <div>
                          Valid till: <strong className="text-slate-700">{voucher.expiryDate}</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {onApplyToSale && (
                            <button
                              type="button"
                              onClick={() => {
                                onApplyToSale(voucher.code);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded border border-indigo-200 cursor-pointer"
                              title="Apply this voucher to current POS cart"
                            >
                              Apply to POS
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePrintCertificate(voucher)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                            title="Print 58mm Certificate"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(voucher)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Redemption History Snippet */}
                      {voucher.redemptionHistory && voucher.redemptionHistory.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">Recent Redemptions: </span>
                          {voucher.redemptionHistory.map((rh, idx) => (
                            <span key={idx} className="inline-block mr-2 text-rose-600 font-mono">
                              -₹{rh.amountDeducted} ({rh.date})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

