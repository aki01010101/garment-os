import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Company, CompanyType } from '../../types';
import {
  Building2,
  Plus,
  Edit2,
  ShieldCheck,
  DollarSign,
  Check,
  Phone,
  MapPin,
  Receipt,
  X,
  Sparkles,
  Star,
  Hash,
  FileText,
  Palette,
  Layers,
  HelpCircle,
  Save,
  CheckCircle2,
} from 'lucide-react';

const ACCENT_COLOR_PRESETS = [
  { label: 'Indigo', hex: '#4f46e5' },
  { label: 'Violet', hex: '#7c3aed' },
  { label: 'Rose', hex: '#e11d48' },
  { label: 'Emerald', hex: '#059669' },
  { label: 'Amber', hex: '#d97706' },
  { label: 'Cyan', hex: '#0891b2' },
  { label: 'Slate', hex: '#1e293b' },
];

const RETURN_POLICY_PRESETS = [
  'Exchange within 7 days with original bill & price tag intact.',
  'Exchange within 14 days. No refunds on discounted/sale items.',
  'Store credit voucher issued for returned items within 7 days.',
  'No cash refunds. Exchange allowed for size or style within 7 days.',
];

export const CompanySettings: React.FC = () => {
  const { companies, updateCompany, addCompany, activeCompanyId, setActiveCompanyId } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [formData, setFormData] = useState<Omit<Company, 'id'>>({
    name: '',
    legalName: '',
    type: 'billed',
    taxId: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    invoicePrefix: 'INV-',
    currentInvoiceNumber: 1001,
    returnPolicy: 'Goods once sold can be exchanged within 7 days with original invoice.',
    accentColor: '#4f46e5',
    tagline: 'Retail Clothing Outlet',
    enableDynamicGarmentGst: true,
    taxInclusive: true,
    googleReviewUrl: '',
  });

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      legalName: '',
      type: 'billed',
      taxId: '07AAAAA0000A1Z5',
      address: 'Main Commercial Market',
      city: 'Karnal, Haryana',
      phone: '+91 98123 00000',
      email: 'store@example.com',
      invoicePrefix: 'INV-NEW-',
      currentInvoiceNumber: 1,
      returnPolicy: 'Exchange within 7 days with original bill.',
      accentColor: '#4f46e5',
      tagline: 'Fashion Boutique',
      enableDynamicGarmentGst: true,
      taxInclusive: true,
      googleReviewUrl: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp);
    setFormData({
      ...comp,
      enableDynamicGarmentGst: comp.enableDynamicGarmentGst ?? true,
      taxInclusive: comp.taxInclusive ?? true,
      googleReviewUrl: comp.googleReviewUrl || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.invoicePrefix.trim()) return;

    if (editingCompany) {
      updateCompany({ ...formData, id: editingCompany.id });
    } else {
      addCompany(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Multi-Company Entity Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure independent billing profiles with segregated tax IDs, invoice prefix sequences, and receipt policies.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Business Entity</span>
        </button>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companies.map((comp) => {
          const isActive = comp.id === activeCompanyId;
          const isBilled = comp.type === 'billed';

          return (
            <div
              key={comp.id}
              className={`bg-white rounded-xl border p-5 space-y-4 relative transition-all ${
                isActive
                  ? 'border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: comp.accentColor || '#4f46e5' }}
                  >
                    {comp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{comp.name}</h3>
                    <div className="text-[11px] text-slate-500">{comp.legalName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isBilled && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        comp.taxInclusive !== false
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {comp.taxInclusive !== false ? 'GST Included (MRP)' : 'GST Added on Top'}
                    </span>
                  )}
                  {isBilled && comp.enableDynamicGarmentGst !== false && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Auto GST 5%/12%
                    </span>
                  )}
                  {comp.googleReviewUrl && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <span>★ Review QR Configured</span>
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isBilled
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isBilled ? 'Official Billed (GST)' : 'Cash / Direct Retail'}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(comp)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                    title="Edit Entity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Company Details */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{comp.address}, {comp.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{comp.phone}</span>
                  {comp.email && <span>· {comp.email}</span>}
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-sans text-slate-500">Tax ID / GST:</span>
                  <span className="font-bold text-slate-800">{comp.taxId}</span>
                </div>
              </div>

              {/* Invoice Sequence & Receipt Policy */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Invoice Numbering:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {comp.invoicePrefix}{comp.currentInvoiceNumber}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 italic leading-snug">
                  "{comp.returnPolicy}"
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setActiveCompanyId(comp.id)}
                  disabled={isActive}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-500 cursor-default'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isActive && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{isActive ? 'Current Active POS Profile' : 'Set as Active POS Profile'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Company Bento Grid Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-2xl sm:rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200/90 overflow-hidden flex flex-col my-4 max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-white px-5 sm:px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 transition-colors"
                  style={{ backgroundColor: formData.accentColor || '#4f46e5' }}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>{editingCompany ? 'Edit Business Entity Profile' : 'Create New Business Entity'}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        formData.type === 'billed'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {formData.type === 'billed' ? 'Official Billed (GST)' : 'Cash / Direct Retail'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure multi-store tax structure, invoice numbering sequences, and receipt policies.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Bento Grid */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* BENTO CELL 1: Brand & Entity Identity (7 Cols) */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                            <Sparkles className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Brand & Entity Identity
                            </h4>
                            <p className="text-[11px] text-slate-500">Public store name, legal business identity, and branding.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cell 01</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Store Display Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Garment OS Karnal"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Legal Registered Name
                          </label>
                          <input
                            type="text"
                            value={formData.legalName}
                            onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                            placeholder="e.g. Garment OS Retail Pvt. Ltd."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Outlet Category / Tagline
                        </label>
                        <input
                          type="text"
                          value={formData.tagline}
                          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                          placeholder="e.g. Exclusive Designer Kurtis & Ethnic Studio"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Accent Color Swatches */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-slate-500" />
                            <span>Brand Accent Color</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 uppercase">{formData.accentColor}</span>
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {ACCENT_COLOR_PRESETS.map((color) => (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() => setFormData({ ...formData, accentColor: color.hex })}
                              title={color.label}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                formData.accentColor === color.hex
                                  ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-xs'
                                  : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: color.hex }}
                            >
                              {formData.accentColor === color.hex && (
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              )}
                            </button>
                          ))}
                          <div className="flex items-center gap-1.5 ml-auto">
                            <input
                              type="color"
                              value={formData.accentColor || '#4f46e5'}
                              onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                              className="w-7 h-7 rounded-xl border border-slate-200 cursor-pointer overflow-hidden p-0"
                            />
                            <input
                              type="text"
                              value={formData.accentColor || '#4f46e5'}
                              onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono uppercase text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Brand Header Preview */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-8 rounded-md"
                            style={{ backgroundColor: formData.accentColor || '#4f46e5' }}
                          />
                          <div>
                            <div className="font-extrabold text-xs text-slate-900">
                              {formData.name || 'Company Display Name'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">
                              {formData.tagline || 'Outlet Category / Tagline'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Live Banner Preview
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BENTO CELL 2: Entity Type & Taxation Architecture (5 Cols) */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Entity Classification
                            </h4>
                            <p className="text-[11px] text-slate-500">Legal invoicing & tax status.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cell 02</span>
                      </div>

                      {/* Entity Type Radio Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                        <label
                          className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                            formData.type === 'billed'
                              ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400 shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="entityType"
                            checked={formData.type === 'billed'}
                            onChange={() => setFormData({ ...formData, type: 'billed' })}
                            className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="font-extrabold text-xs text-slate-900">Official Billed (GST)</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                              Generates official tax invoices with GSTIN, HSN summaries, and tax breakdown.
                            </p>
                          </div>
                        </label>

                        <label
                          className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                            formData.type === 'cash'
                              ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400 shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="entityType"
                            checked={formData.type === 'cash'}
                            onChange={() => setFormData({ ...formData, type: 'cash' })}
                            className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-extrabold text-xs text-slate-900">Cash / Direct Counter</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                              For unbilled cash memo counters. Skips tax calculation and issues clean retail chits.
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* GSTIN / Tax ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>{formData.type === 'billed' ? 'GSTIN / State Tax ID' : 'Memo Reference Code'}</span>
                          {formData.type === 'billed' && (
                            <span className="text-[10px] font-mono text-indigo-600 font-semibold">15-digit GSTIN</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={formData.taxId}
                          onChange={(e) => setFormData({ ...formData, taxId: e.target.value.toUpperCase() })}
                          placeholder={formData.type === 'billed' ? '07AAAAA0000A1Z5' : 'RETAIL-CASH-UNREG'}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Compliant with Indian state taxation & commercial laws.</span>
                    </div>
                  </div>

                  {/* BENTO CELL 3: GST Slabs & Calculation Architecture (7 Cols) */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                          <Layers className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            GST Calculation & Slabs
                          </h4>
                          <p className="text-[11px] text-slate-500">Retail price tax inclusion and garment slab automation.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cell 03</span>
                    </div>

                    {formData.type === 'billed' ? (
                      <div className="space-y-3">
                        {/* GST Mode Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <label
                            className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                              formData.taxInclusive !== false
                                ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400 shadow-2xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="taxInclusive"
                              checked={formData.taxInclusive !== false}
                              onChange={() => setFormData({ ...formData, taxInclusive: true })}
                              className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <div className="font-extrabold text-xs text-slate-900">GST Included in Price (MRP)</div>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                Retail Standard: Customer pays price on clothing tag. GST is back-calculated and itemized.
                              </p>
                            </div>
                          </label>

                          <label
                            className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                              formData.taxInclusive === false
                                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400 shadow-2xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="taxInclusive"
                              checked={formData.taxInclusive === false}
                              onChange={() => setFormData({ ...formData, taxInclusive: false })}
                              className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <div className="font-extrabold text-xs text-slate-900">GST Added Separately (+Tax)</div>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                Wholesale / Exclusive: Tag is base rate. GST % is added on top of item rate at checkout.
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Dynamic Garment GST Slabs */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.enableDynamicGarmentGst ?? true}
                              onChange={(e) => setFormData({ ...formData, enableDynamicGarmentGst: e.target.checked })}
                              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-extrabold text-xs text-slate-900 block">
                                Indian Garment Dynamic GST Slab Automation
                              </span>
                              <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                                Automatically recalibrates tax rate per garment at checkout according to Indian apparel tax laws:
                              </span>
                            </div>
                          </label>

                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                              <span className="font-bold block">Net Rate ≤ ₹1,000</span>
                              <span className="text-emerald-700 text-[10px]">Applies 5% GST</span>
                            </div>
                            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900">
                              <span className="font-bold block">Net Rate &gt; ₹1,000</span>
                              <span className="text-indigo-700 text-[10px]">Applies 12% GST</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                        <DollarSign className="w-8 h-8 text-emerald-600 mx-auto" />
                        <div className="text-xs font-bold text-slate-800">
                          Direct Cash / Unbilled Counter Profile
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Sales under this entity bypass GST itemization and generate direct retail cash memos. Switch entity type to "Official Billed" if you wish to apply GST slabs.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* BENTO CELL 4: Invoice Sequence & Numbering (5 Cols) */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                            <Hash className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Invoice Sequence
                            </h4>
                            <p className="text-[11px] text-slate-500">Autonomous invoice counter.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cell 04</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Invoice Prefix <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.invoicePrefix}
                            onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                            placeholder="e.g. INV-"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Next Bill Number
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.currentInvoiceNumber}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                currentInvoiceNumber: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Live Bill Sequence Hologram */}
                      <div className="p-3 bg-slate-950 text-white rounded-xl shadow-xs space-y-1 font-mono">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                          <span>Next Generated Bill:</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Sequence
                          </span>
                        </div>
                        <div className="text-base font-extrabold text-white tracking-wide">
                          {formData.invoicePrefix || 'INV-'}{formData.currentInvoiceNumber || 1001}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      Each entity increments its invoice count independently without conflicts.
                    </div>
                  </div>

                  {/* BENTO CELL 5: Physical Location & Contact Info (6 Cols) */}
                  <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Location & Contact Details
                          </h4>
                          <p className="text-[11px] text-slate-500">Printed on receipt headers and sales registers.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cell 05</span>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Shop / Storefront Address
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="e.g. Shop 12, Main Market"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            City & Pincode
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="e.g. Karnal, Haryana - 132001"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Store Contact Phone
                          </label>
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="e.g. +91 98123 45678"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Store Official Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="e.g. store@garmentos.com"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BENTO CELL 6: Google Review QR & Digital Presence (6 Cols) */}
                  <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                            <Star className="w-4 h-4 fill-current" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Google Review QR Code
                            </h4>
                            <p className="text-[11px] text-slate-500">Collect 5-star Google ratings on printed bills.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cell 06</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Branch Google Review / Maps Link</span>
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                            Thermal QR
                          </span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://g.page/r/.../review or https://maps.app.goo.gl/..."
                          value={formData.googleReviewUrl || ''}
                          onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-[11px] text-slate-500 mt-1.5 block leading-snug">
                          When added, customer thermal bills automatically include a scannable QR code linking to this Google business listing.
                        </span>
                      </div>

                      <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
                        <Star className="w-4 h-4 text-amber-600 fill-current shrink-0 mt-0.5" />
                        <span>
                          Leave blank to inherit the global store review link configured in main POS Settings.
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      Scannable with any smartphone camera on printed 58mm & 80mm receipts.
                    </div>
                  </div>

                  {/* BENTO CELL 7: Printed Receipt Return & Exchange Policy (12 Cols) */}
                  <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                          <FileText className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Thermal Receipt Return & Exchange Policy
                          </h4>
                          <p className="text-[11px] text-slate-500">Customer terms printed at the bottom of 58mm / 80mm receipt tape.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Cell 07</span>
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={formData.returnPolicy}
                        onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                        placeholder="e.g. Exchange within 7 days with original invoice & tags intact."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                      />
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                        Quick Presets:
                      </span>
                      {RETURN_POLICY_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, returnPolicy: preset })}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            formData.returnPolicy === preset
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {preset.slice(0, 32)}...
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer / Actions */}
              <div className="bg-white px-5 sm:px-6 py-3.5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Changes take effect immediately on all subsequent POS transactions.</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingCompany ? 'Update Business Entity' : 'Create Business Entity'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
