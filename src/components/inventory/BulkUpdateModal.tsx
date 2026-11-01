import React, { useState, useMemo } from 'react';
import { Product, Season } from '../../types';
import {
  X,
  Layers,
  TrendingUp,
  Percent,
  Plus,
  Minus,
  Check,
  AlertCircle,
  ArrowRight,
  PackageCheck,
  DollarSign,
} from 'lucide-react';

export interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  initialTab?: 'stock' | 'price' | 'season';
  onApply: (
    updates: Array<{
      id: string;
      stockDelta?: number;
      newStock?: number;
      priceDeltaPercent?: number;
      priceDeltaFlat?: number;
      newPrice?: number;
      newCostPrice?: number;
      season?: Season;
    }>
  ) => void;
}

export const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  initialTab = 'stock',
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'price' | 'season'>(initialTab);

  // Stock update state
  const [stockMode, setStockMode] = useState<'delta' | 'exact'>('delta');
  const [stockDeltaValue, setStockDeltaValue] = useState<number>(5);
  const [stockExactValue, setStockExactValue] = useState<number>(20);

  // Price update state
  const [priceMode, setPriceMode] = useState<'percent' | 'flat' | 'exact'>('percent');
  const [pricePercentValue, setPricePercentValue] = useState<number>(10);
  const [priceFlatValue, setPriceFlatValue] = useState<number>(100);
  const [priceExactValue, setPriceExactValue] = useState<number>(1499);
  const [alsoAdjustCost, setAlsoAdjustCost] = useState<boolean>(false);
  const [costPercentValue, setCostPercentValue] = useState<number>(5);

  // Season state
  const [selectedSeason, setSelectedSeason] = useState<Season>('Summer');

  // Compute live preview of changes
  const previewItems = useMemo(() => {
    return selectedProducts.map((p) => {
      // Stock calculations
      let updatedStock = p.stock;
      if (activeTab === 'stock') {
        if (stockMode === 'delta') {
          updatedStock = Math.max(0, p.stock + stockDeltaValue);
        } else {
          updatedStock = Math.max(0, stockExactValue);
        }
      }

      // Price calculations
      let updatedPrice = p.sellingPrice;
      let updatedCost = p.costPrice;
      if (activeTab === 'price') {
        if (priceMode === 'percent') {
          updatedPrice = Math.max(0, Math.round(p.sellingPrice * (1 + pricePercentValue / 100)));
        } else if (priceMode === 'flat') {
          updatedPrice = Math.max(0, p.sellingPrice + priceFlatValue);
        } else {
          updatedPrice = Math.max(0, priceExactValue);
        }

        if (alsoAdjustCost) {
          updatedCost = Math.max(0, Math.round(p.costPrice * (1 + costPercentValue / 100)));
        }
      }

      const updatedSeason = activeTab === 'season' ? selectedSeason : p.season;

      return {
        product: p,
        updatedStock,
        updatedPrice,
        updatedCost,
        updatedSeason,
      };
    });
  }, [
    selectedProducts,
    activeTab,
    stockMode,
    stockDeltaValue,
    stockExactValue,
    priceMode,
    pricePercentValue,
    priceFlatValue,
    priceExactValue,
    alsoAdjustCost,
    costPercentValue,
    selectedSeason,
  ]);

  const handleSave = () => {
    const updates = previewItems.map((item) => {
      if (activeTab === 'stock') {
        return {
          id: item.product.id,
          stockDelta: stockMode === 'delta' ? stockDeltaValue : undefined,
          newStock: stockMode === 'exact' ? stockExactValue : undefined,
        };
      } else if (activeTab === 'price') {
        return {
          id: item.product.id,
          priceDeltaPercent: priceMode === 'percent' ? pricePercentValue : undefined,
          priceDeltaFlat: priceMode === 'flat' ? priceFlatValue : undefined,
          newPrice: priceMode === 'exact' ? priceExactValue : undefined,
          newCostPrice: alsoAdjustCost ? item.updatedCost : undefined,
        };
      } else {
        return {
          id: item.product.id,
          season: selectedSeason,
        };
      }
    });

    onApply(updates);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Bulk Update Inventory</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {selectedProducts.length} items selected
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Apply batch stock adjustments, price changes, or seasonal updates simultaneously
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 px-5 pt-3 bg-slate-50 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stock'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>1. Stock Quantities</span>
          </button>
          <button
            onClick={() => setActiveTab('price')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'price'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>2. Selling Prices (MRP)</span>
          </button>
          <button
            onClick={() => setActiveTab('season')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'season'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Season Collection</span>
          </button>
        </div>

        {/* Configuration Controls Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: STOCK UPDATE */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Update Mode:</label>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setStockMode('delta')}
                    className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                      stockMode === 'delta'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Add / Deduct Relative (+ / -)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockMode('exact')}
                    className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                      stockMode === 'exact'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Set Fixed Stock Level
                  </button>
                </div>
              </div>

              {stockMode === 'delta' ? (
                <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-indigo-950">
                    Adjust all {selectedProducts.length} items by:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={stockDeltaValue}
                      onChange={(e) => setStockDeltaValue(parseInt(e.target.value) || 0)}
                      className="w-24 px-3 py-1 text-xs bg-white border border-indigo-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-500">pcs per garment</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {[5, 10, 20, -2, -5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStockDeltaValue(val)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-indigo-100 border border-indigo-200 text-[11px] font-mono text-indigo-800 cursor-pointer"
                      >
                        {val > 0 ? `+${val}` : val}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 flex items-center gap-3">
                  <span className="text-xs font-medium text-indigo-950">
                    Set fixed stock for all items to:
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={stockExactValue}
                    onChange={(e) => setStockExactValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-28 px-3 py-1 text-xs bg-white border border-indigo-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-500">pcs in inventory</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRICE UPDATE */}
          {activeTab === 'price' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Price Adjustment Mode:</label>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setPriceMode('percent')}
                    className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                      priceMode === 'percent'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Percentage (+ / - %)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceMode('flat')}
                    className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                      priceMode === 'flat'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Flat Amount (+ / - ₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceMode('exact')}
                    className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                      priceMode === 'exact'
                        ? 'bg-white text-indigo-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Set Fixed MRP (₹)
                  </button>
                </div>
              </div>

              {priceMode === 'percent' && (
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-emerald-950">
                    Adjust MRP prices by percentage:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={pricePercentValue}
                      onChange={(e) => setPricePercentValue(parseFloat(e.target.value) || 0)}
                      className="w-24 px-3 py-1 text-xs bg-white border border-emerald-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-800">%</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {[5, 10, 15, -10, -20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPricePercentValue(pct)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 border border-emerald-200 text-[11px] font-mono text-emerald-800 cursor-pointer"
                      >
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {priceMode === 'flat' && (
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <span className="text-xs font-medium text-emerald-950">
                    Adjust MRP by flat rupee amount:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-900">₹</span>
                    <input
                      type="number"
                      value={priceFlatValue}
                      onChange={(e) => setPriceFlatValue(parseFloat(e.target.value) || 0)}
                      className="w-28 px-3 py-1 text-xs bg-white border border-emerald-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {priceMode === 'exact' && (
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
                  <span className="text-xs font-medium text-emerald-950">
                    Set all selected garments MRP to:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-900">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={priceExactValue}
                      onChange={(e) => setPriceExactValue(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-28 px-3 py-1 text-xs bg-white border border-emerald-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEASON UPDATE */}
          {activeTab === 'season' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Assign Season Tag to all {selectedProducts.length} garments:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Summer', 'Winter', 'Festive / Autumn', 'All-Season'] as Season[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSeason(s)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                      selectedSeason === s
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Changes Preview Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
            <div className="px-3.5 py-2 bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
              <span>Preview of Changes ({previewItems.length} items):</span>
              <span className="text-[11px] font-normal text-slate-500">
                Green indicates updated values
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Garment / SKU</th>
                    <th className="py-2 px-3">Size / Color</th>
                    <th className="py-2 px-3 text-right">Stock</th>
                    <th className="py-2 px-3 text-right">Selling MRP</th>
                    <th className="py-2 px-3 text-center">Season</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewItems.map(({ product, updatedStock, updatedPrice, updatedSeason }) => {
                    const stockChanged = updatedStock !== product.stock;
                    const priceChanged = updatedPrice !== product.sellingPrice;
                    const seasonChanged = updatedSeason !== product.season;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                            {product.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">{product.sku}</div>
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {product.size} · {product.color}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {stockChanged ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              {product.stock} → {updatedStock}
                            </span>
                          ) : (
                            <span className="text-slate-600">{product.stock} pcs</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {priceChanged ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              ₹{product.sellingPrice} → ₹{updatedPrice}
                            </span>
                          ) : (
                            <span className="text-slate-600">₹{product.sellingPrice}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center text-[11px]">
                          {seasonChanged ? (
                            <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                              {updatedSeason}
                            </span>
                          ) : (
                            <span className="text-slate-500">{product.season}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Applying batch changes to <strong>{selectedProducts.length}</strong> apparel items.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Updates ({selectedProducts.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
