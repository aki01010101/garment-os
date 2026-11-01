import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Company, CompanyType } from '../../types';
import { Building2, Plus, Edit2, ShieldCheck, DollarSign, Check, Phone, MapPin, Receipt } from 'lucide-react';

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
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp);
    setFormData({
      ...comp,
      enableDynamicGarmentGst: comp.enableDynamicGarmentGst ?? true,
      taxInclusive: comp.taxInclusive ?? true,
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

      {/* Add / Edit Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200 space-y-4 my-6">
            <h3 className="text-sm font-bold text-slate-900">
              {editingCompany ? 'Edit Business Entity Profile' : 'Create New Business Entity'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Display Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Garment OS Apparel"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Registered Entity Name</label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="e.g. Garment OS Apparel Private Limited"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entity Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CompanyType })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="billed">Official Billed (Tax Invoices)</option>
                    <option value="cash">Cash / Direct Counter (Unbilled)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="e.g. 07AABCV1234F1Z8"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shop Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City & Pincode</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix *</label>
                  <input
                    type="text"
                    required
                    value={formData.invoicePrefix}
                    onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                    placeholder="e.g. INV-COMPA-"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Next Bill Number</label>
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
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              {formData.type === 'billed' && (
                <div className="space-y-3">
                  {/* GST Calculation Mode: Inclusive vs Added on Top */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block text-xs">
                      GST Calculation Mode
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer transition-all ${
                          formData.taxInclusive !== false
                            ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-400'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="taxInclusive"
                          checked={formData.taxInclusive !== false}
                          onChange={() => setFormData({ ...formData, taxInclusive: true })}
                          className="mt-0.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">
                            GST Included in Price (MRP)
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                            Retail standard. Customer pays exact tag price. GST is back-calculated and itemized.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer transition-all ${
                          formData.taxInclusive === false
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
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
                          <span className="font-bold text-xs text-slate-900 block">
                            GST Added Separately
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                            Wholesale / Exclusive model. Tax % is added on top of item rate at checkout.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Dynamic Slabs */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableDynamicGarmentGst ?? true}
                        onChange={(e) => setFormData({ ...formData, enableDynamicGarmentGst: e.target.checked })}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 block text-xs">
                          Indian Garment Dynamic GST Slab Automation
                        </span>
                        <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                          Automatically recalculates tax rate per garment at checkout: <strong>5% GST</strong> if net unit price is ≤ ₹1,000, and <strong>12% GST</strong> if net unit price is &gt; ₹1,000 (compliant with Indian apparel tax laws).
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Receipt Return Policy Text (Printed on 58mm receipts)
                </label>
                <textarea
                  rows={2}
                  value={formData.returnPolicy}
                  onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
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
                  Save Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
