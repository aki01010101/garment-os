import React, { useState, useMemo, useRef } from 'react';
import { Product, BulkCsvImportRow } from '../../types';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clipboard,
  Check,
  RefreshCw,
} from 'lucide-react';

export interface BulkCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onImport: (rows: BulkCsvImportRow[]) => { updatedCount: number; notFoundCount: number; errors: string[] };
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
    notFoundCount: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate Sample CSV with real SKUs from the store
  const sampleCsvContent = useMemo(() => {
    const header = 'SKU,Barcode,Stock,SellingPrice,CostPrice';
    const rows = products.slice(0, 5).map((p, idx) => {
      // Add a small sample delta to show realistic changes
      const sampleNewStock = p.stock + (idx + 1) * 5;
      const sampleNewPrice = Math.round(p.sellingPrice * 1.05);
      return `${p.sku},${p.barcode},${sampleNewStock},${sampleNewPrice},${p.costPrice}`;
    });
    return [header, ...rows].join('\n');
  }, [products]);

  // Handle template download
  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GarmentOS_Inventory_Bulk_Update_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSample = () => {
    setPastedText(sampleCsvContent);
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
        setActiveTab('paste'); // Switch to preview tab
      }
    };
    reader.onerror = () => {
      setFileError('Could not read file. Please ensure it is a valid text or CSV file.');
    };
    reader.readAsText(file);
  };

  // Parse CSV or tab-separated lines
  const parsedRows = useMemo(() => {
    if (!pastedText.trim()) return [];

    const lines = pastedText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const results: Array<{
      sku: string;
      barcode: string;
      stock?: number;
      sellingPrice?: number;
      costPrice?: number;
      matchedProduct: Product | null;
      error?: string;
    }> = [];

    // Detect header row
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader =
      firstLineLower.includes('sku') ||
      firstLineLower.includes('barcode') ||
      firstLineLower.includes('stock') ||
      firstLineLower.includes('price');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    dataLines.forEach((line) => {
      // Split by comma or tab
      const parts = line.includes('\t')
        ? line.split('\t').map((p) => p.trim())
        : line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));

      if (parts.length === 0 || !parts[0]) return;

      const firstCol = parts[0] || '';
      const secondCol = parts[1] || '';
      const thirdCol = parts[2] || '';
      const fourthCol = parts[3] || '';
      const fifthCol = parts[4] || '';

      // Determine column assignments
      let sku = '';
      let barcode = '';
      let stockVal: number | undefined;
      let priceVal: number | undefined;
      let costVal: number | undefined;

      // If first column looks like SKU (starts with VT- or letters) and 2nd is numeric barcode
      if (/^\d{8,}$/.test(secondCol)) {
        sku = firstCol;
        barcode = secondCol;
        if (thirdCol && !isNaN(Number(thirdCol))) stockVal = Number(thirdCol);
        if (fourthCol && !isNaN(Number(fourthCol))) priceVal = Number(fourthCol);
        if (fifthCol && !isNaN(Number(fifthCol))) costVal = Number(fifthCol);
      } else if (!isNaN(Number(secondCol))) {
        // First col is identifier (SKU or Barcode), 2nd is stock, 3rd is price
        if (/^\d{8,}$/.test(firstCol)) {
          barcode = firstCol;
        } else {
          sku = firstCol;
        }
        stockVal = Number(secondCol);
        if (thirdCol && !isNaN(Number(thirdCol))) priceVal = Number(thirdCol);
        if (fourthCol && !isNaN(Number(fourthCol))) costVal = Number(fourthCol);
      } else {
        sku = firstCol;
        barcode = secondCol;
      }

      // Find match in catalog
      const matched = products.find(
        (p) =>
          (sku && p.sku.toLowerCase() === sku.toLowerCase()) ||
          (barcode && p.barcode.toLowerCase() === barcode.toLowerCase()) ||
          (firstCol && (p.sku.toLowerCase() === firstCol.toLowerCase() || p.barcode === firstCol))
      );

      results.push({
        sku: matched ? matched.sku : sku || firstCol,
        barcode: matched ? matched.barcode : barcode,
        stock: stockVal,
        sellingPrice: priceVal,
        costPrice: costVal,
        matchedProduct: matched || null,
        error: !matched ? 'No catalog garment matches this SKU / Barcode' : undefined,
      });
    });

    return results;
  }, [pastedText, products]);

  const matchedCount = parsedRows.filter((r) => r.matchedProduct !== null).length;
  const unmatchedCount = parsedRows.length - matchedCount;

  const handleCommitImport = () => {
    const validRowsToImport: BulkCsvImportRow[] = parsedRows
      .filter((r) => r.matchedProduct !== null)
      .map((r) => ({
        sku: r.sku,
        barcode: r.barcode,
        stock: r.stock,
        sellingPrice: r.sellingPrice,
        costPrice: r.costPrice,
      }));

    if (validRowsToImport.length === 0) {
      alert('No matching products found in the provided CSV rows to update.');
      return;
    }

    const res = onImport(validRowsToImport);
    setImportResult(res);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>CSV & Spreadsheet Bulk Import</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Stock & MRP
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Bulk adjust inventory stock levels and selling prices by uploading a CSV or pasting rows
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
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
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
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Load Sample Data</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
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
                  Successfully updated {importResult.updatedCount} items in catalog!
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                CSV or Tabular Data Input:
              </label>
              <span className="text-[11px] text-slate-500">
                Format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">SKU, Barcode, Stock, Price, Cost</code>
              </span>
            </div>
            <textarea
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                setImportResult(null);
              }}
              rows={4}
              placeholder={`Paste CSV rows or Excel columns here, e.g.:\nSKU,Barcode,Stock,SellingPrice,CostPrice\nVT-MSH-001-M,890100100101,25,1599,500\nVT-MDN-002-32,890100200201,18,2299,900`}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Live Parsing Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Parsed Rows ({parsedRows.length} rows):
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {matchedCount} Matched
                  </span>
                  {unmatchedCount > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {unmatchedCount} Unmatched
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear All
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 tracking-wider sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">SKU / Identifier</th>
                      <th className="py-2 px-3">Catalog Garment</th>
                      <th className="py-2 px-3 text-right">New Stock</th>
                      <th className="py-2 px-3 text-right">New Selling Price</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={row.matchedProduct ? 'hover:bg-slate-50' : 'bg-rose-50/40'}
                      >
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">
                          {row.sku || row.barcode}
                        </td>
                        <td className="py-2 px-3">
                          {row.matchedProduct ? (
                            <div>
                              <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                                {row.matchedProduct.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {row.matchedProduct.size} · {row.matchedProduct.color}
                              </div>
                            </div>
                          ) : (
                            <span className="text-rose-600 text-[11px] font-medium">
                              {row.error}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {typeof row.stock === 'number' && row.matchedProduct ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {row.matchedProduct.stock} → {row.stock} pcs
                            </span>
                          ) : typeof row.stock === 'number' ? (
                            <span>{row.stock} pcs</span>
                          ) : (
                            <span className="text-slate-400">No change</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {typeof row.sellingPrice === 'number' && row.matchedProduct ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              ₹{row.matchedProduct.sellingPrice} → ₹{row.sellingPrice}
                            </span>
                          ) : typeof row.sellingPrice === 'number' ? (
                            <span>₹{row.sellingPrice}</span>
                          ) : (
                            <span className="text-slate-400">No change</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.matchedProduct ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Ready
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                              Skipped
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {matchedCount > 0 ? (
              <span>
                Ready to update <strong>{matchedCount}</strong> matched garments.
              </span>
            ) : (
              <span>Paste or upload CSV rows to preview updates.</span>
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
              disabled={matchedCount === 0}
              onClick={handleCommitImport}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Updates ({matchedCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
