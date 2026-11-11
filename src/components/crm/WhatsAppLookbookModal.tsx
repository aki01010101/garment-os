import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Customer } from '../../types';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  BookOpen,
  Share2,
  Copy,
  Printer,
  X,
  Check,
  Search,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Send,
  Phone,
} from 'lucide-react';

interface WhatsAppLookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCustomer?: Customer | null;
}

export const WhatsAppLookbookModal: React.FC<WhatsAppLookbookModalProps> = ({
  isOpen,
  onClose,
  targetCustomer,
}) => {
  const { products, activeCompany, customers, storeGoogleReviewUrl } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    return products.slice(0, 5).map((p) => p.id);
  });

  const [campaignTitle, setCampaignTitle] = useState('✨ EXCLUSIVE NEW ARRIVALS COLLECTION ✨');
  const [customPromoNote, setCustomPromoNote] = useState('🎁 Mention this WhatsApp message in-store to receive a flat 10% Welcome Discount!');
  const [recipientPhone, setRecipientPhone] = useState(targetCustomer?.phone || '');
  const [copied, setCopied] = useState(false);

  // Sync recipient phone if target customer changes
  React.useEffect(() => {
    if (targetCustomer?.phone) {
      setRecipientPhone(targetCustomer.phone);
    }
  }, [targetCustomer]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredProducts.map((p) => p.id);
    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearSelection = () => {
    setSelectedProductIds([]);
  };

  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  // Generate WhatsApp formatted text
  const lookbookText = useMemo(() => {
    const storeName = activeCompany?.name || 'FANTASY OUTFITS';
    const storePhone = activeCompany?.phone || '+91 94161 09928';
    const storeAddress = activeCompany?.address || 'Purshottam Market, Karnal';

    let msg = `🛍️ *${storeName.toUpperCase()}*\n`;
    msg += `${campaignTitle}\n`;
    msg += `--------------------------------\n\n`;

    if (selectedProducts.length === 0) {
      msg += `(No garments currently selected)\n\n`;
    } else {
      selectedProducts.forEach((p, idx) => {
        msg += `${idx + 1}. *${p.name}*\n`;
        msg += `   👗 *Category:* ${p.category}${p.subCategory ? ` · ${p.subCategory}` : ''}\n`;
        msg += `   📏 *Size:* ${p.size}  |  🎨 *Color:* ${p.color}\n`;
        msg += `   💰 *Price:* ₹${p.sellingPrice.toLocaleString('en-IN')} (Incl. of all taxes)\n`;
        msg += `   🏷️ *Article SKU:* ${p.sku}\n\n`;
      });
    }

    if (customPromoNote.trim()) {
      msg += `--------------------------------\n`;
      msg += `${customPromoNote.trim()}\n`;
      msg += `--------------------------------\n\n`;
    }

    msg += `📍 *Visit Our Boutique:*\n${storeAddress}\n`;
    msg += `📞 *Order / Fitting Query:* ${storePhone}\n\n`;
    msg += `💬 *Reply directly to this WhatsApp message to reserve your size before stocks run out!*`;

    return msg;
  }, [campaignTitle, selectedProducts, customPromoNote, activeCompany]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(lookbookText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : '';
    const textEncoded = encodeURIComponent(lookbookText);
    const url = phoneParam
      ? `https://wa.me/${phoneParam}?text=${textEncoded}`
      : `https://api.whatsapp.com/send?text=${textEncoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrintLookbookSlip = () => {
    const html = `
      <div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.3;">
        <div style="text-align: center; font-weight: bold; font-size: 13px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
          ${activeCompany?.name || 'FANTASY OUTFITS'}<br/>
          <span style="font-size: 10px; font-weight: normal;">NEW ARRIVALS LOOKBOOK MEMO</span>
        </div>
        <div style="margin: 6px 0; font-size: 10px;">
          Tel: ${activeCompany?.phone || ''}<br/>
          Date: ${new Date().toLocaleDateString('en-IN')}
        </div>
        <div style="border-top: 1px dashed #000; padding-top: 4px;">
          ${selectedProducts
            .map(
              (p, i) => `
            <div style="margin-bottom: 4px;">
              <b>${i + 1}. ${p.name}</b><br/>
              Size: ${p.size} · Color: ${p.color} · SKU: ${p.sku}<br/>
              <b>Price: Rs. ${p.sellingPrice}</b>
            </div>
          `
            )
            .join('')}
        </div>
        <div style="border-top: 1px dashed #000; padding-top: 4px; text-align: center; font-size: 9px;">
          Reserve items at counter or via WhatsApp.<br/>
          Thank you for visiting!
        </div>
      </div>
    `;
    printThermalReceiptHtml(html, false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/40 rounded-xl text-white">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <span>WhatsApp Interactive Lookbook & Catalog</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 font-bold">
                  {selectedProducts.length} Items Selected
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                Broadcast curated new arrivals, prices, and sizes directly to customer WhatsApp.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg text-emerald-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          {/* Left Column (7 cols): Catalog Selector & Settings */}
          <div className="lg:col-span-7 p-4 border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto space-y-4">
            {/* Headline & Offer Banner Customization */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Campaign Headline:
                </label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Promotional Incentive / Welcome Note:
                </label>
                <input
                  type="text"
                  value={customPromoNote}
                  onChange={(e) => setCustomPromoNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Product Picker Header */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search garments to add to Lookbook..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={selectAllFiltered}
                    className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer"
                  >
                    Select All ({filteredProducts.length})
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Categories Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap text-xs font-semibold cursor-pointer transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelectProduct(p.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.category} · {p.color}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 font-mono">
                        <span className="font-bold text-emerald-800">₹{p.sellingPrice}</span>
                        <span className="text-[10px] px-1 rounded bg-slate-100 text-slate-700 font-bold">
                          {p.size}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (5 cols): WhatsApp Message Preview & Broadcast Action */}
          <div className="lg:col-span-5 p-4 bg-slate-100/90 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Live Preview</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {selectedProducts.length} garments included
              </span>
            </div>

            {/* Chat Bubble Box */}
            <div className="bg-[#e5ddd5] p-3 rounded-2xl border border-slate-300 flex-1 overflow-y-auto max-h-[380px] shadow-inner font-sans text-xs">
              <div className="bg-white p-3 rounded-xl rounded-tl-xs shadow-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text font-mono text-[11px]">
                {lookbookText}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-3 space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Recipient WhatsApp # (optional)..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintLookbookSlip}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Print 58mm customer selection memo"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>58mm Slip</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
