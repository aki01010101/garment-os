import React, { useState, useMemo } from 'react';
import { GarmentOsLogo } from '../common/GarmentOsLogo';
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
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToPOS?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToPOS,
  onNavigateToTab,
}) => {
  // Interactive Simulator States
  const [demoPrice, setDemoPrice] = useState<number>(1499);
  const [demoIsInclusive, setDemoIsInclusive] = useState<boolean>(true);
  const [activeTabFeature, setActiveTabFeature] = useState<'pos' | 'alterations' | 'tags' | 'credit' | 'crm' | 'dayreg'>('pos');
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

  // ROI Calculator formula
  const roiCalculations = useMemo(() => {
    const monthlyBills = footfallPerDay * 30;
    // Assume 45 seconds saved per checkout with barcode + smart GST + UPI QR
    const secondsSaved = monthlyBills * 45;
    const hoursSaved = Math.round((secondsSaved / 3600) * 10) / 10;
    // Assume 1.8% leakage prevented from alteration loss, incorrect GST calculations, and untracked return fraud
    const monthlyTurnover = monthlyBills * avgTicketSize;
    const revenueProtected = Math.round((monthlyTurnover * 0.018) / 100) * 100;
    return {
      monthlyBills,
      hoursSaved,
      revenueProtected,
    };
  }, [footfallPerDay, avgTicketSize]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Top Banner: Subtle Announcement Bar */}
      <div className="bg-slate-950 text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
              NEW RELEASE
            </span>
            <span className="text-slate-300 font-medium">
              GarmentOS v2.4: Instant Store Credit Notes, Alteration SMS Alerts & Dynamic GST Engine live!
            </span>
          </div>
          <button
            onClick={() => onNavigateToPOS?.()}
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors cursor-pointer group"
          >
            <span>Launch POS Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Main Landing Header */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
                  Operating System for Apparel Boutiques
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-950 transition-colors">Features</a>
            <a href="#gst-engine" className="hover:text-slate-950 transition-colors">Garment GST</a>
            <a href="#alterations" className="hover:text-slate-950 transition-colors">Alterations</a>
            <a href="#hangtags" className="hover:text-slate-950 transition-colors">Hangtags</a>
            <a href="#calculator" className="hover:text-slate-950 transition-colors">ROI Calculator</a>
            <a href="#comparison" className="hover:text-slate-950 transition-colors">Why GarmentOS</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToPOS?.()}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer group"
            >
              <span>Open POS Counter</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
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
              Generic POS software fails fashion retailers. GarmentOS unifies dynamic Indian Garment GST slabs (5% vs 12%), in-house tailoring & alteration tracking, thermal barcode hangtags, and 1-click store credit notes into one blisteringly fast interface.
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
                className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs sm:text-sm font-bold border border-slate-200 transition-all flex items-center gap-2"
              >
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>Try Live Simulator</span>
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

          {/* Interactive Live Hero Simulation Card */}
          <div id="interactive-demo" className="mt-14 max-w-5xl mx-auto">
            <div className="bg-slate-950 rounded-2xl p-2 sm:p-3 shadow-2xl border border-slate-800">
              {/* Window Controls */}
              <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 ml-2 hidden sm:inline">
                    GarmentOS POS Counter · Live Indian GST & Alteration Simulator
                  </span>
                </div>
                <div className="flex items-center gap-2">
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
                          onClick={() => setDemoPrice(item.price)}
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
                          onChange={(e) => setDemoPrice(Math.max(1, parseInt(e.target.value) || 0))}
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
                        onClick={() => setDemoIsInclusive(!demoIsInclusive)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer border ${
                          demoIsInclusive
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        }`}
                      >
                        {demoIsInclusive ? 'Tax Included in MRP' : 'Tax Added Separately'}
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-3 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Garment Tag MRP:</span>
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

      {/* 2. THE 6 DOMAIN PILLARS (BENTO GRID) */}
      <section id="features" className="py-20 bg-slate-50/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase font-mono">
              Designed For Apparel Reality
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Everything your garment store needs. Zero fluff.
            </h2>
            <p className="text-sm text-slate-600">
              Unlike generic grocery or restaurant point-of-sale software, every single pixel of GarmentOS is crafted to address retail clothing challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Dynamic Garment GST */}
            <div id="gst-engine" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Dynamic Indian Garment GST</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Automatic slab switching under Indian tax law: <strong>5% GST</strong> for net MRP ≤ ₹1,000 and <strong>12% GST</strong> for &gt; ₹1,000. Switch instantly between Tax-Inclusive MRP and Tax-Exclusive billing per transaction.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-mono text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>≤ ₹1,000:</span>
                  <span className="font-bold text-emerald-700">5% (2.5% CGST + 2.5% SGST)</span>
                </div>
                <div className="flex justify-between">
                  <span>&gt; ₹1,000:</span>
                  <span className="font-bold text-indigo-700">12% (6% CGST + 6% SGST)</span>
                </div>
              </div>
            </div>

            {/* Card 2: Alterations & Tailoring Studio */}
            <div id="alterations" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <Scissors className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">In-Store Tailoring & Alterations</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tag alterations per garment right at checkout: pant hem, waist tuck, sleeve shortening. Assign to Masterji, track turnaround deadlines, print tailor slips, and send 1-click WhatsApp pickup reminders.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                <span className="font-semibold">Tailor Status Board:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                  Ready for Trial
                </span>
              </div>
            </div>

            {/* Card 3: Thermal Barcode Hangtags */}
            <div id="hangtags" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Tag className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Thermal Hangtags & Jewelry Barbell Tags</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Generate standard 50x25mm garment hangtags and jewelry dumbbell/barbell labels directly from the browser. Supports Code128 barcodes, size, color, HSN, MRP, and garment wash care symbols with 0 third-party software.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-mono text-slate-600 flex items-center justify-between">
                <span>Print Ready:</span>
                <span className="font-bold text-slate-800">50x25mm & Jewelry Barbell</span>
              </div>
            </div>

            {/* Card 4: Store Credit Notes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Returns & 1-Click Store Credit Notes</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Never lose track of paper credit vouchers again. When customers return or exchange items, generate verified Credit Notes (e.g. <code>CN-1042</code>). Active notes automatically surface in the POS for 1-click redemption.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                <span>POS Auto-Detection:</span>
                <span className="font-bold text-emerald-700 font-mono">1-Click Redeem</span>
              </div>
            </div>

            {/* Card 5: Customer CRM & Family Sizing */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Family Sizing Matrix & VIP CRM</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Clothing retail is personal. Store customer fit preferences (Shirt Size: 40, Trouser: 34) plus linked family member sizes (spouse, kids) for instant gifting recommendations and VIP spend tiering.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Fit Matrix:</span>
                <span className="font-bold text-indigo-700 font-sans">Family Sizing Profiles</span>
              </div>
            </div>

            {/* Card 6: High-Velocity Checkout & UPI */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Multi-Cart Parking & Indian Split Pay</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Shopper went to try another outfit? Press <strong>F6</strong> to park the cart with a ticket name. Handle 50-50 Split payments (Cash + UPI / Card) and display dynamic UPI QR codes directly to customers.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-mono text-slate-600 flex items-center justify-between">
                <span>Tender Modes:</span>
                <span className="font-bold text-slate-800">Cash · UPI QR · Split · Card</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE ROI & COUNTER SPEED CALCULATOR */}
      <section id="calculator" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto bg-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-slate-800">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
                Store Productivity Calculator
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Calculate your store’s monthly time & revenue savings
              </h2>
              <p className="text-xs text-slate-400">
                Adjust your daily store footfall and ticket size to see the impact of GarmentOS at your counter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-6 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-300">Daily Customer Footfall (Bills/Day):</span>
                    <span className="font-mono text-indigo-400 text-sm">{footfallPerDay} bills</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="300"
                    step="5"
                    value={footfallPerDay}
                    onChange={(e) => setFootfallPerDay(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>15 boutique</span>
                    <span>150 high-street</span>
                    <span>300+ mega-store</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-300">Average Garment Bill Value:</span>
                    <span className="font-mono text-emerald-400 text-sm">₹{avgTicketSize.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="15000"
                    step="250"
                    value={avgTicketSize}
                    onChange={(e) => setAvgTicketSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>₹500 dailywear</span>
                    <span>₹4,000 designer</span>
                    <span>₹15,000+ bridal</span>
                  </div>
                </div>
              </div>

              {/* Calculated Results */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Monthly Counter Time Reclaimed:</div>
                  <div className="text-3xl font-black text-indigo-400 font-mono mt-1">
                    ~{roiCalculations.hoursSaved} hours / mo
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Saved from faster barcode scanning, F-keys, and instant UPI QR generation.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Revenue Protected from Tax & Return Leaks:</div>
                  <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                    ₹{roiCalculations.revenueProtected.toLocaleString('en-IN')} / mo
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Prevented via strict GST slab audits, digital credit note tracking, and alteration status cards.
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToPOS?.()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <span>Start Benefiting Today — Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPARISON MATRIX: Generic POS vs GarmentOS */}
      <section id="comparison" className="py-20 bg-slate-50/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase font-mono">
              The Apparel POS Gap
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Why generic retail POS fails clothing stores
            </h2>
            <p className="text-sm text-slate-600">
              Generic software built for grocery stores and supermarkets ignores the real complexity of sizes, alterations, garment GST, and store credit notes.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="py-3.5 px-4 font-bold">Apparel Retail Requirement</th>
                    <th className="py-3.5 px-4 font-bold text-slate-500 w-1/3">Standard / Generic POS</th>
                    <th className="py-3.5 px-4 font-bold text-indigo-700 w-1/3 bg-indigo-50/50">GarmentOS Solution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Dynamic Indian Garment GST
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      ❌ Flat tax rate only; cashier must manually compute 5% vs 12%
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 bg-indigo-50/30">
                      ✅ Built-in automatic 5% (≤₹1000) & 12% (&gt;₹1000) rules
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      In-House Tailoring & Alteration Tracker
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      ❌ Not supported; tracked on paper slips or unlinked WhatsApp
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 bg-indigo-50/30">
                      ✅ Native item-level alteration slips with Masterji assignment & dates
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Thermal Garment Hangtags (50x25mm)
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      ❌ Requires separate Bartender license or complex Excel macros
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 bg-indigo-50/30">
                      ✅ 1-click thermal barcode & jewelry barbell tag generator
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Fitting Room Cart Hold (Multi-Ticket)
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      ❌ Single cart; counter locks while customer tries next size
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 bg-indigo-50/30">
                      ✅ F6 Multi-Cart Parking with custom ticket labels & instant recall
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Customer Family Sizing Profiles
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      ❌ Stores mobile number and name only
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 bg-indigo-50/30">
                      ✅ Stores shirt size, waist, fit preference, and spouse/kids sizing
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Returns & Store Credit Notes
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      ❌ Paper slips that get lost, damaged, or forged
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 bg-indigo-50/30">
                      ✅ Digital CN codes with remaining balance & 1-click POS redemption
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Offline Resilience & Cloud Sync
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      ❌ Crashes or halts checkout when shop internet fluctuates
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 bg-indigo-50/30">
                      ✅ 100% offline-first local cache + seamless Supabase cloud sync
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ARCHITECTURE & SECURITY */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-950">Role-Based Counter Security</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure role access for Cashier, Store Manager, and Admin. Protect sensitive P&L reports, vendor cost ledgers, and gross margins from the sales counter.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-950">Universal Thermal Printer Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect any 80mm or 58mm thermal receipt printer (TVS, Epson, Posiflex, NGX) with native ESC/POS thermal layout and instant digital E-Receipt QR codes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-950">Multi-Entity & Multi-Branch Ready</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Switch between Billed GST Entities and Retail Cash Memo branches in 1 click. Transfer inventory between sister stores with full stock transfer order (STO) tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION & FOOTER */}
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
