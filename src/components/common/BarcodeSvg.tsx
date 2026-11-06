import React, { useMemo } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { CodePrintType } from '../../types';

export interface BarcodeSvgProps {
  value: string;
  width?: number; // Target display width in px
  height?: number; // Target bar height in px (for barcode)
  showText?: boolean;
  className?: string;
  type?: CodePrintType; // Optional per-instance override
  qrSize?: number; // Size for QR code in px
}

/**
 * High-precision vector code renderer for thermal printers & POS displays.
 * Supports:
 * 1. Real, standard Code 128 (1D) barcodes scannable by all physical laser & optical barcode scanners.
 * 2. Real ISO/IEC 18004 QR Codes (2D) scannable by smartphone cameras and 2D barcode imagers.
 * Synchronous pure vector SVG generation with zero layout shift and zero render latency.
 */
export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  width,
  height = 28,
  showText = true,
  className = '',
  type,
  qrSize = 76,
}) => {
  // Read global code print format setting from context if not explicitly overridden
  let globalType: CodePrintType = 'barcode';
  try {
    const app = useApp();
    if (app && app.codePrintType) {
      globalType = app.codePrintType;
    }
  } catch {
    // If rendered outside AppProvider (e.g. standalone preview), fallback to localStorage
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('garment_os_code_print_type');
      if (saved === 'qr') globalType = 'qr';
    }
  }

  const effectiveType: CodePrintType = type || globalType;
  const cleanValue = (value || '000000').trim();

  // 1. REAL CODE 128 GENERATION (1D)
  const barcodeData = useMemo(() => {
    if (effectiveType !== 'barcode') return null;

    try {
      // Obtain standard Code 128 Auto module from JsBarcode
      const Code128Module = (JsBarcode as any).getModule
        ? (JsBarcode as any).getModule('CODE128')
        : null;

      if (!Code128Module) throw new Error('Code128 module not loaded');

      const encoder = new Code128Module(cleanValue, {});
      const encoded = encoder.encode();
      const bitString: string = encoded.data || '';

      if (!bitString) throw new Error('No barcode data returned');

      // Convert binary string (1s and 0s) into merged rectangular bar intervals
      const rects: { x: number; width: number }[] = [];
      let currentStart = -1;

      for (let i = 0; i < bitString.length; i++) {
        if (bitString[i] === '1') {
          if (currentStart === -1) currentStart = i;
        } else {
          if (currentStart !== -1) {
            rects.push({ x: currentStart, width: i - currentStart });
            currentStart = -1;
          }
        }
      }
      if (currentStart !== -1) {
        rects.push({ x: currentStart, width: bitString.length - currentStart });
      }

      return { totalModules: bitString.length, rects };
    } catch (err) {
      console.warn('Code 128 generation error:', err);
      // Fallback pseudo-pattern to avoid empty broken rendering
      return { totalModules: 100, rects: [] };
    }
  }, [effectiveType, cleanValue]);

  // 2. REAL QR CODE GENERATION (2D)
  const qrSvgString = useMemo(() => {
    if (effectiveType !== 'qr') return '';

    let svgOutput = '';
    try {
      QRCode.toString(
        cleanValue,
        {
          type: 'svg',
          width: qrSize,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        },
        (err, str) => {
          if (!err && str) {
            svgOutput = str.replace(
              '<svg',
              `<svg width="${qrSize}" height="${qrSize}" style="display:block;margin:0 auto;width:100%;height:100%;max-width:${qrSize}px;max-height:${qrSize}px;-webkit-print-color-adjust:exact;print-color-adjust:exact;"`
            );
          }
        }
      );
    } catch (err) {
      console.warn('QR code generation error:', err);
    }

    return svgOutput;
  }, [effectiveType, cleanValue, qrSize]);

  // Render QR Code (2D)
  if (effectiveType === 'qr') {
    return (
      <div
        className={`code-container flex flex-col items-center justify-center select-none ${className}`}
        style={{ textAlign: 'center', margin: '2px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}
      >
        <div
          style={{ width: `${qrSize}px`, height: `${qrSize}px`, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
          className="qr-wrapper flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block bg-white p-0.5 rounded-xs"
          dangerouslySetInnerHTML={{ __html: qrSvgString }}
        />
        {showText && (
          <span
            className="code-label font-mono text-[9px] tracking-wider text-black mt-0.5 font-bold text-center"
            style={{ textAlign: 'center', display: 'block', width: '100%', margin: '2px auto 0 auto' }}
          >
            {cleanValue}
          </span>
        )}
      </div>
    );
  }

  // Render Code 128 Barcode (1D)
  const totalModules = barcodeData?.totalModules || 110;
  const rects = barcodeData?.rects || [];
  const targetWidth = width || 135;

  return (
    <div
      className={`code-container flex flex-col items-center justify-center select-none ${className}`}
      style={{ textAlign: 'center', margin: '2px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}
    >
      <svg
        viewBox={`0 0 ${totalModules} ${height}`}
        width={targetWidth}
        height={height}
        style={{ width: `${targetWidth}px`, height: `${height}px`, display: 'block', margin: '0 auto', maxWidth: '100%', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        className="shape-rendering-crispEdges block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={totalModules} height={height} fill="#ffffff" style={{ fill: '#ffffff' }} />
        {rects.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={0}
            width={bar.width}
            height={height}
            fill="#000000"
            style={{ fill: '#000000', shapeRendering: 'crispEdges', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          />
        ))}
      </svg>
      {showText && (
        <span
          className="code-label font-mono text-[9px] tracking-wider text-black mt-0.5 font-bold text-center"
          style={{ textAlign: 'center', display: 'block', width: '100%', margin: '2px auto 0 auto' }}
        >
          {cleanValue}
        </span>
      )}
    </div>
  );
};
