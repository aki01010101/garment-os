import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CustomerDisplayCustomConfig,
  FestiveThemeKey,
  FESTIVE_THEMES,
  IdleMediaSlide,
  PromoFlashCard,
  PRESET_COLLECTIONS,
  DEFAULT_CUSTOMER_DISPLAY_CONFIG,
  loadCustomerDisplayConfig,
  saveCustomerDisplayConfig,
  resetCustomerDisplayConfig,
} from '../../utils/customerDisplayConfig';
import {
  openCustomerDisplayWindow,
  broadcastCustomerDisplay,
} from '../../utils/customerDisplaySync';
import { asyncSyncCustomerDisplayConfig } from '../../services/supabase';
import { buildUpiPaymentUri } from '../../utils/upi';
import QRCode from 'qrcode';
import {
  Tv,
  MonitorPlay,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Video,
  Megaphone,
  Percent,
  QrCode,
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  Moon,
  Sun,
  Eye,
  Sliders,
  Store,
  Phone,
  Instagram,
  ShoppingBag,
  Star,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Crown,
  Clock,
  ArrowRight,
  Play,
  Pause,
  Upload,
  Layers,
  Copy,
  Info,
} from 'lucide-react';

export const CustomerDisplayManager: React.FC = () => {
  const { activeCompany, storeUpiId, storeUpiName, storeGoogleReviewUrl } = useApp();

  // Load configuration from local storage
  const [config, setConfig] = useState<CustomerDisplayCustomConfig>(() => loadCustomerDisplayConfig());
  const [activeTab, setActiveTab] = useState<
    'theme' | 'slideshow' | 'video' | 'marquee' | 'promos' | 'checkout' | 'reviews'
  >('theme');

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State for adding / editing a slide
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideForm, setSlideForm] = useState<IdleMediaSlide>({
    id: '',
    type: 'image',
    url: '',
    tag: 'Trending Collection',
    title: '',
    subtitle: '',
    accent: 'from-indigo-600 to-purple-700',
    discountBadge: '',
  });

  // State for adding / editing a promo card
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoForm, setPromoForm] = useState<PromoFlashCard>({
    id: '',
    code: '',
    title: '',
    text: '',
    badge: 'SPECIAL OFFER',
    color: 'from-amber-500 to-orange-600',
  });

  // Interactive Live Simulator State
  const [simulatorMode, setSimulatorMode] = useState<'idle' | 'cart' | 'payment' | 'completed'>('idle');
  const [simActiveSlide, setSimActiveSlide] = useState(0);
  const [simUpiQrDataUrl, setSimUpiQrDataUrl] = useState<string>('');

  // Handle configuration updates
  const updateConfig = <K extends keyof CustomerDisplayCustomConfig>(
    key: K,
    value: CustomerDisplayCustomConfig[K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save changes
  const handleSave = () => {
    saveCustomerDisplayConfig(config);
    asyncSyncCustomerDisplayConfig(config);
    showToast('Customer Screen settings saved, broadcasted & synced to database!');
  };

  // Reset to default
  const handleReset = () => {
    if (window.confirm('Reset all Customer Display settings back to default factory settings?')) {
      const def = resetCustomerDisplayConfig();
      setConfig(def);
      asyncSyncCustomerDisplayConfig(def);
      showToast('Settings reset to defaults & synced to database.');
    }
  };

  // Open secondary window
  const handleOpenCustomerDisplay = () => {
    openCustomerDisplayWindow();
  };

  // Test live broadcast to connected customer monitors
  const handleTestBroadcast = (mode: 'idle' | 'cart' | 'payment') => {
    if (mode === 'idle') {
      broadcastCustomerDisplay({
        state: 'idle',
        companyName: config.brandNameOverride || activeCompany.name,
        companyTagline: config.brandTaglineOverride || activeCompany.tagline || 'Boutique Apparel & Tailoring',
        items: [],
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        timestamp: Date.now(),
      });
      showToast('Broadcasted [IDLE] screen state to customer monitors.');
    } else if (mode === 'cart') {
      const upi = buildUpiPaymentUri({
        upiId: config.upiIdOverride || storeUpiId || 'retailstore@upi',
        payeeName: config.upiMerchantNameOverride || storeUpiName || activeCompany.name,
        amount: 3499,
        transactionRef: 'DEMO-1082',
        transactionNote: `Bill Demo at ${activeCompany.name}`,
      });
      broadcastCustomerDisplay({
        state: 'cart',
        companyName: config.brandNameOverride || activeCompany.name,
        companyTagline: config.brandTaglineOverride || activeCompany.tagline || 'Boutique Apparel & Tailoring',
        customerName: 'Priya Sharma',
        customerPhone: '9876543210',
        customerLoyaltyPoints: 480,
        customerVipTier: 'Gold Member',
        items: [
          {
            id: 'demo_1',
            name: 'Handcrafted Banarasi Silk Saree - Ruby Red',
            qty: 1,
            price: 2800,
            total: 2800,
          },
          {
            id: 'demo_2',
            name: 'Embroidered Velvet Blouse Piece - Size 38',
            qty: 1,
            price: 699,
            total: 699,
          },
        ],
        subtotal: 3500,
        discountTotal: 700,
        taxTotal: 175,
        grandTotal: 3499,
        upiUri: upi,
        timestamp: Date.now(),
      });
      showToast('Broadcasted [ACTIVE CART] sample state to customer monitors.');
    } else {
      const upi = buildUpiPaymentUri({
        upiId: config.upiIdOverride || storeUpiId || 'retailstore@upi',
        payeeName: config.upiMerchantNameOverride || storeUpiName || activeCompany.name,
        amount: 3499,
        transactionRef: 'DEMO-1082',
        transactionNote: `Payment at ${activeCompany.name}`,
      });
      broadcastCustomerDisplay({
        state: 'payment',
        paymentMode: 'UPI QR',
        companyName: config.brandNameOverride || activeCompany.name,
        companyTagline: config.brandTaglineOverride || activeCompany.tagline || 'Boutique Apparel & Tailoring',
        customerName: 'Priya Sharma',
        items: [],
        subtotal: 3500,
        discountTotal: 700,
        taxTotal: 175,
        grandTotal: 3499,
        upiUri: upi,
        timestamp: Date.now(),
      });
      showToast('Broadcasted [PAYMENT QR] screen state to customer monitors.');
    }
  };

  // Generate QR for simulator
  useEffect(() => {
    const upiUri = buildUpiPaymentUri({
      upiId: config.upiIdOverride || storeUpiId || 'retailstore@upi',
      payeeName: config.upiMerchantNameOverride || storeUpiName || activeCompany.name,
      amount: 3499,
      transactionRef: 'SIM-PREVIEW',
      transactionNote: 'Live Simulator Preview',
    });
    QRCode.toDataURL(upiUri, { width: 280, margin: 1 })
      .then(setSimUpiQrDataUrl)
      .catch(() => {});
  }, [config.upiIdOverride, storeUpiId, activeCompany.name]);

  // Rotate simulator slides
  useEffect(() => {
    if (simulatorMode !== 'idle' || !config.enableSlideshow || config.slides.length === 0) return;
    const interval = setInterval(() => {
      setSimActiveSlide((prev) => (prev + 1) % config.slides.length);
    }, Math.max(3, config.slideIntervalSeconds) * 1000);
    return () => clearInterval(interval);
  }, [simulatorMode, config.enableSlideshow, config.slides.length, config.slideIntervalSeconds]);

  // Slides management helpers
  const handleOpenAddSlide = () => {
    setEditingSlideId(null);
    setSlideForm({
      id: `slide_${Date.now()}`,
      type: 'image',
      url: '',
      tag: 'New Arrivals',
      title: '',
      subtitle: '',
      accent: 'from-indigo-600 to-purple-700',
      discountBadge: '',
    });
    setIsSlideModalOpen(true);
  };

  const handleOpenEditSlide = (slide: IdleMediaSlide) => {
    setEditingSlideId(slide.id);
    setSlideForm({ ...slide });
    setIsSlideModalOpen(true);
  };

  const handleSaveSlideForm = () => {
    if (!slideForm.url.trim() || !slideForm.title.trim()) {
      alert('Please enter both an Image URL and a Title.');
      return;
    }
    if (editingSlideId) {
      setConfig((prev) => ({
        ...prev,
        slides: prev.slides.map((s) => (s.id === editingSlideId ? slideForm : s)),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        slides: [...prev.slides, slideForm],
      }));
    }
    setIsSlideModalOpen(false);
  };

  const handleDeleteSlide = (id: string) => {
    if (config.slides.length <= 1) {
      alert('You must keep at least 1 slide in the slideshow.');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.filter((s) => s.id !== id),
    }));
  };

  const handleLoadPresetCollection = (presetSlides: IdleMediaSlide[]) => {
    if (window.confirm('Replace current slideshow with this curated collection preset?')) {
      setConfig((prev) => ({
        ...prev,
        slides: presetSlides,
      }));
      showToast('Loaded collection preset into slideshow.');
    }
  };

  // Promo cards helpers
  const handleOpenAddPromo = () => {
    setEditingPromoId(null);
    setPromoForm({
      id: `promo_${Date.now()}`,
      code: '',
      title: '',
      text: '',
      badge: 'LIMITED OFFER',
      color: 'from-amber-500 to-orange-600',
    });
    setIsPromoModalOpen(true);
  };

  const handleOpenEditPromo = (promo: PromoFlashCard) => {
    setEditingPromoId(promo.id);
    setPromoForm({ ...promo });
    setIsPromoModalOpen(true);
  };

  const handleSavePromoForm = () => {
    if (!promoForm.code.trim() || !promoForm.title.trim() || !promoForm.text.trim()) {
      alert('Please fill out Voucher Code, Title, and Description.');
      return;
    }
    if (editingPromoId) {
      setConfig((prev) => ({
        ...prev,
        promoCards: prev.promoCards.map((p) => (p.id === editingPromoId ? promoForm : p)),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        promoCards: [...prev.promoCards, promoForm],
      }));
    }
    setIsPromoModalOpen(false);
  };

  const handleDeletePromo = (id: string) => {
    if (config.promoCards.length <= 1) {
      alert('You must keep at least 1 promo card.');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      promoCards: prev.promoCards.filter((p) => p.id !== id),
    }));
  };

  const activeThemeConfig = FESTIVE_THEMES[config.activeFestiveTheme] || FESTIVE_THEMES.modern;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
            <MonitorPlay className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Customer Screen & Digital Signage Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Secondary Display
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize what shoppers see on the secondary monitor: festive themes, fashion slideshows, live UPI QR, marquee announcements & offer cards.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Open Customer Screen Button */}
          <button
            type="button"
            onClick={handleOpenCustomerDisplay}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            title="Launch secondary customer display window to drag to customer monitor"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Customer Screen</span>
          </button>

          {/* Reset Defaults */}
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Save & Broadcast */}
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save & Publish Changes</span>
          </button>
        </div>
      </div>

      {/* Main Studio Two-Column Grid: Config Controls (Left) + Interactive Simulator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Navigation Tabs & Settings Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Settings Section Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap gap-1 shadow-2xs">
            {[
              { id: 'theme', label: 'Festive & Brand', icon: Palette },
              { id: 'slideshow', label: 'Idle Slideshow', icon: ImageIcon },
              { id: 'video', label: 'Video Showcase', icon: Video },
              { id: 'marquee', label: 'Ticker Text', icon: Megaphone },
              { id: 'promos', label: 'Offer Cards', icon: Percent },
              { id: 'checkout', label: 'Checkout & QR', icon: QrCode },
              { id: 'reviews', label: 'Google Review', icon: Star },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Festive & Brand Identity */}
          {activeTab === 'theme' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <span>Celebration & Festive Themes</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a tailored theme for holidays, festivals, and seasonal events across India.
                </p>
              </div>

              {/* Theme Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(Object.keys(FESTIVE_THEMES) as FestiveThemeKey[]).map((themeKey) => {
                  const t = FESTIVE_THEMES[themeKey];
                  const isSelected = config.activeFestiveTheme === themeKey;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => updateConfig('activeFestiveTheme', themeKey)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-2xl">{t.emoji}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-900 leading-tight">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {t.badge}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Light / Dark Mode Toggle */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 block">Default Screen Color Mode</label>
                  <p className="text-[11px] text-slate-500">
                    Sleek dark mode is recommended for high-contrast luxury displays.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateConfig('displayMode', 'dark')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      config.displayMode === 'dark'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateConfig('displayMode', 'light')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      config.displayMode === 'light'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Brand Header Customization */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
                  Store Brand Identity Overrides
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Custom Store Name:
                    </label>
                    <input
                      type="text"
                      value={config.brandNameOverride}
                      onChange={(e) => updateConfig('brandNameOverride', e.target.value)}
                      placeholder={activeCompany.name || 'e.g. Couture Boutique'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Leave blank to use "{activeCompany.name}"
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Store Tagline / Slogan:
                    </label>
                    <input
                      type="text"
                      value={config.brandTaglineOverride}
                      onChange={(e) => updateConfig('brandTaglineOverride', e.target.value)}
                      placeholder={activeCompany.tagline || 'e.g. Handcrafted Luxury Fashion'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Customer Care Phone:</span>
                    </label>
                    <input
                      type="text"
                      value={config.storePhone}
                      onChange={(e) => updateConfig('storePhone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Instagram className="w-3 h-3 text-slate-400" />
                      <span>Instagram / Social Handle:</span>
                    </label>
                    <input
                      type="text"
                      value={config.storeInstagram}
                      onChange={(e) => updateConfig('storeInstagram', e.target.value)}
                      placeholder="@couture_apparel"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Idle Slideshow */}
          {activeTab === 'slideshow' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Idle Fashion Photo Slideshow</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showcase high-resolution collection imagery when the counter is not actively billing.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableSlideshow}
                    onChange={(e) => updateConfig('enableSlideshow', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Slide Duration Interval */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">Auto-Slide Transition Interval:</span>
                  <p className="text-[11px] text-slate-500">How long each image stays on screen.</p>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  {[4, 6, 8, 10, 15].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => updateConfig('slideIntervalSeconds', sec)}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        config.slideIntervalSeconds === sec
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Click Curated Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>1-Click Collection Presets:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESET_COLLECTIONS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleLoadPresetCollection(preset.slides)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 text-left transition-all cursor-pointer group"
                    >
                      <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-700">
                        {preset.name}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slides List Manager */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Active Slides ({config.slides.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenAddSlide}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Slide</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {config.slides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3 hover:border-slate-300 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 relative">
                        {slide.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white text-[10px] font-bold">
                            <Video className="w-4 h-4 text-cyan-400" />
                          </div>
                        ) : (
                          <img
                            src={slide.url}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                        )}
                        <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono bg-black/70 text-white px-1 rounded">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {slide.tag}
                          </span>
                          {slide.discountBadge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              {slide.discountBadge}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                          {slide.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {slide.subtitle}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSlide(slide)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Edit slide"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Video Showcase */}
          {activeTab === 'video' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-4 h-4 text-cyan-600" />
                    <span>Runway Fashion Video Showcase</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Embed video previews of brand campaigns or bridal shoots that play automatically when idle.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableVideoShowcase}
                    onChange={(e) => updateConfig('enableVideoShowcase', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Direct Video Stream URL (.mp4 / .webm):
                  </label>
                  <input
                    type="url"
                    value={config.videoUrl}
                    onChange={(e) => updateConfig('videoUrl', e.target.value)}
                    placeholder="https://.../runway.mp4"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Use high quality MP4 direct video URLs for crisp fullscreen playback on the customer screen.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Video Title:</label>
                    <input
                      type="text"
                      value={config.videoTitle}
                      onChange={(e) => updateConfig('videoTitle', e.target.value)}
                      placeholder="e.g. Master Artisan Couture"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Video Subtitle / Credit:</label>
                    <input
                      type="text"
                      value={config.videoSubtitle}
                      onChange={(e) => updateConfig('videoSubtitle', e.target.value)}
                      placeholder="e.g. Autumn / Festive Collection"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.autoLoopVideo}
                      onChange={(e) => updateConfig('autoLoopVideo', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-700">Auto-Loop Video Indefinitely</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.autoMuteVideo}
                      onChange={(e) => updateConfig('autoMuteVideo', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-700">Mute Audio by Default (Recommended)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Marquee Announcement Ticker */}
          {activeTab === 'marquee' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-emerald-600" />
                    <span>Scrolling Marquee Announcement Ticker</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Smooth scrolling text ticker displayed at the bottom of the customer screen.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableMarquee}
                    onChange={(e) => updateConfig('enableMarquee', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Speed selector */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">Ticker Scroll Speed:</span>
                  <p className="text-[11px] text-slate-500">Controls how fast announcements scroll across.</p>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  {[
                    { id: 'slow', label: 'Slow' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'fast', label: 'Fast' },
                  ].map((spd) => (
                    <button
                      key={spd.id}
                      type="button"
                      onClick={() => updateConfig('marqueeSpeed', spd.id as any)}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        config.marqueeSpeed === spd.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {spd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text editor */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Marquee Announcement Text:
                </label>
                <textarea
                  rows={4}
                  value={config.marqueeText}
                  onChange={(e) => updateConfig('marqueeText', e.target.value)}
                  placeholder="✨ Welcome to our Store • Complimentary Alterations • Instant UPI Accepted..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:bg-white transition-colors"
                />

                {/* Emoji quick-insert */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Insert:</span>
                  {['✨', '🛍️', '🪔', '🎄', '🎆', '🎨', '🇮🇳', '💳', '✂️', '🏷️', '⭐', '•'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => updateConfig('marqueeText', `${config.marqueeText} ${emoji} `)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-xs cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Promotional Offer Flash Cards */}
          {activeTab === 'promos' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span>Promotional Offer Flash Cards</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rotating flash cards showcasing active discount vouchers and membership perks.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enablePromoCards}
                    onChange={(e) => updateConfig('enablePromoCards', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Promo Cards List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Active Offer Cards ({config.promoCards.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenAddPromo}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Offer Card</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.promoCards.map((card) => (
                    <div
                      key={card.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {card.badge}
                          </span>
                          <span className="font-mono font-extrabold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {card.code}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{card.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{card.text}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className={`h-2.5 w-12 rounded-full bg-gradient-to-r ${card.color}`} />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPromo(card)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                            title="Edit offer card"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePromo(card.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete offer card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Checkout & Payment QR Settings */}
          {activeTab === 'checkout' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Checkout & Dynamic UPI QR Display</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure live UPI payment QR codes and customer recognition banners during checkout.
                </p>
              </div>

              {/* Dynamic QR Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Show Dynamic UPI QR During Cart Scanning
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Encodes the live grand total immediately so shoppers can scan and pay without delay.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showDynamicUpiQr}
                    onChange={(e) => updateConfig('showDynamicUpiQr', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* UPI ID Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Store UPI VPA / ID:
                  </label>
                  <input
                    type="text"
                    value={config.upiIdOverride}
                    onChange={(e) => updateConfig('upiIdOverride', e.target.value)}
                    placeholder={storeUpiId || 'retailstore@upi'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Defaults to {storeUpiId || 'store UPI in settings'}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Merchant Name on UPI App:
                  </label>
                  <input
                    type="text"
                    value={config.upiMerchantNameOverride}
                    onChange={(e) => updateConfig('upiMerchantNameOverride', e.target.value)}
                    placeholder={storeUpiName || activeCompany.name}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Customer Greeting & Privacy */}
              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <span className="font-bold text-slate-900 block">
                  Customer Greeting & Privacy Settings
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Customer Name Text Size:
                    </label>
                    <select
                      value={config.customerGreetingSize}
                      onChange={(e) => updateConfig('customerGreetingSize', e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="xl">Large (text-xl)</option>
                      <option value="2xl">Extra Large (text-2xl)</option>
                      <option value="3xl">Hero Giant (text-3xl - Recommended)</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={config.showCustomerLoyalty}
                        onChange={(e) => updateConfig('showCustomerLoyalty', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-700">Display Customer Loyalty Points</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={config.showCustomerVipBadge}
                        onChange={(e) => updateConfig('showCustomerVipBadge', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-700">Display VIP Member Tier Badge</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={config.maskCustomerPhone}
                        onChange={(e) => updateConfig('maskCustomerPhone', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-700">Mask Phone (e.g. 98765*****) for Privacy</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Google Review & Post Checkout */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>Google Reviews & Post-Bill Completion</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Encourage happy shoppers to leave a 5-star Google review right after receipt printing.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showGoogleReviewQr}
                    onChange={(e) => updateConfig('showGoogleReviewQr', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Google Review URL:
                  </label>
                  <input
                    type="url"
                    value={config.googleReviewUrl}
                    onChange={(e) => updateConfig('googleReviewUrl', e.target.value)}
                    placeholder="https://g.page/r/your-store/review"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Post-Checkout Screen Timeout (Seconds before returning to Idle):
                  </label>
                  <div className="flex items-center gap-1 font-bold">
                    {[10, 15, 20, 30, 45].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => updateConfig('postCheckoutIdleTimeoutSeconds', sec)}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          config.postCheckoutIdleTimeoutSeconds === sec
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Live Broadcast Bar */}
          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <Tv className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Broadcast Live Test State to Connected Customer Displays:</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleTestBroadcast('idle')}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg cursor-pointer"
              >
                Send Idle
              </button>
              <button
                type="button"
                onClick={() => handleTestBroadcast('cart')}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg cursor-pointer"
              >
                Send Cart
              </button>
              <button
                type="button"
                onClick={() => handleTestBroadcast('payment')}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg cursor-pointer"
              >
                Send Payment QR
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Live Customer Screen Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-3 sticky top-20">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                  Live Customer Screen Preview
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                1080p Scaled
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl text-xs font-bold">
              {[
                { id: 'idle', label: 'Idle' },
                { id: 'cart', label: 'Cart' },
                { id: 'payment', label: 'Payment' },
                { id: 'completed', label: 'Complete' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSimulatorMode(m.id as any)}
                  className={`flex-1 py-1 text-center rounded-lg transition-colors cursor-pointer text-[11px] ${
                    simulatorMode === m.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Scaled Preview Frame */}
            <div
              className={`w-full aspect-[16/10] rounded-xl overflow-hidden border border-slate-700/80 shadow-inner relative flex flex-col transition-colors ${
                config.displayMode === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-white'
              }`}
            >
              {/* Scaled Festive Accent Top Bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${activeThemeConfig.accentGradient}`} />

              {/* SIMULATOR: IDLE MODE */}
              {simulatorMode === 'idle' && (
                <div className="flex-1 relative flex flex-col justify-between overflow-hidden">
                  {/* Background Image / Slide */}
                  {config.slides.length > 0 && (
                    <div className="absolute inset-0 z-0">
                      <img
                        src={config.slides[simActiveSlide % config.slides.length]?.url}
                        alt="Preview"
                        className="w-full h-full object-cover brightness-[0.7]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>
                  )}

                  {/* Header */}
                  <div className="relative z-10 p-2.5 flex items-center justify-between text-white">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-[10px]">
                        👗
                      </div>
                      <span className="font-extrabold text-[11px] drop-shadow-sm truncate">
                        {config.brandNameOverride || activeCompany.name}
                      </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 font-bold border border-white/20">
                      {activeThemeConfig.emoji} {activeThemeConfig.name}
                    </span>
                  </div>

                  {/* Slide Content */}
                  {config.slides.length > 0 && (
                    <div className="relative z-10 p-3 text-white">
                      <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-600 uppercase tracking-wide">
                        {config.slides[simActiveSlide % config.slides.length]?.tag}
                      </span>
                      <h4 className="text-xs font-extrabold line-clamp-1 mt-1 drop-shadow-md">
                        {config.slides[simActiveSlide % config.slides.length]?.title}
                      </h4>
                      <p className="text-[9px] text-white/80 line-clamp-1 drop-shadow-sm mt-0.5">
                        {config.slides[simActiveSlide % config.slides.length]?.subtitle}
                      </p>
                    </div>
                  )}

                  {/* Ticker at bottom */}
                  {config.enableMarquee && (
                    <div className="relative z-10 bg-black/80 text-white/90 text-[9px] px-2 py-1 overflow-hidden whitespace-nowrap border-t border-white/10 font-medium">
                      <div className="animate-marquee">{config.marqueeText}</div>
                    </div>
                  )}
                </div>
              )}

              {/* SIMULATOR: CART MODE */}
              {simulatorMode === 'cart' && (
                <div className="flex-1 p-2.5 flex flex-col justify-between overflow-hidden text-[10px]">
                  {/* Customer Banner */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/40">
                    <div>
                      <div className="font-bold flex items-center gap-1 text-[11px]">
                        <span>Welcome, Priya Sharma</span>
                        <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                          VIP Gold
                        </span>
                      </div>
                      <span className="text-[9px] opacity-60">Loyalty: 480 Pts</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] opacity-60 uppercase">Payable Total</span>
                      <div className="font-mono font-extrabold text-xs text-emerald-400">₹3,499.00</div>
                    </div>
                  </div>

                  {/* Mini Cart Items */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-800/40">
                      <span className="truncate max-w-[140px]">1x Banarasi Silk Saree</span>
                      <span className="font-mono font-bold">₹2,800</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="truncate max-w-[140px]">1x Velvet Blouse Piece</span>
                      <span className="font-mono font-bold">₹699</span>
                    </div>
                  </div>

                  {/* Bottom QR Callout */}
                  <div className="bg-slate-800/80 p-2 rounded-lg flex items-center justify-between gap-2 border border-slate-700">
                    <div>
                      <span className="text-[9px] font-extrabold block text-indigo-300">
                        Scan & Pay via UPI
                      </span>
                      <span className="text-[8px] opacity-70">GPay, PhonePe, Paytm</span>
                    </div>
                    {simUpiQrDataUrl && (
                      <img src={simUpiQrDataUrl} alt="QR" className="w-10 h-10 rounded bg-white p-0.5" />
                    )}
                  </div>
                </div>
              )}

              {/* SIMULATOR: PAYMENT MODE */}
              {simulatorMode === 'payment' && (
                <div className="flex-1 p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                    Scan to Pay with Any UPI App
                  </span>
                  {simUpiQrDataUrl && (
                    <div className="bg-white p-1.5 rounded-xl shadow-md my-1">
                      <img src={simUpiQrDataUrl} alt="QR" className="w-24 h-24" />
                    </div>
                  )}
                  <div className="font-mono font-extrabold text-sm text-emerald-400 mt-1">₹3,499.00</div>
                  <span className="text-[8px] opacity-60 mt-0.5">Priya Sharma • Bill #1082</span>
                </div>
              )}

              {/* SIMULATOR: COMPLETED MODE */}
              {simulatorMode === 'completed' && (
                <div className="flex-1 p-3 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <h4 className="text-xs font-extrabold text-white">Thank You for Shopping!</h4>
                  <p className="text-[9px] opacity-70">Your e-receipt has been sent to your mobile.</p>
                  <div className="mt-2 p-1.5 bg-slate-800 rounded-lg flex items-center gap-2 border border-slate-700 text-left">
                    <Star className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[8px] font-bold block">Rate your experience!</span>
                      <span className="text-[7px] text-amber-300">Scan to leave a Google Review</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Real secondary display renders full 1080p / 4K fluid layout.</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT SLIDE */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>{editingSlideId ? 'Edit Slide' : 'Add New Slideshow Image'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL:</label>
                <input
                  type="url"
                  value={slideForm.url}
                  onChange={(e) => setSlideForm({ ...slideForm, url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge / Tag:</label>
                  <input
                    type="text"
                    value={slideForm.tag}
                    onChange={(e) => setSlideForm({ ...slideForm, tag: e.target.value })}
                    placeholder="e.g. Festive Collection"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Offer Badge (Optional):</label>
                  <input
                    type="text"
                    value={slideForm.discountBadge || ''}
                    onChange={(e) => setSlideForm({ ...slideForm, discountBadge: e.target.value })}
                    placeholder="e.g. Flat 20% Off"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Headline Title:</label>
                <input
                  type="text"
                  value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  placeholder="e.g. Exquisite Heritage Sarees & Lehengas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtitle / Details:</label>
                <textarea
                  rows={2}
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  placeholder="e.g. Woven with gold zari, pure silks & bespoke craftsmanship..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSlideForm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {editingSlideId ? 'Save Changes' : 'Add to Slideshow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT PROMO CARD */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-600" />
                <span>{editingPromoId ? 'Edit Offer Card' : 'Add New Promotional Offer Card'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon Code:</label>
                  <input
                    type="text"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FESTIVE20"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge Tag:</label>
                  <input
                    type="text"
                    value={promoForm.badge}
                    onChange={(e) => setPromoForm({ ...promoForm, badge: e.target.value })}
                    placeholder="e.g. HOT OFFER"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title:</label>
                <input
                  type="text"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  placeholder="e.g. Festive Flash Deal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Offer Description:</label>
                <textarea
                  rows={2}
                  value={promoForm.text}
                  onChange={(e) => setPromoForm({ ...promoForm, text: e.target.value })}
                  placeholder="e.g. Get flat ₹500 OFF instantly on all orders above ₹3,000!"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gradient Theme Color:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'from-amber-500 to-orange-600', name: 'Amber' },
                    { id: 'from-emerald-500 to-teal-600', name: 'Emerald' },
                    { id: 'from-purple-500 to-indigo-600', name: 'Purple' },
                    { id: 'from-rose-500 to-pink-600', name: 'Rose' },
                  ].map((grad) => (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() => setPromoForm({ ...promoForm, color: grad.id })}
                      className={`h-8 rounded-lg bg-gradient-to-r ${grad.id} border-2 transition-all cursor-pointer ${
                        promoForm.color === grad.id ? 'border-slate-900 scale-105' : 'border-transparent'
                      }`}
                      title={grad.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePromoForm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                {editingPromoId ? 'Save Offer' : 'Add Offer Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
