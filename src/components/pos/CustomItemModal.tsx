import React, { useState, useEffect, useRef } from 'react';
import { ClothingCategory, ClothingSize } from '../../types';
import {
  X,
  PlusCircle,
  Tag,
  Sparkles,
  Scissors,
  Gift,
  Check,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CustomItemPayload {
  name: string;
  salePrice: number;
  quantity: number;
  category: ClothingCategory;
  size: ClothingSize;
  saveToCatalog?: boolean;
}

interface CustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onAddCustomItem: (item: CustomItemPayload) => void;
}

const COMMON_PRESETS = [
  { name: 'Alteration Charge', price: 150, icon: Scissors },
  { name: 'Stitching Fee', price: 350, icon: Scissors },
  { name: 'Custom Kurti', price: 799, icon: Sparkles },
  { name: 'Matching Dupatta', price: 299, icon: Tag },
  { name: 'Gift Box / Packing', price: 50, icon: Gift },
  { name: 'Sample Scarf', price: 199, icon: Tag },
];

const PRICE_SHORTCUTS = [50, 100, 150, 200, 350, 500, 750, 1000];

export const CustomItemModal: React.FC<CustomItemModalProps> = ({
  isOpen,
  onClose,
  initialName = '',
  onAddCustomItem,
}) => {
  const [name, setName] = useState(initialName);
  const [salePrice, setSalePrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [category, setCategory] = useState<ClothingCategory>('Accessories');
  const [size, setSize] = useState<ClothingSize>('Free Size');
  const [saveToCatalog, setSaveToCatalog] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setSalePrice('');
      setQuantity(1);
      setCategory('Accessories');
      setSize('Free Size');
      setSaveToCatalog(false);
      setShowMoreOptions(false);

      // Focus management: if initialName is provided, focus price; otherwise focus name
      setTimeout(() => {
        if (initialName.trim()) {
          priceInputRef.current?.focus();
          priceInputRef.current?.select();
        } else {
          nameInputRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const parsedPrice = parseFloat(salePrice) || 0;
  const isValid = name.trim().length > 0 && parsedPrice > 0;

  const handleSubmit = (andAnother = false) => {
    if (!isValid) return;

    onAddCustomItem({
      name: name.trim(),
      salePrice: parsedPrice,
      quantity: Math.max(1, quantity),
      category,
      size,
      saveToCatalog,
    });

    if (andAnother) {
      setName('');
      setSalePrice('');
      setQuantity(1);
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } else {
      onClose();
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (name.trim()) {
        priceInputRef.current?.focus();
      }
    }
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isValid) {
        handleSubmit(false);
      }
    }
  };

  const applyPreset = (presetName: string, presetPrice: number) => {
    setName(presetName);
    setSalePrice(presetPrice.toString());
    setTimeout(() => priceInputRef.current?.focus(), 50);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <PlusCircle className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">Add Custom Item</h3>
                <span className="text-[10px] font-mono bg-white/20 text-white font-bold px-1.5 py-0.2 rounded">
                  F7
                </span>
              </div>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                Quick billing with just item name &amp; sale price
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Quick Presets Strip */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Suggestions:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset.name, preset.price)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Icon className="w-3 h-3 text-slate-400" />
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      ₹{preset.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields: Item Name & Price */}
          <div className="space-y-3 pt-1">
            {/* Item Name */}
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                <span>Item / Service Name <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">Press Enter to jump to price</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleNameKeyDown}
                placeholder="e.g. Alteration Charge, Custom Kurti, Matching Scarf..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Sale Price & Quantity in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Sale Price (2 cols) */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                  <span>Sale Price (₹) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Net selling price</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    min="0"
                    step="any"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    onKeyDown={handlePriceKeyDown}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 text-base font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Quick Price Buttons */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {PRICE_SHORTCUTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSalePrice(amt.toString());
                        priceInputRef.current?.focus();
                      }}
                      className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity (1 col) */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Quantity
                </label>
                <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 overflow-hidden h-[42px]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center font-mono font-bold text-sm bg-transparent focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[10px] text-right font-mono text-slate-500 mt-1">
                  Total: ₹{(parsedPrice * quantity).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Collapsible More Options */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-2">
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Optional Details (Size, Category, Catalog)</span>
                {showMoreOptions ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showMoreOptions && (
                <div className="p-3 bg-white space-y-3 border-t border-slate-200 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Category */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ClothingCategory)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
                      >
                        <option value="Accessories">Accessories</option>
                        <option value="Women">Women</option>
                        <option value="Men">Men</option>
                        <option value="Kids">Kids</option>
                      </select>
                    </div>

                    {/* Size */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Size
                      </label>
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="Free Size, S, M, L..."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Save to Inventory Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveToCatalog}
                      onChange={(e) => setSaveToCatalog(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium">
                      Also save this item to Product Catalog for future barcodes / scans
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Cancel (Esc)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isValid}
              onClick={() => handleSubmit(true)}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add &amp; Another
            </button>
            <button
              type="button"
              disabled={!isValid}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Add to Cart (Enter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

