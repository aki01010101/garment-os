import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Vendor, PurchaseOrder, PurchaseItem } from '../../types';
import {
  TrendingUp,
  AlertCircle,
  X,
  Truck,
  Package,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface RestockPrediction {
  product: Product;
  unitsSold14d: number;
  dailyRunRate: number;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'healthy';
  suggestedReorderQty: number;
  estimatedReorderCost: number;
  matchedVendor?: Vendor;
}

interface SmartRestockPredictorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVendorPO?: () => void;
}

export const SmartRestockPredictorModal: React.FC<SmartRestockPredictorModalProps> = ({
  isOpen,
  onClose,
  onOpenVendorPO,
}) => {
  const { products, sales, vendors, recordPurchaseOrder, activeCompany } = useApp();

  const [leadTimeDays, setLeadTimeDays] = useState<number>(5);
  const [safetyBufferDays, setSafetyBufferDays] = useState<number>(3);
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'critical' | 'warning'>('all');
  const [poCreatedMsg, setPoCreatedMsg] = useState<string | null>(null);

  // Compute 14-day velocity and days of inventory
  const predictions: RestockPrediction[] = useMemo(() => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const salesCountMap: Record<string, number> = {};

    sales.forEach((s) => {
      const saleTime = new Date(s.date).getTime();
      if (saleTime >= fourteenDaysAgo) {
        s.items.forEach((item) => {
          salesCountMap[item.productId] = (salesCountMap[item.productId] || 0) + item.qty;
        });
      }
    });

    const thresholdDays = leadTimeDays + safetyBufferDays;
    const list: RestockPrediction[] = [];

    products.forEach((p) => {
      const sold14d = salesCountMap[p.id] || 0;
      const dailyRunRate = sold14d / 14;

      // Only analyze items that sell or have low stock alert
      if (dailyRunRate > 0 || p.stock <= p.minStockAlert) {
        const effectiveRate = dailyRunRate > 0 ? dailyRunRate : 0.2;
        const daysRemaining = Math.round(p.stock / effectiveRate);

        let urgency: 'critical' | 'warning' | 'healthy' = 'healthy';
        if (daysRemaining <= 3 || p.stock === 0) {
          urgency = 'critical';
        } else if (daysRemaining <= thresholdDays) {
          urgency = 'warning';
        }

        // Suggested reorder: 14 days of sales or min 12 pcs
        const suggestedReorderQty = Math.max(12, Math.ceil(effectiveRate * 14));
        const estimatedReorderCost = suggestedReorderQty * p.costPrice;

        // Match vendor by brand or first available
        const matchedVendor =
          vendors.find((v) => p.brand && v.name.toLowerCase().includes(p.brand.toLowerCase())) ||
          vendors[0];

        list.push({
          product: p,
          unitsSold14d: sold14d,
          dailyRunRate,
          daysRemaining,
          urgency,
          suggestedReorderQty,
          estimatedReorderCost,
          matchedVendor,
        });
      }
    });

    // Sort by most urgent (lowest days remaining)
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [products, sales, vendors, leadTimeDays, safetyBufferDays]);

  if (!isOpen) return null;

  const criticalCount = predictions.filter((p) => p.urgency === 'critical').length;
  const warningCount = predictions.filter((p) => p.urgency === 'warning').length;

  const filteredPredictions = predictions.filter((p) => {
    if (filterUrgency === 'critical') return p.urgency === 'critical';
    if (filterUrgency === 'warning') return p.urgency === 'warning' || p.urgency === 'critical';
    return true;
  });

  // 1-Click Draft Purchase Order for urgent items
  const handleDraftPurchaseOrder = (vendor: Vendor, itemsToOrder: RestockPrediction[]) => {
    const poItems: PurchaseItem[] = itemsToOrder.map((pred) => ({
      productId: pred.product.id,
      productName: pred.product.name,
      sku: pred.product.sku,
      category: pred.product.category,
      size: pred.product.size,
      color: pred.product.color,
      qty: pred.suggestedReorderQty,
      costPrice: pred.product.costPrice,
      total: pred.suggestedReorderQty * pred.product.costPrice,
    }));

    const subtotal = poItems.reduce((acc, i) => acc + i.total, 0);
    const taxRate = itemsToOrder[0]?.product.taxRate || 5;
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount;

    recordPurchaseOrder({
      vendorId: vendor.id,
      vendorName: vendor.name,
      companyId: activeCompany.id,
      companyName: activeCompany.name,
      purchaseType: 'billed',
      billOrVoucherNumber: `PO-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      items: poItems,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount: grandTotal,
      paidAmount: 0,
      paymentStatus: 'unpaid',
      paymentMode: 'Bank Transfer',
      notes: `Smart Restock Engine automated purchase order (${itemsToOrder.length} urgent styles)`,
    });

    setPoCreatedMsg(`Purchase Order generated for ${vendor.name} (${poItems.length} lines, ₹${grandTotal.toLocaleString('en-IN')})`);
    setTimeout(() => setPoCreatedMsg(null), 4000);
  };

  // 1-Tap WhatsApp Restock Memo to Vendor
  const handleSendVendorWhatsApp = (vendor: Vendor, itemsToOrder: RestockPrediction[]) => {
    const text =
      `*RESTOCK REORDER REQUEST - ${activeCompany.name}*\n` +
      `Supplier: ${vendor.name}\n` +
      `Urgent reorder items for immediate dispatch:\n` +
      `---------------------------\n` +
      itemsToOrder
        .map(
          (p) =>
            `• ${p.product.name} (Size: ${p.product.size}, Color: ${p.product.color}) - *${p.suggestedReorderQty} pcs* @ approx Rs. ${p.product.costPrice}`
        )
        .join('\n') +
      `\n---------------------------\n` +
      `Kindly confirm dispatch date & delivery tracking. Thank you!`;

    window.open(`https://wa.me/91${vendor.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Smart Restock Prediction Engine
                <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-semibold">
                  {criticalCount} Critical Stockouts
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                AI run-rate velocity forecasting based on 14-day sales trends to prevent stockouts of popular sizes before weekend rush.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Time & Filter Controls */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Supplier Lead Time:</span>
              <select
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value))}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
              >
                <option value={3}>3 Days (Local / Delhi)</option>
                <option value={5}>5 Days (Surat / Ludhiana)</option>
                <option value={8}>8 Days (Tirupur / Mumbai)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Safety Buffer:</span>
              <select
                value={safetyBufferDays}
                onChange={(e) => setSafetyBufferDays(parseInt(e.target.value))}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
              >
                <option value={2}>2 Days</option>
                <option value={3}>3 Days (Standard)</option>
                <option value={5}>5 Days (Festive Peak)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterUrgency('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterUrgency === 'all'
                  ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tracked ({predictions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterUrgency('critical')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filterUrgency === 'critical'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Critical ({criticalCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterUrgency('warning')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                filterUrgency === 'warning'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Need Reorder ({criticalCount + warningCount})</span>
            </button>
          </div>
        </div>

        {poCreatedMsg && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{poCreatedMsg}</span>
          </div>
        )}

        {/* Predictions Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Garment Style</th>
                    <th className="py-2.5 px-3">Size & Color</th>
                    <th className="py-2.5 px-3 text-center">Current Stock</th>
                    <th className="py-2.5 px-3 text-center">14d Sales Rate</th>
                    <th className="py-2.5 px-3 text-center">Days Remaining</th>
                    <th className="py-2.5 px-3 text-center">Suggested PO</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPredictions.map((pred) => (
                    <tr
                      key={pred.product.id}
                      className={`hover:bg-slate-50/80 ${
                        pred.urgency === 'critical' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {pred.product.name}
                        <div className="text-[10px] text-slate-400 font-mono">{pred.product.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="font-bold">{pred.product.size}</span> · {pred.product.color}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span
                          className={
                            pred.product.stock <= pred.product.minStockAlert
                              ? 'text-rose-600'
                              : 'text-slate-800'
                          }
                        >
                          {pred.product.stock} pcs
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {pred.unitsSold14d} pcs ({pred.dailyRunRate.toFixed(1)}/day)
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pred.daysRemaining <= 3
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : pred.daysRemaining <= 8
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {pred.daysRemaining <= 0
                            ? 'OUT OF STOCK'
                            : `${pred.daysRemaining} days left`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                        +{pred.suggestedReorderQty} pcs
                        <div className="text-[10px] text-slate-400 font-normal">
                          ₹{pred.estimatedReorderCost.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {pred.matchedVendor ? (
                          <span>{pred.matchedVendor.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">No vendor mapped</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {pred.matchedVendor && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDraftPurchaseOrder(pred.matchedVendor!, [pred])}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded border border-indigo-200 cursor-pointer"
                              title="Draft Purchase Order"
                            >
                              Draft PO
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendVendorWhatsApp(pred.matchedVendor!, [pred])}
                              className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                              title="Send Restock WhatsApp Memo"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Total {criticalCount} styles require immediate reordering to avoid weekend stockout.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

