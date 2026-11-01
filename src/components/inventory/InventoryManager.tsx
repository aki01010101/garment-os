import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ClothingCategory, ClothingSize, Season } from '../../types';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  CheckCircle,
  Filter,
  Layers,
  Camera,
  FileSpreadsheet,
  PackageCheck,
  DollarSign,
  CheckSquare,
  Bell,
  Sliders,
  AlertOctagon,
  Grid,
  ClipboardCheck,
} from 'lucide-react';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';
import { BulkUpdateModal } from './BulkUpdateModal';
import { BulkCsvImportModal } from './BulkCsvImportModal';
import { MatrixProductModal } from './MatrixProductModal';
import { StockAuditModal } from './StockAuditModal';
import { BulkProductUpdate, BulkCsvImportRow } from '../../types';

interface InventoryManagerProps {
  onNavigateToTags?: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onNavigateToTags }) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    adjustStock,
    bulkUpdateProducts,
    bulkImportProducts,
    globalLowStockThreshold,
    setGlobalLowStockThreshold,
    currentUser,
    addMatrixProducts,
    saveStockAudit,
    applyStockAuditReconciliation,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  const [scannerTarget, setScannerTarget] = useState<'search' | 'form' | null>(null);

  // Variant Matrix & Stock Audit Modals
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [isStockAuditOpen, setIsStockAuditOpen] = useState(false);

  // Bulk Selection States
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkModalTab, setBulkModalTab] = useState<'stock' | 'price' | 'season'>('stock');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [bulkFeedbackMsg, setBulkFeedbackMsg] = useState<string | null>(null);

  // Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Stock Adjust Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Stock Audit');

  // Form State
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    sku: '',
    barcode: '',
    name: '',
    category: 'Men',
    subCategory: 'Shirts',
    size: 'M',
    color: 'Navy Blue',
    season: 'All-Season',
    costPrice: 500,
    sellingPrice: 1299,
    stock: 10,
    minStockAlert: 4,
    taxRate: 5,
    purchaseSource: 'billed',
    description: '',
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: `VT-GAR-${Date.now().toString().slice(-4)}`,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      name: '',
      category: 'Men',
      subCategory: 'Shirts',
      size: 'M',
      color: 'Black',
      season: 'Summer',
      costPrice: 500,
      sellingPrice: 1299,
      stock: 15,
      minStockAlert: 4,
      taxRate: 5,
      purchaseSource: 'billed',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) return;

    if (editingProduct) {
      updateProduct({ ...formData, id: editingProduct.id });
    } else {
      addProduct(formData);
    }
    setIsModalOpen(false);
  };

  const handleConfirmStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || stockDelta === 0) return;
    adjustStock(adjustingProduct.id, stockDelta, adjustReason);
    setAdjustingProduct(null);
    setStockDelta(0);
  };

  const handleInventoryScan = (code: string) => {
    if (scannerTarget === 'form') {
      setFormData((prev) => ({ ...prev, barcode: code }));
      setScannerTarget(null);
    } else {
      setSearchQuery(code);
      setScannerTarget(null);
    }
  };

  const sampleProductCodes = products.slice(0, 6).map((p) => ({
    label: `${p.name} (${p.size})`,
    code: p.barcode,
    type: 'EAN-13',
  }));

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (filteredProducts.length === 0) return;
    const allSelected = filteredProducts.every((p) => selectedProductIds.has(p.id));
    if (allSelected) {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const selectedProductsList = useMemo(() => {
    return products.filter((p) => selectedProductIds.has(p.id));
  }, [products, selectedProductIds]);

  const handleOpenBulkModal = (tab: 'stock' | 'price' | 'season') => {
    setBulkModalTab(tab);
    setIsBulkModalOpen(true);
  };

  const handleApplyBulkUpdates = (updates: BulkProductUpdate[]) => {
    bulkUpdateProducts(updates);
    setBulkFeedbackMsg(`Successfully updated ${updates.length} garments!`);
    setTimeout(() => setBulkFeedbackMsg(null), 3000);
    setSelectedProductIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedProductIds.size === 0) return;
    if (
      confirm(
        `Are you sure you want to permanently delete ${selectedProductIds.size} selected garments from catalog?`
      )
    ) {
      bulkDeleteProducts(Array.from(selectedProductIds));
      setSelectedProductIds(new Set());
      setBulkFeedbackMsg('Selected garments removed from catalog.');
      setTimeout(() => setBulkFeedbackMsg(null), 3000);
    }
  };

  const handleCsvImportCommit = (rows: BulkCsvImportRow[]) => {
    const result = bulkImportProducts(rows);
    setBulkFeedbackMsg(`CSV Import: ${result.updatedCount} garments updated!`);
    setTimeout(() => setBulkFeedbackMsg(null), 3500);
    return result;
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.color.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;

    let matchStock = true;
    if (stockStatusFilter === 'low') {
      matchStock = p.stock > 0 && p.stock <= globalLowStockThreshold;
    } else if (stockStatusFilter === 'out') {
      matchStock = p.stock === 0;
    }

    return matchSearch && matchCat && matchStock;
  });

  // KPI calculations
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalCostValuation = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= globalLowStockThreshold
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalAlertCount = lowStockCount + outOfStockCount;

  const overallMargin =
    totalRetailValuation > 0
      ? (((totalRetailValuation - totalCostValuation) / totalRetailValuation) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Clothing Catalog & Stock Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock auditing, barcode cataloging, sizing attributes, and inventory valuation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Low Stock Threshold Stepper */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 border border-amber-300 rounded-lg text-xs font-semibold text-amber-950 shadow-xs">
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-bold">Alert Threshold:</span>
            <input
              type="number"
              min={1}
              max={999}
              value={globalLowStockThreshold}
              onChange={(e) => setGlobalLowStockThreshold(parseInt(e.target.value, 10) || 1)}
              className="w-12 text-center py-0.5 px-1 bg-white border border-amber-300 rounded font-bold font-mono text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
              title="Global low stock alert threshold for all apparel"
            />
            <span className="text-[11px] text-amber-700 font-mono">pcs</span>
          </div>

          {/* Stock Audit / Physical Count Button */}
          <button
            onClick={() => setIsStockAuditOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Perform barcode-based physical inventory count and reconcile variance"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Stock Audit</span>
          </button>

          {/* Matrix Variant Generator */}
          <button
            onClick={() => setIsMatrixModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Batch generate size and color variant matrix with automated SKUs and barcodes"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-600" />
            <span>Matrix Variants</span>
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bulk CSV Import</span>
          </button>

          {onNavigateToTags && (
            <button
              onClick={onNavigateToTags}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Price Tags</span>
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Garment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Apparel SKUs
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{products.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Variants & sizes</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Units in Stock
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{totalUnits} pcs</div>
          <div className="text-[10px] text-slate-400 mt-0.5">On floor & backroom</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Stock Valuation (Cost)
          </span>
          <div className="text-xl font-bold font-mono text-indigo-600 mt-1">
            ₹{totalCostValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Wholesale outlay</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Retail Value (MRP)
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            ₹{totalRetailValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{overallMargin}% gross margin</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Low Stock Alerts
          </span>
          <div
            className={`text-xl font-bold font-mono mt-1 ${
              totalAlertCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {totalAlertCount} items
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {outOfStockCount > 0 ? `${outOfStockCount} out of stock` : `Threshold ≤ ${globalLowStockThreshold}`}
          </div>
        </div>
      </div>


      {/* Feedback Toast */}
      {bulkFeedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bulkFeedbackMsg}</span>
          </div>
          <button
            onClick={() => setBulkFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Floating / Sticky Bulk Actions Bar */}
      {selectedProductIds.size > 0 && (
        <div className="bg-slate-900 text-white p-3 sm:p-3.5 rounded-xl shadow-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-mono text-xs text-white">
                {selectedProductIds.size}
              </span>
              <span>items selected for bulk action</span>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
            >
              Deselect all
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenBulkModal('stock')}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-900 hover:bg-indigo-50 hover:text-indigo-900 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Adjust Stock</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBulkModal('price')}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-900 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Update Prices</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBulkModal('season')}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-900 hover:bg-indigo-50 hover:text-indigo-900 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Season Tag</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Low Stock Alert Notification Banner */}
      {totalAlertCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50 border border-amber-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-amber-950 flex items-center gap-2">
                <span>Low Stock Alert Notification</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                  {totalAlertCount} garments affected
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {outOfStockCount > 0 && (
                  <span className="font-bold text-rose-700">{outOfStockCount} out of stock! </span>
                )}
                {lowStockCount > 0 && (
                  <span>
                    {lowStockCount} garments are at or below your store alert threshold of{' '}
                    <strong className="font-mono">{globalLowStockThreshold} pcs</strong>.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                stockStatusFilter === 'low'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100/70'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {stockStatusFilter === 'low'
                  ? 'Clear Filter (Show All)'
                  : `Filter Low Stock (${lowStockCount})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by apparel name, SKU, color, or barcode..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setScannerTarget('search')}
            title="Scan garment price tag to look up inventory"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Tag</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            {['All', 'Men', 'Women', 'Kids', 'Accessories'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="all">All Inventory</option>
            <option value="low">Low Stock (≤ Alert)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 pl-4 pr-1 w-8">
                <input
                  type="checkbox"
                  checked={
                    filteredProducts.length > 0 &&
                    filteredProducts.every((p) => selectedProductIds.has(p.id))
                  }
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                  title="Select all visible garments"
                />
              </th>
              <th className="py-3 px-3">Garment SKU & Name</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Size & Color</th>
              <th className="py-3 px-3 text-right">Cost (₹)</th>
              <th className="py-3 px-3 text-right">MRP (₹)</th>
              <th className="py-3 px-3 text-right">Tax (%)</th>
              <th className="py-3 px-3 text-right">Stock</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((p) => {
              const isLow = p.stock > 0 && p.stock <= globalLowStockThreshold;
              const isOut = p.stock === 0;
              const isSelected = selectedProductIds.has(p.id);

              return (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    isOut
                      ? 'bg-rose-50/40 hover:bg-rose-50/60'
                      : isLow
                      ? 'bg-amber-50/40 hover:bg-amber-50/60'
                      : isSelected
                      ? 'bg-indigo-50/70'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  <td className="py-3 pl-4 pr-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectOne(p.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-slate-700">{p.sku}</span>
                      <span>·</span>
                      <span className="text-[10px] text-slate-400">Barcode: {p.barcode}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800">{p.category}</span>
                    <div className="text-[10px] text-slate-400">{p.subCategory}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded">
                        {p.size}
                      </span>
                      <span className="text-slate-600">{p.color}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{p.season}</div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    ₹{p.costPrice.toFixed(2)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{p.sellingPrice.toFixed(2)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {p.taxRate}%
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertOctagon className="w-3 h-3 text-rose-600" />
                          <span>Out of Stock</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Low: {p.stock} left</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.stock} in stock
                        </span>
                      )}
                      <div className="text-[10px] text-slate-400 font-mono">
                        Alert: ≤{globalLowStockThreshold} pcs
                      </div>
                    </div>
                  </td>


                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setAdjustingProduct(p);
                          setStockDelta(0);
                        }}
                        title="Stock Audit / Adjustment"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        title="Edit Product"
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete garment variant "${p.name} (${p.size})"?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        title="Delete Product"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200 space-y-4 my-6">
            <h3 className="text-sm font-bold text-slate-900">
              {editingProduct ? 'Edit Garment Variant' : 'Add New Apparel Item'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Garment Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Slim-Fit Linen Casual Shirt"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Barcode *</label>
                    <button
                      type="button"
                      onClick={() => setScannerTarget('form')}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Scan with Camera</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ClothingCategory })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Size</label>
                  <select
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value as ClothingSize })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="Free Size">Free Size</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g. Navy Blue"
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sub-Category</label>
                  <input
                    type="text"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    placeholder="e.g. Formal Shirts"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Season</label>
                  <select
                    value={formData.season}
                    onChange={(e) =>
                      setFormData({ ...formData, season: e.target.value as Season })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                    <option value="Festive / Autumn">Festive / Autumn</option>
                    <option value="All-Season">All-Season</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MRP Selling (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  >
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Stock (Pcs)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Low Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Audit / Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Audit Stock: {adjustingProduct.name} ({adjustingProduct.size})
            </h3>
            <div className="text-xs text-slate-500">
              Current recorded stock: <strong className="font-mono text-slate-800">{adjustingProduct.stock} pcs</strong>
            </div>

            <form onSubmit={handleConfirmStockAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Stock Adjustment (+ / - pcs)
                </label>
                <input
                  type="number"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
                  placeholder="e.g. +5 or -2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                />
                <span className="text-[10px] text-slate-400">
                  New Resulting Stock: {Math.max(0, adjustingProduct.stock + stockDelta)} pcs
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Note</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Stock Audit">Physical Stock Audit</option>
                  <option value="Damaged / Stained Piece">Damaged / Stained Piece</option>
                  <option value="Returned to Manufacturer">Returned to Manufacturer</option>
                  <option value="Sample Taken">Display / Floor Sample</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockDelta === 0}
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Update Modal for Selected Items */}
      <BulkUpdateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedProducts={selectedProductsList}
        initialTab={bulkModalTab}
        onApply={handleApplyBulkUpdates}
      />

      {/* Bulk CSV / Spreadsheet Import Modal */}
      <BulkCsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        products={products}
        onImport={handleCsvImportCommit}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={scannerTarget !== null}
        onClose={() => setScannerTarget(null)}
        onScan={handleInventoryScan}
        title={scannerTarget === 'form' ? 'Scan Apparel Barcode for Product Form' : 'Inventory Barcode Stock Lookup'}
        subtitle={
          scannerTarget === 'form'
            ? 'Point camera at garment manufacturer tag or price tag to fill barcode'
            : 'Point camera at any clothing tag to instantly filter stock'
        }
        allowContinuous={false}
        defaultContinuous={false}
        sampleCodes={sampleProductCodes}
      />

      {/* Variant Size x Color Matrix Batch Generator Modal */}
      <MatrixProductModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        onGenerate={(matrix) => {
          const generated = addMatrixProducts(matrix);
          setBulkFeedbackMsg(`Generated ${generated.length} variant SKUs across sizes & colors!`);
          setTimeout(() => setBulkFeedbackMsg(null), 3500);
          return generated;
        }}
        onNavigateToTags={onNavigateToTags}
      />

      {/* Physical Stock Take Barcode Audit Modal */}
      <StockAuditModal
        isOpen={isStockAuditOpen}
        onClose={() => setIsStockAuditOpen(false)}
        products={products}
        currentUserName={currentUser?.fullName || 'Store Manager'}
        onSaveAudit={(audit) => {
          saveStockAudit(audit);
          setBulkFeedbackMsg(`Stock Audit "${audit.sessionName}" saved successfully.`);
          setTimeout(() => setBulkFeedbackMsg(null), 3500);
        }}
        onApplyReconciliation={(auditId) => {
          const result = applyStockAuditReconciliation(auditId);
          setBulkFeedbackMsg(result.message);
          setTimeout(() => setBulkFeedbackMsg(null), 4000);
          return result;
        }}
      />
    </div>
  );
};
