import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleTransaction, CreditNote, CreditNoteItem } from '../../types';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import { CreditNotePreviewModal } from './CreditNotePreviewModal';
import {
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  Printer,
  Calendar,
  CreditCard,
  Building2,
  Tag,
  ArrowRight,
  ShieldAlert,
  Camera,
} from 'lucide-react';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';

export const ReturnsExchangeManager: React.FC = () => {
  const { sales, creditNotes, issueCreditNote, activeCompany } = useApp();

  const [activeTab, setActiveTab] = useState<'returns' | 'credit-notes'>('returns');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [matchedSale, setMatchedSale] = useState<SaleTransaction | null>(null);
  const [previewCreditNote, setPreviewCreditNote] = useState<CreditNote | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Return Form State
  const [returnItems, setReturnItems] = useState<{
    [itemIndex: number]: {
      selected: boolean;
      qty: number;
      reason: string;
      isDefective: boolean;
    };
  }>({});

  const [returnNotes, setReturnNotes] = useState('Size mismatch exchange - Credit voucher issued');

  const executeInvoiceLookup = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    const match = sales.find(
      (s) =>
        s.invoiceNumber.toLowerCase() === q ||
        s.customerPhone.includes(q) ||
        s.customerName.toLowerCase().includes(q)
    );

    if (match) {
      setMatchedSale(match);
      const initialMap: typeof returnItems = {};
      match.items.forEach((item, idx) => {
        initialMap[idx] = {
          selected: false,
          qty: 1,
          reason: 'Size Mismatch (Fitting Issue)',
          isDefective: false,
        };
      });
      setReturnItems(initialMap);
    } else {
      alert(`No sales transaction found matching "${query}". Try full invoice number (e.g. ${sales[0]?.invoiceNumber || 'INV-VTA-1044'}).`);
    }
  };

  const handleSearchInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    executeInvoiceLookup(invoiceSearchQuery);
  };

  const handleCameraScanInvoice = (scannedText: string) => {
    setInvoiceSearchQuery(scannedText);
    executeInvoiceLookup(scannedText);
  };

  const sampleInvoiceCodes = sales.slice(0, 4).map((s) => ({
    label: `${s.customerName} (${s.invoiceNumber})`,
    code: s.invoiceNumber,
    type: 'Invoice QR',
  }));

  const handleToggleItem = (idx: number) => {
    setReturnItems((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        selected: !prev[idx]?.selected,
      },
    }));
  };

  // Calculate return credit amount
  let totalCreditAmount = 0;
  const itemsToReturn: CreditNoteItem[] = [];

  if (matchedSale) {
    matchedSale.items.forEach((item, idx) => {
      const config = returnItems[idx];
      if (config?.selected) {
        const itemUnitPrice = item.unitPrice * (1 - item.discountPercent / 100);
        const itemRefundTotal = itemUnitPrice * config.qty;
        totalCreditAmount += itemRefundTotal;
        itemsToReturn.push({
          productName: item.name,
          sku: item.sku,
          size: item.size,
          color: item.color,
          qty: config.qty,
          amount: itemRefundTotal,
          reason: config.reason,
          isDefective: config.isDefective,
        });
      }
    });
  }

  const handleConfirmIssueCreditNote = () => {
    if (!matchedSale || itemsToReturn.length === 0) return;

    const expiry = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const note = issueCreditNote({
      originalInvoiceNumber: matchedSale.invoiceNumber,
      companyId: matchedSale.companyId,
      companyName: matchedSale.companyName,
      customerName: matchedSale.customerName,
      customerPhone: matchedSale.customerPhone,
      amount: Math.round(totalCreditAmount),
      expiryDate: expiry,
      itemsReturned: itemsToReturn,
      notes: returnNotes,
    });

    // Open 58mm Credit Note preview modal
    setPreviewCreditNote(note);
    setMatchedSale(null);
    setInvoiceSearchQuery('');
    setActiveTab('credit-notes');
  };

  const handlePrintCreditNote = (note: CreditNote) => {
    setPreviewCreditNote(note);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-600" />
            Garment Returns, Exchanges & Store Credit Notes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Process size swaps, defective fabric quarantine, and issue redeemable 50mm Store Credit vouchers.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'returns'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Process Return / Exchange
          </button>
          <button
            onClick={() => setActiveTab('credit-notes')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'credit-notes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Credit Notes ({creditNotes.filter((c) => c.status === 'active').length})
          </button>
        </div>
      </div>

      {/* TAB 1: PROCESS RETURN / EXCHANGE */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          {/* Invoice Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Lookup Original Customer Invoice
            </h3>
            <form onSubmit={handleSearchInvoice} className="flex flex-wrap sm:flex-nowrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  placeholder="Enter full bill number (e.g. INV-VTA-1044) or customer mobile number..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                title="Scan QR Code or Barcode from customer receipt"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Receipt QR</span>
              </button>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer shrink-0"
              >
                Find Invoice
              </button>
            </form>
          </div>

          {/* Matched Sale Details */}
          {matchedSale && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {matchedSale.invoiceNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {matchedSale.companyName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Customer: <strong>{matchedSale.customerName}</strong> ({matchedSale.customerPhone}) · Bill Date: {new Date(matchedSale.date).toLocaleDateString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500">Original Total:</span>
                  <div className="font-mono text-base font-bold text-slate-900">
                    ₹{matchedSale.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Garments Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Garment(s) Being Returned / Exchanged:
                </span>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {matchedSale.items.map((item, idx) => {
                    const isSelected = returnItems[idx]?.selected;
                    const config = returnItems[idx] || {
                      qty: 1,
                      reason: 'Size Mismatch',
                      isDefective: false,
                    };

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 transition-colors ${
                          isSelected ? 'bg-indigo-50/60' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleItem(idx)}
                              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <div className="font-bold text-xs text-slate-900">{item.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Size: <strong className="text-slate-800">{item.size}</strong> · Color: {item.color} · SKU: {item.sku}
                              </div>
                            </div>
                          </label>

                          <div className="text-right font-mono text-xs font-bold text-slate-900">
                            ₹{(item.unitPrice * (1 - item.discountPercent / 100)).toFixed(2)}
                          </div>
                        </div>

                        {/* Configuration Row if selected */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-600 font-medium mb-1">
                                Return Qty:
                              </label>
                              <select
                                value={config.qty}
                                onChange={(e) =>
                                  setReturnItems((prev) => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], qty: Number(e.target.value) },
                                  }))
                                }
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                              >
                                {Array.from({ length: item.qty }, (_, i) => i + 1).map((n) => (
                                  <option key={n} value={n}>
                                    {n} pc{n > 1 ? 's' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-600 font-medium mb-1">
                                Return Reason:
                              </label>
                              <select
                                value={config.reason}
                                onChange={(e) =>
                                  setReturnItems((prev) => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], reason: e.target.value },
                                  }))
                                }
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                              >
                                <option value="Size Mismatch (Fitting Issue)">Size Mismatch (Fitting Issue)</option>
                                <option value="Defective / Torn Fabric / Stained">Defective / Stained Fabric</option>
                                <option value="Customer Preference / Color Exchange">Customer Style/Color Change</option>
                                <option value="Exchange for Different Garment">Exchange for Different Style</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-600 font-medium mb-1">
                                Stock Action:
                              </label>
                              <label className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={config.isDefective}
                                  onChange={(e) =>
                                    setReturnItems((prev) => ({
                                      ...prev,
                                      [idx]: { ...prev[idx], isDefective: e.target.checked },
                                    }))
                                  }
                                  className="rounded text-rose-600 focus:ring-rose-500"
                                />
                                <span className={config.isDefective ? 'font-bold text-rose-700' : 'text-slate-600'}>
                                  {config.isDefective ? 'Quarantine Defective' : 'Restock to Floor'}
                                </span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Settlement & Store Credit Creation */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-600">Calculated Store Credit Value:</span>
                  <div className="text-2xl font-bold font-mono text-indigo-700 mt-0.5">
                    ₹{Math.round(totalCreditAmount).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Valid for 30 days · Redeemable against any future purchase
                  </div>
                </div>

                <button
                  onClick={handleConfirmIssueCreditNote}
                  disabled={itemsToReturn.length === 0}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Issue & Print 50mm Store Credit Note</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREDIT NOTES REGISTRY */}
      {activeTab === 'credit-notes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Voucher Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Original Bill</th>
                <th className="py-3 px-4">Issued & Valid Until</th>
                <th className="py-3 px-4 text-right">Initial Amount</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {creditNotes.map((cn) => (
                <tr key={cn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                    {cn.code}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{cn.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{cn.customerPhone}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {cn.originalInvoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-[11px]">
                    <div>{cn.issuedDate}</div>
                    <div className="text-slate-400">Expires: {cn.expiryDate}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    ₹{cn.amount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{cn.remainingAmount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        cn.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cn.status === 'used'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cn.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handlePrintCreditNote(cn)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                      title="Print 58mm Credit Note Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 58mm Credit Note Voucher Preview Modal */}
      <CreditNotePreviewModal
        isOpen={Boolean(previewCreditNote)}
        creditNote={previewCreditNote}
        onClose={() => setPreviewCreditNote(null)}
      />

      {/* Camera Barcode / QR Scanner Modal for Receipts */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleCameraScanInvoice}
        title="Invoice QR & Receipt Barcode Scanner"
        subtitle="Point camera at printed 50mm thermal receipt QR code or bill number"
        allowContinuous={false}
        defaultContinuous={false}
        sampleCodes={sampleInvoiceCodes}
      />
    </div>
  );
};
