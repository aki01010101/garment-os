import React, { useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Star, ExternalLink, Copy, Check } from 'lucide-react';

export interface GoogleReviewQrProps {
  reviewUrl: string;
  size?: number;
  title?: string;
  subTitle?: string;
  isThermalReceipt?: boolean;
  className?: string;
  showDetails?: boolean;
}

export const GoogleReviewQr: React.FC<GoogleReviewQrProps> = ({
  reviewUrl,
  size = 120,
  title = 'Rate Us 5★ On Google',
  subTitle = 'Scan with camera to leave a review',
  isThermalReceipt = false,
  className = '',
  showDetails = true,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate pure vector inline SVG string from URL
  const qrSvgString = useMemo(() => {
    if (!reviewUrl || !reviewUrl.trim()) return '';
    let svgOutput = '';
    try {
      QRCode.toString(
        reviewUrl.trim(),
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
      console.warn('Google Review QR generation error:', err);
    }
    return svgOutput;
  }, [reviewUrl, size, isThermalReceipt]);

  const handleCopy = () => {
    if (!reviewUrl) return;
    navigator.clipboard.writeText(reviewUrl.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // If no review URL is provided
  if (!reviewUrl || !reviewUrl.trim()) {
    if (isThermalReceipt) return null;
    return (
      <div className={`p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center ${className}`}>
        <Star className="w-6 h-6 text-amber-400 mx-auto mb-1 stroke-1" />
        <div className="text-xs font-bold text-slate-700">Google Review URL Not Configured</div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Add your Google Profile / Review link in Settings to enable the review QR on your bills.
        </p>
      </div>
    );
  }

  // --- 1. THERMAL PRINTER RENDER MODE (58mm / 80mm high-contrast vector) ---
  if (isThermalReceipt) {
    return (
      <div
        className="google-review-receipt-block text-center py-1 space-y-0.5"
        style={{
          textAlign: 'center',
          margin: '3px auto 1px auto',
          width: '100%',
          display: 'block',
        }}
      >
        {/* Star Rating Header */}
        <div
          style={{
            fontSize: '9px',
            fontWeight: 900,
            letterSpacing: '2px',
            color: '#000000',
            lineHeight: 1.1,
          }}
        >
          ★ ★ ★ ★ ★
        </div>

        {/* Title / Call to Action */}
        <div
          style={{
            fontSize: '8px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            color: '#000000',
            margin: '1px 0',
          }}
        >
          {title}
        </div>

        {/* Pure Vector Inline SVG QR Code */}
        {qrSvgString ? (
          <div
            dangerouslySetInnerHTML={{ __html: qrSvgString }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '2px auto',
              width: `${size}px`,
              maxWidth: '100%',
            }}
          />
        ) : (
          <div style={{ fontSize: '7px', color: '#000' }}>[QR Code Error]</div>
        )}

        {/* Subtitle / Scan Hint */}
        <div
          style={{
            fontSize: '6.5px',
            fontWeight: 600,
            color: '#333333',
            letterSpacing: '0.2px',
            textTransform: 'uppercase',
          }}
        >
          {subTitle}
        </div>
      </div>
    );
  }

  // --- 2. SCREEN / ON-SCREEN PREVIEW MODE ---
  return (
    <div className={`flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-xs ${className}`}>
      {/* 5-Star Header */}
      <div className="flex items-center gap-1 text-amber-500 mb-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-500" />
        ))}
      </div>

      <div className="text-xs font-extrabold text-slate-900 tracking-tight text-center">
        {title}
      </div>

      <p className="text-[11px] text-slate-500 text-center mb-3">
        {subTitle}
      </p>

      {/* SVG QR Code */}
      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center">
        {qrSvgString ? (
          <div
            dangerouslySetInnerHTML={{ __html: qrSvgString }}
            className="flex items-center justify-center"
          />
        ) : (
          <div className="text-xs text-rose-500">Failed to render QR</div>
        )}
      </div>

      {showDetails && (
        <div className="w-full mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
            {reviewUrl}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Copy Review URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
              title="Open Google Review Link in browser"
            >
              <span>Test</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
