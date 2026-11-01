import React, { useState, useEffect } from 'react';
import { Customer, SaleTransaction } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  computeCustomerSpendMetrics,
  getCustomerPurchases,
  buildCustomerWhatsAppSummary,
} from '../../utils/crmUtils';
import {
  X,
  Printer,
  Search,
  Building2,
  Calendar,
  CreditCard,
  ShoppingBag,
  Sparkles,
  Phone,
  Mail,
  Crown,
  ChevronRight,
  Share2,
  CheckCircle2,
  Tag,
  Scissors,
  ExternalLink,
} from 'lucide-react';

interface CustomerPurchasesModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerPurchasesModal: React.FC<CustomerPurchasesModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const { sales, companies, loyaltyConfig, setActiveReceipt, setIsReceiptModalOpen } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !customer) return null;

  const threshold = loyaltyConfig.vipMonthlyThreshold || 5000;
  const metrics = computeCustomerSpendMetrics(customer, sales, threshold);
  const allPurchases = getCustomerPurchases(customer, sales);

  // Filter purchases by search query and company entity
  const filteredPurchases = allPurchases.filter((s) => {
    const matchesEntity = selectedEntity === 'all' || s.companyId === selectedEntity;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesEntity;

    const matchesInvoice = s.invoiceNumber.toLowerCase().includes(q);
    const matchesDate = s.date.includes(q);
    const matchesItems = s.items.some(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q)
    );
    return matchesEntity && (matchesInvoice || matchesDate || matchesItems);
  });

  const handleOpenReceipt = (sale: SaleTransaction) => {
    setActiveReceipt(sale);
    setIsReceiptModalOpen(true);
  };

  const handleShareWhatsApp = (sale?: SaleTransaction) => {
    let url = '';
    if (sale) {
      const itemsList = sale.items.map((i) => `• ${i.name} (${i.size}, ${i.color}) x${i.qty} = ₹${i.total.toFixed(0)}`).join('\n');
      const text = `*Invoice ${sale.invoiceNumber} - ${sale.companyName}*\nDate: ${new Date(sale.date).toLocaleDateString('en-IN')}\nCustomer: ${sale.customerName}\n\n*Items Purchased:*\n${itemsList}\n\n*Net Total: ₹${sale.grandTotal.toFixed(2)}* (${sale.paymentMode})\nThank you for shopping at Garment OS!`;
      url = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(text)}`;
    } else {
      url = `https://wa.me/91${customer.phone}?text=${buildCustomerWhatsAppSummary(customer, metrics)}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md shrink-0">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{customer.name}</h3>
                {metrics.isVip ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm ring-1 ring-amber-300">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span>VIP Client</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    Regular Member
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1.5 font-mono">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  +91 {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1 font-sans">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {customer.email}
                  </span>
                )}
                <span className="text-slate-400">·</span>
                <span className="text-slate-300">
                  Member since {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShareWhatsApp()}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              title="Share purchase statement on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Statement</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Spend & VIP Tier Strip */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Monthly Spend & VIP Status */}
            <div
              className={`p-3 rounded-xl border col-span-2 sm:col-span-2 ${
                metrics.isVip
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                <span className="flex items-center gap-1">
                  <Crown className={`w-3.5 h-3.5 ${metrics.isVip ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
                  <span>Monthly Spend ({metrics.monthLabel})</span>
                </span>
                <span className="font-mono font-bold text-xs">
                  ₹{metrics.monthlySpend.toLocaleString('en-IN')} / ₹{threshold.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden my-1.5">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    metrics.isVip ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${metrics.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px]">
                {metrics.isVip ? (
                  <span className="font-bold text-amber-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                    <span>👑 VIP Status Achieved (Above ₹5,000 threshold)</span>
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">
                    ₹{metrics.remainingForVip.toLocaleString('en-IN')} more needed to unlock VIP tier this month
                  </span>
                )}
                <span className="font-mono font-bold text-slate-700">{metrics.progressPercent}%</span>
              </div>
            </div>

            {/* Lifetime Spend */}
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Lifetime Spend
              </div>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                ₹{metrics.lifetimeSpend.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Avg ₹{metrics.averageOrderValue.toLocaleString('en-IN')}/bill
              </div>
            </div>

            {/* Orders & Garments */}
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Purchase Volume
              </div>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">
                {metrics.totalOrders} Orders
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {metrics.totalGarments} total garments
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Loyalty Points</span>
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-base font-bold font-mono text-indigo-700 mt-1">
                {customer.loyaltyPoints} pts
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                ₹{customer.loyaltyPoints * loyaltyConfig.pointRedemptionValue} bill credit
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, garment name, SKU, or color..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs self-start sm:self-auto">
            <span className="text-[10px] text-slate-400 font-semibold px-1.5">Entity:</span>
            <button
              onClick={() => setSelectedEntity('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                selectedEntity === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Invoices ({allPurchases.length})
            </button>
            {companies.map((c) => {
              const count = allPurchases.filter((s) => s.companyId === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedEntity(c.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    selectedEntity === c.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c.name.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Invoices List Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-100/60">
          {filteredPurchases.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-700">No purchases found</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No bills match "${searchQuery}". Try clearing search or changing entity filter.`
                  : 'This customer has not made any purchases yet.'}
              </p>
            </div>
          ) : (
            filteredPurchases.map((sale) => {
              const isExpanded = expandedInvoiceId === sale.id;
              const formattedDate = new Date(sale.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const formattedTime = new Date(sale.date).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const totalItems = sale.items.reduce((acc, item) => acc + item.qty, 0);

              return (
                <div
                  key={sale.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Invoice Header Strip */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {sale.invoiceNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {sale.companyName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sale.paymentMode === 'Cash'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sale.paymentMode === 'UPI'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {sale.paymentMode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                        <span className="flex items-center gap-1 font-sans">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate} at {formattedTime}
                        </span>
                        <span>·</span>
                        <span className="font-sans font-medium text-slate-600">
                          {totalItems} {totalItems === 1 ? 'garment' : 'garments'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-slate-900">
                          ₹{sale.grandTotal.toFixed(2)}
                        </div>
                        {sale.itemDiscountsTotal > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Saved ₹{sale.itemDiscountsTotal.toFixed(0)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleShareWhatsApp(sale)}
                          className="p-2 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 border border-slate-200 transition-colors"
                          title="Share Invoice on WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenReceipt(sale)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200"
                          title="Print 58mm Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Receipt</span>
                        </button>

                        <button
                          onClick={() =>
                            setExpandedInvoiceId(isExpanded ? null : sale.id)
                          }
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                          title={isExpanded ? 'Collapse details' : 'Expand garments'}
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Garment Details Breakdown */}
                  <div className="p-4 bg-slate-50/50">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Purchased Garments ({sale.items.length} line items)
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase">
                            <th className="pb-1.5 font-bold">Garment Item</th>
                            <th className="pb-1.5">Size / Color</th>
                            <th className="pb-1.5">SKU / Barcode</th>
                            <th className="pb-1.5 text-center">Qty</th>
                            <th className="pb-1.5 text-right">Price</th>
                            <th className="pb-1.5 text-right">Discount</th>
                            <th className="pb-1.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {sale.items.map((item, idx) => (
                            <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-100/60">
                              <td className="py-2 pr-2 font-medium text-slate-900">
                                <div>{item.name}</div>
                                {item.alteration && (
                                  <div className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5">
                                    <Scissors className="w-3 h-3 text-amber-600" />
                                    <span>
                                      Tailoring: {item.alteration.notes || 'Alteration requested'}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 pr-2">
                                <span className="font-semibold text-slate-800">{item.size}</span>
                                <span className="text-slate-400"> · </span>
                                <span className="text-slate-600">{item.color}</span>
                              </td>
                              <td className="py-2 pr-2 font-mono text-[11px] text-slate-500">
                                {item.sku}
                              </td>
                              <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                                {item.qty}
                              </td>
                              <td className="py-2 px-2 text-right font-mono">
                                ₹{item.unitPrice.toFixed(0)}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-emerald-700">
                                {item.discountAmount > 0 ? `-₹${item.discountAmount.toFixed(0)}` : '—'}
                              </td>
                              <td className="py-2 pl-2 text-right font-mono font-bold text-slate-900">
                                ₹{item.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Summary */}
                    <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                        <span>Subtotal: ₹{sale.subtotal.toFixed(2)}</span>
                        {sale.couponDiscountAmount && sale.couponDiscountAmount > 0 ? (
                          <span className="text-emerald-700">
                            Coupon ({sale.couponCodeApplied}): -₹{sale.couponDiscountAmount.toFixed(2)}
                          </span>
                        ) : null}
                        {sale.creditNoteDiscountAmount && sale.creditNoteDiscountAmount > 0 ? (
                          <span className="text-purple-700">
                            Credit Note: -₹{sale.creditNoteDiscountAmount.toFixed(2)}
                          </span>
                        ) : null}
                        {sale.loyaltyDiscountAmount > 0 && (
                          <span className="text-indigo-700">
                            Loyalty Redeemed: -₹{sale.loyaltyDiscountAmount.toFixed(2)} ({sale.loyaltyPointsUsed} pts)
                          </span>
                        )}
                        {sale.taxTotal > 0 && <span>GST: ₹{sale.taxTotal.toFixed(2)}</span>}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="font-semibold text-slate-500">Net Payable:</span>
                        <span className="font-mono font-black text-sm text-slate-950">
                          ₹{sale.grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Showing {filteredPurchases.length} recorded purchases for {customer.name}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
