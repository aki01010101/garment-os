import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, FamilyMember } from '../../types';
import { isUpcomingMilestone, normalizePhone } from '../../utils/crmUtils';
import {
  Cake,
  Heart,
  Calendar,
  Share2,
  Sparkles,
  Search,
  Tag,
  Gift,
  CheckCircle2,
  Copy,
  Clock,
  User,
  Users,
  Send,
  PartyPopper,
} from 'lucide-react';

interface CelebrationEvent {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  beneficiaryName: string;
  relationship: string;
  eventType: 'birthday' | 'anniversary';
  dateString: string;
  daysRemaining: number;
  generatedCoupon: string;
}

export const CelebrationsManager: React.FC = () => {
  const { customers, activeCompany } = useApp();

  const [timeframe, setTimeframe] = useState<7 | 15 | 30>(7);
  const [filterType, setFilterType] = useState<'all' | 'birthday' | 'anniversary'>('all');
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Scan all customers and linked family members
  const upcomingEvents: CelebrationEvent[] = useMemo(() => {
    const list: CelebrationEvent[] = [];
    const now = new Date();

    customers.forEach((c) => {
      // 1. Primary customer birthday
      if (c.profile?.birthday) {
        const bday = new Date(c.profile.birthday);
        const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
        if (thisYearBday < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          thisYearBday.setFullYear(now.getFullYear() + 1);
        }
        const diffDays = Math.ceil((thisYearBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= timeframe) {
          const initials = c.name.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase();
          list.push({
            id: `bday_${c.id}_primary`,
            customerId: c.id,
            customerName: c.name,
            customerPhone: c.phone,
            beneficiaryName: c.name,
            relationship: 'Self',
            eventType: 'birthday',
            dateString: c.profile.birthday,
            daysRemaining: diffDays,
            generatedCoupon: `BDAY-${initials}-${discountPercent}`,
          });
        }
      }

      // 2. Primary customer anniversary
      if (c.profile?.anniversary) {
        const anniv = new Date(c.profile.anniversary);
        const thisYearAnniv = new Date(now.getFullYear(), anniv.getMonth(), anniv.getDate());
        if (thisYearAnniv < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          thisYearAnniv.setFullYear(now.getFullYear() + 1);
        }
        const diffDays = Math.ceil((thisYearAnniv.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= timeframe) {
          const initials = c.name.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase();
          list.push({
            id: `anniv_${c.id}_primary`,
            customerId: c.id,
            customerName: c.name,
            customerPhone: c.phone,
            beneficiaryName: c.name,
            relationship: 'Self & Spouse',
            eventType: 'anniversary',
            dateString: c.profile.anniversary,
            daysRemaining: diffDays,
            generatedCoupon: `ANNIV-${initials}-${discountPercent}`,
          });
        }
      }

      // 3. Family members celebrations
      if (c.profile?.familyMembers) {
        c.profile.familyMembers.forEach((member, mIdx) => {
          if (member.birthday) {
            const bday = new Date(member.birthday);
            const thisYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
            if (thisYearBday < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
              thisYearBday.setFullYear(now.getFullYear() + 1);
            }
            const diffDays = Math.ceil((thisYearBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= timeframe) {
              const initials = member.name.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase();
              list.push({
                id: `bday_${c.id}_m_${mIdx}`,
                customerId: c.id,
                customerName: c.name,
                customerPhone: c.phone,
                beneficiaryName: member.name,
                relationship: member.relation || 'Family Member',
                eventType: 'birthday',
                dateString: member.birthday,
                daysRemaining: diffDays,
                generatedCoupon: `BDAY-${initials}-${discountPercent}`,
              });
            }
          }

          if (member.anniversary) {
            const anniv = new Date(member.anniversary);
            const thisYearAnniv = new Date(now.getFullYear(), anniv.getMonth(), anniv.getDate());
            if (thisYearAnniv < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
              thisYearAnniv.setFullYear(now.getFullYear() + 1);
            }
            const diffDays = Math.ceil((thisYearAnniv.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= timeframe) {
              const initials = member.name.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase();
              list.push({
                id: `anniv_${c.id}_m_${mIdx}`,
                customerId: c.id,
                customerName: c.name,
                customerPhone: c.phone,
                beneficiaryName: member.name,
                relationship: member.relation || 'Family Member',
                eventType: 'anniversary',
                dateString: member.anniversary,
                daysRemaining: diffDays,
                generatedCoupon: `ANNIV-${initials}-${discountPercent}`,
              });
            }
          }
        });
      }
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [customers, timeframe, discountPercent]);

  // Filtered
  const filteredEvents = useMemo(() => {
    return upcomingEvents.filter((ev) => {
      const matchType = filterType === 'all' || ev.eventType === filterType;
      const matchQuery =
        ev.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.customerPhone.includes(searchQuery);
      return matchType && matchQuery;
    });
  }, [upcomingEvents, filterType, searchQuery]);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const handleSendWhatsApp = (ev: CelebrationEvent) => {
    const cleanPhone = normalizePhone(ev.customerPhone);
    const store = activeCompany?.name || 'Fantasy Outfits';
    const isSelf = ev.beneficiaryName === ev.customerName;

    let greeting = '';
    if (ev.eventType === 'birthday') {
      greeting = isSelf
        ? `🎂 *HAPPY BIRTHDAY DEAR ${ev.customerName.toUpperCase()}!* 🎂\n\nWarmest wishes from everyone at *${store}*! May your year ahead be blessed with style, happiness, and joy.`
        : `🎂 *CELEBRATING ${ev.beneficiaryName.toUpperCase()}'S BIRTHDAY!* 🎂\n\nDear ${ev.customerName},\nWe noticed ${ev.beneficiaryName} (${ev.relationship}) has a birthday coming up! Warm wishes from all of us at *${store}*.`;
    } else {
      greeting = isSelf
        ? `💍 *HAPPY WEDDING ANNIVERSARY!* 🥂\n\nDear ${ev.customerName},\nHeartiest congratulations on your anniversary from everyone at *${store}*! Wishing you and your family endless happiness.`
        : `💍 *HAPPY ANNIVERSARY!* 🥂\n\nDear ${ev.customerName},\nWishing ${ev.beneficiaryName} (${ev.relationship}) a wonderful anniversary celebration from *${store}*!`;
    }

    const offer =
      `\n\n🎁 *YOUR CELEBRATION PRIVILEGE:* Enjoy an exclusive *${discountPercent}% OFF* on all festive outfits, suits, and kurtis this week!\n` +
      `🔑 *Coupon Code: ${ev.generatedCoupon}*\n` +
      `📅 *Valid for the next 7 days*\n\n` +
      `Visit us in-store to celebrate. We look forward to dressing you! ✨\n` +
      `📍 ${activeCompany?.address || 'Our Boutique'}`;

    const fullMessage = greeting + offer;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(fullMessage)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner">
            <Cake className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              Automated Birthday & Anniversary Campaigns
              <span className="text-[10px] bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full font-semibold">
                {upcomingEvents.length} Celebrating Soon
              </span>
            </h3>
            <p className="text-xs text-rose-100">
              Drive emotional loyalty with personalized celebratory WhatsApp greetings and dynamic single-use discount coupon codes.
            </p>
          </div>
        </div>

        {/* Discount Selector */}
        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 shrink-0 text-xs">
          <span className="font-semibold text-rose-100">Coupon Discount:</span>
          <select
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
            className="bg-white text-slate-900 font-bold px-2 py-1 rounded-lg text-xs"
          >
            <option value={10}>10% OFF</option>
            <option value={15}>15% OFF</option>
            <option value={20}>20% OFF</option>
            <option value={25}>25% OFF</option>
          </select>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setTimeframe(7)}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                timeframe === 7 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Next 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe(15)}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                timeframe === 15 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Next 15 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe(30)}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                timeframe === 30 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              This Month (30d)
            </button>
          </div>

          {/* Event type filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All Events ({upcomingEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('birthday')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors flex items-center gap-1 ${
                filterType === 'birthday' ? 'bg-white text-pink-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Cake className="w-3 h-3 text-pink-500" />
              <span>Birthdays</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('anniversary')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors flex items-center gap-1 ${
                filterType === 'anniversary' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Heart className="w-3 h-3 text-purple-500" />
              <span>Anniversaries</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Celebrations Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 space-y-2">
          <PartyPopper className="w-10 h-10 mx-auto text-slate-400 opacity-60" />
          <p className="font-semibold text-sm text-slate-700">No Celebrations in This Timeframe</p>
          <p className="text-xs text-slate-400">
            Expand the filter to "This Month (30d)" or add family birthdays in customer profiles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className={`p-4 rounded-xl border bg-white shadow-2xs transition-all space-y-3 relative ${
                ev.daysRemaining <= 2
                  ? 'border-pink-300 ring-1 ring-pink-400/40 bg-gradient-to-b from-pink-50/30 to-white'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      ev.eventType === 'birthday'
                        ? 'bg-pink-100 text-pink-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {ev.eventType === 'birthday' ? (
                      <Cake className="w-4 h-4" />
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{ev.beneficiaryName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({ev.relationship})
                      </span>
                    </h4>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{ev.customerName}</span>
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    ev.daysRemaining === 0
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : ev.daysRemaining <= 2
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ev.daysRemaining === 0
                    ? 'Today!'
                    : ev.daysRemaining === 1
                    ? 'Tomorrow'
                    : `In ${ev.daysRemaining} days`}
                </span>
              </div>

              {/* Generated Single-Use Coupon Chip */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    Personalized {discountPercent}% Coupon:
                  </span>
                  <strong className="font-mono text-indigo-700 font-bold tracking-wider">
                    {ev.generatedCoupon}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(ev.generatedCoupon)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCoupon === ev.generatedCoupon ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{copiedCoupon === ev.generatedCoupon ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Action: 1-Tap WhatsApp */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {ev.customerPhone}
                </span>
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(ev)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
