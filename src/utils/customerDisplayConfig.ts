import { CustomerDisplayPayload } from '../types';

export type FestiveThemeKey =
  | 'modern'
  | 'christmas'
  | 'new_year'
  | 'diwali'
  | 'eid'
  | 'holi'
  | 'navratri'
  | 'tiranga';

export interface FestiveThemeConfig {
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

export const FESTIVE_THEMES: Record<FestiveThemeKey, FestiveThemeConfig> = {
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

export interface IdleMediaSlide {
  id: string;
  type: 'image' | 'video';
  url: string;
  tag: string;
  title: string;
  subtitle: string;
  accent: string;
  discountBadge?: string;
}

export const DEFAULT_SLIDES: IdleMediaSlide[] = [
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

export interface PromoFlashCard {
  id: string;
  code: string;
  title: string;
  text: string;
  badge: string;
  color: string;
}

export const DEFAULT_PROMOS: PromoFlashCard[] = [
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

export interface CustomerDisplayCustomConfig {
  // Appearance & Themes
  displayMode: 'dark' | 'light';
  activeFestiveTheme: FestiveThemeKey;
  brandNameOverride: string;
  brandTaglineOverride: string;
  storePhone: string;
  storeInstagram: string;

  // Idle Media: Slideshow
  enableSlideshow: boolean;
  slideIntervalSeconds: number; // 3, 5, 8, 10, 15
  slides: IdleMediaSlide[];

  // Idle Media: Video Showcase
  enableVideoShowcase: boolean;
  videoUrl: string;
  videoTitle: string;
  videoSubtitle: string;
  autoLoopVideo: boolean;
  autoMuteVideo: boolean;

  // Idle Media: Announcement Ticker
  enableMarquee: boolean;
  marqueeSpeed: 'slow' | 'normal' | 'fast';
  marqueeText: string;

  // Idle Media: Promotional Flash Cards
  enablePromoCards: boolean;
  promoCards: PromoFlashCard[];

  // Active Billing & Payment Screen
  showDynamicUpiQr: boolean;
  upiIdOverride: string;
  upiMerchantNameOverride: string;
  customerGreetingSize: 'xl' | '2xl' | '3xl';
  showCustomerLoyalty: boolean;
  showCustomerVipBadge: boolean;
  maskCustomerPhone: boolean;
  showSavingsCallout: boolean;

  // Post-Checkout Screen
  showGoogleReviewQr: boolean;
  googleReviewUrl: string;
  postCheckoutIdleTimeoutSeconds: number;
}

export const DEFAULT_CUSTOMER_DISPLAY_CONFIG: CustomerDisplayCustomConfig = {
  displayMode: 'dark',
  activeFestiveTheme: 'modern',
  brandNameOverride: '',
  brandTaglineOverride: '',
  storePhone: '+91 98765 43210',
  storeInstagram: '@couture_apparel',

  enableSlideshow: true,
  slideIntervalSeconds: 6,
  slides: DEFAULT_SLIDES,

  enableVideoShowcase: true,
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  videoTitle: 'Runway Highlights & Fresh Arrivals',
  videoSubtitle: 'Watch our master artisan collection come alive in fluid drape and motion.',
  autoLoopVideo: true,
  autoMuteVideo: true,

  enableMarquee: true,
  marqueeSpeed: 'normal',
  marqueeText:
    '✨ Welcome to our Store • Complimentary Master-Tailor Alterations • Instant UPI, Card & Cash Payments Accepted • 7-Day Exchange Guarantee with Tags • Follow us on Instagram for latest drops!',

  enablePromoCards: true,
  promoCards: DEFAULT_PROMOS,

  showDynamicUpiQr: true,
  upiIdOverride: '',
  upiMerchantNameOverride: '',
  customerGreetingSize: '3xl',
  showCustomerLoyalty: true,
  showCustomerVipBadge: true,
  maskCustomerPhone: false,
  showSavingsCallout: true,

  showGoogleReviewQr: true,
  googleReviewUrl: 'https://g.page/r/your-store/review',
  postCheckoutIdleTimeoutSeconds: 15,
};

export const CONFIG_STORAGE_KEY = 'garment_customer_display_config';
export const CONFIG_EVENT_NAME = 'garment_customer_display_config_update';
export const CHANNEL_NAME = 'garment_pos_customer_display';

/**
 * Load customer display configuration from localStorage with robust fallbacks.
 */
export function loadCustomerDisplayConfig(): CustomerDisplayCustomConfig {
  if (typeof window === 'undefined') return DEFAULT_CUSTOMER_DISPLAY_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMER_DISPLAY_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CUSTOMER_DISPLAY_CONFIG,
      ...parsed,
      slides: Array.isArray(parsed.slides) && parsed.slides.length > 0 ? parsed.slides : DEFAULT_SLIDES,
      promoCards: Array.isArray(parsed.promoCards) && parsed.promoCards.length > 0 ? parsed.promoCards : DEFAULT_PROMOS,
    };
  } catch {
    return DEFAULT_CUSTOMER_DISPLAY_CONFIG;
  }
}

/**
 * Save configuration and broadcast updates instantly to all secondary customer displays.
 */
export function saveCustomerDisplayConfig(config: CustomerDisplayCustomConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    // Also save legacy keys for backwards-compatibility
    localStorage.setItem('garment_customer_display_mode', config.displayMode);
    localStorage.setItem('garment_customer_display_festive_theme', config.activeFestiveTheme);
    localStorage.setItem('garment_customer_display_slides', JSON.stringify(config.slides));
    localStorage.setItem('garment_customer_display_ticker', config.marqueeText);

    // Dispatch event in current window
    window.dispatchEvent(
      new CustomEvent(CONFIG_EVENT_NAME, { detail: config })
    );

    // Broadcast message via native BroadcastChannel
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        bc.postMessage({ type: 'CONFIG_UPDATE', config, timestamp: Date.now() });
        bc.close();
      } catch (err) {
        console.warn('BroadcastChannel send error:', err);
      }
    }
  } catch (e) {
    console.error('Failed to save customer display config:', e);
  }
}

/**
 * Reset config back to factory defaults.
 */
export function resetCustomerDisplayConfig(): CustomerDisplayCustomConfig {
  saveCustomerDisplayConfig(DEFAULT_CUSTOMER_DISPLAY_CONFIG);
  return DEFAULT_CUSTOMER_DISPLAY_CONFIG;
}

/**
 * Subscribe to customer display config changes (from admin page or secondary display).
 */
export function listenCustomerDisplayConfig(
  callback: (config: CustomerDisplayCustomConfig) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<CustomerDisplayCustomConfig>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === CONFIG_STORAGE_KEY && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch {}
    }
  };

  let bc: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'CONFIG_UPDATE' && event.data.config) {
          callback(event.data.config);
        }
      };
    } catch {}
  }

  window.addEventListener(CONFIG_EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(CONFIG_EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
    if (bc) {
      bc.close();
    }
  };
}

/**
 * Presets of curated fashion collections for 1-click loading by store managers.
 */
export const PRESET_COLLECTIONS: { id: string; name: string; description: string; slides: IdleMediaSlide[] }[] = [
  {
    id: 'bridal_ethnic',
    name: '👑 Royal Bridal & Silk Heritage',
    description: 'Gold zari Banarasi sarees, bridal lehengas, and royal wedding jewelry accents.',
    slides: [
      {
        id: 'preset_b1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
        tag: 'Bridal Heritage',
        title: 'Heirloom Kanjeevaram & Banarasi Silks',
        subtitle: 'Hand-woven real zari borders with pure mulberry silks for timeless elegance.',
        accent: 'from-amber-600 to-rose-700',
        discountBadge: 'Flat 20% Off on Bridal Trousseau',
      },
      {
        id: 'preset_b2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80',
        tag: 'Grand Reception',
        title: 'Intricate Zardozi & Hand-Embroidered Lehengas',
        subtitle: 'Crafted by master artisans over 300+ hours with velvet and raw silk dupion.',
        accent: 'from-rose-600 to-purple-800',
        discountBadge: 'Complimentary Master Blouse Tailoring',
      },
      {
        id: 'preset_b3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80',
        tag: 'Groom Collection',
        title: 'Regal Raw Silk Sherwanis & Safas',
        subtitle: 'Coordinated groom and bride colorways with antique brocade safas.',
        accent: 'from-amber-600 to-yellow-600',
        discountBadge: 'Special Wedding Set Savings',
      },
    ],
  },
  {
    id: 'mens_formal',
    name: '👔 Gentlemen Suits & Bespoke Tailoring',
    description: 'Italian wool suits, crisp Egyptian cotton shirts, and sharp formal trousers.',
    slides: [
      {
        id: 'preset_m1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80',
        tag: 'Bespoke Suiting',
        title: 'Super 120s Italian Wool Suits & Tuxedos',
        subtitle: 'Crafted for boardrooms and galas with hand-canvassed chest pieces.',
        accent: 'from-slate-700 to-slate-900',
        discountBadge: 'Free Alteration & Custom Monogram',
      },
      {
        id: 'preset_m2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1600&q=80',
        tag: 'Luxury Shirting',
        title: 'Giza & Egyptian Cotton Dress Shirts',
        subtitle: 'Wrinkle-resistant double-ply yarns with mother-of-pearl buttons.',
        accent: 'from-blue-600 to-indigo-800',
        discountBadge: 'Buy 2 Get 1 Free on Fine Shirts',
      },
    ],
  },
  {
    id: 'casual_linen',
    name: '🌿 Summer Linens & Pret Wear',
    description: 'Breathable pure European linen shirts, casual kurtas, and breezy coordinate sets.',
    slides: [
      {
        id: 'preset_c1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80',
        tag: 'Breezy Comfort',
        title: 'Pure French Linen Shirts & Co-ord Sets',
        subtitle: 'Lightweight, naturally thermoregulating weaves in soothing pastel tones.',
        accent: 'from-teal-600 to-emerald-800',
        discountBadge: 'Summer Drop: Flat 15% Off',
      },
      {
        id: 'preset_c2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80',
        tag: 'Contemporary Chic',
        title: 'Casual Fusion Kurtis & Comfort Denims',
        subtitle: 'Effortless everyday grace designed for work and weekend outings.',
        accent: 'from-fuchsia-600 to-rose-700',
        discountBadge: 'Student & Youth 10% Extra Off',
      },
    ],
  },
];

