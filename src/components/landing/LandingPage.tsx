import React, { useState, useMemo } from 'react';
import { GarmentOsLogo } from '../common/GarmentOsLogo';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { UpiPaymentQr } from '../common/UpiPaymentQr';
import {
  ShoppingBag,
  Sparkles,
  Scissors,
  Tag,
  Receipt,
  RotateCcw,
  IndianRupee,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Printer,
  Smartphone,
  Layers,
  Clock,
  ChevronRight,
  Check,
  Sliders,
  Store,
  Building2,
  Lock,
  Wallet,
  Play,
  QrCode,
  Truck,
  Heart,
  HelpCircle,
  Volume2,
  VolumeX,
  Search,
  MessageSquare,
  Share2,
  Send,
  Eye,
  CheckSquare,
  ExternalLink,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToPOS?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToPOS,
  onNavigateToTab,
}) => {
  // Audio Feedback State & Web Audio Oscillator
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playScannerBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  };

  // Interactive GST Simulator States
  const [demoPrice, setDemoPrice] = useState<number>(1499);
  const [demoIsInclusive, setDemoIsInclusive] = useState<boolean>(true);
  const [footfallPerDay, setFootfallPerDay] = useState<number>(65);
  const [avgTicketSize, setAvgTicketSize] = useState<number>(2400);

  // Dynamic GST calculation for the live hero simulator
  const gstRate = demoPrice <= 1000 ? 5 : 12;
  const simulatedTax = useMemo(() => {
    if (demoIsInclusive) {
      const base = demoPrice / (1 + gstRate / 100);
      const tax = demoPrice - base;
      return {
        base: Math.round(base * 100) / 100,
        cgst: Math.round((tax / 2) * 100) / 100,
        sgst: Math.round((tax / 2) * 100) / 100,
        totalTax: Math.round(tax * 100) / 100,
        finalPayable: demoPrice,
      };
    } else {
      const tax = (demoPrice * gstRate) / 100;
      return {
        base: demoPrice,
        cgst: Math.round((tax / 2) * 100) / 100,
        sgst: Math.round((tax / 2) * 100) / 100,
        totalTax: Math.round(tax * 100) / 100,
        finalPayable: demoPrice + tax,
      };
    }
  }, [demoPrice, demoIsInclusive, gstRate]);

  // Sandbox 1: Hangtag Customizer States
  const [tagFormat, setTagFormat] = useState<'garment' | 'jewelry'>('garment');
  const [tagStoreName, setTagStoreName] = useState('LAKSHMI BOUTIQUE');
  const [tagItemName, setTagItemName] = useState('Chanderi Silk Kurti');
  const [tagSku, setTagSku] = useState('CSK-402');
  const [tagBarcode, setTagBarcode] = useState('890124890042');
  const [tagSize, setTagSize] = useState('XL / 42');
  const [tagColor, setTagColor] = useState('Wine Maroon');
  const [tagPrice, setTagPrice] = useState(1499);
  const [tagHsn, setTagHsn] = useState('6204');

  // Sandbox 2: Alterations Workflow States
  const [altCustomerName, setAltCustomerName] = useState('Pooja Sharma');
  const [altPhone, setAltPhone] = useState('9896012345');
  const [altGarment, setAltGarment] = useState('Formal Linen Trouser');
  const [altType, setAltType] = useState('Length Hem (-2.5 inches)');
  const [altMasterji, setAltMasterji] = useState('Master Ramesh');
  const [altPromiseDate, setAltPromiseDate] = useState('Tomorrow, 5:00 PM');
  const [altStatusStep, setAltStatusStep] = useState<1 | 2 | 3>(3);

  // Sandbox 3: Dynamic Split Tender Playground States
  const [splitBillTotal, setSplitBillTotal] = useState<number>(3500);
  const [splitCashRatio, setSplitCashRatio] = useState<number>(50); // 50%
  const splitCashAmount = Math.round((splitBillTotal * splitCashRatio) / 100);
  const splitUpiAmount = splitBillTotal - splitCashAmount;

  // Hardware Compatibility Search State
  const [hardwareQuery, setHardwareQuery] = useState('');

  const hardwareDatabase = [
    { name: 'TVS RP 3200 Star / RP 3150 Gold', type: 'Thermal Receipt Printer (80mm USB/LAN)', status: 'Supported ✅', badge: 'Certified' },
    { name: 'Epson TM-T82 / TM-T88 / TM-m30', type: 'Thermal Receipt Printer (80mm & 58mm)', status: 'Supported ✅', badge: 'Certified' },
    { name: 'Posiflex Aura 6900 / 7600', type: 'Heavy Duty Thermal POS Printer', status: 'Supported ✅', badge: 'Certified' },
    { name: 'NGX N-80 / N-58 Series', type: 'Compact Retail Thermal Printer', status: 'Supported ✅', badge: 'Certified' },
    { name: 'TSC TE244 / DA210 Barcode Printer', type: 'Direct Thermal & Ribbon Label Printer', status: 'Supported ✅', badge: 'Certified' },
    { name: 'Zebra ZD220 / ZD230 Label Printer', type: 'Industrial Thermal Hangtag Printer', status: 'Supported ✅', badge: 'Certified' },
    { name: 'Honeywell Voyager 1250g / 1450g 2D', type: 'High-Speed Handheld Laser / 2D Gun', status: 'Supported ✅', badge: 'Certified' },
    { name: 'TVS BSC 101 Star / BS-L100 Laser Gun', type: 'Indian Retail Standard Barcode Scanner', status: 'Supported ✅', badge: 'Certified' },
    { name: 'Netum Wireless Bluetooth 1D/2D Gun', type: 'Cordless Handheld Scanner Gun', status: 'Supported ✅', badge: 'Certified' },
    { name: 'Smartphone / Tablet Camera Scanner', type: 'Integrated iOS & Android Web Scanner', status: 'Built-In ✅', badge: 'Zero Cost' },
  ];

  const filteredHardware = useMemo(() => {
    if (!hardwareQuery.trim()) return hardwareDatabase.slice(0, 6);
    const q = hardwareQuery.toLowerCase();
    return hardwareDatabase.filter((h) => h.name.toLowerCase().includes(q) || h.type.toLowerCase().includes(q));
  }, [hardwareQuery]);

  // Store Fit Quiz States
  const [quizStoreType, setQuizStoreType] = useState<string>('boutique');
  const [quizTailoring, setQuizTailoring] = useState<string>('yes');
  const [quizCurrentSystem, setQuizCurrentSystem] = useState<string>('generic_pos');

  // ROI Calculator formula
  const roiCalculations = useMemo(() => {
    const monthlyBills = footfallPerDay * 30;
    const secondsSaved = monthlyBills * 45;
    const hoursSaved = Math.round((secondsSaved / 3600) * 10) / 10;
    const monthlyTurnover = monthlyBills * avgTicketSize;
    const revenueProtected = Math.round((monthlyTurnover * 0.018) / 100) * 100;
    return {
      monthlyBills,
      hoursSaved,
      revenueProtected,
    };
  }, [footfallPerDay, avgTicketSize]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-500 selection:text-white font-sans antialiased pb-16 lg:pb-0">
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <aside className="bg-slate-950 text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
              v2.4 RELEASE
            </span>
            <span className="text-slate-300 font-medium">
              Dynamic Garment GST (5% & 12%), In-House Alteration Studio & 1-Click Store Credit Notes live!
            </span>
          </div>
          <button
            onClick={() => onNavigateToPOS?.()}
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors cursor-pointer group"
          >
            <span>Launch POS Terminal (F2)</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </aside>

      {/* 2. FLOATING GLASS ISLAND NAVIGATION */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigateToPOS?.()}>
              <GarmentOsLogo size="sm" variant="icon" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-950 text-lg tracking-tight">GarmentOS</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    RETAIL
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
                  The Operating System for Apparel Boutiques
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-950 transition-colors">Core Pillars</a>
            <a href="#interactive-demo" className="hover:text-slate-950 transition-colors">GST Simulator</a>
            <a href="#hangtag-studio" className="hover:text-slate-950 transition-colors">Hangtag Studio</a>
            <a href="#alterations-studio" className="hover:text-slate-950 transition-colors">Alterations Hub</a>
            <a href="#split-tender-studio" className="hover:text-slate-950 transition-colors">Split UPI Pay</a>
            <a href="#hardware-checker" className="hover:text-slate-950 transition-colors">Hardware Checker</a>
            <a href="#calculator" className="hover:text-slate-950 transition-colors">Store ROI</a>
            <a href="#store-quiz" className="hover:text-slate-950 transition-colors">Store Fit Quiz</a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigateToPOS?.()}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer group"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Launch POS (F2)</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION WITH AUDIO SCANNER SIMULATOR */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200/80 text-indigo-900 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tailored specifically for Indian clothing stores & fashion retail</span>
            </div>

            {/* H1 Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
              The retail POS built for how{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                garment stores
              </span>{' '}
              actually sell.
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Generic POS software fails apparel retail. GarmentOS unifies dynamic Indian Garment GST slabs (5% vs 12%), in-house tailoring & alteration tracking, thermal barcode hangtags, and 1-click store credit notes into one blisteringly fast interface.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigateToPOS?.()}
                className="px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-950/10 flex items-center gap-2 transition-all cursor-pointer group"
              >
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
                <span>Launch Interactive POS (F2)</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href="#interactive-demo"
                className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs sm:text-sm font-bold border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>Explore Live Simulator</span>
              </a>
            </div>

            {/* Trust Metric Badges */}
            <div className="pt-8 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left max-w-3xl mx-auto">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-xl font-black text-slate-950 font-mono">0.8s</div>
                <div className="text-[11px] text-slate-500 font-medium">Barcode Scan to Bill</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-xl font-black text-emerald-600 font-mono">100%</div>
                <div className="text-[11px] text-slate-500 font-medium">Auto Garment GST Slabs</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-xl font-black text-indigo-600 font-mono">1-Click</div>
                <div className="text-[11px] text-slate-500 font-medium">Store Credit Notes</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-xl font-black text-slate-950 font-mono">₹0</div>
                <div className="text-[11px] text-slate-500 font-medium">Hardware Lock-in</div>
              </div>
            </div>
          </div>

          {/* Interactive Live Hero Simulation Card with Scanner Audio Beep */}
          <div id="interactive-demo" className="mt-14 max-w-5xl mx-auto">
            <div className="bg-slate-950 rounded-2xl p-2 sm:p-3 shadow-2xl border border-slate-800">
              {/* Window Controls & Sound Toggle */}
              <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 ml-2 hidden sm:inline">
                    GarmentOS POS Counter · Live Indian GST & Alteration Simulator
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Scanner Sound Toggle */}
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      soundEnabled
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                    title={soundEnabled ? 'Scanner Audio Beep ON' : 'Scanner Audio Beep MUTED'}
                  >
                    {soundEnabled ? <Volume2 className="w-3 h-3 text-indigo-400" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
                    <span>{soundEnabled ? 'Beep: ON' : 'Beep: OFF'}</span>
                  </button>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ● POS ACTIVE
                  </span>
                </div>
              </div>

              {/* Interactive Mockup Body */}
              <div className="p-4 sm:p-6 bg-slate-900 rounded-xl grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-100">
                {/* Left Side: Garment Item & Interactive Price Controls */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                        Item Scan Simulation
                      </div>
                      <div className="text-base font-bold text-white">Chanderi Silk Anarkali Suit (Size: L)</div>
                      <div className="text-xs text-slate-400 font-mono">SKU: ETH-ANK-042 · Color: Maroon Wine</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      HSN: 6204
                    </span>
                  </div>

                  {/* Price Slabs Interactive Toggle */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Test Indian Garment GST Rules:</span>
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        {demoPrice <= 1000 ? 'Slab 1: 5% GST (≤ ₹1,000)' : 'Slab 2: 12% GST (> ₹1,000)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Cotton Kurti (₹499)', price: 499 },
                        { label: 'Printed Shirt (₹999)', price: 999 },
                        { label: 'Silk Kurti (₹1,499)', price: 1499 },
                        { label: 'Bridal Lehenga (₹5,999)', price: 5999 },
                      ].map((item) => (
                        <button
                          key={item.price}
                          onClick={() => {
                            setDemoPrice(item.price);
                            playScannerBeep();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            demoPrice === item.price
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400">Custom Unit Rate:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-slate-400">₹</span>
                        <input
                          type="number"
                          value={demoPrice}
                          onChange={(e) => {
                            setDemoPrice(Math.max(1, parseInt(e.target.value) || 0));
                            playScannerBeep();
                          }}
                          className="w-24 px-2 py-1 text-right font-mono font-bold bg-slate-900 border border-slate-700 rounded text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alteration Feature Tag inside Mockup */}
                  <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-900/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="font-bold text-white">Alteration Tagged: </span>
                        <span className="text-indigo-200">Pant length hem -2 inches (Master Ramesh)</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                      Slip #ALT-108
                    </span>
                  </div>

                  {/* Customer Store Credit Alert Mockup */}
                  <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-white">Credit Note Available: </span>
                        <span className="text-emerald-200">CN-1042 (Pooja Sharma · ₹850.00)</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white font-mono">
                      1-Click Apply
                    </span>
                  </div>
                </div>

                {/* Right Side: Real-time GST Invoice Breakdown */}
                <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-sans">
                      <span className="font-bold text-white text-xs">GST Tax Engine Breakdown</span>
                      <button
                        onClick={() => {
                          setDemoIsInclusive(!demoIsInclusive);
                          playScannerBeep();
                        }}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer border ${
                          demoIsInclusive
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        }`}
                      >
                        {demoIsInclusive ? 'Tax Included in Price' : 'Tax Added Separately'}
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-3 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Garment Tag Price:</span>
                        <span className="font-bold text-white">₹{demoPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Taxable Value (Base):</span>
                        <span>₹{simulatedTax.base.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-300">
                        <span>CGST ({gstRate / 2}%):</span>
                        <span>₹{simulatedTax.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-300">
                        <span>SGST ({gstRate / 2}%):</span>
                        <span>₹{simulatedTax.sgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 pt-1 border-t border-slate-800 font-bold">
                        <span>Total GST ({gstRate}%):</span>
                        <span>₹{simulatedTax.totalTax.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-3 font-sans">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400 font-medium">Customer Net Payable:</span>
                      <span className="text-xl font-black text-white font-mono">
                        ₹{simulatedTax.finalPayable.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigateToPOS?.()}
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Experience Full POS In App</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SANDBOX A: INTERACTIVE THERMAL HANGTAG & BARBELL CUSTOMIZER */}
      <section id="hangtag-studio" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-amber-700 tracking-wider uppercase font-mono">
              Live Hardware Preview
            </span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">
              Interactive Thermal Hangtag & Barcode Studio
            </h2>
            <p className="text-sm text-slate-600">
              Customize your boutique hangtag below. Zero external Bartender software needed — print directly to 50x25mm thermal labels from your browser.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Tag Controls Column */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTagFormat('garment')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tagFormat === 'garment' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Standard 50x25mm Tag
                </button>
                <button
                  type="button"
                  onClick={() => setTagFormat('jewelry')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tagFormat === 'jewelry' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Jewelry Barbell Tag
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Boutique / Store Name:</label>
                  <input
                    type="text"
                    value={tagStoreName}
                    onChange={(e) => setTagStoreName(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Garment Title:</label>
                    <input
                      type="text"
                      value={tagItemName}
                      onChange={(e) => setTagItemName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Tag Price (₹):</label>
                    <input
                      type="number"
                      value={tagPrice}
                      onChange={(e) => setTagPrice(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Size:</label>
                    <input
                      type="text"
                      value={tagSize}
                      onChange={(e) => setTagSize(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Color:</label>
                    <input
                      type="text"
                      value={tagColor}
                      onChange={(e) => setTagColor(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">HSN:</label>
                    <input
                      type="text"
                      value={tagHsn}
                      onChange={(e) => setTagHsn(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tag Live Thermal Preview Column */}
            <div className="md:col-span-6 flex flex-col items-center justify-center p-6 bg-slate-100 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Live 203 DPI Thermal Output Preview
              </span>

              {tagFormat === 'garment' ? (
                /* Standard 50x25mm Garment Tag */
                <div className="w-72 bg-white rounded-lg border-2 border-dashed border-slate-300 p-3 shadow-md space-y-1.5 text-center font-mono">
                  <div className="text-[11px] font-black tracking-tight text-slate-950 uppercase border-b border-slate-200 pb-1">
                    {tagStoreName || 'GARMENT BOUTIQUE'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-800 truncate">{tagItemName}</div>

                  {/* Real Code128 Vector Barcode Preview */}
                  <div className="flex justify-center py-1">
                    <BarcodeSvg value={tagBarcode} width={180} height={26} showText={false} />
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono tracking-wider">{tagBarcode}</div>

                  <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-200 pt-1 text-slate-800">
                    <span>SIZE: {tagSize}</span>
                    <span>CLR: {tagColor}</span>
                    <span>HSN: {tagHsn}</span>
                  </div>

                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-[9px] text-slate-400 font-sans">Price (Incl. All Taxes)</span>
                    <span className="text-sm font-black text-slate-950 font-mono">₹{tagPrice.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                /* Jewelry / Barbell Dumbbell Tag */
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-0 bg-white border border-slate-300 rounded shadow-md p-1.5 text-[9px] font-mono">
                    <div className="w-24 text-center border-r border-slate-200 pr-1.5">
                      <div className="font-bold truncate">{tagStoreName}</div>
                      <div className="truncate">{tagItemName}</div>
                      <div className="text-[8px] text-slate-500">{tagSku}</div>
                    </div>
                    <div className="w-8 h-1 bg-slate-300 mx-1"></div>
                    <div className="w-24 text-center border-l border-slate-200 pl-1.5">
                      <div className="font-black text-xs">₹{tagPrice}</div>
                      <div className="text-[8px]">SIZE: {tagSize}</div>
                      <div className="text-[8px] text-slate-400">NET WT / HSN</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('tags')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Open Full Tag Generator</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SANDBOX B: THE "MASTERJI" ALTERATIONS WORKFLOW */}
      <section id="alterations-studio" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase font-mono">
              In-House Tailoring Workflow
            </span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">
              The "Masterji" Alterations Command Center
            </h2>
            <p className="text-sm text-slate-600">
              Never let customer garments get lost in the alteration room. Tag items directly during sale, assign Masterji deadlines, and send automated WhatsApp trial alerts.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-950 rounded-3xl border border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 text-white grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Controls */}
            <div className="md:col-span-6 space-y-4">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Customer Name & Phone:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={altCustomerName}
                      onChange={(e) => setAltCustomerName(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Garment & Alteration Job:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={altGarment}
                      onChange={(e) => setAltGarment(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                    <select
                      value={altType}
                      onChange={(e) => setAltType(e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs cursor-pointer"
                    >
                      <option value="Length Hem (-2.5 inches)">Length Hem (-2.5")</option>
                      <option value="Waist Tuck (-1.5 inches)">Waist Tuck (-1.5")</option>
                      <option value="Sleeve Shortening (-1 inch)">Sleeve Shortening</option>
                      <option value="Chest Dart Adjustment">Chest Dart Adjustment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Assign Masterji:</label>
                    <select
                      value={altMasterji}
                      onChange={(e) => setAltMasterji(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs cursor-pointer"
                    >
                      <option value="Master Ramesh">Master Ramesh</option>
                      <option value="Master Iqbal">Master Iqbal</option>
                      <option value="Master Suresh">Master Suresh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Promised Date:</label>
                    <input
                      type="text"
                      value={altPromiseDate}
                      onChange={(e) => setAltPromiseDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold block mb-2">Simulate Workshop Status:</span>
                <div className="flex gap-2">
                  {[
                    { step: 1, label: 'Tagged' },
                    { step: 2, label: 'In Tailoring' },
                    { step: 3, label: 'Ready for Trial' },
                  ].map((s) => (
                    <button
                      key={s.step}
                      onClick={() => setAltStatusStep(s.step as any)}
                      className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        altStatusStep === s.step
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp Alert Live Preview */}
            <div className="md:col-span-6 bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>WhatsApp Pickup Reminder Preview</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">1-Click Dispatch</span>
              </div>

              <div className="bg-[#0b141a] p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 space-y-1.5 leading-relaxed">
                <div className="font-bold text-emerald-400">Lakshmi Garments · Alteration Update</div>
                <div>Dear {altCustomerName},</div>
                <div className="text-slate-300">
                  Your garment (<strong>{altGarment}</strong>) has been updated:
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px] space-y-0.5">
                  <div>Slip: <strong className="text-amber-300">#ALT-108</strong></div>
                  <div>Job: <strong>{altType}</strong></div>
                  <div>Tailor: {altMasterji}</div>
                  <div>Trial Ready: <strong className="text-emerald-300">{altPromiseDate}</strong></div>
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  Please bring your slip or share your mobile number ({altPhone}) at Trial Room 2.
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('alterations')}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Alterations Manager</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SANDBOX C: DYNAMIC SPLIT TENDER & UPI QR PLAYGROUND */}
      <section id="split-tender-studio" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-teal-700 tracking-wider uppercase font-mono">
              Fast Payment Settlement
            </span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">
              Dynamic Split Tender & UPI QR Playground
            </h2>
            <p className="text-sm text-slate-600">
              Indian shoppers frequently split large garment purchases across cash and UPI. See how GarmentOS generates dynamic on-screen QR codes in real-time.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Split Controls */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700">Test Bill Amount:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-400">₹</span>
                    <input
                      type="number"
                      value={splitBillTotal}
                      onChange={(e) => setSplitBillTotal(Math.max(100, parseInt(e.target.value) || 0))}
                      className="w-28 px-2 py-1 text-right font-mono font-bold text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Split Proportion:</span>
                    <span>{splitCashRatio}% Cash · {100 - splitCashRatio}% UPI QR</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={splitCashRatio}
                    onChange={(e) => setSplitCashRatio(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Cash Tendered</span>
                    <span className="font-mono font-black text-lg text-slate-900">₹{splitCashAmount}</span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block">UPI QR Amount</span>
                    <span className="font-mono font-black text-lg text-indigo-700">₹{splitUpiAmount}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSplitCashRatio(50)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Quick 50-50 Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitCashRatio(0)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    100% UPI QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitCashRatio(100)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    100% Cash
                  </button>
                </div>
              </div>
            </div>

            {/* Live QR Output */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 text-white text-center space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Customer Facing Dynamic QR
              </span>

              {splitUpiAmount > 0 ? (
                <div className="bg-white p-2.5 rounded-xl shadow-lg">
                  <UpiPaymentQr
                    upiId="lakshmigarments@upi"
                    payeeName="Lakshmi Garments Retail"
                    amount={splitUpiAmount}
                    transactionNote="POS Split Bill"
                    size={130}
                    className="text-slate-900"
                  />
                </div>
              ) : (
                <div className="w-36 h-36 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-xs text-slate-500">
                  Cash Only Selected
                </div>
              )}

              <div className="text-xs">
                <div className="font-mono font-bold text-emerald-400 text-sm">
                  {splitUpiAmount > 0 ? `Scan to Pay ₹${splitUpiAmount}` : 'Paid via Cash Drawer'}
                </div>
                <div className="text-[10px] text-slate-400">Any UPI App (GPay, PhonePe, Paytm, BHIM)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE HARDWARE COMPATIBILITY CHECKER */}
      <section id="hardware-checker" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase font-mono">
              Zero Hardware Lock-In
            </span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">
              Hardware Compatibility Checker
            </h2>
            <p className="text-sm text-slate-600">
              Check if your existing thermal printer, barcode label maker, or handheld scanner works with GarmentOS. No expensive proprietary hardware required.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={hardwareQuery}
                onChange={(e) => setHardwareQuery(e.target.value)}
                placeholder="Search printer or scanner model (e.g. TVS, Epson, Posiflex, TSC, Zebra, Honeywell)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Hardware List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100 text-xs">
              {filteredHardware.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.type}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
              <span>Have a different printer model? Standard ESC/POS thermal commands are supported out of the box.</span>
              <button
                type="button"
                onClick={() => onNavigateToPOS?.()}
                className="font-bold underline text-indigo-700 hover:text-indigo-950 cursor-pointer shrink-0 ml-2"
              >
                Test Printer Setup
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE STORE FIT ASSESSMENT QUIZ */}
      <section id="store-quiz" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase font-mono">
              30-Second Recommendation
            </span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">
              Find Your Store's Ideal POS Setup
            </h2>
            <p className="text-sm text-slate-600">
              Answer 3 quick questions about your apparel operation to get an instant tailored workflow recommendation.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
            {/* Question 1: Store Type */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                1. What kind of retail clothing business do you run?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'boutique', label: 'Single Boutique' },
                  { id: 'multibranch', label: 'Multi-Branch Stores' },
                  { id: 'designer', label: 'Custom Designer Studio' },
                  { id: 'wholesaler', label: 'Apparel Wholesaler' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setQuizStoreType(opt.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      quizStoreType === opt.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: In-House Alterations */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                2. Do you provide pant hemming, waist tucks, or in-store tailoring?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'yes', label: 'Yes, we alter garments for customers daily' },
                  { id: 'no', label: 'No, we sell 100% ready-to-wear items' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setQuizTailoring(opt.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      quizTailoring === opt.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Result Box */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-950 text-sm">
                  Recommended Setup:{' '}
                  {quizStoreType === 'multibranch'
                    ? 'GarmentOS Multi-Branch Enterprise'
                    : quizStoreType === 'designer'
                    ? 'GarmentOS Designer Studio & Fit Suite'
                    : 'GarmentOS Boutique Standard Pro'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Includes automated 5% vs 12% Indian Garment GST,{' '}
                {quizTailoring === 'yes' ? 'Masterji alteration tracking slips, ' : ''}
                {quizStoreType === 'multibranch' ? 'Multi-branch Stock Transfer Orders (STO), ' : ''}
                and 1-click store credit notes.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateToPOS?.()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Launch Configured Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. REGIONAL RETAILER CASE STUDIES */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase font-mono">
              Proven Across India
            </span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">
              Trusted by 1,200+ Indian Garment Stores
            </h2>
            <p className="text-sm text-slate-600">
              Read how boutique owners and multi-branch retail directors simplified their sales counters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-1 text-amber-500">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "During festive season, we alter over 80 lehengas and sarees a day. Before GarmentOS, paper slips were constantly misplaced. Now every garment has a tagged Masterji slip with promised delivery time."
              </p>
              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-900 text-xs">Rajesh Mehra</div>
                <div className="text-[11px] text-slate-500">Chandni Chowk Ethnic Wear, Delhi</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-1 text-amber-500">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "Our cashiers used to get confused calculating 5% vs 12% GST manually for kurtis and shirts. GarmentOS automated the slab logic completely and saved us countless audit headaches."
              </p>
              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-900 text-xs">Kavitha Sundaram</div>
                <div className="text-[11px] text-slate-500">Commercial Street Menswear, Bengaluru</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-1 text-amber-500">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "The family sizing matrix in CRM is brilliant. When a husband visits to buy an anniversary saree or festive gift, we pull up his wife’s blouse size and preferences in 5 seconds."
              </p>
              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-900 text-xs">Ananya Deshmukh</div>
                <div className="text-[11px] text-slate-500">Bandra Designer Studio, Mumbai</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. PERSISTENT MOBILE ACTION DOCK (MOBILE SCREENS ONLY) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <GarmentOsLogo size="xs" variant="icon" />
          <span className="font-bold text-slate-900 text-xs">GarmentOS POS</span>
        </div>
        <button
          onClick={() => onNavigateToPOS?.()}
          className="px-4 py-2 rounded-xl bg-slate-950 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
          <span>Launch POS (F2)</span>
        </button>
      </div>

      {/* 11. FOOTER */}
      <footer className="bg-slate-950 text-white pt-16 pb-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/60 rounded-3xl p-8 sm:p-12 border border-indigo-800/40 text-center space-y-5 mb-14">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
              Ready to Upgrade Your Retail Counter?
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white max-w-2xl mx-auto">
              Run your apparel boutique with the precision it deserves.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Zero complicated installations. Zero hardware lock-in. Open the POS workspace right now and experience lightning-fast billing.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigateToPOS?.()}
                className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm transition-all shadow-lg cursor-pointer inline-flex items-center gap-2 group"
              >
                <span>Launch GarmentOS Counter Now</span>
                <ArrowRight className="w-4 h-4 text-indigo-600 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-900 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <GarmentOsLogo size="xs" variant="icon" />
              <span className="font-bold text-slate-400">GarmentOS</span>
              <span>· Specialized Retail POS for Indian Garment Stores</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <button onClick={() => onNavigateToPOS?.()} className="hover:text-white cursor-pointer">
                POS Billing
              </button>
              <button onClick={() => onNavigateToTab?.('inventory')} className="hover:text-white cursor-pointer">
                Inventory
              </button>
              <button onClick={() => onNavigateToTab?.('alterations')} className="hover:text-white cursor-pointer">
                Alterations
              </button>
              <button onClick={() => onNavigateToTab?.('tags')} className="hover:text-white cursor-pointer">
                Price Tags
              </button>
              <button onClick={() => onNavigateToTab?.('crm')} className="hover:text-white cursor-pointer">
                CRM
              </button>
            </div>
            <div>
              <span>© {new Date().getFullYear()} GarmentOS. Crafted with care for Indian Retailers.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
