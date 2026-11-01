import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PromotionRule, PromotionType, ClothingCategory } from '../../types';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  ShoppingBag,
  Percent,
  Layers,
  ArrowRight,
  Gift,
  HelpCircle,
} from 'lucide-react';

const CATEGORIES: (ClothingCategory | 'ALL')[] = ['ALL', 'Men', 'Women', 'Kids', 'Accessories'];

export const PromotionsManager: React.FC = () => {
  const { promotions, addPromotion, updatePromotion, deletePromotion, togglePromotion } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionRule | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PromotionType>('bogo');
  const [applicableCategory, setApplicableCategory] = useState<ClothingCategory | 'ALL'>('ALL');
  const [minQuantity, setMinQuantity] = useState<number>(3);
  const [freeQuantity, setFreeQuantity] = useState<number>(1);
  const [bundlePrice, setBundlePrice] = useState<number>(1499);
  const [minCartAmount, setMinCartAmount] = useState<number>(3000);
  const [slabType, setSlabType] = useState<'flat' | 'percent'>('flat');
  const [slabDiscountValue, setSlabDiscountValue] = useState<number>(500);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setTitle('');
    setType('bogo');
    setApplicableCategory('ALL');
    setMinQuantity(3);
    setFreeQuantity(1);
    setBundlePrice(1499);
    setMinCartAmount(3000);
    setSlabType('flat');
    setSlabDiscountValue(500);
    setDescription('Buy 2 garments and get the 3rd one (lowest price) completely free!');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: PromotionRule) => {
    setEditingPromo(rule);
    setTitle(rule.title);
    setType(rule.type);
    setApplicableCategory(rule.applicableCategory || 'ALL');
    setMinQuantity(rule.minQuantity || 3);
    setFreeQuantity(rule.freeQuantity || 1);
    setBundlePrice(rule.bundlePrice || 1499);
    setMinCartAmount(rule.minCartAmount || 3000);
    if (rule.slabDiscountPercent) {
      setSlabType('percent');
      setSlabDiscountValue(rule.slabDiscountPercent);
    } else {
      setSlabType('flat');
      setSlabDiscountValue(rule.slabDiscountAmount || 500);
    }
    setDescription(rule.description);
    setIsActive(rule.isActive);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (presetKey: 'bogo' | 'slab500' | 'bundle' | 'slab15') => {
    if (presetKey === 'bogo') {
      setTitle('Buy 2 Get 1 Free (All Apparel)');
      setType('bogo');
      setApplicableCategory('ALL');
      setMinQuantity(3);
      setFreeQuantity(1);
      setDescription('Buy 2 items, get the 3rd (lowest priced piece) free.');
    } else if (presetKey === 'slab500') {
      setTitle('Weekend Fest: ₹500 Off on ₹3,000+');
      setType('cart_slab');
      setApplicableCategory('ALL');
      setMinCartAmount(3000);
      setSlabType('flat');
      setSlabDiscountValue(500);
      setDescription('Get flat ₹500 instant discount on cart bills of ₹3,000 or above.');
    } else if (presetKey === 'bundle') {
      setTitle('Any 2 Men Shirts for ₹1,499');
      setType('bundle_price');
      setApplicableCategory('Men');
      setMinQuantity(2);
      setBundlePrice(1499);
      setDescription('Select any 2 Men shirts and pay a fixed combo price of ₹1,499.');
    } else if (presetKey === 'slab15') {
      setTitle('Mega Cart: 15% Off on ₹5,000+');
      setType('cart_slab');
      setApplicableCategory('ALL');
      setMinCartAmount(5000);
      setSlabType('percent');
      setSlabDiscountValue(15);
      setDescription('Enjoy 15% savings across the bill on shopping over ₹5,000.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide an offer title.');
      return;
    }

    const promoData: Omit<PromotionRule, 'id'> = {
      title: title.trim(),
      type,
      isActive,
      applicableCategory: applicableCategory === 'ALL' ? undefined : applicableCategory,
      description: description.trim() || title.trim(),
      ...(type === 'bogo' ? { minQuantity, freeQuantity } : {}),
      ...(type === 'bundle_price' ? { minQuantity, bundlePrice } : {}),
      ...(type === 'cart_slab'
        ? {
            minCartAmount,
            slabDiscountAmount: slabType === 'flat' ? slabDiscountValue : undefined,
            slabDiscountPercent: slabType === 'percent' ? slabDiscountValue : undefined,
          }
        : {}),
    };

    if (editingPromo) {
      updatePromotion({ ...promoData, id: editingPromo.id });
      showToast(`Promotion "${title}" updated!`);
    } else {
      addPromotion(promoData);
      showToast(`New offer "${title}" created and activated!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove promotion offer "${name}"?`)) {
      deletePromotion(id);
      showToast(`Promotion "${name}" deleted.`);
    }
  };

  // KPIs
  const totalOffers = promotions.length;
  const activeOffers = promotions.filter((p) => p.isActive).length;
  const bogoCount = promotions.filter((p) => p.type === 'bogo').length;
  const cartSlabCount = promotions.filter((p) => p.type === 'cart_slab').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl shadow-xs animate-in fade-in flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </span>
          <button onClick={() => setFeedbackMsg(null)} className="text-[11px] underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Quick Create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <span>Automated Retail Promotions & Deals Engine</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Set up BOGO deals, cart slab discounts, and bundle combos that automatically evaluate and apply during POS billing.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion Offer</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Configured Rules</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{totalOffers}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Automated offers</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active at Register</span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">{activeOffers}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Evaluating in POS</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">BOGO Rules</span>
          <div className="text-xl font-bold font-mono text-indigo-600 mt-1">{bogoCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Buy X Get Y Free</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cart Slabs & Bundles</span>
          <div className="text-xl font-bold font-mono text-purple-600 mt-1">{cartSlabCount + (totalOffers - bogoCount - cartSlabCount)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Spend thresholds & combos</div>
        </div>
      </div>

      {/* Promotions List */}
      <div className="space-y-3">
        {promotions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Promotions Created Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Boost your store sales velocity by creating automated Buy 2 Get 1 Free offers or cart spend slabs.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
            >
              + Create First Promotion
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {promotions.map((promo) => {
              const isBogo = promo.type === 'bogo';
              const isCartSlab = promo.type === 'cart_slab';
              const isBundle = promo.type === 'bundle_price';

              return (
                <div
                  key={promo.id}
                  className={`bg-white rounded-xl border p-4 transition-all flex flex-col justify-between shadow-xs ${
                    promo.isActive
                      ? 'border-emerald-300 ring-1 ring-emerald-500/10'
                      : 'border-slate-200 opacity-70 bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Type & Status Switch */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isBogo
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isCartSlab
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {isBogo ? 'BOGO' : isCartSlab ? 'Cart Slab' : 'Bundle Combo'}
                        </span>

                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {promo.applicableCategory ? `${promo.applicableCategory} Only` : 'All Apparel'}
                        </span>
                      </div>

                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => togglePromotion(promo.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          promo.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title={promo.isActive ? 'Click to Pause this Offer' : 'Click to Activate this Offer'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            promo.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span>{promo.isActive ? 'Active' : 'Paused'}</span>
                      </button>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{promo.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{promo.description}</p>
                    </div>

                    {/* Formula / Rule Details Tag */}
                    <div className="p-2 bg-slate-50 rounded-lg text-xs font-mono border border-slate-100 text-slate-700 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        {isBogo &&
                          `Buy ${promo.minQuantity! - promo.freeQuantity!} Get ${promo.freeQuantity!} Free (${promo.minQuantity} items in set, lowest piece 100% off)`}
                        {isCartSlab &&
                          `Min Cart: ₹${promo.minCartAmount?.toLocaleString('en-IN')} → ${
                            promo.slabDiscountAmount
                              ? `Flat ₹${promo.slabDiscountAmount} Off`
                              : `${promo.slabDiscountPercent}% Off Entire Bill`
                          }`}
                        {isBundle &&
                          `Any ${promo.minQuantity} items for flat ₹${promo.bundlePrice?.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {promo.id}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(promo)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Offer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id, promo.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Offer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Promotion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>{editingPromo ? 'Edit Promotion Offer' : 'Create New Promotional Offer'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure automated rule parameters for POS cart calculation.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Presets Quick Strip */}
              {!editingPromo && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Preset Templates:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('bogo')}
                      className="px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-semibold cursor-pointer text-[11px]"
                    >
                      Buy 2 Get 1 Free
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('slab500')}
                      className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold cursor-pointer text-[11px]"
                    >
                      ₹500 Off on ₹3k+
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('bundle')}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold cursor-pointer text-[11px]"
                    >
                      2 Men Shirts for ₹1,499
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('slab15')}
                      className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold cursor-pointer text-[11px]"
                    >
                      15% Off on ₹5k+
                    </button>
                  </div>
                </div>
              )}

              {/* Offer Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Offer Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Buy 2 Get 1 Free - Summer Special"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Type Switcher Tabs */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Promotion Rule Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('bogo')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      type === 'bogo'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Gift className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span>BOGO Deal</span>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Buy X Get Y Free</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('cart_slab')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      type === 'cart_slab'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span>Cart Slab</span>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Spend ₹X get ₹Y/% off</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('bundle_price')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      type === 'bundle_price'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span>Bundle Combo</span>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">Any X for fixed ₹Y</div>
                  </button>
                </div>
              </div>

              {/* Target Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicable Category</label>
                <select
                  value={applicableCategory}
                  onChange={(e) => setApplicableCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Apparel (Storewide)</option>
                  <option value="Men">Men Only</option>
                  <option value="Women">Women Only</option>
                  <option value="Kids">Kids Only</option>
                  <option value="Accessories">Accessories Only</option>
                </select>
              </div>

              {/* Type Specific Fields */}
              {type === 'bogo' && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3">
                  <span className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-purple-700" />
                    <span>BOGO Rule Parameters</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Total Pieces in Set</label>
                      <input
                        type="number"
                        min={2}
                        max={20}
                        required
                        value={minQuantity}
                        onChange={(e) => setMinQuantity(parseInt(e.target.value, 10) || 2)}
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500">e.g. 3 for "Buy 2 Get 1"</span>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Number of Free Pieces</label>
                      <input
                        type="number"
                        min={1}
                        max={minQuantity - 1}
                        required
                        value={freeQuantity}
                        onChange={(e) => setFreeQuantity(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500">Free items per set (lowest price)</span>
                    </div>
                  </div>
                </div>
              )}

              {type === 'cart_slab' && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-amber-700" />
                    <span>Cart Slab Parameters</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Min Cart Value (₹)</label>
                      <input
                        type="number"
                        min={100}
                        step={100}
                        required
                        value={minCartAmount}
                        onChange={(e) => setMinCartAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                      <select
                        value={slabType}
                        onChange={(e) => setSlabType(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg font-semibold"
                      >
                        <option value="flat">Flat ₹ Discount</option>
                        <option value="percent">% Percentage Off</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {slabType === 'flat' ? 'Discount (₹)' : 'Discount (%)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={slabDiscountValue}
                        onChange={(e) => setSlabDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {type === 'bundle_price' && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
                  <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-700" />
                    <span>Bundle Combo Parameters</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Required Quantity</label>
                      <input
                        type="number"
                        min={2}
                        max={10}
                        required
                        value={minQuantity}
                        onChange={(e) => setMinQuantity(parseInt(e.target.value, 10) || 2)}
                        className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500">e.g. Any 2 items</span>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Combo Bundle Price (₹)</label>
                      <input
                        type="number"
                        min={100}
                        step={50}
                        required
                        value={bundlePrice}
                        onChange={(e) => setBundlePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500">Total charge for the set</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer & Cashier Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explains what this offer provides..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Active Toggle Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="font-bold text-slate-800">Activate this offer immediately at POS checkout</span>
              </label>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingPromo ? 'Save Changes' : 'Create & Activate Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

