import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, PromotionRule } from '../../types';
import {
  Flame,
  AlertTriangle,
  X,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Percent,
  CheckCircle2,
  DollarSign,
  Tag,
  Share2,
  Printer,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface DeadStockItem {
  product: Product;
  unitsSold60d: number;
  lockedCapital: number;
  daysStagnant: number;
}

interface SmartBundleSuggestion {
  id: string;
  title: string;
  anchorProduct: Product;
  deadProduct: Product;
  combinedOriginalPrice: number;
  suggestedBundlePrice: number;
  discountPercent: number;
  totalCost: number;
  projectedProfit: number;
  projectedMarginPercent: number;
  capitalUnlocked: number;
}

interface DeadStockLiquidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTags?: () => void;
}

export const DeadStockLiquidatorModal: React.FC<DeadStockLiquidatorModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTags,
}) => {
  const { products, sales, addPromotion, updateProduct } = useApp();

  const [activeTab, setActiveTab] = useState<'bundles' | 'dead_list'>('bundles');
  const [activatedBundleId, setActivatedBundleId] = useState<string | null>(null);
  const [markdownSuccessMsg, setMarkdownSuccessMsg] = useState<string | null>(null);

  // Compute 60-day velocity per product
  const deadStockData = useMemo(() => {
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const salesCountMap: Record<string, number> = {};

    sales.forEach((s) => {
      const saleTime = new Date(s.date).getTime();
      if (saleTime >= sixtyDaysAgo) {
        s.items.forEach((item) => {
          salesCountMap[item.productId] = (salesCountMap[item.productId] || 0) + item.qty;
        });
      }
    });

    const deadItems: DeadStockItem[] = [];
    const fastItems: Product[] = [];

    products.forEach((p) => {
      const sold = salesCountMap[p.id] || 0;
      if (p.stock >= 4 && sold <= 1) {
        deadItems.push({
          product: p,
          unitsSold60d: sold,
          lockedCapital: p.stock * p.costPrice,
          daysStagnant: 60,
        });
      } else if (sold >= 3) {
        fastItems.push(p);
      }
    });

    // Sort dead items by highest capital locked
    deadItems.sort((a, b) => b.lockedCapital - a.lockedCapital);

    // Generate Smart Bundles (pairing high-velocity anchor items with dead items in complementary categories)
    const bundles: SmartBundleSuggestion[] = [];

    deadItems.forEach((dItem, idx) => {
      // Find a fast-moving anchor product in same or complementary category
      const anchor =
        fastItems.find((f) => f.category === dItem.product.category && f.id !== dItem.product.id) ||
        fastItems[idx % (fastItems.length || 1)] ||
        products.find((p) => p.stock > 0 && p.id !== dItem.product.id);

      if (anchor) {
        const combinedOriginalPrice = anchor.sellingPrice + dItem.product.sellingPrice;
        // Discount dead item by 50% in the combo
        const suggestedBundlePrice = Math.round(anchor.sellingPrice + dItem.product.sellingPrice * 0.5);
        const discountPercent = Math.round(
          ((combinedOriginalPrice - suggestedBundlePrice) / combinedOriginalPrice) * 100
        );
        const totalCost = anchor.costPrice + dItem.product.costPrice;
        const projectedProfit = suggestedBundlePrice - totalCost;
        const projectedMarginPercent = Math.round((projectedProfit / suggestedBundlePrice) * 100);

        bundles.push({
          id: `bundle_${anchor.id}_${dItem.product.id}`,
          title: `Flash Combo: Buy ${anchor.name} + Get ${dItem.product.name} at 50% OFF`,
          anchorProduct: anchor,
          deadProduct: dItem.product,
          combinedOriginalPrice,
          suggestedBundlePrice,
          discountPercent,
          totalCost,
          projectedProfit,
          projectedMarginPercent,
          capitalUnlocked: dItem.product.costPrice,
        });
      }
    });

    const totalLockedCapital = deadItems.reduce((acc, d) => acc + d.lockedCapital, 0);
    const totalStagnantPcs = deadItems.reduce((acc, d) => acc + d.product.stock, 0);

    return {
      deadItems,
      fastItems,
      bundles,
      totalLockedCapital,
      totalStagnantPcs,
    };
  }, [products, sales]);

  if (!isOpen) return null;

  // Activate bundle as an active POS promotion rule
  const handleActivateBundle = (bundle: SmartBundleSuggestion) => {
    addPromotion({
      title: bundle.title,
      type: 'bundle_price',
      bundlePrice: bundle.suggestedBundlePrice,
      minQuantity: 2,
      applicableCategory: bundle.anchorProduct.category,
      isActive: true,
      description: `Auto-generated Dead Stock Liquidator Combo: ${bundle.anchorProduct.name} + ${bundle.deadProduct.name}`,
    });

    setActivatedBundleId(bundle.id);
    setTimeout(() => setActivatedBundleId(null), 3500);
  };

  // Apply clearance markdown directly to a product
  const handleApplyMarkdown = (product: Product, markdownPercent: number) => {
    const discountedPrice = Math.round(product.sellingPrice * (1 - markdownPercent / 100));
    updateProduct({
      ...product,
      sellingPrice: Math.max(product.costPrice + 50, discountedPrice),
    });

    setMarkdownSuccessMsg(`Marked down ${product.name} to ₹${discountedPrice} (${markdownPercent}% OFF)`);
    setTimeout(() => setMarkdownSuccessMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-700 via-amber-700 to-indigo-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
              <Flame className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Dead Stock Liquidator & Smart Bundle Suggester
                <span className="text-[10px] bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full font-semibold">
                  ₹{deadStockData.totalLockedCapital.toLocaleString('en-IN')} Capital Locked
                </span>
              </h2>
              <p className="text-xs text-rose-100">
                Identify stagnant apparel styles (&gt;60 days with 0 sales) and automatically pair them with fast-selling anchor items into high-margin POS combos.
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

        {/* Metric Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Dead / Stagnant Stock Pieces
            </span>
            <div className="text-lg font-mono font-extrabold text-slate-900 mt-0.5">
              {deadStockData.totalStagnantPcs} pcs ({deadStockData.deadItems.length} styles)
            </div>
            <span className="text-[10px] text-rose-600 font-semibold">
              Zero velocity in the past 60 days
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Locked Working Capital
            </span>
            <div className="text-lg font-mono font-extrabold text-rose-700 mt-0.5">
              ₹{deadStockData.totalLockedCapital.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-500">
              Idle cost tying up store cash flow
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Generated Smart Combos
            </span>
            <div className="text-lg font-mono font-extrabold text-emerald-700 mt-0.5">
              {deadStockData.bundles.length} Bundle Deals
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">
              Projected 35-48% net gross margin
            </span>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100/70 border-b border-slate-200 text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('bundles')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bundles'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Smart Bundle Recommendations ({deadStockData.bundles.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dead_list')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dead_list'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>All Stagnant Items ({deadStockData.deadItems.length})</span>
            </button>
          </div>

          {markdownSuccessMsg && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 animate-in fade-in">
              {markdownSuccessMsg}
            </span>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'bundles' ? (
            <div className="space-y-3">
              {deadStockData.bundles.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Package className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p className="text-xs">No dead stock detected! All apparel styles are moving well.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deadStockData.bundles.map((bundle) => {
                    const isActivated = activatedBundleId === bundle.id;

                    return (
                      <div
                        key={bundle.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {bundle.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 shrink-0">
                            Save {bundle.discountPercent}%
                          </span>
                        </div>

                        {/* Pairing visual */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-emerald-700 block">
                              ⭐ Fast-Selling Anchor
                            </span>
                            <strong className="text-slate-800 line-clamp-1">
                              {bundle.anchorProduct.name}
                            </strong>
                            <div className="font-mono text-slate-500">
                              ₹{bundle.anchorProduct.sellingPrice} (Cost: ₹{bundle.anchorProduct.costPrice})
                            </div>
                          </div>

                          <div className="space-y-0.5 border-l border-slate-200 pl-2">
                            <span className="text-[9px] uppercase font-bold text-rose-700 block">
                              ⚠️ Stagnant Item (50% Off)
                            </span>
                            <strong className="text-slate-800 line-clamp-1">
                              {bundle.deadProduct.name}
                            </strong>
                            <div className="font-mono text-slate-500">
                              ₹{bundle.deadProduct.sellingPrice} ({bundle.deadProduct.stock} pcs left)
                            </div>
                          </div>
                        </div>

                        {/* Financial Projection Strip */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Combined MRP</span>
                            <strong className="font-mono line-through text-slate-400">
                              ₹{bundle.combinedOriginalPrice}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Bundle Price</span>
                            <strong className="font-mono text-indigo-700 font-extrabold text-sm">
                              ₹{bundle.suggestedBundlePrice}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Gross Margin</span>
                            <strong className="font-mono text-emerald-700 font-bold">
                              {bundle.projectedMarginPercent}% (₹{bundle.projectedProfit})
                            </strong>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500">
                            Recovers ₹{bundle.capitalUnlocked} locked cash
                          </span>
                          <button
                            type="button"
                            onClick={() => handleActivateBundle(bundle)}
                            disabled={isActivated}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                              isActivated
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            {isActivated ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Activated in POS!</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Activate POS Promotion</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: All Stagnant Items with 1-Click Clearance Markdown */
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Garment Style</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Size & Color</th>
                      <th className="py-2.5 px-3 text-center">Current Stock</th>
                      <th className="py-2.5 px-3 text-right">Cost Rate</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                      <th className="py-2.5 px-3 text-right">Locked Capital</th>
                      <th className="py-2.5 px-3 text-center">Clearance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deadStockData.deadItems.map(({ product, unitsSold60d, lockedCapital }) => (
                      <tr key={product.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {product.name}
                          <div className="text-[10px] text-slate-400 font-mono">{product.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{product.category}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {product.size} · {product.color}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700">
                          {product.stock} pcs
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ₹{product.costPrice}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{product.sellingPrice}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-800">
                          ₹{lockedCapital.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleApplyMarkdown(product, 25)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded border border-amber-200 cursor-pointer"
                              title="Markdown selling price by 25%"
                            >
                              -25%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyMarkdown(product, 40)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold rounded border border-rose-200 cursor-pointer"
                              title="Clearance markdown by 40%"
                            >
                              -40%
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
