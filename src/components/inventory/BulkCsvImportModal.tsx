import React, { useState, useMemo, useRef } from 'react';
import { Product, BulkCsvImportRow, ClothingCategory, Season, ClothingSize } from '../../types';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clipboard,
  Check,
  PlusCircle,
  HelpCircle,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

export interface BulkCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onImport: (rows: BulkCsvImportRow[]) => {
    updatedCount: number;
    createdCount?: number;
    notFoundCount: number;
    errors: string[];
  };
}

type FieldKey =
  | 'sku'
  | 'barcode'
  | 'name'
  | 'category'
  | 'subCategory'
  | 'size'
  | 'color'
  | 'stock'
  | 'stockDelta'
  | 'sellingPrice'
  | 'costPrice'
  | 'taxRate'
  | 'season'
  | 'minStockAlert'
  | 'rack'
  | 'brand'
  | 'description';

const FIELD_ALIASES: Record<FieldKey, string[]> = {
  sku: ['sku', 'skucode', 'itemcode', 'code', 'stylecode', 'styleno', 'articleno', 'articlecode', 'model', 'productcode'],
  barcode: ['barcode', 'bar code', 'upc', 'ean', 'gtin', 'tag', 'tagno'],
  name: ['garmentname', 'productname', 'itemname', 'name', 'item', 'garment', 'product', 'title', 'articlename'],
  category: ['category', 'dept', 'department', 'section', 'apparelcategory', 'cat', 'group'],
  subCategory: ['subcategory', 'sub category', 'sub-category', 'subcat', 'type', 'itemtype', 'appareltype'],
  size: ['size', 'sizes', 'garmentsize', 'measurement', 'sz'],
  color: ['color', 'colour', 'shade', 'col'],
  stock: ['stock', 'qty', 'quantity', 'stockqty', 'inventory', 'units', 'pieces', 'pcs', 'currentstock', 'openingstock', 'available', 'count'],
  stockDelta: ['stockdelta', 'addstock', 'addqty', 'adjustment', 'delta', 'restock'],
  sellingPrice: ['sellingprice', 'mrp', 'price', 'retailprice', 'saleprice', 'rate', 'unitprice', 'sellingrate', 'sp'],
  costPrice: ['costprice', 'cost', 'purchaseprice', 'purchaserate', 'cp', 'buyingprice', 'costrate'],
  taxRate: ['taxrate', 'tax', 'gst', 'gst%', 'tax%', 'vat', 'gstrate', 'taxrate%'],
  season: ['season', 'collection', 'weather', 'seasons'],
  minStockAlert: ['minstockalert', 'minstock', 'alertqty', 'reorderlevel', 'reorderpoint', 'minimumstock', 'lowstockthreshold', 'threshold', 'alert'],
  rack: ['rack', 'shelf', 'location', 'bin', 'racklocation', 'storelocation', 'aisle'],
  brand: ['brand', 'brandname', 'label', 'vendor', 'manufacturer', 'maker'],
  description: ['description', 'desc', 'notes', 'remarks', 'details'],
};

function matchHeaderToField(headerText: string): FieldKey | null {
  const clean = headerText.toLowerCase().replace(/[^a-z0-9%]/g, '');
  if (!clean) return null;

  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((alias) => alias.replace(/[^a-z0-9%]/g, '') === clean)) {
      return key as FieldKey;
    }
  }
  return null;
}

// Parses a CSV or TSV line respecting quotes
function parseCsvLine(line: string): string[] {
  if (line.includes('\t') && !line.includes(',')) {
    return line.split('\t').map((c) => c.trim().replace(/^"|"$/g, ''));
  }

  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

// Safely converts user input into a number or returns undefined
function parseCleanNumber(val: any): number | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'n/a' || str === '-' || str === '--') return undefined;
  const cleaned = str.replace(/[₹$,\s%]|pcs|units/gi, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

export const BulkCsvImportModal: React.FC<BulkCsvImportModalProps> = ({
  isOpen,
  onClose,
  products,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    updatedCount: number;
    createdCount?: number;
    notFoundCount: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate Sample CSV with comprehensive columns
  const sampleCsvContent = useMemo(() => {
    const header =
      'SKU,Barcode,Garment Name,Category,Sub-Category,Size,Color,Stock,SellingPrice,CostPrice,TaxRate,Season,Rack';

    const sampleRows: string[] = [];

    // Include up to 3 existing store products to demonstrate updating catalog
    if (products && products.length > 0) {
      products.slice(0, 3).forEach((p, idx) => {
        const sampleNewStock = p.stock + (idx + 1) * 5;
        const sampleNewPrice = Math.round(p.sellingPrice * 1.05);
        sampleRows.push(
          `"${p.sku}","${p.barcode}","${p.name}","${p.category}","${p.subCategory || 'Apparel'}","${p.size}","${p.color}",${sampleNewStock},${sampleNewPrice},${p.costPrice},${p.taxRate},"${p.season}","${p.rack || 'Rack A-1'}"`
        );
      });
    }

    // Include demonstration new garments to showcase flexible optional columns
    sampleRows.push(
      `"VT-WKT-301-M","890100998811","Embroidered Silk Festive Anarkali","Women","Kurtis","M","Wine Maroon",20,2999,1200,5,"Festive / Autumn","Rack B-2"`
    );
    sampleRows.push(
      `"","","Premium Linen Summer Casual Shirt","Men","Shirts","L","Pastel Blue",15,1899,750,5,"Summer","Rack C-1"`
    );

    return [header, ...sampleRows].join('\n');
  }, [products]);

  // Handle template download
  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GarmentOS_Inventory_Bulk_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSample = () => {
    setPastedText(sampleCsvContent);
    setImportResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        setActiveTab('paste');
        setImportResult(null);
      }
    };
    reader.onerror = () => {
      setFileError('Could not read file. Please ensure it is a valid text or CSV file.');
    };
    reader.readAsText(file);
  };

  // Parse CSV or tab-separated lines with robust header detection and optional fields
  const parsedRows = useMemo(() => {
    if (!pastedText.trim()) return [];

    const lines = pastedText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    // Header Detection
    const firstLineCells = parseCsvLine(lines[0]);
    const detectedFieldMap: Array<FieldKey | null> = firstLineCells.map((h) => matchHeaderToField(h));
    const hasHeaderRow = detectedFieldMap.some((field) => field !== null);

    const dataLines = hasHeaderRow ? lines.slice(1) : lines;

    const results: Array<{
      status: 'update' | 'new' | 'skipped';
      row: BulkCsvImportRow;
      matchedProduct: Product | null;
      note?: string;
    }> = [];

    dataLines.forEach((line) => {
      const cells = parseCsvLine(line);
      if (cells.length === 0 || cells.every((c) => !c.trim())) return; // ignore completely blank rows

      const rowData: BulkCsvImportRow = {};

      if (hasHeaderRow) {
        // Map according to matched headers
        cells.forEach((val, idx) => {
          const field = detectedFieldMap[idx];
          if (!field) return;

          switch (field) {
            case 'sku':
              if (val) rowData.sku = val;
              break;
            case 'barcode':
              if (val) rowData.barcode = val;
              break;
            case 'name':
              if (val) rowData.name = val;
              break;
            case 'category':
              if (val) rowData.category = val;
              break;
            case 'subCategory':
              if (val) rowData.subCategory = val;
              break;
            case 'size':
              if (val) rowData.size = val;
              break;
            case 'color':
              if (val) rowData.color = val;
              break;
            case 'stock':
              rowData.stock = parseCleanNumber(val);
              break;
            case 'stockDelta':
              rowData.stockDelta = parseCleanNumber(val);
              break;
            case 'sellingPrice':
              rowData.sellingPrice = parseCleanNumber(val);
              break;
            case 'costPrice':
              rowData.costPrice = parseCleanNumber(val);
              break;
            case 'taxRate':
              rowData.taxRate = parseCleanNumber(val);
              break;
            case 'season':
              if (val) rowData.season = val;
              break;
            case 'minStockAlert':
              rowData.minStockAlert = parseCleanNumber(val);
              break;
            case 'rack':
              if (val) rowData.rack = val;
              break;
            case 'brand':
              if (val) rowData.brand = val;
              break;
            case 'description':
              if (val) rowData.description = val;
              break;
          }
        });
      } else {
        // Fallback positional mapping if no headers detected:
        // [0: SKU/Identifier, 1: Barcode/Stock, 2: Stock/Price, 3: SellingPrice, 4: CostPrice]
        const firstCol = cells[0] || '';
        const secondCol = cells[1] || '';
        const thirdCol = cells[2] || '';
        const fourthCol = cells[3] || '';
        const fifthCol = cells[4] || '';

        if (/^\d{8,}$/.test(secondCol)) {
          rowData.sku = firstCol;
          rowData.barcode = secondCol;
          rowData.stock = parseCleanNumber(thirdCol);
          rowData.sellingPrice = parseCleanNumber(fourthCol);
          rowData.costPrice = parseCleanNumber(fifthCol);
        } else if (!isNaN(Number(secondCol)) && secondCol !== '') {
          if (/^\d{8,}$/.test(firstCol)) {
            rowData.barcode = firstCol;
          } else {
            rowData.sku = firstCol;
          }
          rowData.stock = parseCleanNumber(secondCol);
          rowData.sellingPrice = parseCleanNumber(thirdCol);
          rowData.costPrice = parseCleanNumber(fourthCol);
        } else {
          rowData.sku = firstCol;
          rowData.barcode = secondCol;
        }
      }

      // Check matching against existing products
      const skuQ = (rowData.sku || '').trim().toLowerCase();
      const barcodeQ = (rowData.barcode || '').trim().toLowerCase();
      const nameQ = (rowData.name || '').trim().toLowerCase();

      let matched: Product | null = null;
      if (skuQ) {
        matched = products.find((p) => p.sku.toLowerCase() === skuQ) || null;
      }
      if (!matched && barcodeQ) {
        matched = products.find((p) => p.barcode.toLowerCase() === barcodeQ) || null;
      }
      if (!matched && nameQ) {
        matched =
          products.find((p) => {
            if (p.name.toLowerCase() !== nameQ) return false;
            if (rowData.size && p.size.toLowerCase() !== rowData.size.toLowerCase().trim()) return false;
            if (rowData.color && p.color.toLowerCase() !== rowData.color.toLowerCase().trim()) return false;
            return true;
          }) ||
          products.find((p) => p.name.toLowerCase() === nameQ) ||
          null;
      }

      if (matched) {
        results.push({
          status: 'update',
          row: rowData,
          matchedProduct: matched,
          note: `Updates "${matched.name}" (${matched.sku})`,
        });
      } else if (nameQ || skuQ || barcodeQ) {
        results.push({
          status: 'new',
          row: rowData,
          matchedProduct: null,
          note: 'New garment will be added to catalog',
        });
      } else {
        results.push({
          status: 'skipped',
          row: rowData,
          matchedProduct: null,
          note: 'Skipped: missing garment name, SKU, or barcode',
        });
      }
    });

    return results;
  }, [pastedText, products]);

  const updateRows = parsedRows.filter((r) => r.status === 'update');
  const newRows = parsedRows.filter((r) => r.status === 'new');
  const skippedRows = parsedRows.filter((r) => r.status === 'skipped');
  const actionableCount = updateRows.length + newRows.length;

  const handleCommitImport = () => {
    const validRowsToImport: BulkCsvImportRow[] = parsedRows
      .filter((r) => r.status === 'update' || r.status === 'new')
      .map((r) => r.row);

    if (validRowsToImport.length === 0) {
      alert('No valid garments found in the uploaded text to import.');
      return;
    }

    const res = onImport(validRowsToImport);
    setImportResult(res);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Inventory Bulk Import & Spreadsheet Sync
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  All Fields Optional
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Update stock & prices or add new apparel with Name, Category, Size, Color, MRP, Cost, Rack, and more
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab & Helper Buttons */}
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste Text / Excel</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('file');
                fileInputRef.current?.click();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .CSV File</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt,.tsv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Load Sample Data</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Supported Columns Guide Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Supported Columns (Any Order &bull; All Fields Optional):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              {[
                'Garment Name',
                'Category',
                'Sub-Category',
                'Size',
                'Color',
                'Stock',
                'SellingPrice (MRP)',
                'CostPrice',
                'SKU',
                'Barcode',
                'TaxRate (%)',
                'Season',
                'Rack / Location',
                'Brand',
              ].map((col) => (
                <span
                  key={col}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[10px]"
                >
                  {col}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Omitted columns or blank cells leave existing catalog properties intact. New garments with a name or code are automatically created.
            </p>
          </div>

          {fileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Success Banner */}
          {importResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Import successfully completed! Updated {importResult.updatedCount} catalog items
                  {importResult.createdCount ? ` and created ${importResult.createdCount} new garments` : ''}.
                </span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="text-slate-600 text-[11px] font-mono bg-white p-2 rounded border border-emerald-100 max-h-24 overflow-y-auto">
                  {importResult.errors.map((e, idx) => (
                    <div key={idx} className="text-amber-800">
                      • {e}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paste Input Box */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Paste CSV or Tabular Data (from Excel / Google Sheets):
              </label>
              <span className="text-[11px] text-slate-500">
                Headers automatically recognized
              </span>
            </div>
            <textarea
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                setImportResult(null);
              }}
              rows={4}
              placeholder={`SKU,Barcode,Garment Name,Category,Size,Color,Stock,SellingPrice,CostPrice,Rack\nVT-MSH-001,890100100101,Classic Oxford Shirt,Men,M,Sky Blue,25,1599,650,Rack A-1\n,,Embroidered Festive Kurti,Women,L,Maroon,15,2499,950,Rack B-3`}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Live Parsing Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">
                    Preview ({parsedRows.length} rows detected):
                  </span>
                  {updateRows.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {updateRows.length} Existing to Update
                    </span>
                  )}
                  {newRows.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      {newRows.length} New Garments to Add
                    </span>
                  )}
                  {skippedRows.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {skippedRows.length} Skipped
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPastedText('');
                    setImportResult(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 tracking-wider sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Garment Name</th>
                      <th className="py-2.5 px-3">Category / Variant</th>
                      <th className="py-2.5 px-3">SKU / Barcode</th>
                      <th className="py-2.5 px-3 text-right">Stock</th>
                      <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                      <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                      <th className="py-2.5 px-3">Rack / Season</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((item, idx) => {
                      const { status, row, matchedProduct, note } = item;
                      const displayName = row.name || (matchedProduct ? matchedProduct.name : '—');
                      const displayCategory = row.category || (matchedProduct ? matchedProduct.category : '—');
                      const displaySize = row.size || (matchedProduct ? matchedProduct.size : '—');
                      const displayColor = row.color || (matchedProduct ? matchedProduct.color : '—');
                      const displaySku = row.sku || (matchedProduct ? matchedProduct.sku : 'Auto-generated');
                      const displayBarcode = row.barcode || (matchedProduct ? matchedProduct.barcode : 'Auto-generated');
                      const displayRack = row.rack || (matchedProduct ? matchedProduct.rack : '—');
                      const displaySeason = row.season || (matchedProduct ? matchedProduct.season : '—');

                      return (
                        <tr
                          key={idx}
                          className={
                            status === 'update'
                              ? 'hover:bg-slate-50'
                              : status === 'new'
                              ? 'bg-blue-50/30 hover:bg-blue-50/60'
                              : 'bg-slate-50/60 text-slate-400'
                          }
                        >
                          <td className="py-2 px-3 whitespace-nowrap">
                            {status === 'update' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                <Check className="w-3 h-3" />
                                <span>Update</span>
                              </span>
                            ) : status === 'new' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit">
                                <PlusCircle className="w-3 h-3" />
                                <span>New Item</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 w-fit">
                                Skipped
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={displayName}>
                              {displayName}
                            </div>
                            <div className="text-[10px] text-slate-500">{note}</div>
                          </td>

                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {displayCategory !== '—' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                  {displayCategory}
                                </span>
                              )}
                              {displaySize !== '—' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                  {displaySize}
                                </span>
                              )}
                              {displayColor !== '—' && (
                                <span className="text-[10px] text-slate-600">{displayColor}</span>
                              )}
                            </div>
                          </td>

                          <td className="py-2 px-3 font-mono text-[11px]">
                            <div className="text-slate-800 font-medium">{displaySku}</div>
                            {displayBarcode !== '—' && (
                              <div className="text-[10px] text-slate-400">{displayBarcode}</div>
                            )}
                          </td>

                          <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                            {typeof row.stock === 'number' && matchedProduct ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {matchedProduct.stock} → {row.stock}
                              </span>
                            ) : typeof row.stock === 'number' ? (
                              <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {row.stock} pcs
                              </span>
                            ) : typeof row.stockDelta === 'number' && matchedProduct ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                +{row.stockDelta} ({matchedProduct.stock + row.stockDelta})
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No change</span>
                            )}
                          </td>

                          <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                            {typeof row.sellingPrice === 'number' && matchedProduct ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                ₹{matchedProduct.sellingPrice} → ₹{row.sellingPrice}
                              </span>
                            ) : typeof row.sellingPrice === 'number' ? (
                              <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                ₹{row.sellingPrice}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No change</span>
                            )}
                          </td>

                          <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                            {typeof row.costPrice === 'number' ? (
                              <span className="text-slate-700">₹{row.costPrice}</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">
                                {matchedProduct ? `₹${matchedProduct.costPrice}` : '—'}
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-3 text-[11px] whitespace-nowrap">
                            <span className="text-slate-700 font-medium">{displayRack}</span>
                            {displaySeason !== '—' && (
                              <span className="text-[10px] text-slate-400 block">{displaySeason}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            {actionableCount > 0 ? (
              <span>
                Ready to process <strong>{actionableCount}</strong> garments (
                <strong className="text-emerald-700">{updateRows.length}</strong> updates,{' '}
                <strong className="text-blue-700">{newRows.length}</strong> new additions).
              </span>
            ) : (
              <span>Paste Excel rows or upload a CSV above to preview changes.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={actionableCount === 0}
              onClick={handleCommitImport}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Import ({actionableCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
