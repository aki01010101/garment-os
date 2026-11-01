import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  CameraDevice,
} from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  X,
  Flashlight,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Keyboard,
  ArrowRight,
  ShieldAlert,
  Play,
} from 'lucide-react';
import { playScannerBeep } from '../../utils/audioBeep';
import { stopAllCameraHardware } from '../../utils/cameraManager';

export interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
  title?: string;
  subtitle?: string;
  allowContinuous?: boolean;
  defaultContinuous?: boolean;
  sampleCodes?: Array<{ label: string; code: string; type?: string }>;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Barcode & QR Scanner',
  subtitle = 'Scan garment price tags, invoice QR codes, or tailor tickets',
  allowContinuous = true,
  defaultContinuous = false,
  sampleCodes = [],
}) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [continuousMode, setContinuousMode] = useState(defaultContinuous);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [manualCode, setManualCode] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScanCodeRef = useRef<string>('');
  const isAbortedRef = useRef<boolean>(false);
  const activeSessionRef = useRef<number>(0);

  /**
   * Forcibly stops scanner and terminates all active hardware camera tracks
   */
  const stopScanner = useCallback(async () => {
    isAbortedRef.current = true;
    activeSessionRef.current++;

    // 1. Immediately force kill all hardware camera tracks to turn off laptop webcam LED
    stopAllCameraHardware();

    // 2. Safely stop and clear Html5Qrcode instance
    if (scannerRef.current) {
      const instance = scannerRef.current;
      scannerRef.current = null;
      try {
        if (instance.isScanning) {
          await instance.stop().catch(() => {});
        }
      } catch {}
      try {
        instance.clear();
      } catch {}
    }

    setIsScanning(false);
    setIsStarting(false);
    setTorchOn(false);
  }, []);

  /**
   * Complete close sequence: shuts down camera hardware first, then notifies parent
   */
  const handleClose = useCallback(async () => {
    isAbortedRef.current = true;
    await stopScanner();
    stopAllCameraHardware();
    onClose();
  }, [stopScanner, onClose]);

  /**
   * Handle successful barcode / QR detection
   */
  const handleDecoded = useCallback(
    (decodedText: string) => {
      const trimmed = decodedText.trim();
      if (!trimmed) return;

      const now = Date.now();
      // Debounce: prevent duplicate scan of exact same code within 1.4 seconds
      if (trimmed === lastScanCodeRef.current && now - lastScanTimeRef.current < 1400) {
        return;
      }

      lastScanCodeRef.current = trimmed;
      lastScanTimeRef.current = now;

      if (soundEnabled) {
        playScannerBeep('success');
      }

      setLastScannedCode(trimmed);
      setScanCount((prev) => prev + 1);

      onScan(trimmed);

      // In single-scan mode: stop camera hardware and close popup immediately
      if (!continuousMode) {
        isAbortedRef.current = true;
        stopScanner();
        stopAllCameraHardware();
        onClose();
      }
    },
    [continuousMode, soundEnabled, onScan, stopScanner, onClose]
  );

  /**
   * Starts camera scanner
   */
  const startScanner = useCallback(
    async (targetCameraId?: string) => {
      if (!isOpen) return;

      const currentSession = ++activeSessionRef.current;
      isAbortedRef.current = false;
      setIsStarting(true);
      setErrorMsg(null);
      setIsPermissionDenied(false);

      try {
        // Clear any previous instance and kill old tracks first
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop().catch(() => {});
            }
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }
        stopAllCameraHardware();

        if (isAbortedRef.current || currentSession !== activeSessionRef.current) {
          setIsStarting(false);
          return;
        }

        const scannerElement = document.getElementById(containerId.current);
        if (!scannerElement) {
          setIsStarting(false);
          return;
        }

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ];

        const html5QrCode = new Html5Qrcode(containerId.current, {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        // Camera target constraint
        let cameraTarget: string | MediaTrackConstraints = { facingMode: 'environment' };
        if (targetCameraId) {
          cameraTarget = targetCameraId;
        } else if (selectedCameraId) {
          cameraTarget = selectedCameraId;
        }

        await html5QrCode.start(
          cameraTarget,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              return {
                width: Math.max(200, Math.floor(minEdge * 0.85)),
                height: Math.max(140, Math.floor(minEdge * 0.65)),
              };
            },
            aspectRatio: 1.333333,
          },
          (decodedText) => {
            handleDecoded(decodedText);
          },
          () => {}
        );

        // Check if user closed modal while camera was initializing
        if (isAbortedRef.current || currentSession !== activeSessionRef.current) {
          try {
            await html5QrCode.stop().catch(() => {});
            html5QrCode.clear();
          } catch {}
          stopAllCameraHardware();
          scannerRef.current = null;
          setIsScanning(false);
          setIsStarting(false);
          return;
        }

        setIsScanning(true);
        setIsStarting(false);

        // Check torch capability
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities() as any;
          setTorchSupported(Boolean(capabilities && capabilities.torch));
        } catch {
          setTorchSupported(false);
        }

        // Asynchronously query available cameras without blocking startup
        Html5Qrcode.getCameras()
          .then((devices) => {
            if (devices && devices.length > 0 && !isAbortedRef.current) {
              setCameras(devices);
            }
          })
          .catch(() => {});
      } catch (err: any) {
        if (isAbortedRef.current || currentSession !== activeSessionRef.current) {
          return;
        }
        console.warn('Camera access unavailable:', err?.message || err);
        let msg = 'Could not access camera. Please check camera permissions in your browser.';
        const errStr = (err?.name || err?.message || String(err)).toLowerCase();
        if (
          err?.name === 'NotAllowedError' ||
          errStr.includes('permission') ||
          errStr.includes('notallowed')
        ) {
          msg = 'Camera permission was denied. Please allow camera permissions in your browser address bar, or use manual entry / test barcodes below.';
          setIsPermissionDenied(true);
        } else if (
          err?.name === 'NotFoundError' ||
          errStr.includes('notfound') ||
          errStr.includes('no device')
        ) {
          msg = 'No camera device found on this system. You can type or use sample barcodes below.';
        } else if (typeof err === 'string') {
          msg = err;
        }
        setErrorMsg(msg);
        setIsScanning(false);
        setIsStarting(false);
        stopAllCameraHardware();
      }
    },
    [isOpen, selectedCameraId, handleDecoded]
  );

  /**
   * Main lifecycle hook: strictly tied ONLY to isOpen
   * Camera starts ONLY when modal is opened, and physically stops immediately when closed
   */
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      stopAllCameraHardware();
      return;
    }

    isAbortedRef.current = false;
    setIsCameraEnabled(true);
    setScanCount(0);
    setLastScannedCode(null);
    setErrorMsg(null);

    // Give DOM a frame to mount the container div, then start scanner
    const timer = setTimeout(() => {
      startScanner();
    }, 50);

    return () => {
      clearTimeout(timer);
      stopScanner();
      stopAllCameraHardware();
    };
  }, [isOpen]);

  /**
   * Close on Escape key
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  /**
   * Privacy & Resource Protection:
   * Shut off camera hardware immediately if the user switches away from the browser tab
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibility = () => {
      if (document.hidden) {
        stopScanner();
        stopAllCameraHardware();
      } else if (isCameraEnabled) {
        startScanner();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isOpen, isCameraEnabled, stopScanner, startScanner]);

  /**
   * Explicit user camera hardware toggle inside modal
   */
  const toggleCameraActive = async () => {
    if (isCameraEnabled) {
      setIsCameraEnabled(false);
      await stopScanner();
      stopAllCameraHardware();
    } else {
      setIsCameraEnabled(true);
      startScanner();
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    if (isCameraEnabled) {
      startScanner(newId).catch(() => {});
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(containerId.current, { verbose: false });
        scannerRef.current = scanner;
      }
      const result = await scanner.scanFile(file, false);
      handleDecoded(result);
    } catch {
      setErrorMsg('No readable barcode or QR code found in this image file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSampleScan = (code: string) => {
    handleDecoded(code);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecoded(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{title}</span>
                {continuousMode && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Continuous
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 leading-tight">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Camera Hardware State Toggle */}
            <button
              onClick={toggleCameraActive}
              title={isCameraEnabled ? 'Pause Camera Hardware (Turn Off Webcam)' : 'Turn On Camera Hardware'}
              className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isCameraEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
              }`}
            >
              {isCameraEnabled ? (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cam ON</span>
                </>
              ) : (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cam OFF</span>
                </>
              )}
            </button>

            {/* Audio Beep Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Beep Sound' : 'Enable Beep Sound'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-700/80 text-indigo-300 border-slate-600'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              title="Close Scanner (Esc)"
              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black flex-1 flex flex-col items-center justify-center min-h-[280px] max-h-[360px] overflow-hidden">
          {/* html5-qrcode video element container */}
          <div
            id={containerId.current}
            className="w-full h-full flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {/* Camera Paused / Turned Off Screen */}
          {!isCameraEnabled && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-15">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                <CameraOff className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Camera Hardware is Off</h4>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Webcam is completely stopped. You can type barcodes below or turn the camera back on.
              </p>
              <button
                onClick={toggleCameraActive}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Turn On Camera</span>
              </button>
            </div>
          )}

          {/* Scanner Overlay Visual Guide (Visible when scanning) */}
          {isScanning && isCameraEnabled && !errorMsg && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Darkened mask with transparent cutout */}
              <div className="relative w-72 h-48 sm:w-80 sm:h-52 border-2 border-indigo-400/90 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] overflow-hidden">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-sm" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-[scan_2s_ease-in-out_infinite]" />
              </div>

              <p className="mt-3 text-xs text-white/90 bg-slate-900/80 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-700/70 font-medium">
                Point camera at garment barcode or QR code
              </p>
            </div>
          )}

          {/* Loading state indicator */}
          {isStarting && isCameraEnabled && !errorMsg && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-2 text-slate-300">
              <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
              <span className="text-xs font-medium">Connecting camera...</span>
            </div>
          )}

          {/* Error / Permission Denied Screen */}
          {errorMsg && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                {isPermissionDenied ? <ShieldAlert className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                {isPermissionDenied ? 'Camera Permission Denied' : 'Camera Unavailable'}
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                {errorMsg}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => startScanner().catch(() => {})}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-sm transition-colors"
                >
                  Try Camera Again
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Tag Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* Scanned Badge Flash */}
          {lastScannedCode && (
            <div className="absolute bottom-3 left-4 right-4 z-20 bg-emerald-600/95 text-white p-2.5 rounded-xl shadow-lg border border-emerald-400 flex items-center justify-between animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] uppercase font-bold text-emerald-200">
                    Scanned Successfully {continuousMode ? `(#${scanCount})` : ''}
                  </div>
                  <div className="font-mono text-xs font-bold truncate">{lastScannedCode}</div>
                </div>
              </div>
              {continuousMode && (
                <span className="text-[11px] font-semibold bg-emerald-700 px-2 py-0.5 rounded-md shrink-0">
                  Ready next
                </span>
              )}
            </div>
          )}
        </div>

        {/* Manual Barcode / SKU Entry Bar */}
        <div className="p-2.5 bg-slate-800/95 border-t border-slate-700/80">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Keyboard className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Type or paste barcode / QR / SKU..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 text-slate-100 border border-slate-700 rounded-lg font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>Apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Controls Bar */}
        <div className="px-3 py-2 bg-slate-800/80 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Camera switcher */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            {cameras.length > 1 ? (
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                disabled={!isCameraEnabled}
                className="w-full bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-400 cursor-pointer disabled:opacity-50"
              >
                {cameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isCameraEnabled ? 'Laptop Camera Active' : 'Camera Stopped'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Flashlight button */}
            {torchSupported && isCameraEnabled && (
              <button
                onClick={toggleTorch}
                title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                  torchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
              >
                <Flashlight className="w-3.5 h-3.5" />
                <span>{torchOn ? 'Flash On' : 'Flash'}</span>
              </button>
            )}

            {/* Continuous scan toggle */}
            {allowContinuous && (
              <button
                onClick={() => setContinuousMode(!continuousMode)}
                title="Continuous Mode allows scanning multiple items sequentially without closing"
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  continuousMode
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{continuousMode ? 'Multi-Scan ON' : 'Single Scan'}</span>
              </button>
            )}

            {/* Scan Image from File upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload image containing barcode or QR"
              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Image</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Barcodes */}
        {sampleCodes.length > 0 && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Quick Test Barcodes (Click to test):</span>
              </span>
              <span className="text-[10px] text-slate-500">1D Barcode & 2D QR</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {sampleCodes.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleManualSampleScan(s.code)}
                  className="px-2 py-1 bg-slate-800 hover:bg-indigo-900/60 hover:text-indigo-200 text-slate-300 border border-slate-700 hover:border-indigo-500/60 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="font-sans font-semibold text-white">{s.label}:</span>
                  <span className="text-slate-400">{s.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
