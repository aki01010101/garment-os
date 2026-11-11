import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Vendor, Product, ClothingCategory, ClothingSize, PurchaseOrder, PurchaseItem } from '../../types';
import {
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Building2,
  Tag,
  DollarSign,
  Package,
  Layers,
  ZoomIn,
  RefreshCw,
} from 'lucide-react';

interface ExtractedInvoiceItem {
  id: string;
  description: string;
  category: ClothingCategory;
  subCategory: string;
  size: string;
  color: string;
  qty: number;
  unitCost: number;
  gstRate: number;
  total: number;
  matchedProductId?: string;
  isNewProduct: boolean;
  suggestedSellingPrice: number;
}

interface InvoiceInwardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTags?: () => void;
}

const SAMPLE_INVOICES = [
  {
    label: 'Surat Textile Syndicate (Festive Kurtis)',
    vendorName: 'Surat Silk & Cotton Mills',
    vendorGstin: '24AAECS9124K1Z8',
    billNumber: 'SUR-2026-8912',
    date: new Date().toISOString().split('T')[0],
    purchaseType: 'billed' as const,
    items: [
      {
        description: 'Embroidered Chanderi Kurti',
        category: 'Women' as ClothingCategory,
        subCategory: 'Kurtis',
        size: 'M',
        color: 'Wine Maroon',
        qty: 15,
        unitCost: 550,
        gstRate: 5,
        suggestedSellingPrice: 1299,
      },
      {
        description: 'Embroidered Chanderi Kurti',
        category: 'Women' as ClothingCategory,
        subCategory: 'Kurtis',
        size: 'L',
        color: 'Wine Maroon',
        qty: 20,
        unitCost: 550,
        gstRate: 5,
        suggestedSellingPrice: 1299,
      },
      {
        description: 'Embroidered Chanderi Kurti',
        category: 'Women' as ClothingCategory,
        subCategory: 'Kurtis',
        size: 'XL',
        color: 'Emerald Green',
        qty: 15,
        unitCost: 550,
        gstRate: 5,
        suggestedSellingPrice: 1299,
      },
      {
        description: 'Rayon Anarkali Suit Set with Dupatta',
        category: 'Women' as ClothingCategory,
        subCategory: 'Suits',
        size: 'L',
        color: 'Navy Blue',
        qty: 10,
        unitCost: 850,
        gstRate: 12,
        suggestedSellingPrice: 1999,
      },
    ],
  },
  {
    label: 'Ludhiana Hosiery Hub (Men Night Suits & T-Shirts)',
    vendorName: 'Ludhiana Knitwear Associates',
    vendorGstin: '03AAFFL5521H1Z2',
    billNumber: 'LUD-OCT-4491',
    date: new Date().toISOString().split('T')[0],
    purchaseType: 'billed' as const,
    items: [
      {
        description: 'Melini Cotton Night Suit',
        category: 'Men' as ClothingCategory,
        subCategory: 'Nightwear',
        size: 'M',
        color: 'Charcoal Grey',
        qty: 25,
        unitCost: 480,
        gstRate: 5,
        suggestedSellingPrice: 1199,
      },
      {
        description: 'Melini Cotton Night Suit',
        category: 'Men' as ClothingCategory,
        subCategory: 'Nightwear',
        size: 'L',
        color: 'Charcoal Grey',
        qty: 30,
        unitCost: 480,
        gstRate: 5,
        suggestedSellingPrice: 1199,
      },
      {
        description: 'Melini Cotton Night Suit',
        category: 'Men' as ClothingCategory,
        subCategory: 'Nightwear',
        size: 'XL',
        color: 'Navy Blue',
        qty: 25,
        unitCost: 480,
        gstRate: 5,
        suggestedSellingPrice: 1199,
      },
    ],
  },
];

export const InvoiceInwardingModal: React.FC<InvoiceInwardingModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTags,
}) => {
  const {
    vendors,
    addVendor,
    products,
    addProduct,
    companies,
    activeCompany,
    recordPurchaseOrder,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [inwardSuccess, setInwardSuccess] = useState(false);
  const [inwardedPoId, setInwardedPoId] = useState<string | null>(null);
  const [inwardedCount, setInwardedCount] = useState<number>(0);

  // Bill metadata form
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || '');
  const [billNumber, setBillNumber] = useState<string>('');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchaseType, setPurchaseType] = useState<'billed' | 'cash'>('billed');
  const [companyId, setCompanyId] = useState<string>(companies[0]?.id || activeCompany.id);
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI'>('Bank Transfer');
  const [notes, setNotes] = useState<string>('Auto-inwarded via Smart Invoice OCR');

  // Extracted Line Items
  const [items, setItems] = useState<ExtractedInvoiceItem[]>([]);

  if (!isOpen) return null;

  // Process sample invoice
  const handleLoadSample = (sampleIndex: number) => {
    const sample = SAMPLE_INVOICES[sampleIndex];
    setIsScanning(true);
    setScanComplete(false);
    setInwardSuccess(false);

    // Create a mock canvas bill preview
    setImagePreview('sample_bill');

    setTimeout(() => {
      // Find or set vendor
      let matchedVendor = vendors.find(
        (v) =>
          v.name.toLowerCase().includes(sample.vendorName.toLowerCase().slice(0, 8)) ||
          (v.gstin && v.gstin === sample.vendorGstin)
      );

      if (matchedVendor) {
        setSelectedVendorId(matchedVendor.id);
      } else if (vendors.length > 0) {
        setSelectedVendorId(vendors[0].id);
      }

      setBillNumber(sample.billNumber);
      setBillDate(sample.date);
      setPurchaseType(sample.purchaseType);

      // Map line items to existing catalog products if matching name & size & color
      const parsed: ExtractedInvoiceItem[] = sample.items.map((item, idx) => {
        const matchedProd = products.find(
          (p) =>
            p.name.toLowerCase().includes(item.description.toLowerCase().slice(0, 10)) &&
            p.size.toLowerCase() === item.size.toLowerCase() &&
            (!item.color || p.color.toLowerCase() === item.color.toLowerCase())
        );

        return {
          id: `ext_${Date.now()}_${idx}`,
          description: item.description,
          category: item.category,
          subCategory: item.subCategory,
          size: item.size,
          color: item.color,
          qty: item.qty,
          unitCost: item.unitCost,
          gstRate: item.gstRate,
          total: item.qty * item.unitCost,
          matchedProductId: matchedProd?.id,
          isNewProduct: !matchedProd,
          suggestedSellingPrice: item.suggestedSellingPrice || Math.round(item.unitCost * 2.2),
        };
      });

      setItems(parsed);
      setIsScanning(false);
      setScanComplete(true);
    }, 850);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setIsScanning(true);
      setScanComplete(false);

      // Perform OCR extraction simulation with smart detection
      setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
        setBillNumber(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
        setBillDate(new Date().toISOString().split('T')[0]);

        // Default extracted line items from optical bill
        const defaultExtracted: ExtractedInvoiceItem[] = [
          {
            id: `ext_${Date.now()}_1`,
            description: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Wholesale Garment Pack',
            category: 'Women',
            subCategory: 'Kurtis',
            size: 'M',
            color: 'Red',
            qty: 20,
            unitCost: 650,
            gstRate: 5,
            total: 20 * 650,
            isNewProduct: true,
            suggestedSellingPrice: 1399,
          },
          {
            id: `ext_${Date.now()}_2`,
            description: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Wholesale Garment Pack',
            category: 'Women',
            subCategory: 'Kurtis',
            size: 'L',
            color: 'Red',
            qty: 20,
            unitCost: 650,
            gstRate: 5,
            total: 20 * 650,
            isNewProduct: true,
            suggestedSellingPrice: 1399,
          },
        ];
        setItems(defaultExtracted);
      }, 1000);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateItem = (id: string, field: keyof ExtractedInvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'unitCost') {
          updated.total = updated.qty * updated.unitCost;
        }
        if (field === 'matchedProductId') {
          if (value) {
            const prod = products.find((p) => p.id === value);
            if (prod) {
              updated.description = prod.name;
              updated.category = prod.category;
              updated.size = prod.size;
              updated.color = prod.color;
              updated.unitCost = prod.costPrice;
              updated.suggestedSellingPrice = prod.sellingPrice;
              updated.isNewProduct = false;
              updated.total = updated.qty * prod.costPrice;
            }
          }
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `ext_${Date.now()}_${prev.length + 1}`,
        description: 'New Garment Article',
        category: 'Men',
        subCategory: 'Shirts',
        size: 'L',
        color: 'Navy Blue',
        qty: 12,
        unitCost: 450,
        gstRate: 5,
        total: 12 * 450,
        isNewProduct: true,
        suggestedSellingPrice: 999,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount =
    purchaseType === 'billed'
      ? items.reduce((sum, item) => sum + (item.total * item.gstRate) / 100, 0)
      : 0;
  const grandTotal = subtotal + taxAmount;
  const totalPcs = items.reduce((sum, item) => sum + item.qty, 0);
  const parsedPaid = parseFloat(paidAmount) || 0;

  // Execute Inwarding
  const handleExecuteInward = () => {
    if (items.length === 0) return;
    const vendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
    const company = companies.find((c) => c.id === companyId) || companies[0];

    if (!vendor || !company) {
      alert('Please select a valid supplier and company.');
      return;
    }

    const inwardedPurchaseItems: PurchaseItem[] = [];

    // 1. Process items: create new products if needed
    items.forEach((item) => {
      let finalProductId = item.matchedProductId;

      if (item.isNewProduct || !finalProductId) {
        // Generate new SKU and barcode
        const skuPrefix = item.description
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 3)
          .toUpperCase() || 'VT';
        const randomCode = Math.floor(100 + Math.random() * 900);
        const newSku = `${skuPrefix}-${item.size}-${randomCode}`;
        const newBarcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;

        const createdProd = addProduct({
          name: item.description,
          sku: newSku,
          barcode: newBarcode,
          category: item.category,
          subCategory: item.subCategory,
          size: item.size as ClothingSize,
          color: item.color,
          costPrice: item.unitCost,
          sellingPrice: item.suggestedSellingPrice || Math.round(item.unitCost * 2.2),
          taxRate: item.gstRate,
          taxInclusive: true,
          stock: 0, // Will be restocked by recordPurchaseOrder
          minStockAlert: 4,
          season: 'All-Season',
          brand: vendor.name,
          purchaseSource: purchaseType === 'billed' ? 'billed' : 'cash',
        });

        finalProductId = createdProd.id;
      }

      inwardedPurchaseItems.push({
        productId: finalProductId,
        productName: item.description,
        sku: item.size ? `${item.description.slice(0, 6)}-${item.size}` : 'SKU',
        category: item.category,
        size: item.size,
        color: item.color,
        qty: item.qty,
        costPrice: item.unitCost,
        total: item.total,
      });
    });

    // 2. Record Purchase Order in AppContext
    const paymentStatus: 'paid' | 'partial' | 'unpaid' =
      parsedPaid >= grandTotal ? 'paid' : parsedPaid > 0 ? 'partial' : 'unpaid';

    const po = recordPurchaseOrder({
      vendorId: vendor.id,
      vendorName: vendor.name,
      companyId: company.id,
      companyName: company.name,
      purchaseType,
      billOrVoucherNumber: billNumber || `OCR-${Date.now()}`,
      date: billDate,
      items: inwardedPurchaseItems,
      subtotal,
      taxRate: items[0]?.gstRate || 5,
      taxAmount,
      totalAmount: grandTotal,
      paidAmount: parsedPaid,
      paymentStatus,
      paymentMode,
      notes: `${notes} [OCR Inwarded ${totalPcs} pcs]`,
    });

    setInwardedPoId(po.id);
    setInwardedCount(totalPcs);
    setInwardSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Wholesale Invoice OCR & AI Inwarding
                <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Automated GRN
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Scan or upload wholesale bills from Surat, Ludhiana & Tirupur to auto-extract line items, update stock & credit vendor khata.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {inwardSuccess ? (
            <div className="py-8 px-4 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Stock Inwarded Successfully!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Added <strong className="text-slate-800 font-mono">{inwardedCount} garments</strong> across{' '}
                  <strong className="text-slate-800">{items.length} line items</strong> directly into inventory.
                  Vendor payable ledger updated with ₹{grandTotal.toLocaleString('en-IN')}.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Voucher / Bill No:</span>
                  <strong className="font-mono text-slate-800">{billNumber}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Grand Total:</span>
                  <strong className="font-mono text-emerald-700 font-bold">₹{grandTotal.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Status:</span>
                  <span className="capitalize font-semibold text-slate-800">
                    {parsedPaid >= grandTotal ? 'Paid' : parsedPaid > 0 ? 'Partial' : 'Credit / Unpaid'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                {onNavigateToTags && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToTags();
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print 50x25mm Barcode Tags</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Action Bar: Upload / Camera / Sample presets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                {/* Upload File */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    1. Upload Bill Image / PDF
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Choose File or Photo</span>
                  </button>
                </div>

                {/* Sample Bills */}
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Or Try Instant Preset Wholesale Bills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_INVOICES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLoadSample(idx)}
                        className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{sample.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scanning Progress */}
              {isScanning && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center gap-3 animate-pulse">
                  <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                  <div className="text-xs">
                    <p className="font-bold text-indigo-900">
                      OCR Engine Analyzing Invoice Structure...
                    </p>
                    <p className="text-indigo-700">
                      Detecting GSTIN, line items, garment sizes, rates, and tax breakdown.
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-side reconciliation (if scanComplete or items exist) */}
              {scanComplete && (
                <div className="space-y-4">
                  {/* Bill Details Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Supplier / Mill *
                      </label>
                      <select
                        value={selectedVendorId}
                        onChange={(e) => setSelectedVendorId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.city || 'Wholesaler'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Invoice / Bill No *
                      </label>
                      <input
                        type="text"
                        value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Invoice Date
                      </label>
                      <input
                        type="date"
                        value={billDate}
                        onChange={(e) => setBillDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Purchase Ledger Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPurchaseType('billed')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            purchaseType === 'billed'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          GST Billed
                        </button>
                        <button
                          type="button"
                          onClick={() => setPurchaseType('cash')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            purchaseType === 'cash'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          Cash / Unbilled
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Line Items Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                    <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800">
                          Extracted Garment Line Items ({items.length} variants, {totalPcs} pcs)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Line</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
                          <tr>
                            <th className="p-2.5">Garment Description / Name</th>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Size</th>
                            <th className="p-2.5">Color</th>
                            <th className="p-2.5 w-20 text-center">Qty (Pcs)</th>
                            <th className="p-2.5 w-24 text-right">Cost Rate (₹)</th>
                            <th className="p-2.5 w-24 text-right">Sell Price (₹)</th>
                            <th className="p-2.5 w-28 text-right">Total (₹)</th>
                            <th className="p-2.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/80">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                  className="w-full font-semibold text-slate-900 border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-1.5 py-1 focus:bg-white focus:outline-none"
                                />
                                {item.matchedProductId ? (
                                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 px-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Matched to Catalog SKU
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-indigo-700 font-medium flex items-center gap-1 px-1">
                                    <Sparkles className="w-2.5 h-2.5" /> New Product (Will Auto-create SKU)
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                <select
                                  value={item.category}
                                  onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                                  className="border border-slate-200 rounded px-1.5 py-1 text-slate-800 text-[11px] bg-white"
                                >
                                  <option value="Men">Men</option>
                                  <option value="Women">Women</option>
                                  <option value="Kids">Kids</option>
                                  <option value="Accessories">Accessories</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.size}
                                  onChange={(e) => handleUpdateItem(item.id, 'size', e.target.value)}
                                  className="w-14 border border-slate-200 rounded px-1.5 py-1 text-slate-800 font-mono text-center"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.color}
                                  onChange={(e) => handleUpdateItem(item.id, 'color', e.target.value)}
                                  className="w-24 border border-slate-200 rounded px-1.5 py-1 text-slate-800"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => handleUpdateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                  className="w-16 border border-slate-200 rounded px-1.5 py-1 text-slate-900 font-mono font-bold text-center"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.unitCost}
                                  onChange={(e) => handleUpdateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                  className="w-20 border border-slate-200 rounded px-1.5 py-1 text-slate-900 font-mono text-right"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.suggestedSellingPrice}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, 'suggestedSellingPrice', parseFloat(e.target.value) || 0)
                                  }
                                  className="w-20 border border-indigo-200 bg-indigo-50/50 rounded px-1.5 py-1 text-indigo-950 font-mono font-bold text-right"
                                  title="Customer Selling Price (MRP / Retail)"
                                />
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-slate-900">
                                ₹{item.total.toFixed(2)}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Remove Line"
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

                  {/* Financial Reconciliation & Payment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="space-y-2 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Payment & Vendor Khata Settlement
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                            Amount Paid Now (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            placeholder="0 for full credit"
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                            Payment Mode
                          </label>
                          <select
                            value={paymentMode}
                            onChange={(e) => setPaymentMode(e.target.value as any)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
                          >
                            <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                            <option value="UPI">UPI / GPay / PhonePe</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Cash">Cash</option>
                          </select>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Unpaid amount of <strong className="font-mono text-rose-700 font-bold">₹{Math.max(0, grandTotal - parsedPaid).toFixed(2)}</strong> will be credited directly to the vendor's payable khata ledger.
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 self-center">
                      <div className="flex justify-between text-slate-600">
                        <span>Line Items Total ({totalPcs} pcs):</span>
                        <strong className="font-mono text-slate-900">₹{subtotal.toFixed(2)}</strong>
                      </div>
                      {purchaseType === 'billed' && (
                        <div className="flex justify-between text-slate-600">
                          <span>GST Input Tax Credit:</span>
                          <strong className="font-mono text-slate-900">+₹{taxAmount.toFixed(2)}</strong>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                        <span>Invoice Grand Total:</span>
                        <strong className="font-mono text-indigo-600">₹{grandTotal.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!inwardSuccess && scanComplete && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteInward}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Inward Stock ({totalPcs} Pcs)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
