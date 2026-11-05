import React, { useState } from 'react';
import {
  Printer,
  Check,
  X,
  Sliders,
  ExternalLink,
  AlertCircle,
  FileText,
  Bluetooth,
  Zap,
  Smartphone,
  Info,
  HelpCircle,
} from 'lucide-react';
import {
  isWebBluetoothSupported,
  formatTestReceipt,
  printViaWebBluetooth,
  printViaRawBT,
} from '../../utils/escpos';

interface PrinterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterGuideModal: React.FC<PrinterGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'everycom' | 'browser' | 'troubleshoot'>('everycom');
  const [paperColumns, setPaperColumns] = useState<32 | 48>(32);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestBluetooth = async () => {
    setIsTesting(true);
    setTestStatus('Requesting Bluetooth Printer...');
    try {
      const payload = formatTestReceipt({ columns: paperColumns });
      const result = await printViaWebBluetooth(payload, (status) => setTestStatus(status));
      if (result.success) {
        setTestStatus(`✅ Success: Test printed to ${result.deviceName || 'Everycom Printer'}!`);
      } else {
        setTestStatus(`❌ ${result.error || 'Print failed.'}`);
      }
    } catch (err: any) {
      setTestStatus(`❌ Error: ${err.message || 'Bluetooth error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestRawBT = () => {
    setTestStatus('Sending test receipt to RawBT app...');
    const payload = formatTestReceipt({ columns: paperColumns });
    const res = printViaRawBT(payload);
    if (res.success) {
      setTestStatus('⚡ Sent to RawBT! If RawBT is installed, receipt will print immediately.');
    } else {
      setTestStatus(`❌ RawBT error: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Everycom & Thermal Printer Guide</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Android & PC
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Connect Everycom EC-58, EC-80, or any ESC/POS thermal printer directly to Garment OS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('everycom')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'everycom'
                ? 'border-indigo-600 text-indigo-700 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bluetooth className="w-4 h-4 text-indigo-600" />
            <span>Everycom & Android Direct</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('browser')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'browser'
                ? 'border-indigo-600 text-indigo-700 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>PC / Mac Browser Setup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('troubleshoot')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'troubleshoot'
                ? 'border-indigo-600 text-indigo-700 font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-600" />
            <span>Troubleshooting & Quality</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs text-slate-600 overflow-y-auto max-h-[68vh]">
          {activeTab === 'everycom' && (
            <div className="space-y-4">
              {/* Highlight Banner */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl space-y-1.5">
                <div className="font-extrabold text-indigo-950 flex items-center gap-2 text-sm">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Printing from Android Phone to Everycom Printer</span>
                </div>
                <p className="text-indigo-900 leading-relaxed">
                  Mobile browsers normally cannot format thermal receipts directly. Garment OS offers two direct integration methods so you can print with zero hassle!
                </p>
              </div>

              {/* Step 1: Printer Hardware & Bluetooth Pairing */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <span>Pair Everycom with Android via Bluetooth</span>
                </h4>

                <div className="space-y-2 text-slate-700 pl-7">
                  <p>
                    <strong>1. Prepare the printer:</strong> Insert 58mm or 80mm thermal roll (ensure paper feeds from the bottom towards front). Turn power ON.
                  </p>
                  <p>
                    <strong>2. Self-test (Optional):</strong> Hold FEED button while powering ON to print printer Bluetooth name and baud rate.
                  </p>
                  <p>
                    <strong>3. Android Bluetooth Pairing:</strong> Open Android <em>Settings &gt; Bluetooth &gt; Pair new device</em>. Tap your printer (e.g. <code>Everycom EC58</code>, <code>POS-58</code>, or <code>Printer001</code>).
                  </p>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-medium">
                    🔑 <strong>Default Pairing PIN:</strong> Enter <strong>1234</strong> or <strong>0000</strong>. Once paired, it will appear under "Paired Devices".
                  </div>
                </div>
              </div>

              {/* Step 2: Choose Method (Web Bluetooth vs RawBT) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Method A: Web Bluetooth API */}
                <div className="p-4 rounded-xl border-2 border-indigo-200 bg-white space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
                        <Bluetooth className="w-4 h-4 text-indigo-600" />
                        <span>Method A: Web Bluetooth</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        Zero Apps
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1.5 leading-relaxed">
                      Connects directly from Chrome or Edge on Android over HTTPS. Sends native ESC/POS commands straight to Everycom BLE.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-slate-500 space-y-1">
                      <li>No external apps required</li>
                      <li>Single tap to select device</li>
                      <li>Keeps connection active for fast repeat bills</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestBluetooth}
                    disabled={isTesting}
                    className="w-full mt-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>{isTesting ? 'Printing...' : 'Test Web Bluetooth Print'}</span>
                  </button>
                </div>

                {/* Method B: RawBT Print Service */}
                <div className="p-4 rounded-xl border-2 border-slate-200 bg-white space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500 fill-current" />
                        <span>Method B: RawBT App</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        Classic BT & USB
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1.5 leading-relaxed">
                      For Classic Bluetooth (SPP) Everycom printers or USB-OTG. A background print bridge for Android.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-slate-500 space-y-1">
                      <li>Install RawBT once from Play Store</li>
                      <li>Select Everycom printer in RawBT</li>
                      <li>Garment OS triggers instant 1-click prints</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleTestRawBT}
                      className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      <span>Test RawBT Print</span>
                    </button>
                    <a
                      href="https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600"
                      title="Install RawBT on Google Play Store"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              {testStatus && (
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 flex items-center justify-between">
                  <span>{testStatus}</span>
                  <button
                    onClick={() => setTestStatus(null)}
                    className="text-slate-500 hover:text-slate-800 font-bold ml-2 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Paper Width Selector */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Default Paper Width:</span>
                  <p className="text-[11px] text-slate-500">
                    Matches your Everycom roll width (58mm = 32 cols, 80mm = 48 cols).
                  </p>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <button
                    type="button"
                    onClick={() => setPaperColumns(32)}
                    className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      paperColumns === 32
                        ? 'bg-white text-indigo-700 border-indigo-300 shadow-2xs font-extrabold'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    58mm (2-inch)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperColumns(48)}
                    className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      paperColumns === 48
                        ? 'bg-white text-indigo-700 border-indigo-300 shadow-2xs font-extrabold'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    80mm (3-inch)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'browser' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-indigo-950">Zero-Margin Thermal Output (PC / Mac)</div>
                  <p className="text-indigo-800 leading-relaxed">
                    When printing via your computer browser (Chrome, Edge, or Firefox), configure these 4 settings once. Your browser will remember them for all future receipts!
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">Destination:</span>
                    <p className="text-slate-600">Select your thermal receipt printer (USB, Network, or Bluetooth Everycom).</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">Paper Size:</span>
                    <p className="text-slate-600">
                      Choose <strong>"58mm x 210mm"</strong>, <strong>"58mm Roll"</strong>, or <strong>"2-Inch Receipt"</strong>. (If using 80mm, choose 80mm Roll).
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
                      Set to <strong>"None"</strong> or <strong>"Minimum"</strong>. Never use "Default" margins which introduce 0.4-inch left and right borders that shrink the receipt.
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
          )}

          {activeTab === 'troubleshoot' && (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                <div className="p-3.5 space-y-1">
                  <span className="font-bold text-slate-900">1. Blank paper feeds out with no text:</span>
                  <p className="text-slate-600">
                    Thermal paper only prints on one heat-sensitive side! Open printer cover, flip the paper roll over so the glossy side faces the thermal print head, and close tightly.
                  </p>
                </div>

                <div className="p-3.5 space-y-1 bg-amber-50/50">
                  <span className="font-bold text-amber-950">2. Faint or light printing:</span>
                  <p className="text-slate-700">
                    Turn ON <strong>"🖨️ Bold: ON"</strong> directly on the receipt preview window. It applies heavy double-strike black strokes across all text and barcodes, ensuring high contrast on aging printer heads.
                  </p>
                </div>

                <div className="p-3.5 space-y-1">
                  <span className="font-bold text-slate-900">3. Garbled symbols or question marks:</span>
                  <p className="text-slate-600">
                    Thermal printers do not support Unicode ₹ characters natively. Garment OS automatically converts Rupee symbols into crisp <code>Rs.</code> in ESC/POS mode to ensure zero corrupted characters!
                  </p>
                </div>

                <div className="p-3.5 space-y-1">
                  <span className="font-bold text-slate-900">4. Printer not detected in Bluetooth list:</span>
                  <p className="text-slate-600">
                    Turn Everycom power switch OFF and ON. Check if printer is already connected to another smartphone or tablet (thermal printers only allow 1 active Bluetooth connection at a time).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Direct Everycom ESC/POS Driver · Garment OS
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
