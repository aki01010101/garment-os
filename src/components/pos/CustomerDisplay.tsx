import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { CustomerDisplayPayload } from '../../types';
import {
  listenCustomerDisplay,
  getCurrentCustomerDisplay,
} from '../../utils/customerDisplaySync';
import { buildUpiPaymentUri } from '../../utils/upi';
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
  Sun,
  Moon,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  Volume2,
  VolumeX,
  Video,
  Image as ImageIcon,
  Flame,
  Palette,
  Crown,
  Percent,
  Check,
  BellRing,
} from 'lucide-react';

export type FestiveThemeKey =
  | 'modern'
  | 'christmas'
  | 'new_year'
  | 'diwali'
  | 'eid'
  | 'holi'
  | 'navratri'
  | 'tiranga';

interface FestiveThemeConfig {
  id: FestiveThemeKey;
  name: string;
  emoji: string;
  badge: string;
  greeting: string;
  subGreeting: string;
  accentGradient: string;
  accentColor: string;
  accentBorder: string;
  particle: string;
  bannerBg: string;
  bannerText: string;
}

const FESTIVE_THEMES: Record<FestiveThemeKey, FestiveThemeConfig> = {
  modern: {
    id: 'modern',
    name: 'Classic Modern',
    emoji: '✨',
    badge: 'Premium Collection',
    greeting: 'Welcome to Our Fashion Boutique',
    subGreeting: 'Curated Elegance, Bespoke Tailoring & Exceptional Quality',
    accentGradient: 'from-indigo-600 to-purple-600',
    accentColor: '#6366f1',
    accentBorder: 'border-indigo-500/40',
    particle: '✨',
    bannerBg: 'bg-indigo-950/70 border-indigo-500/30',
    bannerText: 'text-indigo-200',
  },
  christmas: {
    id: 'christmas',
    name: 'Merry Christmas',
    emoji: '🎄',
    badge: 'Holiday Magic',
    greeting: 'Merry Christmas & Happy Holidays!',
    subGreeting: 'May Your Season Be Filled with Warmth, Joy & Festive Styles!',
    accentGradient: 'from-red-600 via-rose-600 to-emerald-700',
    accentColor: '#dc2626',
    accentBorder: 'border-red-500/50',
    particle: '❄️',
    bannerBg: 'bg-gradient-to-r from-red-950/80 via-rose-950/80 to-emerald-950/80 border-red-500/40',
    bannerText: 'text-rose-100',
  },
  new_year: {
    id: 'new_year',
    name: 'Happy New Year',
    emoji: '🎆',
    badge: 'Celebrate 2027',
    greeting: 'Happy New Year! Ring In Fresh Styles!',
    subGreeting: 'Step into the New Year with Dazzling Elegance & Fresh Wardrobes!',
    accentGradient: 'from-amber-500 via-yellow-500 to-purple-700',
    accentColor: '#eab308',
    accentBorder: 'border-amber-500/50',
    particle: '✨',
    bannerBg: 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-purple-950/80 border-amber-500/40',
    bannerText: 'text-amber-200',
  },
  diwali: {
    id: 'diwali',
    name: 'Shubh Deepavali',
    emoji: '🪔',
    badge: 'Festival of Lights',
    greeting: 'Shubh Deepavali! Festival of Lights & Joy!',
    subGreeting: 'Illuminate Your Celebrations with Grand Ethnic Wear & Golden Radiance!',
    accentGradient: 'from-amber-600 via-orange-600 to-yellow-500',
    accentColor: '#ea580c',
    accentBorder: 'border-amber-500/50',
    particle: '🪔',
    bannerBg: 'bg-gradient-to-r from-orange-950/80 via-amber-950/80 to-red-950/80 border-amber-500/40',
    bannerText: 'text-amber-100',
  },
  eid: {
    id: 'eid',
    name: 'Eid Mubarak',
    emoji: '🌙',
    badge: 'Blessed Celebrations',
    greeting: 'Eid Mubarak! Celebrate in Style & Grace!',
    subGreeting: 'Wishing You and Your Family Prosperity, Peace & Elegant Attire!',
    accentGradient: 'from-emerald-600 via-teal-600 to-amber-500',
    accentColor: '#059669',
    accentBorder: 'border-emerald-500/50',
    particle: '🌙',
    bannerBg: 'bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border-emerald-500/40',
    bannerText: 'text-emerald-100',
  },
  holi: {
    id: 'holi',
    name: 'Happy Holi',
    emoji: '🎨',
    badge: 'Festival of Colors',
    greeting: 'Happy Holi! Splash into Vibrant Fashion!',
    subGreeting: 'Celebrate with Joyous Festive Hues, Pure Cottons & Fresh Summer Styles!',
    accentGradient: 'from-fuchsia-600 via-pink-500 to-cyan-500',
    accentColor: '#d946ef',
    accentBorder: 'border-pink-500/50',
    particle: '🌸',
    bannerBg: 'bg-gradient-to-r from-fuchsia-950/80 via-pink-950/80 to-cyan-950/80 border-pink-500/40',
    bannerText: 'text-pink-100',
  },
  navratri: {
    id: 'navratri',
    name: 'Shubh Navratri',
    emoji: '🪘',
    badge: 'Dandiya & Garba Fest',
    greeting: 'Shubh Navratri! Grand Festive Ethnic Collection!',
    subGreeting: 'Dance into the Festivities with Vibrant Chaniya Cholis, Kurtas & Dupattas!',
    accentGradient: 'from-rose-600 via-amber-600 to-orange-500',
    accentColor: '#e11d48',
    accentBorder: 'border-rose-500/50',
    particle: '🪘',
    bannerBg: 'bg-gradient-to-r from-rose-950/80 via-orange-950/80 to-amber-950/80 border-rose-500/40',
    bannerText: 'text-rose-100',
  },
  tiranga: {
    id: 'tiranga',
    name: 'National Pride',
    emoji: '🇮🇳',
    badge: 'Pride of India',
    greeting: 'Celebrating the Vibrant Spirit of India!',
    subGreeting: 'Handcrafted Heritage Textiles, Khadi Weaves & Sustainable Fashion',
    accentGradient: 'from-orange-600 via-slate-100 to-emerald-600',
    accentColor: '#f97316',
    accentBorder: 'border-orange-500/50',
    particle: '🇮🇳',
    bannerBg: 'bg-gradient-to-r from-orange-950/80 via-slate-900 to-emerald-950/80 border-orange-500/40',
    bannerText: 'text-orange-100',
  },
};

interface IdleMediaSlide {
  id: string;
  type: 'image' | 'video';
  url: string;
  tag: string;
  title: string;
  subtitle: string;
  accent: string;
  discountBadge?: string;
}

const DEFAULT_SLIDES: IdleMediaSlide[] = [
  {
    id: 'slide_1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
    tag: 'Festive Ethnic Showcase',
    title: 'Exquisite Heritage Sarees & Lehengas',
    subtitle: 'Woven with gold zari, pure silks & bespoke craftsmanship for every celebration.',
    accent: 'from-amber-600 to-rose-700',
    discountBadge: 'Flat 20% Off on Bridal Wear',
  },
  {
    id: 'slide_2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80',
    tag: 'Gentlemen Ethnic & Formal',
    title: 'Tailored Sherwanis, Kurtas & Fine Shirts',
    subtitle: 'Bespoke collar cuts, Egyptian cotton weaves & regal celebratory silhouettes.',
    accent: 'from-indigo-600 to-purple-700',
    discountBadge: 'Buy 2 Get 1 Free on Shirts',
  },
  {
    id: 'slide_3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80',
    tag: 'Contemporary Designer Couture',
    title: 'Modern Fusion Silhouettes & Pret Wear',
    subtitle: 'From casual breezy linens to statement evening ensembles tailored for comfort.',
    accent: 'from-emerald-600 to-teal-700',
    discountBadge: 'Extra 10% Off for VIP Members',
  },
  {
    id: 'slide_4',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tag: 'Live Fashion Campaign',
    title: 'Runway Highlights & Fresh Arrivals',
    subtitle: 'Watch our master artisan collection come alive in fluid drape and motion.',
    accent: 'from-cyan-600 to-blue-700',
    discountBadge: 'Complimentary Master Tailoring',
  },
];

const PROMO_NOTIFICATIONS = [
  {
    id: 'notif_1',
    code: 'FESTIVE500',
    title: 'Festive Flash Deal',
    text: 'Get flat ₹500 OFF instantly on all shopping bills above ₹3,000!',
    badge: 'HOT OFFER',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'notif_2',
    code: 'WELCOME10',
    title: 'First-Time Shopper?',
    text: 'Enjoy 10% Welcome Discount on your purchase with instant bill redemption.',
    badge: 'NEW ARRIVALS',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'notif_3',
    code: 'VIPCLUB',
    title: 'VIP Loyalty Rewards',
    text: 'Earn 2X Loyalty Points on all Festive Silk and Sherwani sets today!',
    badge: 'DOUBLE POINTS',
    color: 'from-purple-500 to-indigo-600',
  },
];

export const CustomerDisplay: React.FC = () => {
  const [payload, setPayload] = useState<CustomerDisplayPayload>(() => {
    return (
      getCurrentCustomerDisplay() || {
        state: 'idle',
        companyName: 'Fantasy Outfits',
        companyTagline: 'Premium Apparel & Ethnic Fashion Store',
        items: [],
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        timestamp: Date.now(),
      }
    );
  });

  // Light / Dark Mode State
  const [displayMode, setDisplayMode] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('garment_customer_display_mode') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleDisplayMode = () => {
    setDisplayMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('garment_customer_display_mode', next);
      } catch {}
      return next;
    });
  };

  // Festive Theme State
  const [festiveThemeKey, setFestiveThemeKey] = useState<FestiveThemeKey>(() => {
    try {
      return (localStorage.getItem('garment_customer_display_festive_theme') as FestiveThemeKey) || 'modern';
    } catch {
      return 'modern';
    }
  });

  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const activeTheme = FESTIVE_THEMES[festiveThemeKey] || FESTIVE_THEMES.modern;

  const selectFestiveTheme = (themeKey: FestiveThemeKey) => {
    setFestiveThemeKey(themeKey);
    try {
      localStorage.setItem('garment_customer_display_festive_theme', themeKey);
    } catch {}
    setIsThemePickerOpen(false);
  };

  // Slideshow State
  const [slides, setSlides] = useState<IdleMediaSlide[]>(() => {
    try {
      const saved = localStorage.getItem('garment_customer_display_slides');
      return saved ? JSON.parse(saved) : DEFAULT_SLIDES;
    } catch {
      return DEFAULT_SLIDES;
    }
  });

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  // Marquee announcement text
  const [tickerText, setTickerText] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('garment_customer_display_ticker') ||
        '✨ Welcome to our Store • Complimentary Master-Tailor Alterations • Instant UPI, Card & Cash Payments Accepted • 7-Day Exchange Guarantee with Tags • Follow us for latest drops!'
      );
    } catch {
      return '✨ Welcome to our Store • Complimentary Master-Tailor Alterations • Instant UPI & Card Payments';
    }
  });

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
    if (payload.state !== 'idle' || isPaused || slides.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [payload.state, isPaused, slides.length]);

  // Promotional Offer Rotation
  useEffect(() => {
    if (payload.state !== 'idle') return;
    const interval = setInterval(() => {
      setActivePromoIndex((prev) => (prev + 1) % PROMO_NOTIFICATIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [payload.state]);

  // Generate UPI QR SVG
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');

  // Fallback UPI URI generation if not passed by cashier
  const effectiveUpiUri = useMemo(() => {
    if (payload.upiUri) return payload.upiUri;
    if (payload.grandTotal > 0) {
      return buildUpiPaymentUri({
        upiId: 'retailstore@upi',
        payeeName: payload.companyName || 'Garment Store',
        amount: payload.grandTotal,
        transactionNote: `${payload.companyName || 'Store'} Purchase`,
      });
    }
    return '';
  }, [payload.upiUri, payload.grandTotal, payload.companyName]);

  useEffect(() => {
    if (effectiveUpiUri && (payload.state === 'payment' || payload.state === 'cart')) {
      QRCode.toDataURL(
        effectiveUpiUri,
        {
          width: 340,
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
  }, [effectiveUpiUri, payload.state]);

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

  const isLight = displayMode === 'light';

  // Current Slide
  const currentSlide = slides[activeSlide] || slides[0] || DEFAULT_SLIDES[0];
  const activePromo = PROMO_NOTIFICATIONS[activePromoIndex];

  return (
    <div
      className={`h-screen w-screen flex flex-col font-sans select-none overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* ================= FESTIVE GREETING BANNER ================= */}
      {festiveThemeKey !== 'modern' && (
        <div
          className={`h-8 px-6 flex items-center justify-between text-xs font-bold tracking-wide transition-all ${
            activeTheme.bannerBg
          } ${activeTheme.bannerText}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{activeTheme.emoji}</span>
            <span>{activeTheme.greeting}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium opacity-90">
            <span>{activeTheme.subGreeting}</span>
            <span className="text-sm">{activeTheme.particle}</span>
          </div>
        </div>
      )}

      {/* ================= TOP HEADER BAR ================= */}
      <header
        className={`h-20 border-b px-6 sm:px-10 flex items-center justify-between shrink-0 backdrop-blur-md transition-colors ${
          isLight
            ? 'bg-white/95 border-slate-200 shadow-xs'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg font-black text-xl text-white bg-gradient-to-tr ${
              activeTheme.accentGradient
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-xl sm:text-2xl font-black tracking-tight uppercase ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {payload.companyName || 'Fantasy Outfits'}
              </h1>
              {festiveThemeKey !== 'modern' && (
                <span className="text-base" title={activeTheme.name}>
                  {activeTheme.emoji}
                </span>
              )}
            </div>
            <p className={`text-xs font-medium tracking-wide ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {payload.companyTagline || 'Apparel & Ethnic Fashion Boutique'}
            </p>
          </div>
        </div>

        {/* ================= PROMINENT CUSTOMER RECOGNITION (BIGGER NAME) ================= */}
        {payload.customerName && payload.state !== 'idle' ? (
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all shadow-sm ${
              isLight
                ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-100'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
              {payload.customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-500">
                  Welcome,
                </span>
                <span className="text-lg sm:text-xl font-black tracking-tight leading-none">
                  {payload.customerName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold mt-0.5">
                {payload.customerLoyaltyPoints !== undefined && (
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{payload.customerLoyaltyPoints} Pts</span>
                  </span>
                )}
                {payload.customerVipTier && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[10px] font-extrabold uppercase">
                    {payload.customerVipTier}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* When in idle mode, show store tagline/festive status */
          <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Interactive Secondary Screen • Live Billing Updates</span>
          </div>
        )}

        {/* Right Info: Festive Selector, Light/Dark Switch, Clock, Fullscreen */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Festive Theme Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
              title="Change Festive Celebration Theme"
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Palette className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline">{activeTheme.name}</span>
              <span>{activeTheme.emoji}</span>
            </button>

            {/* Festive Theme Dropdown Menu */}
            {isThemePickerOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-2xl p-2 border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 mb-1">
                  Indian & Global Festive Themes
                </div>
                <div className="space-y-1">
                  {Object.values(FESTIVE_THEMES).map((th) => (
                    <button
                      key={th.id}
                      onClick={() => selectFestiveTheme(th.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        festiveThemeKey === th.id
                          ? 'bg-indigo-600 text-white'
                          : isLight
                          ? 'hover:bg-slate-100 text-slate-700'
                          : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{th.emoji}</span>
                        <span>{th.name}</span>
                      </div>
                      {festiveThemeKey === th.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Light / Dark Mode Switch */}
          <button
            onClick={toggleDisplayMode}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>

          {/* Live Clock */}
          <div className="text-right hidden sm:block">
            <div
              className={`text-sm sm:text-base font-extrabold font-mono tracking-wider flex items-center gap-1.5 justify-end ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>{formattedTimeStr}</span>
            </div>
            <div className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {formattedDateStr}
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ================= MAIN SCREEN BODY ================= */}
      <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 flex flex-col justify-center relative">
        {/* ================= STATE 1: IDLE / MULTIMEDIA SLIDESHOW & OFFERS ================= */}
        {payload.state === 'idle' && (
          <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-between py-2 animate-in fade-in duration-300">
            {/* Top Carousel / Video Card */}
            <div className="relative w-full flex-1 rounded-3xl overflow-hidden shadow-2xl border flex flex-col justify-end p-8 sm:p-12 transition-all">
              {/* Slide Background: Video or Image */}
              {currentSlide.type === 'video' ? (
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
                  <video
                    src={currentSlide.url}
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    <button
                      onClick={() => setIsVideoMuted(!isVideoMuted)}
                      className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-md cursor-pointer"
                    >
                      {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-700"
                  style={{ backgroundImage: `url(${currentSlide.url})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
              )}

              {/* Ambient Glow */}
              <div
                className={`absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 bg-gradient-to-tr ${
                  activeTheme.accentGradient
                }`}
              />

              {/* Floating Slide Content */}
              <div className="relative z-10 space-y-4 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/30 flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentSlide.tag}</span>
                  </span>

                  {currentSlide.discountBadge && (
                    <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-lg animate-pulse">
                      <Percent className="w-3.5 h-3.5" />
                      <span>{currentSlide.discountBadge}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {currentSlide.title}
                </h2>

                <p className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed drop-shadow max-w-2xl">
                  {currentSlide.subtitle}
                </p>

                {/* Slide Controls & Carousel Indicators */}
                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={() => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                    className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md cursor-pointer transition-colors"
                  >
                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
                    className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1.5 ml-2">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          activeSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setIsCustomizerOpen(true)}
                    className="ml-auto text-xs font-bold text-white/80 hover:text-white bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Customize Media</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Rotating Discount Notification & Prompt */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Rotating Offer Notification Banner */}
              <div
                className={`md:col-span-8 p-3.5 rounded-2xl border flex items-center gap-3.5 shadow-sm transition-all ${
                  isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-md">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 font-mono">
                      {activePromo.badge}
                    </span>
                    <span className="font-extrabold text-sm">{activePromo.title}</span>
                    {activePromo.code && (
                      <span className="font-mono font-bold text-xs bg-white/50 px-1.5 py-0.5 rounded text-amber-800">
                        Code: {activePromo.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                    {activePromo.text}
                  </p>
                </div>
              </div>

              {/* Present Items Prompt */}
              <div
                className={`md:col-span-4 p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700 shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <ShoppingBag className="w-5 h-5 text-indigo-500 animate-bounce shrink-0" />
                <span>Please present your selected clothing garments at the counter</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STATE 2: CART / SCANNING APPAREL ================= */}
        {payload.state === 'cart' && (
          <div className="h-full w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* Left 7 Cols: Live Item List */}
            <div
              className={`lg:col-span-7 rounded-3xl border p-6 flex flex-col h-[calc(100vh-14rem)] shadow-xl backdrop-blur-xs transition-colors ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'
              }`}
            >
              <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  <span>Garments Scanned ({totalItemPieces} pcs)</span>
                </div>
                <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {payload.items.length} unique items
                </span>
              </div>

              {/* Scanned Items Scrollable Table */}
              <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
                {payload.items.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-xs">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-base font-extrabold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs font-medium">
                          {item.size && (
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                                isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-slate-200'
                              }`}
                            >
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] ${
                                isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {item.color}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-base font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        ₹{item.total.toFixed(2)}
                      </div>
                      <div className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {item.qty} × ₹{item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Bill Payable & LIVE DYNAMIC PAYMENT QR */}
            <div className="lg:col-span-5 space-y-4">
              {/* Savings Celebration Card */}
              {payload.discountTotal > 0 && (
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 shadow-md ${
                    isLight
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-emerald-500 text-white">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Exclusive Savings
                    </div>
                    <div className="text-sm font-extrabold">
                      You are saving ₹{payload.discountTotal.toFixed(2)} on this purchase!
                    </div>
                  </div>
                </div>
              )}

              {/* Bill Details Box */}
              <div
                className={`p-6 rounded-3xl border space-y-4 shadow-xl ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className={`space-y-2 text-sm pb-4 border-b ${isLight ? 'border-slate-100 text-slate-600' : 'border-slate-800 text-slate-300'}`}>
                  <div className="flex items-center justify-between">
                    <span>Subtotal ({totalItemPieces} items)</span>
                    <span className="font-mono font-semibold">₹{payload.subtotal.toFixed(2)}</span>
                  </div>

                  {payload.discountTotal > 0 && (
                    <div className="flex items-center justify-between text-emerald-500 font-bold">
                      <span>Total Discounts & Offers</span>
                      <span className="font-mono">-₹{payload.discountTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className={`flex items-center justify-between text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>GST (Tax Rate)</span>
                    <span>Included in MRP</span>
                  </div>
                </div>

                {/* Net Payable Highlight */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block">
                    Total Amount Payable
                  </span>
                  <div
                    className={`text-4xl sm:text-5xl font-black font-mono tracking-tight mt-1 ${
                      isLight ? 'text-slate-950' : 'text-white'
                    }`}
                  >
                    ₹{payload.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* ================= DYNAMIC QR CODE FOR IMMEDIATE PAYMENT ================= */}
              {upiQrDataUrl && (
                <div
                  className={`p-5 rounded-3xl border flex items-center gap-5 shadow-xl transition-all ${
                    isLight
                      ? 'bg-emerald-50/80 border-emerald-300 text-slate-900'
                      : 'bg-slate-900 border-emerald-500/50 text-white'
                  }`}
                >
                  <div className="p-2 rounded-2xl bg-white shadow-md shrink-0">
                    <img
                      src={upiQrDataUrl}
                      alt="Dynamic UPI QR Code"
                      className="w-28 h-28 object-contain"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 uppercase tracking-wide">
                      <Smartphone className="w-4 h-4" />
                      <span>Instant Dynamic UPI Pay</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-600">
                      ₹{payload.grandTotal.toFixed(2)}
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Scan with PhonePe, Google Pay, Paytm, or BHIM to pay instantly.
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STATE 3: FULLSCREEN UPI PAYMENT QR ================= */}
        {payload.state === 'payment' && (
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-in zoom-in-95 duration-200">
            {/* Left: Huge High-Contrast QR Code */}
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl border-4 border-emerald-500">
              {upiQrDataUrl ? (
                <img
                  src={upiQrDataUrl}
                  alt="Scan to Pay via UPI"
                  className="w-72 h-72 sm:w-80 sm:h-80 object-contain"
                />
              ) : (
                <div className="w-72 h-72 flex flex-col items-center justify-center text-slate-600 gap-3">
                  <QrCode className="w-20 h-20 text-slate-400 animate-pulse" />
                  <span className="text-sm font-bold">Generating Dynamic UPI QR...</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3 text-slate-700 font-extrabold text-xs uppercase tracking-wider">
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
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  Instant Payment Checkout
                </span>
                <h2 className={`text-3xl sm:text-5xl font-black mt-3 leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Please Scan & Pay
                </h2>
                <p className={`text-sm mt-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Point your phone camera or any UPI app at the dynamic QR code.
                </p>
              </div>

              {/* Amount Box */}
              <div
                className={`p-6 rounded-3xl border space-y-1 shadow-lg ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Exact Bill Amount
                </span>
                <div className="text-4xl sm:text-6xl font-black font-mono text-emerald-500">
                  ₹{payload.grandTotal.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400 font-medium pt-1">
                  Total Items: {totalItemPieces} garments
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-medium text-emerald-500">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span>Waiting for payment confirmation from counter...</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STATE 4: COMPLETED / THANK YOU & GOOGLE REVIEW ================= */}
        {payload.state === 'completed' && (
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-200">
            {/* Green Checkmark */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div>
              <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Thank You for Shopping with Us!
              </h2>
              <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Your purchase has been completed. Cashier is printing your thermal receipt.
              </p>
              {payload.invoiceNumber && (
                <div className="mt-3 inline-block px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-xs font-mono font-bold text-indigo-400">
                  Invoice: {payload.invoiceNumber}
                </div>
              )}
            </div>

            {/* Google Review Card */}
            {reviewQrDataUrl && (
              <div
                className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center gap-6 shadow-2xl max-w-xl w-full text-center sm:text-left ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
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
                  <h3 className="text-base font-extrabold">Loved your shopping experience?</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Scan this QR code with your phone camera to leave a quick 5-star review on Google!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MARQUEE TICKER & FOOTER ================= */}
      <div
        className={`h-9 border-t px-6 flex items-center overflow-hidden text-xs font-bold tracking-wide transition-colors ${
          isLight ? 'bg-slate-200/80 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 shrink-0 mr-4 text-indigo-500 font-extrabold uppercase">
          <BellRing className="w-3.5 h-3.5" />
          <span>Announcements:</span>
        </div>
        <div className="whitespace-nowrap overflow-hidden relative w-full">
          <div className="inline-block animate-marquee whitespace-nowrap">
            {tickerText}
          </div>
        </div>
      </div>

      <footer
        className={`h-10 border-t px-6 sm:px-10 flex items-center justify-between text-[11px] transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-500'
        }`}
      >
        <div>
          Powered by <span className="font-bold">Garment OS</span> • Customer Interactive Display
        </div>
        <div>{payload.companyAddress || 'High-Street Retail Counter'}</div>
      </footer>

      {/* ================= MODAL: CUSTOMIZE IDLE MEDIA & OFFERS ================= */}
      {isCustomizerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2 font-black text-lg">
                <Settings className="w-5 h-5 text-indigo-500" />
                <span>Customize Customer Idle Screen</span>
              </div>
              <button
                onClick={() => setIsCustomizerOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Announcement Ticker Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Scrolling Bottom Marquee Announcements
              </label>
              <textarea
                value={tickerText}
                onChange={(e) => {
                  setTickerText(e.target.value);
                  try {
                    localStorage.setItem('garment_customer_display_ticker', e.target.value);
                  } catch {}
                }}
                rows={2}
                className={`w-full p-3 rounded-2xl border text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                }`}
                placeholder="Enter store news, exchange policy, festive greetings..."
              />
            </div>

            {/* Media Slides List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Idle Slides ({slides.length})
                </span>
                <button
                  onClick={() => {
                    const newSlide: IdleMediaSlide = {
                      id: `slide_${Date.now()}`,
                      type: 'image',
                      url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=80',
                      tag: 'New Collection',
                      title: 'Fresh Festive Styles',
                      subtitle: 'Premium handloom fabrics and bespoke designer fits.',
                      accent: 'from-indigo-600 to-purple-600',
                      discountBadge: 'Flat 15% Off',
                    };
                    const next = [...slides, newSlide];
                    setSlides(next);
                    localStorage.setItem('garment_customer_display_slides', JSON.stringify(next));
                  }}
                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  + Add Slide
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {slides.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold truncate">{s.title}</div>
                        <div className="text-[11px] text-slate-400 truncate font-mono">
                          {s.type.toUpperCase()}: {s.url}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const filtered = slides.filter((_, i) => i !== idx);
                        setSlides(filtered);
                        localStorage.setItem('garment_customer_display_slides', JSON.stringify(filtered));
                      }}
                      className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/50 flex justify-end">
              <button
                onClick={() => setIsCustomizerOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
