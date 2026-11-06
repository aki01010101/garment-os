import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import { CodePrintType } from '../../types';
import {
  Tag,
  Printer,
  Plus,
  Minus,
  Search,
  Check,
  Layers,
  Sliders,
  QrCode,
  Phone,
  RotateCcw,
} from 'lucide-react';

export const PriceTagGenerator: React.FC = () => {
  const { products, activeCompany, codePrintType, setCodePrintType } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // Map of productId -> quantity of tags to print
  const [tagQuantities, setTagQuantities] = useState<Record<string, number>>({
    prod_1: 4,
    prod_8: 2,
  });

  // Default brand name: Fantasy, and contact number: +919416109928
  const [brandTitle, setBrandTitle] = useState('Fantasy');
  const [contactNumber, setContactNumber] = useState('+919416109928');
  const [tagCodeType, setTagCodeType] = useState<CodePrintType>('qr');
  const [layoutMode, setLayoutMode] = useState<'roll' | 'sheet'>('roll');
  const [saleOfferPercentage, setSaleOfferPercentage] = useState<number>(0);

  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter((p) => {
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchQuery && matchCat;
  });

  const handleQtyChange = (productId: string, delta: number) => {
    setTagQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleSetAllFiltered = (count: number) => {
    setTagQuantities((prev) => {
      const next = { ...prev };
      filteredProducts.forEach((p) => {
        if (count === 0) {
          delete next[p.id];
        } else {
          next[p.id] = count;
        }
      });
      return next;
    });
  };

  // Compile list of tags to print
  const tagsToPrint: { product: (typeof products)[0]; index: number }[] = [];
  Object.entries(tagQuantities).forEach(([prodId, qty]) => {
    const product = products.find((p) => p.id === prodId);
    if (product && qty > 0) {
      for (let i = 0; i < qty; i++) {
        tagsToPrint.push({ product, index: i });
      }
    }
  });

  const handlePrintTags = () => {
    if (printRef.current) {
      printThermalReceiptHtml(printRef.current.innerHTML);
    } else {
      window.focus();
      window.print();
    }
  };

  const resetToBrandDefaults = () => {
    setBrandTitle('Fantasy');
    setContactNumber('+919416109928');
    setTagCodeType('qr');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            Clothing Price Tag & QR Code Generator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate and batch-print thermal apparel tags with &ldquo;Fantasy&rdquo; branding, contact number, QR code, size, category, and selling price.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600 font-medium">
            <span className="font-bold text-indigo-600 font-mono text-sm">{tagsToPrint.length}</span> labels queued
          </div>
          <button
            onClick={handlePrintTags}
            disabled={tagsToPrint.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print {tagsToPrint.length} Tags</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Product Selection & Batch Counts */}
        <div className="lg:col-span-7 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clothing by name, SKU, or barcode..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category Segmented Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
                {['All', 'Men', 'Women', 'Kids', 'Accessories'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>Showing {filteredProducts.length} items</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSetAllFiltered(1)}
                  className="px-2 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200 cursor-pointer"
                >
                  +1 to All Filtered
                </button>
                <button
                  onClick={() => handleSetAllFiltered(0)}
                  className="px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const count = tagQuantities[product.id] || 0;
                return (
                  <div
                    key={product.id}
                    className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors ${
                      count > 0 ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {product.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-800 rounded font-mono">
                          {product.size}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-600">{product.sku}</span>
                        <span>·</span>
                        <span>{product.category}</span>
                        <span>·</span>
                        <span>{product.color}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-900">₹{product.sellingPrice}</span>
                        <span>·</span>
                        <span className="text-slate-400">Stock: {product.stock}</span>
                      </div>
                    </div>

                    {/* Tag Quantity Counter */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleQtyChange(product.id, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setTagQuantities((prev) => ({
                            ...prev,
                            [product.id]: Math.max(0, val),
                          }));
                        }}
                        className="w-12 py-1 text-center font-mono text-xs font-bold border border-slate-200 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleQtyChange(product.id, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Tag Format Settings & Live Print Preview */}
        <div className="lg:col-span-5 space-y-4">
          {/* Format Settings Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                Tag Print Specifications
              </h3>
              <button
                type="button"
                onClick={resetToBrandDefaults}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Fantasy</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Brand Name on Tag
                  </label>
                  <input
                    type="text"
                    value={brandTitle}
                    onChange={(e) => setBrandTitle(e.target.value)}
                    placeholder="e.g. Fantasy"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+919416109928"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Printer Target
                  </label>
                  <select
                    value={layoutMode}
                    onChange={(e) => setLayoutMode(e.target.value as 'roll' | 'sheet')}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="roll">Thermal Roll (50x32mm)</option>
                    <option value="sheet">Avery Sheet (3 Across)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Promotional Tag (%)
                  </label>
                  <select
                    value={saleOfferPercentage}
                    onChange={(e) => setSaleOfferPercentage(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value={0}>Standard Price</option>
                    <option value={10}>10% Sale Offer</option>
                    <option value={20}>20% Sale Offer</option>
                    <option value={30}>30% Season Sale</option>
                    <option value={50}>50% Flat Clearance</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-600 font-semibold mb-1">
                  Tag Scannable Code Format:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTagCodeType('qr');
                      setCodePrintType('qr');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      tagCodeType === 'qr'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>2D QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTagCodeType('barcode');
                      setCodePrintType('barcode');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      tagCodeType === 'barcode'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>1D Barcode</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Container */}
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-inner">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-600">
              <span className="font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Live Print Preview (50mm x 32mm)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {tagsToPrint.length} tags queued
              </span>
            </div>

            {tagsToPrint.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg bg-white">
                Select items from the catalog on the left to preview generated price tags.
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[420px] p-2 flex flex-col items-center gap-3">
                <div ref={printRef} className="space-y-3">
                  {tagsToPrint.map(({ product, index }) => {
                    const discountedPrice =
                      saleOfferPercentage > 0
                        ? Math.round(product.sellingPrice * (1 - saleOfferPercentage / 100))
                        : product.sellingPrice;

                    return (
                      <div
                        key={`${product.id}-${index}`}
                        className="thermal-tag-roll border border-slate-300 shadow-sm bg-white rounded-xs p-1"
                        style={{
                          width: '50mm',
                          height: '32mm',
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '1.5mm',
                          background: '#ffffff',
                          overflow: 'hidden',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        }}
                      >
                        {/* 1. Top Header: Brand Name "Fantasy" & Contact Number */}
                        <div
                          className="flex items-center justify-between border-b border-black pb-0.5"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #000000',
                            paddingBottom: '1px',
                            lineHeight: '1',
                          }}
                        >
                          <span
                            className="font-black text-[10px] tracking-wider uppercase text-black"
                            style={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', color: '#000000', letterSpacing: '0.5px' }}
                          >
                            {brandTitle || 'FANTASY'}
                          </span>
                          <span
                            className="text-[7.5px] font-bold text-black font-mono tracking-tight"
                            style={{ fontWeight: 700, fontSize: '7.5px', color: '#000000', fontFamily: 'monospace' }}
                          >
                            {contactNumber}
                          </span>
                        </div>

                        {/* 2. Article / Garment Name & Category */}
                        <div
                          className="my-0.5 leading-tight"
                          style={{ margin: '1px 0', lineHeight: '1.15' }}
                        >
                          <div
                            className="text-[9px] font-extrabold text-black truncate"
                            style={{ fontWeight: 800, fontSize: '9px', color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={product.name}
                          >
                            {product.name}
                          </div>
                          <div
                            className="text-[7.5px] font-semibold text-slate-700 flex items-center justify-between mt-0.5"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '7.5px', color: '#334155', marginTop: '1px' }}
                          >
                            <span style={{ textTransform: 'uppercase' }}>
                              {product.category}
                              {product.subCategory && product.subCategory !== 'General' ? ` · ${product.subCategory}` : ''}
                            </span>
                            <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
                              {product.color}
                            </span>
                          </div>
                        </div>

                        {/* 3. Middle & Bottom Split: QR Code on Left | Size & Price on Right */}
                        <div
                          className="pt-0.5 border-t border-black/40 flex items-center justify-between"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '0.8px solid #000000',
                            paddingTop: '1.5px',
                            marginTop: 'auto',
                          }}
                        >
                          {/* QR Code / Barcode */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <BarcodeSvg
                              value={product.barcode || product.sku}
                              type={tagCodeType}
                              qrSize={46}
                              height={18}
                              width={90}
                              showText={tagCodeType === 'barcode'}
                              className="scale-95"
                            />
                            {tagCodeType === 'qr' && (
                              <span
                                style={{
                                  fontSize: '6.5px',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  color: '#000000',
                                  marginTop: '0.5px',
                                  lineHeight: '1',
                                }}
                              >
                                {product.barcode || product.sku}
                              </span>
                            )}
                          </div>

                          {/* Size & Selling Price (Just the amount) */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              textAlign: 'right',
                              justifyContent: 'center',
                            }}
                          >
                            {/* Size Box */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                marginBottom: '2px',
                              }}
                            >
                              <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#334155' }}>
                                SIZE:
                              </span>
                              <span
                                style={{
                                  border: '1px solid #000000',
                                  padding: '1px 3.5px',
                                  fontSize: '9.5px',
                                  fontWeight: 900,
                                  borderRadius: '2px',
                                  backgroundColor: '#000000',
                                  color: '#ffffff',
                                  fontFamily: 'monospace',
                                  lineHeight: '1',
                                }}
                              >
                                {product.size}
                              </span>
                            </div>

                            {/* Selling Price (Just the amount) */}
                            <div>
                              <div
                                style={{
                                  fontSize: '6px',
                                  fontWeight: 700,
                                  color: '#475569',
                                  textTransform: 'uppercase',
                                  lineHeight: '1',
                                }}
                              >
                                PRICE
                              </div>
                              <div
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 900,
                                  fontFamily: 'monospace',
                                  color: '#000000',
                                  lineHeight: '1.1',
                                }}
                              >
                                {saleOfferPercentage > 0 ? (
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                                    <span style={{ fontSize: '8px', textDecoration: 'line-through', color: '#64748b' }}>
                                      ₹{product.sellingPrice}
                                    </span>
                                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#000000' }}>
                                      ₹{discountedPrice}
                                    </span>
                                  </div>
                                ) : (
                                  <span>₹{product.sellingPrice}</span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: '5.5px',
                                  color: '#64748b',
                                  textTransform: 'uppercase',
                                  lineHeight: '1',
                                  marginTop: '0.5px',
                                }}
                              >
                                (INCL. TAXES)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
