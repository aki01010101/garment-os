import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleTransaction } from '../../types';
import { EditSaleModal } from './EditSaleModal';
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  Download,
  Printer,
  Edit,
  Eye,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Tag,
  Share2,
  ChevronDown,
  ChevronUp,
  Building2,
  CheckCircle2,
  Phone,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
} from 'lucide-react';

export const SalesRegister: React.FC = () => {
  const {
    sales,
    companies,
    activeCompany,
    setActiveReceipt,
    setIsReceiptModalOpen,
  } = useApp();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Expanded row for item breakdown
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Edit Sale modal state
  const [editingSale, setEditingSale] = useState<SaleTransaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Calculate Date Boundaries
  const dateBounds = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    return {
      todayStr,
      yesterdayStr,
      sevenDaysAgoStr,
      firstDayOfMonth,
    };
  }, []);

  // Filter Sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // 1. Search Query (Invoice #, Customer Name, Phone, Cashier, Item Name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesInvoice = sale.invoiceNumber.toLowerCase().includes(q);
        const matchesCustomer = sale.customerName.toLowerCase().includes(q);
        const matchesPhone = sale.customerPhone.toLowerCase().includes(q);
        const matchesCashier = sale.cashierName.toLowerCase().includes(q);
        const matchesAssociate = sale.salesAssociate?.toLowerCase().includes(q);
        const matchesItem = sale.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));

        if (!matchesInvoice && !matchesCustomer && !matchesPhone && !matchesCashier && !matchesAssociate && !matchesItem) {
          return false;
        }
      }

      // 2. Entity Filter
      if (selectedEntityId !== 'all' && sale.companyId !== selectedEntityId) {
        return false;
      }

      // 3. Payment Mode Filter
      if (selectedPaymentMode !== 'all' && sale.paymentMode !== selectedPaymentMode) {
        return false;
      }

      // 4. Date Range Filter
      const saleDateOnly = sale.date.split('T')[0];

      if (dateRangePreset === 'today') {
        return saleDateOnly === dateBounds.todayStr;
      }
      if (dateRangePreset === 'yesterday') {
        return saleDateOnly === dateBounds.yesterdayStr;
      }
      if (dateRangePreset === '7days') {
        return saleDateOnly >= dateBounds.sevenDaysAgoStr && saleDateOnly <= dateBounds.todayStr;
      }
      if (dateRangePreset === 'month') {
        return saleDateOnly >= dateBounds.firstDayOfMonth && saleDateOnly <= dateBounds.todayStr;
      }
      if (dateRangePreset === 'custom') {
        if (customStartDate && saleDateOnly < customStartDate) return false;
        if (customEndDate && saleDateOnly > customEndDate) return false;
      }

      return true;
    });
  }, [sales, searchQuery, selectedEntityId, selectedPaymentMode, dateRangePreset, customStartDate, customEndDate, dateBounds]);

  // Financial KPIs on filtered data
  const metrics = useMemo(() => {
    let totalGrossRevenue = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalItems = 0;
    let billedRevenue = 0;
    let cashRevenue = 0;

    let tenderCash = 0;
    let tenderUpi = 0;
    let tenderCard = 0;

    filteredSales.forEach((sale) => {
      totalGrossRevenue += sale.grandTotal;
      totalTax += sale.taxTotal;
      totalDiscount += (sale.itemDiscountsTotal || 0) + (sale.loyaltyDiscountAmount || 0) + (sale.couponDiscountAmount || 0);
      totalItems += sale.items.reduce((acc, it) => acc + it.qty, 0);

      const comp = companies.find((c) => c.id === sale.companyId);
      if (comp?.type === 'billed') {
        billedRevenue += sale.grandTotal;
      } else {
        cashRevenue += sale.grandTotal;
      }

      if (sale.paymentMode === 'Cash') {
        tenderCash += sale.grandTotal;
      } else if (sale.paymentMode === 'UPI') {
        tenderUpi += sale.grandTotal;
      } else if (sale.paymentMode === 'Card') {
        tenderCard += sale.grandTotal;
      } else if (sale.paymentMode === 'Split' && sale.splitBreakdown) {
        tenderCash += sale.splitBreakdown.cash;
        tenderUpi += sale.splitBreakdown.upi;
        tenderCard += sale.splitBreakdown.card;
      }
    });

    return {
      count: filteredSales.length,
      totalGrossRevenue,
      totalTax,
      totalDiscount,
      totalItems,
      billedRevenue,
      cashRevenue,
      tenderCash,
      tenderUpi,
      tenderCard,
    };
  }, [filteredSales, companies]);

  // Export filtered register to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert('No sales found to export.');
      return;
    }

    const headers = [
      'Invoice Number',
      'Date',
      'Time',
      'Billing Entity',
      'Customer Name',
      'Customer Phone',
      'Payment Mode',
      'Subtotal (INR)',
      'Discount (INR)',
      'GST Tax (INR)',
      'Grand Total (INR)',
      'Cashier',
      'Sales Associate',
      'Items Count',
      'Item Summary',
    ];

    const rows = filteredSales.map((s) => [
      `"${s.invoiceNumber}"`,
      `"${new Date(s.date).toLocaleDateString('en-IN')}"`,
      `"${new Date(s.date).toLocaleTimeString('en-IN')}"`,
      `"${s.companyName}"`,
      `"${s.customerName}"`,
      `"${s.customerPhone}"`,
      `"${s.paymentMode}"`,
      s.subtotal.toFixed(2),
      (s.itemDiscountsTotal + (s.loyaltyDiscountAmount || 0) + (s.couponDiscountAmount || 0)).toFixed(2),
      s.taxTotal.toFixed(2),
      s.grandTotal.toFixed(2),
      `"${s.cashierName}"`,
      `"${s.salesAssociate || 'N/A'}"`,
      s.items.reduce((acc, it) => acc + it.qty, 0),
      `"${s.items.map((i) => `${i.qty}x ${i.name} (${i.size})`).join('; ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Garment_OS_Sales_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReceipt = (sale: SaleTransaction) => {
    setActiveReceipt(sale);
    setIsReceiptModalOpen(true);
  };

  const handleOpenEdit = (sale: SaleTransaction) => {
    setEditingSale(sale);
    setIsEditModalOpen(true);
  };

  const handleWhatsAppReceipt = (sale: SaleTransaction) => {
    const phone = sale.customerPhone && sale.customerPhone !== 'N/A' ? sale.customerPhone.replace(/\D/g, '') : '';
    const itemsSummary = sale.items.map((it) => `• ${it.qty}x ${it.name} (${it.size}) - ₹${it.total.toFixed(0)}`).join('\n');
    const text = `*Invoice ${sale.invoiceNumber} - ${sale.companyName}*\nDate: ${new Date(sale.date).toLocaleDateString('en-IN')}\nCustomer: ${sale.customerName}\n\n*Items Purchased:*\n${itemsSummary}\n\n*Net Total: ₹${sale.grandTotal.toFixed(2)}* (${sale.paymentMode})\nThank you for shopping at ${sale.companyName}!`;

    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md shadow-slate-900/20">
            <Receipt className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Sales Register</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {metrics.count} Receipts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive ledger of all retail bills, tender breakdowns, and tax invoices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Sales Revenue
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{metrics.totalGrossRevenue.toFixed(2)}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span>{metrics.totalItems} garments sold</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Billed vs. Cash Entities
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-black text-indigo-700 font-mono">
              ₹{metrics.billedRevenue.toFixed(0)}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-lg font-black text-emerald-700 font-mono">
              ₹{metrics.cashRevenue.toFixed(0)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Billed
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Cash Memo
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Tender Collection
          </span>
          <div className="space-y-1 mt-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Cash:</span>
              <span className="font-bold text-slate-800">₹{metrics.tenderCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">UPI:</span>
              <span className="font-bold text-indigo-700">₹{metrics.tenderUpi.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Card:</span>
              <span className="font-bold text-purple-700">₹{metrics.tenderCard.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Tax & Discounts
          </span>
          <div className="space-y-1 mt-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">GST Collected:</span>
              <span className="font-bold text-slate-900">₹{metrics.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Total Discounts:</span>
              <span className="font-bold text-emerald-700">-₹{metrics.totalDiscount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, customer name, phone, item name, cashier..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {(['today', 'yesterday', '7days', 'month', 'all', 'custom'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDateRangePreset(preset)}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  dateRangePreset === preset
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset === 'today' && 'Today'}
                {preset === 'yesterday' && 'Yesterday'}
                {preset === '7days' && 'Last 7 Days'}
                {preset === 'month' && 'This Month'}
                {preset === 'all' && 'All Time'}
                {preset === 'custom' && 'Custom Date'}
              </button>
            ))}
          </div>
        </div>

        {/* Second Filter Row: Entity, Payment Mode & Custom Dates */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Entity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Entity:</span>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
            >
              <option value="all">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'billed' ? 'Billed GST' : 'Cash Memo'})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Payment:</span>
            <select
              value={selectedPaymentMode}
              onChange={(e) => setSelectedPaymentMode(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash Only</option>
              <option value="UPI">UPI QR Only</option>
              <option value="Card">Card Only</option>
              <option value="Split">Split Tender Only</option>
            </select>
          </div>

          {/* Custom Date Range Picker */}
          {dateRangePreset === 'custom' && (
            <div className="flex items-center gap-2 bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-200">
              <span className="text-indigo-900 font-bold text-[11px]">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-indigo-300 rounded text-xs"
              />
              <span className="text-indigo-900 font-bold text-[11px]">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-indigo-300 rounded text-xs"
              />
            </div>
          )}

          {(selectedEntityId !== 'all' || selectedPaymentMode !== 'all' || dateRangePreset !== 'today' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedEntityId('all');
                setSelectedPaymentMode('all');
                setDateRangePreset('today');
                setSearchQuery('');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
            <div className="font-bold text-slate-700 text-sm">No sales records found</div>
            <p className="text-xs max-w-sm mx-auto text-slate-400">
              No bills match your current search and date filters. Try changing your filters or record a new sale in POS.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice # & Date</th>
                  <th className="py-3 px-3">Entity</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items Summary</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Net Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => {
                  const isExpanded = expandedSaleId === sale.id;
                  const comp = companies.find((c) => c.id === sale.companyId);
                  const isBilled = comp?.type === 'billed';
                  const totalItemsCount = sale.items.reduce((s, i) => s + i.qty, 0);

                  return (
                    <React.Fragment key={sale.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-indigo-50/30' : ''}`}>
                        {/* Invoice & Date */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 cursor-pointer"
                              title="Toggle item details"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <div>
                              <span className="font-extrabold text-slate-900 font-mono text-xs">
                                {sale.invoiceNumber}
                              </span>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {new Date(sale.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {new Date(sale.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Company Entity */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isBilled
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {sale.companyName}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 truncate max-w-[140px]">
                            {sale.customerName}
                          </div>
                          {sale.customerPhone && sale.customerPhone !== 'N/A' && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {sale.customerPhone}
                            </div>
                          )}
                        </td>

                        {/* Items Summary */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 truncate max-w-[200px]" title={sale.items.map((i) => i.name).join(', ')}>
                            {totalItemsCount} pcs · {sale.items.map((i) => i.name).slice(0, 2).join(', ')}{sale.items.length > 2 ? '...' : ''}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            By {sale.salesAssociate || sale.cashierName}
                          </div>
                        </td>

                        {/* Payment Mode */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {sale.paymentMode === 'Cash' && <Banknote className="w-3 h-3 text-emerald-600" />}
                            {sale.paymentMode === 'UPI' && <QrCode className="w-3 h-3 text-indigo-600" />}
                            {sale.paymentMode === 'Card' && <CreditCard className="w-3 h-3 text-purple-600" />}
                            {sale.paymentMode === 'Split' && <Sparkles className="w-3 h-3 text-amber-600" />}
                            <span>{sale.paymentMode}</span>
                          </span>
                        </td>

                        {/* GST / Tax */}
                        <td className="py-3 px-3 text-right font-mono text-slate-600 text-xs">
                          {sale.taxTotal > 0 ? `₹${sale.taxTotal.toFixed(2)}` : '—'}
                        </td>

                        {/* Grand Total */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-black text-slate-900 font-mono text-sm">
                            ₹{sale.grandTotal.toFixed(2)}
                          </div>
                          {sale.itemDiscountsTotal > 0 && (
                            <div className="text-[10px] text-emerald-700 font-mono">
                              Saved ₹{sale.itemDiscountsTotal.toFixed(0)}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handlePrintReceipt(sale)}
                              title="Print Thermal Receipt"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(sale)}
                              title="Edit Sale / Receipt Items"
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleWhatsAppReceipt(sale)}
                              title="Send to WhatsApp"
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Line Items Detail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-extrabold text-xs text-slate-900">
                                  Items Breakdown for {sale.invoiceNumber}
                                </span>
                                <div className="text-xs text-slate-500">
                                  Cashier: <span className="font-bold text-slate-700">{sale.cashierName}</span> · Sales Staff: <span className="font-bold text-slate-700">{sale.salesAssociate || 'N/A'}</span>
                                </div>
                              </div>

                              <div className="divide-y divide-slate-100">
                                {sale.items.map((it, idx) => (
                                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                    <div>
                                      <span className="font-bold text-slate-900">{it.name}</span>
                                      <span className="text-slate-500 ml-2 font-mono text-[11px]">
                                        {it.color} · Size: <span className="font-semibold text-slate-700">{it.size}</span>
                                      </span>
                                      {it.alteration?.needed && (
                                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                          Alteration: {it.alteration.notes}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-mono text-slate-700 flex items-center gap-4">
                                      <span>
                                        {it.qty} pcs @ ₹{it.unitPrice.toFixed(0)}
                                        {it.discountPercent > 0 && ` (-${it.discountPercent}%)`}
                                      </span>
                                      <span className="font-bold text-slate-900 w-20 text-right">
                                        ₹{it.total.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {sale.notes && (
                                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                                  <span className="font-bold">Notes:</span> {sale.notes}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Sale Modal */}
      {isEditModalOpen && (
        <EditSaleModal
          sale={editingSale}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSale(null);
          }}
        />
      )}
    </div>
  );
};
