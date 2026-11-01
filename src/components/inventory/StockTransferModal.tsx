import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StockTransferOrder, StockTransferStatus, StockTransferItem, Product } from '../../types';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  ArrowLeftRight,
  Truck,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Package,
  Search,
  Check,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUserName: string;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  products,
  currentUserName,
}) => {
  const {
    storeBranches,
    stockTransfers,
    createStockTransfer,
    updateStockTransferStatus,
    receiveStockTransfer,
    activeCompany,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'transfers' | 'create'>('transfers');

  // Create Transfer Form State
  const [sourceBranch, setSourceBranch] = useState(storeBranches[0] || 'Main Flagship Store');
  const [destinationBranch, setDestinationBranch] = useState(storeBranches[1] || 'Boutique Outlet');
  const [vehicleNo, setVehicleNo] = useState('');
  const [notes, setNotes] = useState('');
  const [transferItems, setTransferItems] = useState<{ product: Product; qty: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Receive Verification Modal State
  const [receivingTransfer, setReceivingTransfer] = useState<StockTransferOrder | null>(null);
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Filter products for picker
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 8);
    const q = productSearch.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q))
      .slice(0, 10);
  }, [products, productSearch]);

  const handleAddItemToTransfer = (prod: Product) => {
    setTransferItems((prev) => {
      const exists = prev.find((i) => i.product.id === prod.id);
      if (exists) {
        return prev.map((i) => (i.product.id === prod.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { product: prod, qty: 1 }];
    });
  };

  const handleUpdateItemQty = (prodId: string, qty: number) => {
    setTransferItems((prev) =>
      prev.map((i) => (i.product.id === prodId ? { ...i, qty: Math.max(1, qty) } : i))
    );
  };

  const handleRemoveItem = (prodId: string) => {
    setTransferItems((prev) => prev.filter((i) => i.product.id !== prodId));
  };

  const handleCreateTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferItems.length === 0) {
      showToast('Please add at least 1 garment to the transfer.');
      return;
    }
    if (sourceBranch === destinationBranch) {
      showToast('Source and destination branch cannot be the same.');
      return;
    }

    const items: StockTransferItem[] = transferItems.map((ti) => ({
      productId: ti.product.id,
      sku: ti.product.sku,
      barcode: ti.product.barcode,
      name: ti.product.name,
      size: ti.product.size,
      color: ti.product.color,
      category: ti.product.category,
      qtyDispatched: ti.qty,
    }));

    const totalDispatchedQty = items.reduce((sum, i) => sum + i.qtyDispatched, 0);

    const created = createStockTransfer({
      sourceBranch,
      destinationBranch,
      dispatchedBy: currentUserName,
      status: 'in_transit',
      items,
      totalDispatchedQty,
      vehicleOrChallanNo: vehicleNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    showToast(`Stock Transfer ${created.transferNumber} dispatched! Inventory deducted.`);
    setTransferItems([]);
    setVehicleNo('');
    setNotes('');
    setActiveTab('transfers');
  };

  // Open Receive Verification
  const handleOpenReceive = (transfer: StockTransferOrder) => {
    setReceivingTransfer(transfer);
    const initialMap: Record<string, number> = {};
    transfer.items.forEach((item) => {
      initialMap[item.productId] = item.qtyDispatched;
    });
    setReceivedQtyMap(initialMap);
  };

  const handleCommitReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingTransfer) return;

    const receivedPayload = receivingTransfer.items.map((item) => ({
      productId: item.productId,
      qtyReceived: receivedQtyMap[item.productId] ?? item.qtyDispatched,
    }));

    const result = receiveStockTransfer(receivingTransfer.id, receivedPayload, currentUserName);
    showToast(result.message);
    setReceivingTransfer(null);
  };

  // 58mm Thermal Delivery Challan / Gate Pass
  const handlePrintChallan = (transfer: StockTransferOrder) => {
    const formattedDate = new Date(transfer.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = new Date(transfer.date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const receiptHtml = `
      <div style="font-family: monospace; font-size: 11px; line-height: 1.3; text-align: center; color: #000; width: 58mm; margin: 0 auto; padding: 2px;">
        <div style="font-weight: bold; font-size: 13px;">${activeCompany.name.toUpperCase()}</div>
        <div style="font-size: 9px; margin-top: 1px;">STOCK TRANSFER DELIVERY CHALLAN</div>
        <div style="font-size: 8px;">GATE PASS & IN-TRANSIT DISPATCH</div>
        <hr style="border: 0; border-top: 1px dashed #000; margin: 4px 0;" />
        
        <div style="text-align: left; font-size: 9px;">
          <div><b>Challan No:</b> ${transfer.transferNumber}</div>
          <div><b>Date/Time:</b> ${formattedDate}, ${formattedTime}</div>
          <div><b>From:</b> ${transfer.sourceBranch}</div>
          <div><b>To:</b> ${transfer.destinationBranch}</div>
          ${transfer.vehicleOrChallanNo ? `<div><b>Vehicle:</b> ${transfer.vehicleOrChallanNo}</div>` : ''}
          <div><b>Dispatched By:</b> ${transfer.dispatchedBy}</div>
        </div>

        <hr style="border: 0; border-top: 1px dashed #000; margin: 4px 0;" />
        <div style="text-align: left; font-weight: bold; font-size: 9px;">DISPATCHED GARMENTS:</div>
        <table style="width: 100%; font-size: 9px; text-align: left; border-collapse: collapse; margin-top: 2px;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="padding: 2px 0;">Item</th>
              <th style="text-align: right; padding: 2px 0;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${transfer.items
              .map(
                (item) => `
                <tr>
                  <td style="padding: 2px 0;">
                    ${item.name}<br/>
                    <span style="font-size: 8px; color: #444;">${item.sku} [${item.size}, ${item.color}]</span>
                  </td>
                  <td style="text-align: right; font-weight: bold; vertical-align: top; padding: 2px 0;">
                    ${item.qtyDispatched}
                  </td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>

        <hr style="border: 0; border-top: 1px dashed #000; margin: 4px 0;" />
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
          <span>TOTAL UNITS:</span>
          <span>${transfer.totalDispatchedQty} pcs</span>
        </div>

        ${transfer.notes ? `<div style="text-align: left; font-size: 8px; margin-top: 4px;"><b>Note:</b> ${transfer.notes}</div>` : ''}

        <div style="margin-top: 16px; display: flex; justify-content: space-between; font-size: 8px; text-align: center;">
          <div style="border-top: 1px solid #000; width: 45%; padding-top: 2px;">Dispatch Sign</div>
          <div style="border-top: 1px solid #000; width: 45%; padding-top: 2px;">Receiver Sign</div>
        </div>
        <div style="font-size: 7px; margin-top: 8px; text-align: center;">Garment OS Multi-Branch Logistics</div>
      </div>
    `;

    printThermalReceiptHtml(receiptHtml);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Multi-Branch Stock Transfer (STO) & Logistics</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transfer garments between retail branches, track in-transit consignments, and print delivery challans.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('transfers')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'transfers'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Transfers List ({stockTransfers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'create'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dispatch Transfer</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between px-5">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)} className="underline text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'transfers' && (
            <div className="space-y-4">
              {stockTransfers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                  <Package className="w-8 h-8 mx-auto opacity-50" />
                  <p>No stock transfer orders recorded yet.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg cursor-pointer"
                  >
                    + Create First Transfer
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stockTransfers.map((transfer) => {
                    const isReceived = transfer.status === 'received';
                    const isInTransit = transfer.status === 'in_transit' || transfer.status === 'dispatched';
                    const isDiscrepancy = transfer.status === 'discrepancy';

                    return (
                      <div
                        key={transfer.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {transfer.transferNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isReceived
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isDiscrepancy
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                              }`}
                            >
                              {transfer.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-medium">
                            <button
                              onClick={() => handlePrintChallan(transfer)}
                              className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print Challan</span>
                            </button>

                            {isInTransit && (
                              <button
                                onClick={() => handleOpenReceive(transfer)}
                                className="px-3 py-1 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify & Receive</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Route Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">From (Source):</div>
                            <div className="font-bold text-slate-800">{transfer.sourceBranch}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Dispatched by {transfer.dispatchedBy} on{' '}
                              {new Date(transfer.date).toLocaleDateString('en-IN')}
                            </div>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">To (Destination):</div>
                            <div className="font-bold text-slate-800">{transfer.destinationBranch}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {transfer.receivedBy
                                ? `Received by ${transfer.receivedBy} on ${new Date(transfer.receivedAt!).toLocaleDateString('en-IN')}`
                                : 'Pending delivery verification'}
                            </div>
                          </div>
                        </div>

                        {/* Items Summary Table */}
                        <div className="border border-slate-100 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold">
                              <tr>
                                <th className="py-1.5 px-3">Garment</th>
                                <th className="py-1.5 px-2">Size / Color</th>
                                <th className="py-1.5 px-2 text-right">Dispatched</th>
                                {transfer.receivedAt && <th className="py-1.5 px-2 text-right">Received</th>}
                                {transfer.receivedAt && <th className="py-1.5 px-3 text-right">Variance</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {transfer.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="py-1.5 px-3 font-semibold text-slate-800">
                                    {item.name}
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      {item.sku}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2 text-slate-600">
                                    {item.size} • {item.color}
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-800">
                                    {item.qtyDispatched}
                                  </td>
                                  {transfer.receivedAt && (
                                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-800">
                                      {item.qtyReceived ?? item.qtyDispatched}
                                    </td>
                                  )}
                                  {transfer.receivedAt && (
                                    <td
                                      className={`py-1.5 px-3 text-right font-mono font-bold ${
                                        (item.variance ?? 0) < 0
                                          ? 'text-rose-600'
                                          : (item.variance ?? 0) > 0
                                          ? 'text-emerald-600'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {item.variance ? (item.variance > 0 ? `+${item.variance}` : item.variance) : '0'}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {transfer.vehicleOrChallanNo && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            Vehicle / Gate Pass: <strong>{transfer.vehicleOrChallanNo}</strong>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateTransferSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Source Branch (From)</label>
                  <select
                    value={sourceBranch}
                    onChange={(e) => setSourceBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
                  >
                    {storeBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination Branch (To)</label>
                  <select
                    value={destinationBranch}
                    onChange={(e) => setDestinationBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
                  >
                    {storeBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle / Challan Reference</label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    placeholder="e.g. HR-05-CH-4412 (Logistics Van)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transfer Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Weekend footfall replenishment"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Garment Item Picker */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Select Garments to Dispatch</span>
                </span>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search catalog by garment name, SKU, or barcode..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Search Quick Picks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddItemToTransfer(p)}
                      className="p-2 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition-colors cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 truncate max-w-[200px]">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.sku} • {p.size}, {p.color} • Stock: {p.stock}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Selected for Dispatch Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-slate-100/70 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                  <span>Transfer Dispatch Manifest ({transferItems.length} styles)</span>
                  <span className="font-mono text-indigo-700">
                    Total: {transferItems.reduce((s, i) => s + i.qty, 0)} units
                  </span>
                </div>

                {transferItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No garments added to transfer manifest yet. Use the picker above.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold">
                      <tr>
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-2">Size / Color</th>
                        <th className="py-2 px-2">Store Stock</th>
                        <th className="py-2 px-2 text-right">Transfer Qty</th>
                        <th className="py-2 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transferItems.map(({ product, qty }) => (
                        <tr key={product.id}>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {product.name}
                            <span className="text-[10px] text-slate-400 block font-mono">{product.sku}</span>
                          </td>
                          <td className="py-2 px-2 text-slate-600">
                            {product.size} • {product.color}
                          </td>
                          <td className="py-2 px-2 font-mono text-slate-500">{product.stock} pcs</td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min={1}
                              max={product.stock}
                              value={qty}
                              onChange={(e) =>
                                handleUpdateItemQty(product.id, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-16 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(product.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('transfers')}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferItems.length === 0}
                  className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Dispatch Stock & Generate Challan</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* RECEIVE VERIFICATION MODAL OVERLAY */}
        {receivingTransfer && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Verify & Receive: {receivingTransfer.transferNumber}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Count incoming pieces from {receivingTransfer.sourceBranch}.
                  </p>
                </div>
                <button
                  onClick={() => setReceivingTransfer(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCommitReceive} className="space-y-4 text-xs">
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Garment</th>
                        <th className="py-2 px-2 text-right">Dispatched</th>
                        <th className="py-2 px-2 text-right">Physical Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receivingTransfer.items.map((item) => (
                        <tr key={item.productId}>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {item.name}
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {item.size} • {item.color}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-600">
                            {item.qtyDispatched}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <input
                              type="number"
                              min={0}
                              value={receivedQtyMap[item.productId] ?? item.qtyDispatched}
                              onChange={(e) =>
                                setReceivedQtyMap((prev) => ({
                                  ...prev,
                                  [item.productId]: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              className="w-16 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded font-mono font-bold text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReceivingTransfer(null)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Receipt & Update Stock</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
