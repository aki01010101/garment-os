import React from 'react';
import { Printer, Check, X, Sliders, ExternalLink, AlertCircle, FileText } from 'lucide-react';

interface PrinterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterGuideModal: React.FC<PrinterGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Printer className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                58mm / 2-Inch Thermal Printer Configuration Guide
              </h3>
              <p className="text-xs text-slate-500">
                Ensure zero margin clipping and sharp 203 DPI output on ESC/POS thermal printers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-600 overflow-y-auto max-h-[70vh]">
          {/* Quick Notice */}
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-indigo-950">Standard 58mm Thermal Printers</div>
              <p className="text-indigo-800 leading-relaxed">
                Most retail 2-inch receipt printers (such as Epson TM-T20/T88 in 58mm mode, TVS RP-3200, POS-58, Everycom, or Bluetooth/USB 58mm thermal printers) use 58mm roll paper with approximately <strong>48mm active printable width (~32 characters per line)</strong>.
              </p>
            </div>
          </div>

          {/* Browser Print Dialog Step-by-Step */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Step 1: Browser Print Dialog Settings (Chrome / Edge / Firefox)</span>
            </h4>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  1
                </span>
                <div>
                  <span className="font-bold text-slate-900">Destination:</span>
                  <p className="text-slate-600">Select your thermal receipt printer (USB, Network, or Bluetooth).</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  2
                </span>
                <div>
                  <span className="font-bold text-slate-900">Paper Size:</span>
                  <p className="text-slate-600">
                    Choose <strong>"58mm x 210mm"</strong>, <strong>"58mm Roll"</strong>, or <strong>"2-Inch Receipt"</strong>. (If not listed, create a custom form in Windows Printer Properties measuring 58mm width).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  3
                </span>
                <div>
                  <span className="font-bold text-slate-900">Margins:</span>
                  <p className="text-slate-600">
                    Set to <strong>"None"</strong> or <strong>"Minimum"</strong>. Never use "Default" margins which introduce 0.4-inch left and right borders that shrink the 58mm receipt.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  4
                </span>
                <div>
                  <span className="font-bold text-slate-900">Headers and Footers:</span>
                  <p className="text-slate-600">
                    <strong>UNCHECK</strong> the "Headers and footers" box so the browser URL, date, and page numbers are not printed on your receipt tape.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Windows / Driver Setup */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Step 2: Windows / Mac Printer Driver Setup
            </h4>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
              <div className="p-3">
                <span className="font-semibold text-slate-900">Dithering & Text Sharpness:</span>
                <p className="text-slate-500 mt-0.5">
                  In driver preferences, set Graphic Dithering to <strong>"Threshold"</strong> or <strong>"None"</strong> to ensure barcode lines and clothing SKUs are solid black vectors rather than grey dots.
                </p>
              </div>
              <div className="p-3">
                <span className="font-semibold text-slate-900">Auto Paper Cut:</span>
                <p className="text-slate-500 mt-0.5">
                  Set Document Cut to <strong>"Cut after job"</strong> or <strong>"Partial Cut"</strong> if your 50mm/58mm printer includes an integrated guillotine paper cutter.
                </p>
              </div>
              <div className="p-3 bg-amber-50/50">
                <span className="font-semibold text-amber-950 flex items-center gap-1">
                  <span>🖨️ Faint / Light Thermal Printing?</span>
                </span>
                <p className="text-slate-600 mt-0.5">
                  Turn ON <strong>"Print Everything in Bold"</strong> directly on the receipt preview window. It burns thick, high-density solid black strokes across all text, ensuring crisp legibility even on low-heat printers or aging thermal rolls.
                </p>
              </div>
            </div>
          </div>

          {/* Price Tag Thermal Labels */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Price Tag Thermal Label Printers (Argox, TSC, Zebra, Rollo)
            </h4>
            <p className="leading-relaxed text-slate-600">
              When printing adhesive clothing price tags from the <strong>Price Tag Generator</strong> module:
              Set paper size to <strong>50mm x 32mm</strong> (or 2" x 1.25" barcode label roll). The labels include vector scannable barcodes, large bold clothing sizes, color, and MRP with tax disclaimer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Settings will be remembered by your browser after the first print.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
