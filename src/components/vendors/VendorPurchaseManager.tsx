import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Vendor, PurchaseItem, ClothingCategory } from '../../types';
import {
  Truck,
  Plus,
  FileText,
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Building2,
  Trash2,
  ArrowDownRight,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

export const VendorPurchaseManager: React.FC = () => {
  const {
    vendors,
    addVendor,
    updateVendor,
    purchases,
    recordPurchaseOrder,
    recordVendorPayment,
    vendorPayments,
    products,
    companies,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'vendors' | 'new-entry' | 'history'>('vendors');
  const [searchQuery, setSearchQuery] = useState('');
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState<'all' | 'billed' | 'cash'>('all');

  // Vendor Payment Modal State
  const [selectedVendorForPayment, setSelectedVendorForPayment] = useState<Vendor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentLedgerType, setPaymentLedgerType] = useState<'billed' | 'cash'>('billed');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque'>('Bank Transfer');
  const [paymentRefNo, setPaymentRefNo] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // New Vendor Modal State
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    gstin: '',
    notes: '',
  });

  // Purchase Entry Form State
  const [entryPurchaseType, setEntryPurchaseType] = useState<'billed' | 'cash'>('billed');
  const [entryVendorId, setEntryVendorId] = useState<string>(vendors[0]?.id || '');
  const [entryCompanyId, setEntryCompanyId] = useState<string>(companies[0]?.id || '');
  const [entryVoucherNumber, setEntryVoucherNumber] = useState<string>('INV-2026-');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entryTaxRate, setEntryTaxRate] = useState<number>(5);
  const [entryPaidAmount, setEntryPaidAmount] = useState<string>('0');
  const [entryPaymentMode, setEntryPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI'>('Bank Transfer');
  const [entryNotes, setEntryNotes] = useState<string>('');

  // Purchase Line Items
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    {
      productId: products[0]?.id,
      productName: products[0]?.name || 'Oxford Pure Cotton Shirt',
      sku: products[0]?.sku || 'VT-MSH-001-M',
      category: products[0]?.category || 'Men',
      size: products[0]?.size || 'M',
      color: products[0]?.color || 'Sky Blue',
      qty: 20,
      costPrice: products[0]?.costPrice || 650,
      total: 20 * (products[0]?.costPrice || 650),
    },
  ]);

  // Handle adding line item to purchase entry
  const handleAddPurchaseLine = () => {
    const firstProd = products[0];
    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: firstProd?.id,
        productName: firstProd?.name || 'Custom Garment',
        sku: firstProd?.sku || 'VT-GEN-001',
        category: firstProd?.category || 'Men',
        size: 'L',
        color: 'Black',
        qty: 10,
        costPrice: 500,
        total: 5000,
      },
    ]);
  };

  const handleUpdateLine = (index: number, field: keyof PurchaseItem, val: any) => {
    setPurchaseItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };

      // If user selected a known product from catalog
      if (field === 'productId') {
        const prod = products.find((p) => p.id === val);
        if (prod) {
          item.productName = prod.name;
          item.sku = prod.sku;
          item.category = prod.category;
          item.size = prod.size;
          item.color = prod.color;
          item.costPrice = prod.costPrice;
        }
      }

      if (field === 'qty' || field === 'costPrice') {
        item.total = item.qty * item.costPrice;
      }

      copy[index] = item;
      return copy;
    });
  };

  const handleRemoveLine = (index: number) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Entry calculations
  const entrySubtotal = purchaseItems.reduce((acc, item) => acc + item.total, 0);
  const entryTaxAmount = entryPurchaseType === 'billed' ? (entrySubtotal * entryTaxRate) / 100 : 0;
  const entryTotalAmount = entrySubtotal + entryTaxAmount;
  const parsedPaid = parseFloat(entryPaidAmount) || 0;

  // Submit Purchase Order
  const handleSavePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === entryVendorId);
    const company = companies.find((c) => c.id === entryCompanyId);

    if (!vendor || !company) return;

    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (parsedPaid >= entryTotalAmount) {
      paymentStatus = 'paid';
    } else if (parsedPaid > 0) {
      paymentStatus = 'partial';
    }

    recordPurchaseOrder({
      vendorId: vendor.id,
      vendorName: vendor.name,
      companyId: company.id,
      companyName: company.name,
      purchaseType: entryPurchaseType,
      billOrVoucherNumber: entryVoucherNumber,
      date: entryDate,
      items: purchaseItems,
      subtotal: entrySubtotal,
      taxRate: entryPurchaseType === 'billed' ? entryTaxRate : 0,
      taxAmount: entryTaxAmount,
      totalAmount: entryTotalAmount,
      paidAmount: parsedPaid,
      paymentStatus,
      paymentMode: entryPaymentMode,
      notes: entryNotes,
    });

    // Reset Form
    alert(`Purchase Entry recorded successfully! Stock restocked for ${purchaseItems.length} products.`);
    setActiveTab('history');
  };

  // Submit Vendor Payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForPayment) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    recordVendorPayment({
      vendorId: selectedVendorForPayment.id,
      vendorName: selectedVendorForPayment.name,
      date: new Date().toISOString().split('T')[0],
      amount,
      ledgerType: paymentLedgerType,
      paymentMode,
      referenceNo: paymentRefNo,
      notes: paymentNotes,
    });

    setSelectedVendorForPayment(null);
    setPaymentAmount('');
    setPaymentRefNo('');
    setPaymentNotes('');
  };

  // Add Vendor
  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.name.trim()) return;

    addVendor(newVendorForm);
    setIsAddVendorOpen(false);
    setNewVendorForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      city: '',
      gstin: '',
      notes: '',
    });
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPurchases = purchases.filter((p) => {
    if (purchaseTypeFilter !== 'all' && p.purchaseType !== purchaseTypeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Vendor & Inward Purchase Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Segregated accounts payable tracking: Official GST Invoices vs. Direct Cash Outlays.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'vendors'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vendors & Dual Ledgers
          </button>
          <button
            onClick={() => setActiveTab('new-entry')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'new-entry'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Inward Stock Entry
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchase Orders History
          </button>
        </div>
      </div>

      {/* TAB 1: VENDORS & DUAL LEDGERS */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Official Billed Payable
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                ₹{vendors.reduce((s, v) => s + v.billedPayableBalance, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Legal accounts payable with GST tax invoices
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Cash / Off-Record Payable
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                ₹{vendors.reduce((s, v) => s + v.cashPayableBalance, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Direct cash lot commitments & settlements
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Combined Outstanding
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                ₹{vendors.reduce((s, v) => s + v.billedPayableBalance + v.cashPayableBalance, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Across {vendors.length} registered fabric and apparel mills
              </p>
            </div>
          </div>

          {/* Directory Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor by name, city, or contact..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() => setIsAddVendorOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Supplier</span>
            </button>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Vendor & Contact</th>
                  <th className="py-3 px-4">Location & Tax ID</th>
                  <th className="py-3 px-4 text-right">Billed Payable</th>
                  <th className="py-3 px-4 text-right">Cash Payable</th>
                  <th className="py-3 px-4 text-right">Total Purchases</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">{vendor.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {vendor.contactPerson} · {vendor.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{vendor.city}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {vendor.gstin || 'Unregistered'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={`font-bold ${vendor.billedPayableBalance > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        ₹{vendor.billedPayableBalance.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={`font-bold ${vendor.cashPayableBalance > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        ₹{vendor.cashPayableBalance.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                      <div>Billed: ₹{vendor.totalBilledPurchased.toLocaleString('en-IN')}</div>
                      <div>Cash: ₹{vendor.totalCashPurchased.toLocaleString('en-IN')}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedVendorForPayment(vendor);
                          setPaymentLedgerType(vendor.billedPayableBalance > 0 ? 'billed' : 'cash');
                          setPaymentAmount(
                            (vendor.billedPayableBalance > 0
                              ? vendor.billedPayableBalance
                              : vendor.cashPayableBalance
                            ).toString()
                          );
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INWARD STOCK ENTRY */}
      {activeTab === 'new-entry' && (
        <form onSubmit={handleSavePurchaseOrder} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          {/* Purchase Type Selector */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Purchase Classification:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setEntryPurchaseType('billed')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  entryPurchaseType === 'billed'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-5 h-5 ${entryPurchaseType === 'billed' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold text-slate-900">Official Billed Purchase</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Recorded with legal vendor GST Tax Invoice. Generates Input Tax Credit (ITC) and logs to the Official Accounts Payable ledger.
                </p>
              </div>

              <div
                onClick={() => setEntryPurchaseType('cash')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  entryPurchaseType === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className={`w-5 h-5 ${entryPurchaseType === 'cash' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold text-slate-900">Cash / Off-the-Record Purchase</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Direct cash wholesale lot outlay. Updates inventory counts into retail stock without GST tax entries; tracked in separate Cash Ledger.
                </p>
              </div>
            </div>
          </div>

          {/* Supplier & Invoice Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor *</label>
              <select
                value={entryVendorId}
                onChange={(e) => setEntryVendorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {entryPurchaseType === 'billed' ? 'Tax Invoice Number *' : 'Cash Voucher / Lot Ref *'}
              </label>
              <input
                type="text"
                required
                value={entryVoucherNumber}
                onChange={(e) => setEntryVoucherNumber(e.target.value)}
                placeholder="e.g. INV-2026-902"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receiving Business Entity</label>
              <select
                value={entryCompanyId}
                onChange={(e) => setEntryCompanyId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt Date</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>

          {/* Garments Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Inward Inventory Items (Stock will be incremented automatically)
              </span>
              <button
                type="button"
                onClick={handleAddPurchaseLine}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Line Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Catalog Product</th>
                    <th className="py-2.5 px-2">Size</th>
                    <th className="py-2.5 px-2">Color</th>
                    <th className="py-2.5 px-2 text-right">Inward Qty</th>
                    <th className="py-2.5 px-2 text-right">Cost Price (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    <th className="py-2.5 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseItems.map((line, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <select
                          value={line.productId}
                          onChange={(e) => handleUpdateLine(idx, 'productId', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={line.size}
                          onChange={(e) => handleUpdateLine(idx, 'size', e.target.value)}
                          className="w-16 px-1.5 py-1 text-center font-mono border border-slate-200 rounded text-xs uppercase"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={line.color}
                          onChange={(e) => handleUpdateLine(idx, 'color', e.target.value)}
                          className="w-24 px-1.5 py-1 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={line.qty}
                          onChange={(e) => handleUpdateLine(idx, 'qty', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-right font-mono border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={line.costPrice}
                          onChange={(e) => handleUpdateLine(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-right font-mono border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        ₹{line.total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Initial Settlement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initial Payment at Entry
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={entryTotalAmount}
                    value={entryPaidAmount}
                    onChange={(e) => setEntryPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-32 px-3 py-1.5 font-mono text-xs border border-slate-200 rounded-lg bg-slate-50"
                  />
                  <select
                    value={entryPaymentMode}
                    onChange={(e) => setEntryPaymentMode(e.target.value as any)}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="e.g. Fabric lot delivery verified by store manager"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({purchaseItems.length} lines):</span>
                <span>₹{entrySubtotal.toLocaleString('en-IN')}</span>
              </div>

              {entryPurchaseType === 'billed' ? (
                <div className="flex justify-between items-center text-slate-600">
                  <div className="flex items-center gap-1 font-sans">
                    <span>GST Rate:</span>
                    <select
                      value={entryTaxRate}
                      onChange={(e) => setEntryTaxRate(Number(e.target.value))}
                      className="px-1 py-0.5 border border-slate-200 rounded text-xs bg-white"
                    >
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                    </select>
                  </div>
                  <span>+₹{entryTaxAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-700 text-[11px] font-sans">
                  <span>Cash Outlay (Off-the-Record):</span>
                  <span>₹0.00 Tax</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Bill Amount:</span>
                <span>₹{entryTotalAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Amount Paid Now:</span>
                <span>-₹{parsedPaid.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t border-slate-200">
                <span>Added to {entryPurchaseType.toUpperCase()} Payable:</span>
                <span>₹{Math.max(0, entryTotalAmount - parsedPaid).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('vendors')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Record Purchase & Update Stock</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PURCHASE HISTORY & AUDIT LOGS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Filter Ledger Type:</span>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              {(['all', 'billed', 'cash'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPurchaseTypeFilter(type)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    purchaseTypeFilter === type
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'all'
                    ? 'All Purchases'
                    : type === 'billed'
                    ? 'Official Billed (GST)'
                    : 'Cash / Off-Record'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Voucher #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Items Received</th>
                  <th className="py-3 px-4 text-right">Tax Amount</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{po.billOrVoucherNumber}</div>
                      <div className="text-[11px] text-slate-500">{po.date}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {po.vendorName}
                    </td>
                    <td className="py-3 px-4">
                      {po.purchaseType === 'billed' ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Billed (GST Tax)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Cash Outlay
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      {po.items.map((i) => `${i.qty}x ${i.productName} (${i.size})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{po.taxAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{po.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          po.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {po.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Vendor Payment Modal */}
      {selectedVendorForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Record Payment to {selectedVendorForPayment.name}</span>
            </h3>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              {/* Ledger Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Apply Payment Toward Ledger:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentLedgerType('billed')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      paymentLedgerType === 'billed'
                        ? 'border-indigo-600 bg-indigo-50/60 font-bold'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="text-indigo-900">Official Billed Ledger</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Due: ₹{selectedVendorForPayment.billedPayableBalance.toLocaleString('en-IN')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentLedgerType('cash')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      paymentLedgerType === 'cash'
                        ? 'border-emerald-600 bg-emerald-50/60 font-bold'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="text-emerald-900">Cash / Off-Record Ledger</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Due: ₹{selectedVendorForPayment.cashPayableBalance.toLocaleString('en-IN')}
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cash">Cash Hand-off</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ref / UTR Number</label>
                  <input
                    type="text"
                    value={paymentRefNo}
                    onChange={(e) => setPaymentRefNo(e.target.value)}
                    placeholder="e.g. UTR-991204"
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Settle balance for lot CC-409"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedVendorForPayment(null)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Supplier Modal */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add New Supplier / Vendor</h3>
            <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor Firm Name *</label>
                <input
                  type="text"
                  required
                  value={newVendorForm.name}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                  placeholder="e.g. Vardhman Textiles Ltd"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newVendorForm.contactPerson}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, contactPerson: e.target.value })}
                    placeholder="e.g. Rajesh Gupta"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newVendorForm.phone}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                    placeholder="e.g. 9812345678"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={newVendorForm.city}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, city: e.target.value })}
                    placeholder="e.g. Surat, Gujarat"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={newVendorForm.gstin}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, gstin: e.target.value })}
                    placeholder="e.g. 24AAACR1234F1ZP"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
