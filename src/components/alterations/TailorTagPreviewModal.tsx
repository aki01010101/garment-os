import React, { useRef, useState, useEffect } from 'react';
import { AlterationRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  formatTailorSlipToEscPos,
  printViaWebUsb,
  printViaWebBluetooth,
  detectLocalPrinters,
} from '../../utils/escpos';
import {
  Printer,
  X,
  Copy,
  Check,
  Scissors,
  Receipt,
  Bluetooth,
  Usb,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface TailorTagPreviewModalProps {
  alteration: AlterationRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TailorTagPreviewModal: React.FC<TailorTagPreviewModalProps> = ({
  alteration,
  isOpen,
  onClose,
}) => {
  const { activeCompany } = useApp();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [printMethod, setPrintMethod] = useState<'usb' | 'bluetooth' | 'browser'>(() => {
    return (localStorage.getItem('default_printer_type') as any) || 'usb';
  });
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [detectedHardware, setDetectedHardware] = useState<{ printers: any[]; ports: any[] }>({
    printers: [],
    ports: [],
  });

  useEffect(() => {
    detectLocalPrinters().then((hw) => {
      setDetectedHardware(hw);
    });
  }, []);

  const setAndSavePrintMethod = (method: 'usb' | 'bluetooth' | 'browser') => {
    setPrintMethod(method);
    localStorage.setItem('default_printer_type', method);
  };

  if (!isOpen || !alteration) return null;

  const firmName = (activeCompany?.name || 'Store Apparel').toUpperCase();

  const handlePrint = async () => {
    if (printMethod === 'browser') {
      if (receiptRef.current) {
        printThermalReceiptHtml(receiptRef.current.innerHTML);
      } else {
        window.focus();
        window.print();
      }
      return;
    }

    setIsPrinting(true);
    setPrintStatus(
      printMethod === 'usb'
        ? 'Connecting to USB Thermal Printer (203 DPI Dark)...'
        : 'Connecting to Bluetooth Printer (COM4 / SPP)...'
    );

    try {
      const payload = formatTailorSlipToEscPos(alteration, {
        columns: 32,
        companyName: firmName,
      });

      if (printMethod === 'usb') {
        const res = await printViaWebUsb(payload, (status) => setPrintStatus(status));
        if (res.success) {
          setPrintStatus(`✅ Printed Tailor Tag via USB (203 DPI Pitch-Black)!`);
        } else {
          setPrintStatus(`❌ USB Print Error: ${res.error}`);
        }
      } else if (printMethod === 'bluetooth') {
        const res = await printViaWebBluetooth(payload, (status) => setPrintStatus(status));
        if (res.success) {
          setPrintStatus(`✅ Printed Tailor Tag via Bluetooth!`);
        } else {
          setPrintStatus(`❌ Bluetooth Print Error: ${res.error}`);
        }
      }
    } catch (err: any) {
      setPrintStatus(`❌ ${err.message || 'Printing failed'}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const generateTagText = () => {
    return `
✂️ *${firmName} - ALTERATION TAG*
--------------------------------
📅 Booked: ${alteration.createdDate}
👕 Garment: ${alteration.garmentName} [Size: ${alteration.size}, ${alteration.color}]
✂️ Alteration Instructions: ${alteration.alterationNotes}
⏰ Ready By: ${alteration.promisedDate}
--------------------------------
📌 STAPLE TO GARMENT
    `.trim();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateTagText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden flex flex-col my-6">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
              <Scissors className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Garment Alteration Tag</h3>
              <p className="text-xs text-slate-500 font-mono">Job #{alteration.id.slice(-6)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Realistic Thermal Paper Preview Box */}
        <div className="p-6 bg-slate-200/70 flex flex-col items-center justify-center overflow-y-auto max-h-[60vh]">
          <div className="text-[11px] font-medium text-slate-600 mb-2.5 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            <span>Garment Workshop Tag (Staple Format)</span>
          </div>

          <div
            ref={receiptRef}
            className="thermal-receipt-50mm shadow-xl rounded-xs border border-neutral-300 relative bg-white"
          >
            {/* Tear edge */}
            <div className="w-full text-center text-[7px] text-neutral-400 select-none pb-1 tracking-widest no-print">
              - - - - - - TEAR HERE - - - - - -
            </div>

            {/* Header: Updated with dynamic firm name */}
            <div className="text-center mb-1">
              <div className="receipt-title">{firmName}</div>
              <div className="receipt-sub mt-0.5">ALTERATION JOB TICKET</div>
              <div className="receipt-sub text-[8px]">ATTACH SECURELY TO GARMENT</div>
            </div>

            <hr />

            {/* Garment Details & Date */}
            <div className="text-[9.5px] leading-tight space-y-1 font-mono">
              <div className="receipt-row text-[9px]">
                <span>BOOKED:</span>
                <span>{alteration.createdDate}</span>
              </div>

              <div className="font-bold text-[10px] pt-1">{alteration.garmentName}</div>
              <div className="text-[8.5px] text-neutral-700">
                Size: {alteration.size} · Color: {alteration.color}
              </div>

              {/* Alteration Instructions Box */}
              <div
                style={{
                  margin: '4px 0',
                  padding: '4px',
                  border: '1px dashed #000',
                  backgroundColor: '#fbfbfb',
                }}
              >
                <div className="font-bold text-[8.5px] uppercase">Alteration Instructions:</div>
                <div className="text-[9.5px] font-sans font-semibold mt-0.5 text-black">
                  {alteration.alterationNotes}
                </div>
              </div>

              <div className="receipt-row font-bold text-[10.5px] pt-0.5">
                <span>READY BY:</span>
                <span>{alteration.promisedDate}</span>
              </div>
            </div>

            <hr />

            {/* Barcode & Footer */}
            <div
              className="receipt-footer text-center pt-1 space-y-1"
              style={{ textAlign: 'center', margin: '4px auto 0 auto', width: '100%' }}
            >
              <BarcodeSvg
                value={`ALT${alteration.id.slice(-6)}`}
                width={120}
                height={22}
                showText={false}
              />
              <div
                className="receipt-thanks text-[8px] font-bold tracking-wider pt-0.5"
                style={{ textAlign: 'center', margin: '2px auto 0 auto', width: '100%', display: 'block' }}
              >
                *** STAPLE TO GARMENT ***
              </div>
            </div>
          </div>
        </div>

        {/* Print Method Selector & Status Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Printer Output:</span>
            </span>
            {(detectedHardware.printers.length > 0 || detectedHardware.ports.length > 0) && (
              <span className="text-[10px] text-emerald-800 font-medium flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {detectedHardware.printers.length > 0 ? detectedHardware.printers[0].Name : detectedHardware.ports[0].DeviceID}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setAndSavePrintMethod('usb')}
              className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                printMethod === 'usb'
                  ? 'border-cyan-600 bg-cyan-50/80 text-cyan-900 font-bold ring-1 ring-cyan-500'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px]">
                <Usb className="w-3 h-3 text-cyan-600" />
                <span>USB 203 DPI</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAndSavePrintMethod('bluetooth')}
              className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                printMethod === 'bluetooth'
                  ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px]">
                <Bluetooth className="w-3 h-3 text-indigo-600" />
                <span>Bluetooth</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAndSavePrintMethod('browser')}
              className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                printMethod === 'browser'
                  ? 'border-slate-800 bg-slate-100 text-slate-900 font-bold ring-1 ring-slate-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px]">
                <Printer className="w-3 h-3 text-slate-700" />
                <span>Browser</span>
              </div>
            </button>
          </div>

          {printStatus && (
            <div className={`p-1.5 rounded-lg border text-[10px] flex items-center justify-between gap-1.5 ${
              printStatus.startsWith('✅')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                : printStatus.startsWith('❌')
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900 animate-pulse'
            }`}>
              <span className="truncate">{printStatus}</span>
              <button
                onClick={() => setPrintStatus(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={handleCopyText}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200/80 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer ${
                printMethod === 'usb'
                  ? 'bg-cyan-700 hover:bg-cyan-800 disabled:bg-slate-300'
                  : printMethod === 'bluetooth'
                  ? 'bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300'
              }`}
            >
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : printMethod === 'usb' ? (
                <Usb className="w-3.5 h-3.5" />
              ) : printMethod === 'bluetooth' ? (
                <Bluetooth className="w-3.5 h-3.5" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span>
                {isPrinting
                  ? 'Printing...'
                  : `Print (${printMethod === 'usb' ? 'USB' : printMethod === 'bluetooth' ? 'Bluetooth' : 'Dialog'})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
