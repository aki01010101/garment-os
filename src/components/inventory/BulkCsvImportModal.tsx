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
  Settings2,
  Edit2,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import {
  autofillRow,
  AutofillConfig,
  DEFAULT_AUTOFILL_CONFIG,
} from '../../utils/csvAutofill';

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
  sku: [
    'sku', 'skucode', 'itemcode', 'code', 'stylecode', 'styleno', 'articleno', 'articlecode',
    'model', 'productcode', 'designno', 'catalogno', 'stylenumber', 'itemnumber', 'partnumber'
  ],
  barcode: ['barcode', 'bar code', 'upc', 'ean', 'gtin', 'tag', 'tagno', 'barcodeno', 'eancode', 'upccode'],
  name: [
    'garmentname', 'productname', 'itemname', 'name', 'item', 'garment', 'product', 'title',
    'articlename', 'particulars', 'itemdescription', 'descriptionofgoods', 'productdescription',
    'stylename', 'goods'
  ],
  category: ['category', 'dept', 'department', 'section', 'apparelcategory', 'cat', 'group'],
  subCategory: ['subcategory', 'sub category', 'sub-category', 'subcat', 'type', 'itemtype', 'appareltype'],
  size: [
    'size', 'sizes', 'garmentsize', 'measurement', 'sz', 'sizeuk', 'sizeus', 'sizefit', 'itemsize',
    'variantsize', 'waist', 'chest', 'collar', 'dimension', 'dimensions', 'fit'
  ],
  color: ['color', 'colour', 'shade', 'col', 'pattern'],
  stock: [
    'stock', 'qty', 'quantity', 'stockqty', 'inventory', 'units', 'pieces', 'pcs',
    'currentstock', 'openingstock', 'available', 'count', 'balance'
  ],
  stockDelta: ['stockdelta', 'addstock', 'addqty', 'adjustment', 'delta', 'restock'],
  sellingPrice: [
    'sellingprice', 'mrp', 'price', 'retailprice', 'saleprice', 'rate', 'unitprice',
    'sellingrate', 'sp', 'salesprice', 'salerate', 'amount', 'unitrate', 'itemrate',
    'pricers', 'rateinr', 'priceinr', 'mrpval'
  ],
  costPrice: [
    'costprice', 'cost', 'purchaseprice', 'purchaserate', 'cp', 'buyingprice', 'costrate',
    'wholesaleprice', 'wholesalerate', 'dealerprice', 'purchasecost'
  ],
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

  // 1. Direct alias match
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((alias) => alias.replace(/[^a-z0-9%]/g, '') === clean)) {
      return key as FieldKey;
    }
  }

  // 2. Fuzzy / Containment Fallbacks
  if (clean.includes('barcode') || clean.includes('ean') || clean.includes('upc') || clean.includes('gtin')) {
    return 'barcode';
  }
  if (clean.includes('cost') || clean.includes('purchase') || clean.includes('buying') || clean.includes('wholesalerate')) {
    return 'costPrice';
  }
  if (
    clean.includes('mrp') ||
    clean.includes('retail') ||
    clean.includes('selling') ||
    clean.includes('saleprice') ||
    clean.includes('salerate') ||
    clean.startsWith('price') ||
    clean.startsWith('rate') ||
    clean === 'amount' ||
    clean === 'sp'
  ) {
    return 'sellingPrice';
  }
  if (
    clean.startsWith('size') ||
    clean.endsWith('size') ||
    clean.includes('waist') ||
    clean.includes('chest') ||
    clean.includes('measurement') ||
    clean === 'sz' ||
    clean === 'fit'
  ) {
    return 'size';
  }
  if (clean.includes('color') || clean.includes('colour') || clean.includes('shade')) {
    return 'color';
  }
  if (
    clean.includes('qty') ||
    clean.includes('quantity') ||
    clean.includes('stock') ||
    clean === 'pcs' ||
    clean === 'pieces' ||
    clean === 'units'
  ) {
    return 'stock';
  }
  if (
    clean.includes('sku') ||
    clean.includes('stylecode') ||
    clean.includes('styleno') ||
    clean.includes('itemcode') ||
    clean.includes('designno') ||
    clean.includes('articleno')
  ) {
    return 'sku';
  }
  if (clean.includes('category') || clean.includes('department') || clean === 'dept') {
    return 'category';
  }
  if (clean.includes('subcategory') || clean.includes('itemtype') || clean === 'subcat') {
    return 'subCategory';
  }
  if (clean.includes('gst') || clean.includes('tax') || clean.includes('vat')) {
    return 'taxRate';
  }
  if (clean.includes('rack') || clean.includes('shelf') || clean.includes('location') || clean.includes('aisle')) {
    return 'rack';
  }
  if (clean.includes('brand') || clean.includes('vendor') || clean.includes('manufacturer')) {
    return 'brand';
  }
  if (
    clean.includes('particulars') ||
    clean.includes('itemname') ||
    clean.includes('productname') ||
    clean.includes('garmentname') ||
    clean.includes('descriptionofgoods') ||
    clean === 'item' ||
    clean === 'product' ||
    clean === 'garment' ||
    clean === 'name' ||
    clean === 'title' ||
    clean === 'goods' ||
    clean === 'style'
  ) {
    return 'name';
  }
  if (clean.includes('desc') || clean.includes('detail') || clean.includes('note')) {
    return 'description';
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

  // Smart Autofill Engine State
  const [enableAutofill, setEnableAutofill] = useState<boolean>(true);
  const [showAutofillSettings, setShowAutofillSettings] = useState<boolean>(false);
  const [autofillConfig, setAutofillConfig] = useState<AutofillConfig>({ ...DEFAULT_AUTOFILL_CONFIG });

  // Inline Row Edits State
  const [editedRows, setEditedRows] = useState<Record<number, BulkCsvImportRow>>({});
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<BulkCsvImportRow>({});

  const [importResult, setImportResult] = useState<{
    updatedCount: number;
    createdCount?: number;
    notFoundCount: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Standard Template CSV
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

    sampleRows.push(
      `"VT-WKT-301-M","890100998811","Embroidered Silk Festive Anarkali","Women","Kurtis","M","Wine Maroon",20,2999,1200,5,"Festive / Autumn","Rack B-2"`
    );
    sampleRows.push(
      `"","","Premium Linen Summer Casual Shirt","Men","Shirts","L","Pastel Blue",15,1899,750,5,"Summer","Rack C-1"`
    );

    return [header, ...sampleRows].join('\n');
  }, [products]);

  // Realistic Incomplete CSV Sample (e.g. raw vendor sheet with missing SKUs, barcodes, sizes, costs)
  const incompleteCsvContent = useMemo(() => {
    const header = 'Garment Name,SellingPrice,Stock';
    const sampleRows = [
      '"Men Premium Linen Slim-Fit Casual Shirt - Sky Blue - 42",1899,15',
      '"Women Embroidered Silk Anarkali Kurti Maroon L",2999,8',
      '"Boys Cotton Graphic Crew Neck T-Shirt Yellow 6-7Y",699,20',
      '"Pure Leather Formal Reversible Belt Brown Free Size",899,25',
      '"Slim Fit Stretch Denim Jeans 32",1599,18',
      '"Floral Chiffon Summer Saree Pink",2499,12',
      '"Winter Woolen Knit Pullover Sweater Navy Blue XL",2199,10',
      '"Solid Regular Fit Chino Trousers Beige 34",1699,',
    ];
    return [header, ...sampleRows].join('\n');
  }, []);

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
    setEditedRows({});
    setImportResult(null);
  };

  const handleLoadIncompleteSample = () => {
    setPastedText(incompleteCsvContent);
    setEditedRows({});
    setImportResult(null);
    setEnableAutofill(true);
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
        setEditedRows({});
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

    const existingSkusInBatch = new Set(products.map((p) => p.sku.toLowerCase()));
    const existingBarcodesInBatch = new Set(products.map((p) => p.barcode));
    const matchedCatalogProductIds = new Set<string>();

    const results: Array<{
      idx: number;
      status: 'update' | 'new' | 'skipped';
      row: BulkCsvImportRow;
      matchedProduct: Product | null;
      autofilledFields: string[];
      notes: string[];
      note?: string;
    }> = [];

    dataLines.forEach((line, idx) => {
      const cells = parseCsvLine(line);
      if (cells.length === 0 || cells.every((c) => !c.trim())) return; // ignore completely blank rows

      let rowData: BulkCsvImportRow = {};

      if (hasHeaderRow) {
        // Map according to matched headers
        cells.forEach((val, cellIdx) => {
          const field = detectedFieldMap[cellIdx];
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
        // Fallback positional mapping if no headers detected
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

      // Merge user manual edits for this row if present
      if (editedRows[idx]) {
        rowData = { ...rowData, ...editedRows[idx] };
      }

      // Check matching against existing products
      const skuQ = (rowData.sku || '').trim().toLowerCase();
      const barcodeQ = (rowData.barcode || '').trim().toLowerCase();
      const nameQ = (rowData.name || '').trim().toLowerCase();

      let matched: Product | null = null;
      if (skuQ) {
        matched = products.find((p) => p.sku.toLowerCase() === skuQ && !matchedCatalogProductIds.has(p.id)) || null;
      }
      if (!matched && barcodeQ) {
        matched = products.find((p) => p.barcode.toLowerCase() === barcodeQ && !matchedCatalogProductIds.has(p.id)) || null;
      }
      // ONLY match by name if SKU and Barcode were NOT provided in the CSV row, AND the size matches EXACTLY!
      if (!matched && !skuQ && !barcodeQ && nameQ) {
        matched =
          products.find((p) => {
            if (matchedCatalogProductIds.has(p.id)) return false;
            if (p.name.toLowerCase() !== nameQ) return false;
            const rowSizeNorm = (rowData.size || '').toString().toLowerCase().trim();
            const prodSizeNorm = (p.size || '').toString().toLowerCase().trim();
            if (rowSizeNorm && prodSizeNorm !== rowSizeNorm) return false;
            if (!rowSizeNorm && prodSizeNorm !== 'free size' && prodSizeNorm !== '') return false;
            if (rowData.color && p.color.toLowerCase() !== rowData.color.toLowerCase().trim()) return false;
            return true;
          }) || null;
      }

      if (matched) {
        matchedCatalogProductIds.add(matched.id);
        existingSkusInBatch.add(matched.sku.toLowerCase());
        existingBarcodesInBatch.add(matched.barcode);

        const enrichedRow: BulkCsvImportRow = {
          ...rowData,
          sku: matched.sku,
          barcode: matched.barcode,
          name: rowData.name || matched.name,
          category: rowData.category || matched.category,
          size: rowData.size || matched.size,
          color: rowData.color || matched.color,
        };

        results.push({
          idx,
          status: 'update',
          row: enrichedRow,
          matchedProduct: matched,
          autofilledFields: [],
          notes: [],
          note: `Updates "${matched.name}" (${matched.sku})`,
        });
      } else {
        const hasAnyData = Boolean(
          nameQ || skuQ || barcodeQ || rowData.category || rowData.sellingPrice
        );

        if (hasAnyData) {
          const autofillRes = autofillRow(
            rowData,
            products,
            existingSkusInBatch,
            existingBarcodesInBatch,
            autofillConfig
          );

          results.push({
            idx,
            status: 'new',
            row: autofillRes.row,
            matchedProduct: null,
            autofilledFields: enableAutofill ? autofillRes.autofilledFields : [],
            notes: autofillRes.notes,
            note:
              enableAutofill && autofillRes.autofilledFields.length > 0
                ? `Autofilled: ${autofillRes.autofilledFields.join(', ')}`
                : 'New garment will be added to catalog',
          });
        } else {
          results.push({
            idx,
            status: 'skipped',
            row: rowData,
            matchedProduct: null,
            autofilledFields: [],
            notes: [],
            note: 'Skipped: missing garment name, SKU, or barcode',
          });
        }
      }
    });

    return results;
  }, [pastedText, products, enableAutofill, autofillConfig, editedRows]);

  const updateRows = parsedRows.filter((r) => r.status === 'update');
  const newRows = parsedRows.filter((r) => r.status === 'new');
  const skippedRows = parsedRows.filter((r) => r.status === 'skipped');
  const actionableCount = updateRows.length + newRows.length;

  // Handle single row edit
  const handleStartEdit = (idx: number, currentRow: BulkCsvImportRow) => {
    setEditingRowIdx(idx);
    setEditFormData({ ...currentRow });
  };

  const handleSaveEdit = () => {
    if (editingRowIdx !== null) {
      setEditedRows((prev) => ({
        ...prev,
        [editingRowIdx]: { ...editFormData },
      }));
      setEditingRowIdx(null);
    }
  };

  const handleResetRowToAuto = (idx: number) => {
    setEditedRows((prev) => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
    setEditingRowIdx(null);
  };

  const handleCancelEdit = () => {
    setEditingRowIdx(null);
  };

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
                  Smart Autofill Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sync existing inventory or import incomplete supplier spreadsheets with automatic SKU, barcode, and attribute generation
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

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleLoadIncompleteSample}
              className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Loads realistic supplier CSV missing SKUs, barcodes, sizes, and costs to test auto-generation"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Load Incomplete Sample (Autofill Demo)</span>
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Standard Template</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Smart Autofill Banner & Quick Switch */}
          <div className="p-3 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-emerald-50/50 border border-indigo-100/90 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Smart Catalog Autofill Engine
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        enableAutofill
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      {enableAutofill ? '✨ ON (Extracting & Generating)' : 'OFF (Raw Only)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Extracts garment size, color, and category from name. Generates structured SKUs, retail EAN-12 barcodes, estimated cost prices (50% margin), and default stock.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnableAutofill(!enableAutofill)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                    enableAutofill
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs hover:bg-indigo-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{enableAutofill ? 'Autofill Active' : 'Enable Autofill'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAutofillSettings(!showAutofillSettings)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    showAutofillSettings
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                  title="Configure SKU prefix, opening stock, and cost margin defaults"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>

            {/* Expandable Autofill Settings Drawer */}
            {showAutofillSettings && (
              <div className="mt-2 pt-2.5 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    SKU Prefix
                  </label>
                  <input
                    type="text"
                    value={autofillConfig.skuPrefix || 'GOS'}
                    onChange={(e) =>
                      setAutofillConfig({ ...autofillConfig, skuPrefix: e.target.value.toUpperCase().trim() })
                    }
                    placeholder="GOS"
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono font-bold uppercase focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block">e.g. GOS, VT, ZRA</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Default Opening Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={autofillConfig.defaultStock ?? 10}
                    onChange={(e) =>
                      setAutofillConfig({
                        ...autofillConfig,
                        defaultStock: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block">Pcs if missing in CSV</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Cost Margin (% of SP)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={autofillConfig.targetCostMarginPercent ?? 50}
                    onChange={(e) =>
                      setAutofillConfig({
                        ...autofillConfig,
                        targetCostMarginPercent: Math.min(99, Math.max(1, parseInt(e.target.value) || 50)),
                      })
                    }
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block">Default: 50% (₹2000 SP → ₹1000 CP)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Markup Ratio (CP → SP)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    max={10}
                    value={autofillConfig.targetMarkupRatio ?? 2.0}
                    onChange={(e) =>
                      setAutofillConfig({
                        ...autofillConfig,
                        targetMarkupRatio: Math.max(1, parseFloat(e.target.value) || 2.0),
                      })
                    }
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block">Default: 2.0x (₹500 CP → ₹999 SP)</span>
                </div>

                <div className="space-y-1 flex flex-col justify-between">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Default Department
                    </label>
                    <select
                      value={autofillConfig.defaultCategory || 'Men'}
                      onChange={(e) =>
                        setAutofillConfig({
                          ...autofillConfig,
                          defaultCategory: e.target.value as ClothingCategory,
                        })
                      }
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutofillConfig({ ...DEFAULT_AUTOFILL_CONFIG })}
                    className="text-[10px] text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>
            )}
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
                Paste CSV or Tabular Data (from Excel, Google Sheets, or Supplier Invoices):
              </label>
              <span className="text-[11px] text-slate-500">
                Supports incomplete CSVs: even just Name + Price will autofill!
              </span>
            </div>
            <textarea
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                setImportResult(null);
              }}
              rows={4}
              placeholder={`Garment Name,SellingPrice,Stock\nMen Premium Linen Slim-Fit Casual Shirt - Sky Blue - 42,1899,15\nWomen Embroidered Silk Anarkali Kurti Maroon L,2999,8\nBoys Cotton Graphic Crew Neck T-Shirt Yellow 6-7Y,699,20`}
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
                  {Object.keys(editedRows).length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      {Object.keys(editedRows).length} Manually Edited
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPastedText('');
                    setEditedRows({});
                    setImportResult(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 tracking-wider sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2 px-2.5">Action</th>
                      <th className="py-2 px-2.5">Garment Name</th>
                      <th className="py-2 px-2.5">Category / Variant</th>
                      <th className="py-2 px-2.5">SKU / Barcode</th>
                      <th className="py-2 px-2.5 text-right">Stock</th>
                      <th className="py-2 px-2.5 text-right">Price (₹)</th>
                      <th className="py-2 px-2.5 text-right">Cost (₹)</th>
                      <th className="py-2 px-2.5">Rack / Season</th>
                      <th className="py-2 px-2.5 text-center">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((item) => {
                      const { idx, status, row, matchedProduct, autofilledFields, note } = item;
                      const displayName = row.name || (matchedProduct ? matchedProduct.name : '—');
                      const displayCategory = row.category || (matchedProduct ? matchedProduct.category : '—');
                      const displaySize = row.size || (matchedProduct ? matchedProduct.size : '—');
                      const displayColor = row.color || (matchedProduct ? matchedProduct.color : '—');
                      const displaySku = row.sku || (matchedProduct ? matchedProduct.sku : 'Auto-generated');
                      const displayBarcode = row.barcode || (matchedProduct ? matchedProduct.barcode : 'Auto-generated');
                      const displayRack = row.rack || (matchedProduct ? matchedProduct.rack : '—');
                      const displaySeason = row.season || (matchedProduct ? matchedProduct.season : '—');

                      const isSkuAutofilled = autofilledFields.includes('sku');
                      const isBarcodeAutofilled = autofilledFields.includes('barcode');
                      const isCategoryAutofilled = autofilledFields.includes('category');
                      const isSizeAutofilled = autofilledFields.includes('size');
                      const isColorAutofilled = autofilledFields.includes('color');
                      const isCostAutofilled = autofilledFields.includes('costPrice');
                      const isSellingPriceAutofilled = autofilledFields.includes('sellingPrice');
                      const isStockAutofilled = autofilledFields.includes('stock');
                      const isRackAutofilled = autofilledFields.includes('rack');
                      const isManuallyEdited = Boolean(editedRows[idx]);

                      return (
                        <tr
                          key={idx}
                          className={
                            isManuallyEdited
                              ? 'bg-amber-50/40 hover:bg-amber-50/70'
                              : status === 'update'
                              ? 'hover:bg-slate-50'
                              : status === 'new'
                              ? 'bg-blue-50/30 hover:bg-blue-50/60'
                              : 'bg-slate-50/60 text-slate-400'
                          }
                        >
                          <td className="py-2 px-2.5 whitespace-nowrap">
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

                          <td className="py-2 px-2.5">
                            <div className="font-semibold text-slate-900 truncate max-w-[210px]" title={displayName}>
                              {displayName}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[210px]" title={note}>
                              {isManuallyEdited && (
                                <span className="text-amber-700 font-bold mr-1">✏️ Edited •</span>
                              )}
                              {note}
                            </div>
                          </td>

                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              {displayCategory !== '—' && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 ${
                                    isCategoryAutofilled
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                  title={isCategoryAutofilled ? 'Category inferred from garment name' : undefined}
                                >
                                  {isCategoryAutofilled && <Sparkles className="w-2.5 h-2.5 text-purple-600" />}
                                  <span>{displayCategory}</span>
                                </span>
                              )}
                              {displaySize !== '—' && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                                    isSizeAutofilled
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      : 'bg-indigo-50 text-indigo-700'
                                  }`}
                                  title={isSizeAutofilled ? 'Size extracted from garment name' : undefined}
                                >
                                  {isSizeAutofilled && <Sparkles className="w-2.5 h-2.5 text-indigo-600" />}
                                  <span>{displaySize}</span>
                                </span>
                              )}
                              {displayColor !== '—' && (
                                <span
                                  className={`text-[10px] flex items-center gap-0.5 ${
                                    isColorAutofilled ? 'text-purple-700 font-semibold' : 'text-slate-600'
                                  }`}
                                  title={isColorAutofilled ? 'Color extracted from garment name' : undefined}
                                >
                                  {isColorAutofilled && <Sparkles className="w-2.5 h-2.5 text-purple-600" />}
                                  <span>{displayColor}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2 px-2.5 font-mono text-[11px] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-800 font-medium">{displaySku}</span>
                              {isSkuAutofilled && (
                                <span
                                  className="text-[9px] font-bold px-1 rounded bg-purple-100 text-purple-700 border border-purple-200"
                                  title="Structured SKU generated from garment category, type, color, and size"
                                >
                                  Auto
                                </span>
                              )}
                            </div>
                            {displayBarcode !== '—' && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span>{displayBarcode}</span>
                                {isBarcodeAutofilled && (
                                  <span
                                    className="text-[9px] font-semibold text-emerald-600"
                                    title="Standard 12-digit Indian retail EAN barcode generated"
                                  >
                                    EAN
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-2 px-2.5 text-right font-mono whitespace-nowrap">
                            {typeof row.stock === 'number' && matchedProduct ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {matchedProduct.stock} → {row.stock}
                              </span>
                            ) : typeof row.stock === 'number' ? (
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded ${
                                  isStockAutofilled
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'text-blue-700 bg-blue-50'
                                }`}
                                title={isStockAutofilled ? 'Default opening stock applied' : undefined}
                              >
                                {row.stock} pcs {isStockAutofilled && '✨'}
                              </span>
                            ) : typeof row.stockDelta === 'number' && matchedProduct ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                +{row.stockDelta} ({matchedProduct.stock + row.stockDelta})
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No change</span>
                            )}
                          </td>

                          <td className="py-2 px-2.5 text-right font-mono whitespace-nowrap">
                            {typeof row.sellingPrice === 'number' && matchedProduct ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                ₹{matchedProduct.sellingPrice} → ₹{row.sellingPrice}
                              </span>
                            ) : typeof row.sellingPrice === 'number' ? (
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded ${
                                  isSellingPriceAutofilled
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : 'text-blue-700 bg-blue-50'
                                }`}
                                title={isSellingPriceAutofilled ? 'Price estimated from cost markup' : undefined}
                              >
                                ₹{row.sellingPrice} {isSellingPriceAutofilled && '✨'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No change</span>
                            )}
                          </td>

                          <td className="py-2 px-2.5 text-right font-mono whitespace-nowrap">
                            {typeof row.costPrice === 'number' ? (
                              <span
                                className={`px-1.5 py-0.5 rounded ${
                                  isCostAutofilled
                                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                                    : 'text-slate-700'
                                }`}
                                title={isCostAutofilled ? 'Cost estimated at 50% of selling price' : undefined}
                              >
                                ₹{row.costPrice} {isCostAutofilled && '✨'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">
                                {matchedProduct ? `₹${matchedProduct.costPrice}` : '—'}
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-2.5 text-[11px] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-700 font-medium">{displayRack}</span>
                              {isRackAutofilled && (
                                <span className="text-[9px] text-purple-600" title="Rack auto-assigned from department">
                                  ✨
                                </span>
                              )}
                            </div>
                            {displaySeason !== '—' && (
                              <span className="text-[10px] text-slate-400 block">{displaySeason}</span>
                            )}
                          </td>

                          <td className="py-2 px-2.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(idx, row)}
                              className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit this garment before importing"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* Modal: Inline Row Editor */}
        {editingRowIdx !== null && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Edit2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Edit Preview Row #{editingRowIdx + 1}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Adjust attributes before importing into store inventory
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs max-h-[60vh] overflow-y-auto px-0.5">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Garment Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-medium focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">SKU Code</label>
                  <input
                    type="text"
                    value={editFormData.sku || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Retail Barcode</label>
                  <input
                    type="text"
                    value={editFormData.barcode || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, barcode: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Category</label>
                  <select
                    value={editFormData.category || 'Men'}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as ClothingCategory })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Sub-Category</label>
                  <input
                    type="text"
                    value={editFormData.subCategory || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value })}
                    placeholder="e.g. Shirts, Kurtis, Jeans"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Size</label>
                  <input
                    type="text"
                    value={editFormData.size || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, size: e.target.value })}
                    placeholder="e.g. M, L, XL, 40, 42"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Color</label>
                  <input
                    type="text"
                    value={editFormData.color || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                    placeholder="e.g. Navy Blue, White"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Stock (Pcs)</label>
                  <input
                    type="number"
                    min={0}
                    value={editFormData.stock ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, stock: parseCleanNumber(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Selling Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editFormData.sellingPrice ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: parseCleanNumber(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Cost Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editFormData.costPrice ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, costPrice: parseCleanNumber(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Rack / Shelf</label>
                  <input
                    type="text"
                    value={editFormData.rack || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, rack: e.target.value })}
                    placeholder="Rack A-1"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                {editedRows[editingRowIdx] ? (
                  <button
                    type="button"
                    onClick={() => handleResetRowToAuto(editingRowIdx)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Auto</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
