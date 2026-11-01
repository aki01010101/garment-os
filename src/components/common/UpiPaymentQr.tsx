import React, { useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { buildUpiPaymentUri } from '../../utils/upi';
import { Copy, Check, QrCode, AlertCircle } from 'lucide-react';

export interface UpiPaymentQrProps {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  transactionRef?: string;
  size?: number;
  isThermalReceipt?: boolean;
  className?: string;
  showDetails?: boolean;
  onOpenSettings?: () => void;
}

export const UpiPaymentQr: React.FC<UpiPaymentQrProps> = ({
  upiId,
  payeeName,
  amount,
  transactionNote = 'POS Retail Bill',
  transactionRef,
  size = 140,
  isThermalReceipt = false,
  className = '',
  showDetails = true,
  onOpenSettings,
}) => {
  const [copied, setCopied] = useState(false);

  // 1. Build the official NPCI UPI URI string
  const upiUri = useMemo(() => {
    return buildUpiPaymentUri({
      upiId,
      payeeName,
      amount,
      transactionNote,
      transactionRef,
    });
  }, [upiId, payeeName, amount, transactionNote, transactionRef]);

  // 2. Generate SVG QR Code
  const qrSvgString = useMemo(() => {
    if (!upiUri) return '';
    let svgOutput = '';
    try {
      QRCode.toString(
        upiUri,
        {
          type: 'svg',
          width: size,
          margin: isThermalReceipt ? 1 : 2,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        },
        (err, str) => {
          if (!err && str) svgOutput = str;
        }
      );
    } catch (err) {
      console.warn('UPI QR generation error:', err);
    }
    return svgOutput;
  }, [upiUri, size, isThermalReceipt]);

  const handleCopyUri = () => {
    if (!upiUri) return;
    navigator.clipboard.writeText(upiUri).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // If no UPI ID is configured
  if (!upiId || !upiId.trim()) {
    if (isThermalReceipt) {
      return (
        <div
          className="text-center text-[7.5px] text-neutral-500 py-1"
          style={{ textAlign: 'center', margin: '2px auto' }}
        >
          [UPI ID not configured in Settings]
        </div>
      );
    }

    return (
      <div className={`p-4 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-2 ${className}`}>
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-amber-900">Store UPI ID Not Configured</div>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Configure your Store VPA / UPI ID in Settings to enable dynamic customer payment QR codes.
          </p>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            Configure in Settings
          </button>
        )}
      </div>
    );
  }

  // 3. Render Thermal Receipt Monochrome Mode
  if (isThermalReceipt) {
    return (
      <div
        className={`upi-receipt-qr code-container flex flex-col items-center justify-center select-none ${className}`}
        style={{ textAlign: 'center', margin: '3px auto 1px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}
      >
        <div
          style={{ width: `${size}px`, height: `${size}px`, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="qr-wrapper flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block bg-white p-0.5"
          dangerouslySetInnerHTML={{ __html: qrSvgString }}
        />
        {showDetails && (
          <div
            className="code-label font-mono text-[8px] font-bold text-black mt-0.5 text-center"
            style={{ textAlign: 'center', display: 'block', width: '100%', margin: '2px auto 0 auto' }}
          >
            ₹{amount.toFixed(2)} · {upiId}
          </div>
        )}
      </div>
    );
  }

  // 4. Render On-Screen POS Dynamic Payment Box
  return (
    <div className={`p-3.5 bg-white rounded-xl border border-indigo-200/90 shadow-xs flex flex-col items-center text-center space-y-2.5 ${className}`}>
      {/* Amount Header Banner */}
      <div className="w-full flex items-center justify-between border-b border-indigo-100 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
          <QrCode className="w-4 h-4 text-indigo-600" />
          <span>Scan to Pay via UPI</span>
        </div>
        <div className="bg-emerald-50 text-emerald-700 font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-md border border-emerald-200">
          ₹{amount.toFixed(2)}
        </div>
      </div>

      {/* QR Code Container */}
      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs relative flex items-center justify-center">
        <div
          style={{ width: `${size}px`, height: `${size}px` }}
          className="[&>svg]:w-full [&>svg]:h-full [&>svg]:block"
          dangerouslySetInnerHTML={{ __html: qrSvgString }}
        />
      </div>

      {/* Payee Details */}
      <div className="space-y-0.5">
        <div className="font-mono text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
          <span>{upiId}</span>
          <button
            onClick={handleCopyUri}
            title="Copy UPI Deep-Link URI"
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Payee: <span className="font-semibold text-slate-700">{payeeName}</span>
        </div>
      </div>

      {/* Supported UPI App Badges */}
      <div className="w-full pt-1.5 border-t border-slate-100 flex items-center justify-center gap-1.5 flex-wrap text-[10px] text-slate-500 font-semibold">
        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Google Pay</span>
        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">PhonePe</span>
        <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">Paytm</span>
        <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">BHIM</span>
        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Cred</span>
      </div>
    </div>
  );
};

