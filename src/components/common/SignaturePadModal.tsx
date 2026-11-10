import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Check,
  RotateCcw,
  FileSignature,
  FileText,
  AlertCircle,
  Calendar,
  DollarSign,
  PenTool,
} from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  previousBalance?: number;
  creditAmount?: number;
  totalNewBalance: number;
  dueDate?: string;
  onConfirm: (signatureDataUrl: string) => void;
  onSignOnPaper?: () => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  previousBalance = 0,
  creditAmount = 0,
  totalNewBalance,
  dueDate,
  onConfirm,
  onSignOnPaper,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Setup high-DPI canvas
  useEffect(() => {
    if (!isOpen) return;

    const setupCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#000000'; // Pure black for crisp thermal printing
      }
      setHasDrawn(false);
    };

    // Small delay to ensure modal DOM is mounted and measured
    const timer = setTimeout(setupCanvas, 60);
    window.addEventListener('resize', setupCanvas);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', setupCanvas);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setLastPoint(coords);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw single dot if clicked without dragging
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    setHasDrawn(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    const coords = getCanvasCoords(e);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
    setHasDrawn(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    setLastPoint(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      alert('Please provide a signature in the box or choose "Sign on Paper Receipt".');
      return;
    }

    // Export clean PNG data URL with transparent background
    const dataUrl = canvas.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Customer Signature & Khata Acknowledgment
              </h2>
              <p className="text-xs text-slate-300">
                Customer: <span className="text-white font-semibold">{customerName}</span> ({customerPhone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Outstanding Khata Debt Breakdown Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {previousBalance > 0 && (
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Previous Khata</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    ₹{previousBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {creditAmount > 0 && (
                <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-700 font-semibold block">This Bill Credit</span>
                  <span className="font-mono font-bold text-amber-900 text-xs">
                    +₹{creditAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className={`p-1.5 rounded-lg border ${
                previousBalance > 0 && creditAmount > 0
                  ? 'bg-indigo-50 border-indigo-200 col-span-1'
                  : 'bg-indigo-50 border-indigo-200 col-span-2'
              }`}>
                <span className="text-[10px] text-indigo-700 font-bold block uppercase tracking-wider">
                  Total Outstanding
                </span>
                <span className="font-mono font-black text-indigo-950 text-sm">
                  ₹{totalNewBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {dueDate && (
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mt-2.5 pt-2 border-t border-slate-200">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Agreed Repayment Due Date:
                </span>
                <span className="font-mono font-bold text-indigo-700">{dueDate}</span>
              </div>
            )}
          </div>

          {/* Interactive Signature Canvas Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                <span>Customer Signature (Sign in Box Below):</span>
              </label>
              <button
                type="button"
                onClick={handleClear}
                disabled={!hasDrawn}
                className="text-[11px] text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Canvas</span>
              </button>
            </div>

            <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner touch-none">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="w-full h-36 sm:h-40 cursor-crosshair block"
                style={{ touchAction: 'none' }}
              />

              {!hasDrawn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none">
                  <PenTool className="w-6 h-6 mb-1 text-slate-300 stroke-1" />
                  <span className="text-xs font-medium">Draw signature with finger, stylus, or mouse</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">X ________________________________________</span>
                </div>
              )}
            </div>
          </div>

          {/* Legal / Khata Declaration Notice */}
          <p className="text-[11px] text-slate-500 italic leading-snug">
            "I acknowledge the previous balance and/or credit amount stated above, and agree to settle the total outstanding balance by the promised due date."
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          {onSignOnPaper && (
            <button
              type="button"
              onClick={onSignOnPaper}
              className="w-full sm:w-auto py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Sign on Paper Receipt</span>
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasDrawn}
              className="flex-1 sm:flex-initial py-2.5 px-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Confirm & Save Signature</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

