import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleTransaction, SaleItem, SplitPaymentBreakdown, Product } from '../../types';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Save,
  Printer,
  AlertCircle,
  Receipt,
  User,
  Phone,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Search,
} from 'lucide-react';

interface EditSaleModalProps {
  sale: SaleTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: SaleTransaction) => void;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
  sale,
  isOpen,
  onClose,
  onSaved,
}) => {
  const {
    products,
    updateSale,
    setActiveReceipt,
    setIsReceiptModalOpen,
    salesAssociates,
    companies,
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [salesAssociate, setSalesAssociate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'UPI' | 'Split'>('Cash');
  const [cashTendered, setCashTendered] = useState<number | undefined>(undefined);
  const [splitBreakdown, setSplitBreakdown] = useState<SplitPaymentBreakdown>({
    cash: 0,
    upi: 0,
    card: 0,
  });

  const [items, setItems] = useState<SaleItem[]>([]);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever sale prop opens
  useEffect(() => {
    if (!sale) return;
    setCustomerName(sale.customerName || '');
    setCustomerPhone(sale.customerPhone === 'N/A' ? '' : sale.customerPhone || '');
    setSalesAssociate(sale.salesAssociate || '');
    setNotes(sale.notes || '');
    setPaymentMode(sale.paymentMode);
    setCashTendered(sale.cashTendered);
    setSplitBreakdown(
      sale.splitBreakdown || {
        cash: sale.paymentMode === 'Cash' ? sale.grandTotal : 0,
        upi: sale.paymentMode === 'UPI' ? sale.grandTotal : 0,
        card: sale.paymentMode === 'Card' ? sale.grandTotal : 0,
      }
    );
    setItems(sale.items.map((it) => ({ ...it })));
    setErrorMessage(null);
    setIsAddingProduct(false);
    setAddSearchQuery('');
  }, [sale, isOpen]);

  // Find company to check tax rate
  const company = useMemo(() => {
    if (!sale) return null;
    return companies.find((c) => c.id === sale.companyId) || null;
  }, [sale, companies]);

  // Recalculate totals
  const recalculatedTotals = useMemo(() => {
    let subtotal = 0;
    let itemDiscountsTotal = 0;
    let taxTotal = 0;

    const computedItems = items.map((it) => {
      const gross = it.unitPrice * it.qty;
      const discount = (gross * it.discountPercent) / 100;
      const net = gross - discount;
      const taxRate = company?.type === 'billed' ? it.taxRate : 0;
      const tax = (net * taxRate) / 100;
      const total = net + tax;

      subtotal += gross;
      itemDiscountsTotal += discount;
      taxTotal += tax;

      return {
        ...it,
        discountAmount: discount,
        taxAmount: tax,
        total,
      };
    });

    const loyaltyDiscountAmount = sale?.loyaltyDiscountAmount || 0;
    const couponDiscountAmount = sale?.couponDiscountAmount || 0;
    const creditNoteDiscountAmount = sale?.creditNoteDiscountAmount || 0;

    const grandTotal = Math.max(
      0,
      Math.round(
        subtotal -
          itemDiscountsTotal +
          taxTotal -
          loyaltyDiscountAmount -
          couponDiscountAmount -
          creditNoteDiscountAmount
      )
    );

    return {
      subtotal,
      itemDiscountsTotal,
      taxTotal,
      grandTotal,
      computedItems,
    };
  }, [items, company, sale]);

  if (!isOpen || !sale) return null;

  const originalGrandTotal = sale.grandTotal;
  const difference = recalculatedTotals.grandTotal - originalGrandTotal;

  // Change quantity
  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], qty: newQty };
      return updated;
    });
  };

  // Change discount
  const handleUpdateDiscount = (index: number, discountPercent: number) => {
    const valid = Math.max(0, Math.min(100, discountPercent));
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], discountPercent: valid };
      return updated;
    });
  };

  // Change unit price
  const handleUpdatePrice = (index: number, price: number) => {
    const valid = Math.max(0, price);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], unitPrice: valid };
      return updated;
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMessage('A sale receipt must contain at least one item. To cancel a sale completely, issue a return.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  // Add new product from catalog to existing sale
  const handleAddProduct = (product: Product) => {
    const existingIdx = items.findIndex((i) => i.productId === product.id);
    if (existingIdx !== -1) {
      handleUpdateQty(existingIdx, items[existingIdx].qty + 1);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        size: product.size,
        color: product.color,
        qty: 1,
        unitPrice: product.sellingPrice,
        discountPercent: 0,
        discountAmount: 0,
        taxRate: product.taxRate,
        taxAmount: 0,
        total: product.sellingPrice,
      };
      setItems((prev) => [...prev, newItem]);
    }
    setAddSearchQuery('');
    setIsAddingProduct(false);
  };

  // Filter available products for adding
  const searchResults = addSearchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
            p.barcode.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(addSearchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleSave = (andPrint: boolean = false) => {
    if (items.length === 0) {
      setErrorMessage('Sale must have at least one line item.');
      return;
    }

    if (paymentMode === 'Split') {
      const totalSplit = splitBreakdown.cash + splitBreakdown.upi + splitBreakdown.card;
      if (Math.abs(totalSplit - recalculatedTotals.grandTotal) > 0.5) {
        setErrorMessage(
          `Split payment amounts (₹${totalSplit.toFixed(2)}) must equal grand total ₹${recalculatedTotals.grandTotal.toFixed(2)}.`
        );
        return;
      }
    }

    const updatedSale: SaleTransaction = {
      ...sale,
      customerName: customerName.trim() || 'Walk-in Retail Shopper',
      customerPhone: customerPhone.trim() || 'N/A',
      salesAssociate: salesAssociate || undefined,
      notes: notes.trim() || undefined,
      paymentMode,
      cashTendered: paymentMode === 'Cash' ? (cashTendered || recalculatedTotals.grandTotal) : undefined,
      splitBreakdown: paymentMode === 'Split' ? splitBreakdown : undefined,
      subtotal: recalculatedTotals.subtotal,
      itemDiscountsTotal: recalculatedTotals.itemDiscountsTotal,
      taxTotal: recalculatedTotals.taxTotal,
      grandTotal: recalculatedTotals.grandTotal,
      items: recalculatedTotals.computedItems,
    };

    updateSale(updatedSale);
    if (onSaved) onSaved(updatedSale);

    if (andPrint) {
      setActiveReceipt(updatedSale);
      setIsReceiptModalOpen(true);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
              <Receipt className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">
                  Edit Sale Bill: {sale.invoiceNumber}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {sale.companyName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Billed on {new Date(sale.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(sale.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Customer & Staff Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Customer Name</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Shopper"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Customer Phone</span>
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Sales Associate</span>
              </label>
              <select
                value={salesAssociate}
                onChange={(e) => setSalesAssociate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {salesAssociates.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Invoice Line Items</span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </h4>

              <button
                type="button"
                onClick={() => setIsAddingProduct(!isAddingProduct)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item to Bill</span>
              </button>
            </div>

            {/* Add Product Search Dropdown Drawer */}
            {isAddingProduct && (
              <div className="mb-3 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-indigo-500" />
                  <input
                    type="text"
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    placeholder="Search by product name, barcode or SKU to add..."
                    autoFocus
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-sm max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleAddProduct(p)}
                        className="p-2 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{p.name}</span>
                          <span className="text-slate-500 ml-2 font-mono text-[11px]">
                            {p.color} · Size: {p.size}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700">₹{p.sellingPrice.toFixed(2)}</span>
                          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                            + Add
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2 text-center w-28">Quantity</th>
                    <th className="py-2.5 px-3 text-right w-24">Rate (₹)</th>
                    <th className="py-2.5 px-2 text-center w-24">Disc %</th>
                    <th className="py-2.5 px-3 text-right w-28">Line Total</th>
                    <th className="py-2.5 px-2 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const gross = it.unitPrice * it.qty;
                    const disc = (gross * it.discountPercent) / 100;
                    const net = gross - disc;
                    const taxRate = company?.type === 'billed' ? it.taxRate : 0;
                    const tax = (net * taxRate) / 100;
                    const lineTot = net + tax;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{it.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {it.color} · Size: <span className="font-semibold text-slate-700">{it.size}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, it.qty - 1)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={it.qty}
                              onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 1)}
                              className="w-10 text-center font-bold text-xs py-1 border border-slate-200 rounded-md font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, it.qty + 1)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.unitPrice}
                            onChange={(e) => handleUpdatePrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 text-right font-mono font-bold py-1 px-1.5 border border-slate-200 rounded-md text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={it.discountPercent}
                            onChange={(e) => handleUpdateDiscount(idx, parseFloat(e.target.value) || 0)}
                            className="w-14 text-center font-mono py-1 px-1 border border-slate-200 rounded-md text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{lineTot.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Payment Method & Split Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-2">Payment Mode</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Cash', 'UPI', 'Card', 'Split'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-1 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                      paymentMode === mode
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {paymentMode === 'Split' && (
                <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 mb-1">Split Payment Breakdown:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Cash (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={splitBreakdown.cash}
                        onChange={(e) =>
                          setSplitBreakdown({ ...splitBreakdown, cash: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1 border border-slate-200 rounded font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">UPI (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={splitBreakdown.upi}
                        onChange={(e) =>
                          setSplitBreakdown({ ...splitBreakdown, upi: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1 border border-slate-200 rounded font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Card (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={splitBreakdown.card}
                        onChange={(e) =>
                          setSplitBreakdown({ ...splitBreakdown, card: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-2 py-1 border border-slate-200 rounded font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Invoice Notes / Remarks</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional customer notes, exchange reason, special discount details..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 4: Financial Summary & Reconciliation */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 text-xs text-slate-600">
              <div>Subtotal: <span className="font-mono font-bold text-slate-900">₹{recalculatedTotals.subtotal.toFixed(2)}</span></div>
              {recalculatedTotals.itemDiscountsTotal > 0 && (
                <div className="text-emerald-700">
                  Item Discounts: <span className="font-mono font-bold">-₹{recalculatedTotals.itemDiscountsTotal.toFixed(2)}</span>
                </div>
              )}
              {recalculatedTotals.taxTotal > 0 && (
                <div>GST / Tax: <span className="font-mono font-bold text-slate-900">₹{recalculatedTotals.taxTotal.toFixed(2)}</span></div>
              )}
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">New Payable Grand Total</div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                ₹{recalculatedTotals.grandTotal.toFixed(2)}
              </div>
              {difference !== 0 && (
                <div
                  className={`text-xs font-bold mt-0.5 ${
                    difference > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {difference > 0 ? `+₹${difference.toFixed(2)} due from customer` : `-₹${Math.abs(difference).toFixed(2)} refund/credit to customer`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Save & Print Updated Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
