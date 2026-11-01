import React, { useState, useMemo } from 'react';
import { ClothingCategory, ClothingSize, Season, MatrixBatchProductInput, Product } from '../../types';
import {
  Grid,
  X,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  CheckCircle2,
  Tag,
  DollarSign,
  Package,
} from 'lucide-react';

interface MatrixProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (input: MatrixBatchProductInput) => Product[];
  onNavigateToTags?: () => void;
}

const PRESET_SIZE_GROUPS: { label: string; sizes: string[] }[] = [
  { label: 'Standard Adult (S - 3XL)', sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'] },
  { label: 'Collar / Shirt (38 - 44)', sizes: ['38', '39', '40', '42', '44'] },
  { label: 'Waist / Trouser (28 - 40)', sizes: ['28', '30', '32', '34', '36', '38', '40'] },
  { label: 'Kids Age Groups', sizes: ['2-3Y', '3-4Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'] },
  { label: 'One Size', sizes: ['Free Size'] },
];

const PRESET_COLORS = [
  'White',
  'Black',
  'Navy Blue',
  'Sky Blue',
  'Olive Green',
  'Beige',
  'Maroon',
  'Charcoal Grey',
  'Pastel Pink',
  'Mustard Yellow',
  'Wine Red',
  'Emerald Green',
];

export const MatrixProductModal: React.FC<MatrixProductModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  onNavigateToTags,
}) => {
  const [styleName, setStyleName] = useState('');
  const [skuPrefix, setSkuPrefix] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('Men');
  const [subCategory, setSubCategory] = useState('Shirts');
  const [season, setSeason] = useState<Season>('All-Season');
  const [costPrice, setCostPrice] = useState('550');
  const [sellingPrice, setSellingPrice] = useState('1399');
  const [taxRate, setTaxRate] = useState<number>(5);
  const [taxInclusive, setTaxInclusive] = useState<boolean>(true);
  const [purchaseSource, setPurchaseSource] = useState<'billed' | 'cash' | 'mixed'>('billed');
  const [minStockAlert, setMinStockAlert] = useState('4');

  // Selected Variants
  const [selectedColors, setSelectedColors] = useState<string[]>(['White', 'Navy Blue', 'Black']);
  const [customColorInput, setCustomColorInput] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L', 'XL', 'XXL']);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // 2D Grid: key is `${color}__${size}`, value is quantity
  const [grid, setGrid] = useState<Record<string, number>>({});
  const [quickFillQty, setQuickFillQty] = useState('10');
  const [generatedProducts, setGeneratedProducts] = useState<Product[] | null>(null);

  // Auto-generate SKU prefix when style name changes
  const handleStyleNameChange = (val: string) => {
    setStyleName(val);
    if (!skuPrefix || skuPrefix.startsWith('VT-')) {
      const initials = val
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 4)
        .toUpperCase();
      if (initials) {
        setSkuPrefix(`VT-${initials}`);
      }
    }
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const addCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (trimmed && !selectedColors.includes(trimmed)) {
      setSelectedColors((prev) => [...prev, trimmed]);
      setCustomColorInput('');
    }
  };

  const applySizePreset = (sizes: string[]) => {
    setSelectedSizes(sizes);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (trimmed && !selectedSizes.includes(trimmed)) {
      setSelectedSizes((prev) => [...prev, trimmed]);
      setCustomSizeInput('');
    }
  };

  const handleCellChange = (color: string, size: string, qty: number) => {
    const key = `${color}__${size}`;
    setGrid((prev) => ({
      ...prev,
      [key]: Math.max(0, qty),
    }));
  };

  const handleQuickFillAll = () => {
    const qty = parseInt(quickFillQty) || 0;
    const newGrid: Record<string, number> = {};
    selectedColors.forEach((color) => {
      selectedSizes.forEach((size) => {
        newGrid[`${color}__${size}`] = qty;
      });
    });
    setGrid(newGrid);
  };

  const handleQuickFillColorRow = (color: string, qty: number) => {
    setGrid((prev) => {
      const copy = { ...prev };
      selectedSizes.forEach((size) => {
        copy[`${color}__${size}`] = qty;
      });
      return copy;
    });
  };

  // Matrix Stats Computations
  const stats = useMemo(() => {
    const totalVariants = selectedColors.length * selectedSizes.length;
    let totalPieces = 0;
    selectedColors.forEach((color) => {
      selectedSizes.forEach((size) => {
        const qty = grid[`${color}__${size}`] ?? 0;
        totalPieces += qty;
      });
    });

    const unitCost = parseFloat(costPrice) || 0;
    const unitRetail = parseFloat(sellingPrice) || 0;
    const totalCostValue = totalPieces * unitCost;
    const totalRetailValue = totalPieces * unitRetail;

    return {
      totalVariants,
      totalPieces,
      totalCostValue,
      totalRetailValue,
    };
  }, [selectedColors, selectedSizes, grid, costPrice, sellingPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleName.trim() || !skuPrefix.trim()) return;
    if (selectedColors.length === 0 || selectedSizes.length === 0) return;

    const input: MatrixBatchProductInput = {
      styleName: styleName.trim(),
      skuPrefix: skuPrefix.trim().toUpperCase(),
      category,
      subCategory: subCategory.trim(),
      season,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      taxRate,
      taxInclusive,
      purchaseSource,
      minStockAlert: parseInt(minStockAlert) || 4,
      colors: selectedColors,
      sizes: selectedSizes,
      grid,
    };

    const created = onGenerate(input);
    setGeneratedProducts(created);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-600 rounded-lg text-white">
              <Grid className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Apparel Size × Color Matrix Generator</h3>
              <p className="text-[11px] text-slate-400">
                Batch generate 20+ SKU & barcode variants from a single style master in seconds
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
        {generatedProducts ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Successfully Generated {generatedProducts.length} Garment SKUs!
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All color and size combinations have been cataloged with unique barcodes, initial inventory stock, and pricing.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-lg mx-auto text-left text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Master Style:</span>
                <strong className="text-slate-900">{styleName}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Pieces Added:</span>
                <strong className="text-indigo-700">{stats.totalPieces} Units</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Colors & Sizes:</span>
                <span>{selectedColors.length} Colors × {selectedSizes.length} Sizes</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Retail Valuation:</span>
                <strong className="text-emerald-700">₹{stats.totalRetailValue.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {onNavigateToTags && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTags();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Tag className="w-4 h-4" />
                  <span>Print Barcode Price Tags (58mm) →</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close & View Inventory
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 1. Master Style Metadata */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Package className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Master Style Information
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Garment / Style Master Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pure Linen Mandarin Collar Shirt"
                    value={styleName}
                    onChange={(e) => handleStyleNameChange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Base SKU Prefix *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VT-PLN-SHR"
                    value={skuPrefix}
                    onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs uppercase font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ClothingCategory)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sub-Category</label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="e.g. Formal Shirts"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Season</label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value as Season)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                    <option value="Festive / Autumn">Festive / Autumn</option>
                    <option value="All-Season">All-Season</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Stock Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cost Price (Per Piece ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Selling Price / MRP (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">GST Tax Rate</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  >
                    <option value={5}>5% (Garments ≤ ₹1,000)</option>
                    <option value={12}>12% (Garments &gt; ₹1,000)</option>
                    <option value={18}>18% (Accessories / Bags)</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rate Tax Mode</label>
                  <select
                    value={taxInclusive ? 'inclusive' : 'exclusive'}
                    onChange={(e) => setTaxInclusive(e.target.value === 'inclusive')}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="inclusive">GST Included (MRP)</option>
                    <option value="exclusive">GST Added Separately</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Color Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Select Colors ({selectedColors.length} chosen)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Custom color..."
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomColor();
                      }
                    }}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md w-32"
                  />
                  <button
                    type="button"
                    onClick={addCustomColor}
                    className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((color) => {
                  const isSelected = selectedColors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Size Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Select Sizes ({selectedSizes.length} chosen)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Custom size..."
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSize();
                      }
                    }}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md w-28 uppercase"
                  />
                  <button
                    type="button"
                    onClick={addCustomSize}
                    className="px-2 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Preset Size Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span className="text-[10px] font-bold uppercase">Presets:</span>
                {PRESET_SIZE_GROUPS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applySizePreset(preset.sizes)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedSizes.map((size) => (
                  <span
                    key={size}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-md text-xs font-bold font-mono flex items-center gap-1.5"
                  >
                    <span>{size}</span>
                    <button
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="text-indigo-400 hover:text-indigo-900 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Interactive 2D Matrix Grid */}
            {selectedColors.length > 0 && selectedSizes.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      4. Stock Quantity Matrix ({selectedColors.length} Colors × {selectedSizes.length} Sizes = {stats.totalVariants} SKUs)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Enter quantity per variant or use Quick Fill to pre-populate common quantities.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">Quick Fill:</span>
                    <input
                      type="number"
                      min="0"
                      value={quickFillQty}
                      onChange={(e) => setQuickFillQty(e.target.value)}
                      className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-center"
                    />
                    <button
                      type="button"
                      onClick={handleQuickFillAll}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded cursor-pointer"
                    >
                      Fill All Cells
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-36">Color</th>
                        {selectedSizes.map((size) => (
                          <th key={size} className="py-2.5 px-2 text-center font-mono">
                            {size}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-right">Row Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {selectedColors.map((color) => {
                        let colorRowTotal = 0;
                        selectedSizes.forEach((size) => {
                          colorRowTotal += grid[`${color}__${size}`] ?? 0;
                        });

                        return (
                          <tr key={color} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">{color}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickFillColorRow(color, parseInt(quickFillQty) || 0)
                                  }
                                  className="text-[10px] text-indigo-600 hover:underline cursor-pointer"
                                  title={`Fill entire ${color} row with ${quickFillQty}`}
                                >
                                  Fill Row
                                </button>
                              </div>
                            </td>
                            {selectedSizes.map((size) => {
                              const key = `${color}__${size}`;
                              const val = grid[key] !== undefined ? grid[key] : '';
                              return (
                                <td key={size} className="py-2 px-1 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={val}
                                    onChange={(e) =>
                                      handleCellChange(
                                        color,
                                        size,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-16 px-1.5 py-1 text-center font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  />
                                </td>
                              );
                            })}
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {colorRowTotal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                      <tr>
                        <td className="py-2.5 px-3 text-slate-700">Column Totals:</td>
                        {selectedSizes.map((size) => {
                          let colTotal = 0;
                          selectedColors.forEach((color) => {
                            colTotal += grid[`${color}__${size}`] ?? 0;
                          });
                          return (
                            <td key={size} className="py-2.5 px-1 text-center font-mono text-slate-900">
                              {colTotal}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-indigo-700">
                          {stats.totalPieces} Pcs
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Summary Strip & Actions */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">New SKUs:</span>
                  <strong className="text-slate-900 text-sm font-mono">{stats.totalVariants}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Total Units:</span>
                  <strong className="text-indigo-700 text-sm font-mono">{stats.totalPieces}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Cost Value:</span>
                  <strong className="text-slate-900 text-sm font-mono">
                    ₹{stats.totalCostValue.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">MRP Retail Value:</span>
                  <strong className="text-emerald-700 text-sm font-mono">
                    ₹{stats.totalRetailValue.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!styleName.trim() || stats.totalVariants === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate & Save {stats.totalVariants} Variants</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

