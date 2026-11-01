import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, StockAuditSession, StockAuditItem, ClothingCategory } from '../../types';
import { playBarcodeBeep } from '../../utils/audio';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';
import {
  ClipboardCheck,
  X,
  Search,
  Camera,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Printer,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Package,
} from 'lucide-react';

interface StockAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUserName: string;
  onSaveAudit: (audit: StockAuditSession) => void;
  onApplyReconciliation: (auditId: string) => { adjustedCount: number; message: string };
}

export const StockAuditModal: React.FC<StockAuditModalProps> = ({
  isOpen,
  onClose,
  products,
  currentUserName,
  onSaveAudit,
  onApplyReconciliation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterMode, setFilterMode] = useState<'all' | 'discrepancy' | 'unscanned'>('all');
  const [scanInput, setScanInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [auditNotes, setAuditNotes] = useState('');
  const [isReconciled, setIsReconciled] = useState(false);
  const [reconcileResultMsg, setReconcileResultMsg] = useState<string | null>(null);

  // Scanned counts map: productId -> physical count
  const [scannedCounts, setScannedCounts] = useState<Record<string, number>>({});
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Initial audit setup
  const auditNumber = useMemo(() => {
    return `AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
  }, []);

  // Filter products by selected category
  const scopedProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Handle Barcode Scan
  const handleBarcodeScanned = (code: string) => {
    const q = code.trim().toLowerCase();
    if (!q) return;

    const matchedProduct = scopedProducts.find(
      (p) => p.barcode.toLowerCase() === q || p.sku.toLowerCase() === q
    );

    if (matchedProduct) {
      playBarcodeBeep();
      setScannedCounts((prev) => {
        const current = prev[matchedProduct.id] ?? 0;
        const next = current + 1;
        setScanFeedback(`+1 Scanned: ${matchedProduct.name} (${matchedProduct.size}) · Count: ${next} / Expected: ${matchedProduct.stock}`);
        return {
          ...prev,
          [matchedProduct.id]: next,
        };
      });
      setScanInput('');
    } else {
      setScanFeedback(`Product with code "${code}" not found in current audit scope.`);
    }
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      handleBarcodeScanned(scanInput.trim());
    }
  };

  const updateCount = (productId: string, delta: number) => {
    setScannedCounts((prev) => {
      const current = prev[productId] ?? 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [productId]: next,
      };
    });
  };

  const setCountDirectly = (productId: string, count: number) => {
    setScannedCounts((prev) => ({
      ...prev,
      [productId]: Math.max(0, count),
    }));
  };

  // Compile full audit items list
  const auditItems: StockAuditItem[] = useMemo(() => {
    return scopedProducts.map((p) => {
      const scannedStock = scannedCounts[p.id] ?? 0;
      const expectedStock = p.stock;
      const variance = scannedStock - expectedStock;
      const unitCost = p.costPrice || 0;
      const costImpact = variance * unitCost;

      return {
        productId: p.id,
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        size: p.size,
        color: p.color,
        expectedStock,
        scannedStock,
        variance,
        unitCost,
        costImpact,
      };
    });
  }, [scopedProducts, scannedCounts]);

  // Filtered rows for the view
  const displayedItems = useMemo(() => {
    if (filterMode === 'discrepancy') {
      return auditItems.filter((i) => i.variance !== 0);
    }
    if (filterMode === 'unscanned') {
      return auditItems.filter((i) => i.scannedStock === 0);
    }
    return auditItems;
  }, [auditItems, filterMode]);

  // Aggregate Metrics
  const summaryMetrics = useMemo(() => {
    let totalExpected = 0;
    let totalScanned = 0;
    let netCostImpact = 0;
    let discrepancyCount = 0;
    let missingUnits = 0;
    let surplusUnits = 0;

    auditItems.forEach((i) => {
      totalExpected += i.expectedStock;
      totalScanned += i.scannedStock;
      netCostImpact += i.costImpact;
      if (i.variance !== 0) discrepancyCount++;
      if (i.variance < 0) missingUnits += Math.abs(i.variance);
      if (i.variance > 0) surplusUnits += i.variance;
    });

    return {
      totalExpected,
      totalScanned,
      netVariance: totalScanned - totalExpected,
      netCostImpact,
      discrepancyCount,
      missingUnits,
      surplusUnits,
    };
  }, [auditItems]);

  const compileAuditSession = (): StockAuditSession => {
    return {
      id: `audit_${Date.now()}`,
      auditNumber,
      date: new Date().toISOString(),
      auditorName: currentUserName,
      categoryFilter: selectedCategory,
      items: auditItems,
      totalExpected: summaryMetrics.totalExpected,
      totalScanned: summaryMetrics.totalScanned,
      netVariance: summaryMetrics.netVariance,
      netCostImpact: summaryMetrics.netCostImpact,
      status: 'draft',
      notes: auditNotes,
    };
  };

  const handleSaveDraft = () => {
    const session = compileAuditSession();
    onSaveAudit(session);
    alert(`Stock Audit #${auditNumber} saved as draft!`);
  };

  const handleConfirmReconciliation = () => {
    if (!confirm(`Are you sure you want to reconcile inventory stock for ${auditItems.length} items? This will set actual stock in your database to match the physical counted scan.`)) {
      return;
    }

    const session = compileAuditSession();
    onSaveAudit(session);
    const result = onApplyReconciliation(session.id);
    setIsReconciled(true);
    setReconcileResultMsg(result.message);
  };

  const handlePrintAuditReport = () => {
    const html = `
      <div class="thermal-receipt-58mm thermal-receipt-50mm thermal-bold">
        <div class="receipt-title">PHYSICAL STOCK AUDIT REPORT</div>
        <div class="receipt-sub">AUDIT #: ${auditNumber}</div>
        <div class="receipt-sub">AUDITOR: ${currentUserName}</div>
        <div class="receipt-sub">DATE: ${new Date().toLocaleDateString('en-IN')}</div>
        <div class="receipt-sub">SCOPE: ${selectedCategory.toUpperCase()}</div>
        <hr />
        <div class="text-[9.5px] font-mono">
          <div>TOTAL EXPECTED: ${summaryMetrics.totalExpected} Units</div>
          <div>TOTAL SCANNED:  ${summaryMetrics.totalScanned} Units</div>
          <div style="font-weight: bold; color: ${summaryMetrics.netVariance < 0 ? '#b91c1c' : '#15803d'}">
            NET VARIANCE:   ${summaryMetrics.netVariance >= 0 ? '+' : ''}${summaryMetrics.netVariance} Units
          </div>
          <div>COST IMPACT:    ₹${summaryMetrics.netCostImpact.toFixed(2)}</div>
          <div>DISCREPANCIES:  ${summaryMetrics.discrepancyCount} SKUs</div>
        </div>
        <hr />
        <div class="text-[9px]">
          <div><strong>VARIANCE DETAILS:</strong></div>
          ${auditItems
            .filter((i) => i.variance !== 0)
            .map(
              (i) => `
            <div style="margin-bottom: 3px;">
              <div>${i.name} (${i.size}/${i.color})</div>
              <div>SKU: ${i.sku}</div>
              <div>Exp: ${i.expectedStock} | Counted: ${i.scannedStock} | Diff: ${i.variance > 0 ? '+' : ''}${i.variance} (₹${i.costImpact})</div>
            </div>
          `
            )
            .join('')}
        </div>
        <hr />
        <div style="text-align: center; font-size: 8px;">VERIFIED & RECONCILED WITH STORE INVENTORY</div>
        <div style="padding-top: 14px; display: flex; justify-content: space-between; font-size: 8px;">
          <div>Auditor: __________</div>
          <div>Manager: __________</div>
        </div>
      </div>
    `;
    printThermalReceiptHtml(html, `Stock-Audit-${auditNumber}`);
  };

  useEffect(() => {
    if (isOpen) {
      scanInputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-600 rounded-lg text-white">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight">Physical Barcode Stock-Take Audit</h3>
                <span className="px-2 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
                  {auditNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Audit sales floor & backroom racks with handheld barcode scanner to detect shrinkage & reconcile inventory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isReconciled ? (
          /* Reconciled Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Inventory Stock Reconciled Successfully!
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {reconcileResultMsg || 'All stock counts have been updated to match your physical audit scans.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintAuditReport}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Audit Slip (58mm)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Top Scanning Control Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Scope selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">Audit Scope:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="All">All Categories ({products.length} Garments)</option>
                    <option value="Men">Men Only</option>
                    <option value="Women">Women Only</option>
                    <option value="Kids">Kids Only</option>
                    <option value="Accessories">Accessories Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Camera Scanner</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintAuditReport}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print Variance</span>
                  </button>
                </div>
              </div>

              {/* Barcode Scanner Input */}
              <form onSubmit={handleManualScanSubmit} className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={scanInputRef}
                  type="text"
                  placeholder="Scan garment barcode or type SKU and press Enter..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  className="w-full pl-9 pr-24 py-2.5 bg-white border-2 border-indigo-500 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Scan
                </button>
              </form>

              {/* Real-time Scan Feedback Pill */}
              {scanFeedback && (
                <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 font-medium animate-in fade-in flex items-center justify-between">
                  <span>{scanFeedback}</span>
                  <button
                    type="button"
                    onClick={() => setScanFeedback(null)}
                    className="text-indigo-400 hover:text-indigo-900 cursor-pointer ml-2"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* KPI Cards Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Expected System Units</span>
                <strong className="text-base font-mono text-slate-900 mt-0.5 block">
                  {summaryMetrics.totalExpected} Pcs
                </strong>
                <span className="text-[10px] text-slate-400">{scopedProducts.length} unique styles</span>
              </div>

              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-200">
                <span className="text-[10px] font-bold uppercase text-indigo-900 block">Physical Scanned Units</span>
                <strong className="text-base font-mono text-indigo-700 mt-0.5 block">
                  {summaryMetrics.totalScanned} Pcs
                </strong>
                <span className="text-[10px] text-indigo-600">Physical count so far</span>
              </div>

              <div className={`p-3 rounded-xl border ${
                summaryMetrics.netVariance < 0
                  ? 'bg-rose-50/50 border-rose-200'
                  : summaryMetrics.netVariance > 0
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-bold uppercase text-slate-600 block">Net Variance (Shrinkage)</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {summaryMetrics.netVariance < 0 ? (
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  ) : summaryMetrics.netVariance > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : null}
                  <strong className={`text-base font-mono font-bold ${
                    summaryMetrics.netVariance < 0
                      ? 'text-rose-600'
                      : summaryMetrics.netVariance > 0
                      ? 'text-emerald-700'
                      : 'text-slate-800'
                  }`}>
                    {summaryMetrics.netVariance >= 0 ? '+' : ''}{summaryMetrics.netVariance} Pcs
                  </strong>
                </div>
                <span className="text-[10px] text-slate-500">
                  {summaryMetrics.missingUnits} missing · {summaryMetrics.surplusUnits} surplus
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Discrepancy Cost Impact</span>
                <strong className={`text-base font-mono mt-0.5 block ${
                  summaryMetrics.netCostImpact < 0
                    ? 'text-rose-600'
                    : summaryMetrics.netCostImpact > 0
                    ? 'text-emerald-700'
                    : 'text-slate-800'
                }`}>
                  ₹{Math.abs(summaryMetrics.netCostImpact).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  {summaryMetrics.netCostImpact < 0 ? ' Loss' : summaryMetrics.netCostImpact > 0 ? ' Gain' : ''}
                </strong>
                <span className="text-[10px] text-slate-400">At weighted cost price</span>
              </div>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Items ({auditItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('discrepancy')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterMode === 'discrepancy'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  Discrepancies Only ({summaryMetrics.discrepancyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('unscanned')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterMode === 'unscanned'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  Unscanned (0 Scanned)
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                Showing {displayedItems.length} of {auditItems.length} products
              </span>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Garment / SKU</th>
                    <th className="py-2.5 px-2">Size / Color</th>
                    <th className="py-2.5 px-3 text-right">System Expected</th>
                    <th className="py-2.5 px-3 text-center w-36">Physical Counted</th>
                    <th className="py-2.5 px-3 text-right">Variance</th>
                    <th className="py-2.5 px-3 text-right">Cost Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {displayedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No items matching current filter.
                      </td>
                    </tr>
                  ) : (
                    displayedItems.map((item) => (
                      <tr
                        key={item.productId}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          item.variance !== 0 ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            <span>{item.sku}</span> · <span>{item.barcode}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">
                              {item.size}
                            </span>
                            <span className="text-slate-600 truncate max-w-[80px]">
                              {item.color}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-semibold">
                          {item.expectedStock}
                        </td>

                        {/* Interactive Counter Controls */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateCount(item.productId, -1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={item.scannedStock}
                              onChange={(e) =>
                                setCountDirectly(item.productId, parseInt(e.target.value) || 0)
                              }
                              className="w-14 px-1 py-0.5 text-center font-mono font-bold text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateCount(item.productId, 1)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Variance Delta */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {item.variance === 0 ? (
                            <span className="text-slate-400">0</span>
                          ) : item.variance < 0 ? (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[11px]">
                              {item.variance}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px]">
                              +{item.variance}
                            </span>
                          )}
                        </td>

                        {/* Cost Impact */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {item.costImpact === 0 ? (
                            <span className="text-slate-400">₹0.00</span>
                          ) : (
                            <span
                              className={
                                item.costImpact < 0 ? 'text-rose-600' : 'text-emerald-700'
                              }
                            >
                              {item.costImpact > 0 ? '+' : ''}₹{item.costImpact.toFixed(2)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Audit Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Audit Notes / Findings (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Rack A-3 complete. Noticed 2 missing linen shirts likely misplaced in alteration rack."
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                Auditor: <strong className="text-slate-900">{currentUserName}</strong> ·{' '}
                <span>{summaryMetrics.discrepancyCount} items will be updated upon reconciliation</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-3.5 py-1.5 font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReconciliation}
                  className="px-4 py-1.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Reconcile Stock</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(code) => {
          handleBarcodeScanned(code);
          setIsCameraOpen(false);
        }}
      />
    </div>
  );
};

