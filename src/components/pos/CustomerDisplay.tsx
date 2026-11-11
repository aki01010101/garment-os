import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { CustomerDisplayPayload } from '../../types';
import {
  listenCustomerDisplay,
  getCurrentCustomerDisplay,
} from '../../utils/customerDisplaySync';
import {
  ShoppingBag,
  Sparkles,
  Smartphone,
  Star,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Clock,
  Scissors,
  ShieldCheck,
  Tag,
  ArrowRight,
  CreditCard,
  Banknote,
  QrCode,
  Gift,
} from 'lucide-react';

const SLIDESHOW_ITEMS = [
  {
    title: 'New Festive & Seasonal Arrivals',
    subtitle: 'Explore our latest collection of premium kurtis, shirts, festive suits & denim.',
    tag: 'Fresh Styles In Store',
    accent: 'from-indigo-600 to-purple-600',
    icon: Sparkles,
  },
  {
    title: 'Complimentary In-House Alterations',
    subtitle: 'Get perfect fitting with our professional master tailor on all purchases.',
    tag: 'Bespoke Fitting',
    accent: 'from-emerald-600 to-teal-600',
    icon: Scissors,
  },
  {
    title: 'Scan & Pay Instantly via UPI',
    subtitle: 'Accepting GPay, PhonePe, Paytm, BHIM and all major banking apps.',
    tag: 'Fast Zero-Contact Checkout',
    accent: 'from-amber-500 to-orange-600',
    icon: Smartphone,
  },
  {
    title: '7-Day Easy Exchange Policy',
    subtitle: 'Customer satisfaction guaranteed. Keep original price tags intact.',
    tag: 'Peace of Mind',
    accent: 'from-blue-600 to-cyan-600',
    icon: ShieldCheck,
  },
];

export const CustomerDisplay: React.FC = () => {
  const [payload, setPayload] = useState<CustomerDisplayPayload>(() => {
    return (
      getCurrentCustomerDisplay() || {
        state: 'idle',
        companyName: 'Fantasy Outfits',
        companyTagline: 'Premium Apparel & Ethnic Wear',
        items: [],
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        timestamp: Date.now(),
      }
    );
  });

  const [activeSlide, setActiveSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Listen to live broadcast updates from cashier POS screen
  useEffect(() => {
    const unsubscribe = listenCustomerDisplay((updated) => {
      setPayload(updated);
    });
    return () => unsubscribe();
  }, []);

  // Live Clock updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Idle Carousel Rotation
  useEffect(() => {
    if (payload.state !== 'idle') return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDESHOW_ITEMS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [payload.state]);

  // Generate UPI QR SVG
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  useEffect(() => {
    if (payload.upiUri && (payload.state === 'payment' || payload.state === 'cart')) {
      QRCode.toDataURL(
        payload.upiUri,
        {
          width: 320,
          margin: 1.5,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (err, url) => {
          if (!err && url) {
            setUpiQrDataUrl(url);
          }
        }
      );
    } else {
      setUpiQrDataUrl('');
    }
  }, [payload.upiUri, payload.state]);

  // Generate Google Review QR SVG
  const [reviewQrDataUrl, setReviewQrDataUrl] = useState<string>('');
  useEffect(() => {
    const reviewUrl = payload.googleReviewUrl || 'https://g.page/r/garment-os-reviews';
    if (payload.state === 'completed' && reviewUrl) {
      QRCode.toDataURL(
        reviewUrl,
        {
          width: 240,
          margin: 1.5,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (err, url) => {
          if (!err && url) {
            setReviewQrDataUrl(url);
          }
        }
      );
    }
  }, [payload.googleReviewUrl, payload.state]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formattedTimeStr = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDateStr = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const totalItemPieces = useMemo(() => {
    return payload.items.reduce((sum, i) => sum + i.qty, 0);
  }, [payload.items]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-20 bg-slate-900/90 border-b border-slate-800 px-6 sm:px-10 flex items-center justify-between shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-black text-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              {payload.companyName || 'Fantasy Outfits'}
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              {payload.companyTagline || 'Apparel & Ethnic Fashion Store'}
            </p>
          </div>
        </div>

        {/* Center Badge: Status or Greeting */}
        {payload.customerName && payload.state !== 'idle' && (
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-indigo-300">
            <span>Welcome,</span>
            <span className="text-white font-bold">{payload.customerName}</span>
          </div>
        )}

        {/* Right Info: Time & Fullscreen Toggle */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-base font-extrabold font-mono text-white tracking-wider flex items-center gap-1.5 justify-end">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{formattedTimeStr}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {formattedDateStr}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Screen Body */}
      <main className="flex-1 overflow-hidden p-6 sm:p-10 flex flex-col justify-center">
        {/* ================= STATE 1: IDLE / WELCOME SLIDESHOW ================= */}
        {payload.state === 'idle' && (
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-300">
            {/* Sliding Hero Banner */}
            <div className="relative w-full rounded-3xl p-10 sm:p-14 overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center space-y-4">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {SLIDESHOW_ITEMS[activeSlide].tag}
                </span>

                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl">
                  {SLIDESHOW_ITEMS[activeSlide].title}
                </h2>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-medium leading-relaxed">
                  {SLIDESHOW_ITEMS[activeSlide].subtitle}
                </p>
              </div>

              {/* Indicator Dots */}
              <div className="flex items-center justify-center gap-2 mt-8">
                {SLIDESHOW_ITEMS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      activeSlide === idx ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Prompt Card */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm font-semibold">
              <ShoppingBag className="w-5 h-5 text-indigo-400 animate-bounce" />
              <span>Please present your selected clothing garments at the billing counter</span>
            </div>
          </div>
        )}

        {/* ================= STATE 2: CART / SCANNING APPAREL ================= */}
        {payload.state === 'cart' && (
          <div className="h-full w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
            {/* Left 7 Cols: Live Item List */}
            <div className="lg:col-span-7 bg-slate-900/80 rounded-3xl border border-slate-800 p-6 flex flex-col h-[calc(100vh-14rem)] shadow-xl backdrop-blur-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-200 uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  <span>Garments Scanned ({totalItemPieces} pcs)</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {payload.items.length} unique items
                </span>
              </div>

              {/* Scanned Items Scrollable Table */}
              <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
                {payload.items.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-950/80 text-indigo-300 font-extrabold flex items-center justify-center shrink-0 border border-indigo-800/40 text-sm">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-extrabold text-white truncate">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
                          {item.size && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-200 font-mono font-bold text-[11px]">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[11px]">
                              {item.color}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black font-mono text-white">
                        ₹{item.total.toFixed(2)}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {item.qty} × ₹{item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Order Summary & Bill Payable */}
            <div className="lg:col-span-5 space-y-5">
              {/* Savings Celebration Card */}
              {payload.discountTotal > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center gap-3 shadow-lg">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Exclusive Savings
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      You are saving ₹{payload.discountTotal.toFixed(2)} on this purchase!
                    </div>
                  </div>
                </div>
              )}

              {/* Bill Details Box */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl">
                <div className="space-y-2.5 text-sm text-slate-300 pb-4 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <span>Subtotal ({totalItemPieces} items)</span>
                    <span className="font-mono font-semibold text-white">
                      ₹{payload.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {payload.discountTotal > 0 && (
                    <div className="flex items-center justify-between text-emerald-400 font-medium">
                      <span>Total Discounts & Offers</span>
                      <span className="font-mono font-bold">
                        -₹{payload.discountTotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>GST (Tax Rate)</span>
                    <span>Included in MRP</span>
                  </div>
                </div>

                {/* Net Payable Highlight */}
                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                    Total Amount Payable
                  </span>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight mt-1">
                    ₹{payload.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Dynamic UPI Quick Scan Option (if available) */}
              {upiQrDataUrl && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
                  <img
                    src={upiQrDataUrl}
                    alt="UPI QR Code"
                    className="w-20 h-20 rounded-xl bg-white p-1 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>Scan & Pay via UPI</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Open PhonePe, GPay, or Paytm to pay ₹{payload.grandTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STATE 3: PAYMENT WAITING (FULLSCREEN UPI QR) ================= */}
        {payload.state === 'payment' && (
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-in zoom-in-95 duration-200">
            {/* Left: Huge High-Contrast QR Code */}
            <div className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl border-4 border-emerald-500/40">
              {upiQrDataUrl ? (
                <img
                  src={upiQrDataUrl}
                  alt="Scan to Pay via UPI"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-600 gap-3">
                  <QrCode className="w-16 h-16 text-slate-400" />
                  <span className="text-xs font-bold">Generating UPI QR...</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <span>PhonePe</span>
                <span>•</span>
                <span>Google Pay</span>
                <span>•</span>
                <span>Paytm</span>
                <span>•</span>
                <span>BHIM</span>
              </div>
            </div>

            {/* Right: Payment Instructions & Exact Amount */}
            <div className="space-y-6 text-center md:text-left">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Instant Payment Checkout
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 leading-tight">
                  Please Scan & Pay
                </h2>
                <p className="text-sm text-slate-400 mt-1.5">
                  Point your phone camera or any UPI app at the QR code on the left.
                </p>
              </div>

              {/* Amount Box */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Exact Bill Amount
                </span>
                <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-400">
                  ₹{payload.grandTotal.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400 font-medium pt-1">
                  Total Items: {totalItemPieces} garments
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-slate-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Waiting for payment confirmation from cashier...</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STATE 4: COMPLETED / THANK YOU & GOOGLE REVIEW ================= */}
        {payload.state === 'completed' && (
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-200">
            {/* Green Checkmark */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Thank You for Shopping with Us!
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Your purchase has been completed. Cashier is printing your thermal receipt.
              </p>
              {payload.invoiceNumber && (
                <div className="mt-3 inline-block px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-indigo-300">
                  Invoice: {payload.invoiceNumber}
                </div>
              )}
            </div>

            {/* Google Review Card */}
            {reviewQrDataUrl && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-6 shadow-2xl max-w-xl w-full text-center sm:text-left">
                <img
                  src={reviewQrDataUrl}
                  alt="Google Review QR"
                  className="w-32 h-32 rounded-2xl bg-white p-2 shrink-0 shadow-lg"
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    Loved your shopping experience?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Scan this QR code with your phone camera to leave a quick 5-star review on Google!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="h-12 bg-slate-900/60 border-t border-slate-800 px-6 sm:px-10 flex items-center justify-between text-xs text-slate-500">
        <div>
          Powered by <span className="font-bold text-slate-300">Garment OS</span> • Customer Interactive Display
        </div>
        <div>
          {payload.companyAddress || 'High-Street Retail Counter'}
        </div>
      </footer>
    </div>
  );
};

