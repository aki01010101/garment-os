import React, { useState } from 'react';
import { Award, Check, Gift, Sparkles, Star, Info, Phone, MapPin, Share2 } from 'lucide-react';
import { LoyaltyStampCardConfig } from '../../types';
import { DEFAULT_STAMP_CARD_CONFIG } from '../../data/seedData';

export interface LoyaltyStampCardProps {
  customerName?: string;
  customerPhone?: string;
  stamps?: number; // 0 to 10
  cyclesCompleted?: number;
  stampsEarnedThisSale?: number;
  config?: LoyaltyStampCardConfig;
  variant?: 'card' | 'compact' | 'thermal';
  interactive?: boolean;
  onStampClick?: (stampNumber: number) => void;
  showTermsInitially?: boolean;
  className?: string;
}

export const LoyaltyStampCard: React.FC<LoyaltyStampCardProps> = ({
  customerName,
  customerPhone,
  stamps = 0,
  cyclesCompleted = 0,
  stampsEarnedThisSale = 0,
  config = DEFAULT_STAMP_CARD_CONFIG,
  variant = 'card',
  interactive = false,
  onStampClick,
  showTermsInitially = false,
  className = '',
}) => {
  const [showBackTerms, setShowBackTerms] = useState(showTermsInitially);
  const totalStamps = config.totalStamps || 10;
  const currentStamps = Math.min(totalStamps, Math.max(0, stamps));

  // Determine rewards
  const has5thGift = currentStamps >= 5;
  const has10thGift = currentStamps >= 10;

  // Render individual stamp circle
  const renderCircle = (num: number, isMilestone: boolean, milestoneLabel: string, milestonePerk: string) => {
    const isStamped = num <= currentStamps;
    const isNewlyEarned = stampsEarnedThisSale > 0 && num > currentStamps - stampsEarnedThisSale && num <= currentStamps;

    if (variant === 'thermal') {
      return (
        <div
          key={num}
          className={`flex flex-col items-center justify-center p-1 rounded-full border text-center transition-all ${
            isStamped
              ? 'border-black bg-black text-white'
              : isMilestone
              ? 'border-black border-dashed bg-neutral-100 text-black'
              : 'border-neutral-400 bg-white text-neutral-500'
          }`}
          style={{ width: '38px', height: '38px' }}
        >
          {isStamped ? (
            <div className="flex flex-col items-center leading-none">
              <span className="text-[10px] font-black">✓</span>
              <span className="text-[8px] font-bold">#{num}</span>
            </div>
          ) : isMilestone ? (
            <div className="flex flex-col items-center leading-none">
              <span className="text-[8px] font-black uppercase">{num === 5 ? 'GIFT' : 'TOP'}</span>
              <span className="text-[7px]">#{num}</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono font-bold text-neutral-400">{num}</span>
          )}
        </div>
      );
    }

    if (variant === 'compact') {
      return (
        <button
          key={num}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onStampClick && onStampClick(num)}
          className={`relative flex flex-col items-center justify-center rounded-full transition-all duration-200 select-none ${
            interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
          } ${
            isStamped
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
              : isMilestone
              ? 'bg-amber-50 border-2 border-dashed border-amber-400 text-amber-800'
              : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-blue-300'
          }`}
          style={{ width: '36px', height: '36px' }}
          title={isMilestone ? `${milestoneLabel}: ${milestonePerk}` : `Visit Stamp #${num}`}
        >
          {isStamped ? (
            <div className="flex flex-col items-center leading-none">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span className="text-[8px] font-extrabold mt-0.5">{num}</span>
            </div>
          ) : isMilestone ? (
            <div className="flex flex-col items-center leading-tight">
              <Gift className="w-3 h-3 text-amber-600 animate-bounce" />
              <span className="text-[7px] font-black tracking-tight text-amber-900 leading-none">
                {num === 5 ? 'FREE' : 'GIFT'}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-bold font-mono text-slate-400">{num}</span>
          )}
          {isNewlyEarned && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}
        </button>
      );
    }

    // Default 'card' variant (high-fidelity recreation of physical card)
    return (
      <div
        key={num}
        onClick={() => interactive && onStampClick && onStampClick(num)}
        className={`group relative flex flex-col items-center justify-center rounded-full transition-all duration-200 select-none ${
          interactive ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
        } ${
          isStamped
            ? 'bg-radial from-blue-700 to-blue-900 text-white shadow-md ring-2 ring-blue-400/50'
            : isMilestone
            ? 'bg-blue-50/60 border-2 border-dashed border-blue-400 text-blue-900 shadow-2xs'
            : 'bg-white border-2 border-blue-200/80 text-blue-300 hover:border-blue-400'
        }`}
        style={{ width: '48px', height: '48px' }}
      >
        {isStamped ? (
          <div className="flex flex-col items-center justify-center leading-none text-center">
            <span className="text-[12px] font-black tracking-tighter uppercase text-blue-100 flex items-center gap-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3] text-amber-300" />
            </span>
            <span className="text-[9px] font-black tracking-wider text-blue-200 font-mono mt-0.5">#{num}</span>
          </div>
        ) : isMilestone ? (
          <div className="flex flex-col items-center justify-center text-center p-0.5 leading-none">
            <span
              className="text-[9px] font-extrabold italic text-blue-900 tracking-tight"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Free
            </span>
            <span
              className="text-[8.5px] font-extrabold italic text-blue-800 tracking-tight leading-none"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Gift
            </span>
            <span className="text-[6.5px] font-bold text-amber-700 font-mono mt-0.5">#{num}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className="text-[13px] font-black font-sans text-blue-300/80 group-hover:text-blue-500">
              {num}
            </span>
          </div>
        )}

        {isNewlyEarned && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-1 ring-white"></span>
          </span>
        )}
      </div>
    );
  };

  // 1. THERMAL PRINT RECEIPT VARIANT
  if (variant === 'thermal') {
    return (
      <div className={`receipt-stamp-card border-t border-b border-black py-2 my-1.5 font-mono text-black ${className}`}>
        <div className="text-center font-black text-[10px] tracking-wider uppercase mb-0.5">
          FANTASY CHECK-IN CARD
        </div>
        <div className="text-center text-[7.5px] font-semibold text-neutral-700 uppercase tracking-tight mb-1">
          Earn Points With Every Visit
        </div>

        {customerName && (
          <div className="flex justify-between text-[7.5px] font-bold mb-1">
            <span>Customer: {customerName}</span>
            <span>Balance: {currentStamps}/10</span>
          </div>
        )}

        {/* Row 1: Stamps 1 to 5 */}
        <div className="flex items-center justify-between gap-1 my-1 px-1">
          {[1, 2, 3, 4].map((num) => renderCircle(num, false, '', ''))}
          {renderCircle(5, true, 'Free Gift', config.milestone5GiftText)}
        </div>

        {/* Row 2: Stamps 6 to 10 */}
        <div className="flex items-center justify-between gap-1 my-1 px-1">
          {[6, 7, 8, 9].map((num) => renderCircle(num, false, '', ''))}
          {renderCircle(10, true, 'Free Gift', config.milestone10GiftText)}
        </div>

        <div className="mt-1.5 pt-1 border-t border-dashed border-neutral-400 text-[6.5px] space-y-0.5 leading-tight text-neutral-800">
          <div className="font-bold flex items-center justify-between">
            <span>5th Visit: Small Gift (Rs.200-300 item)</span>
            <span>{has5thGift ? '[ UNLOCKED ]' : '[ Pending ]'}</span>
          </div>
          <div className="font-bold flex items-center justify-between">
            <span>10th Visit: Free Shirt/Top (Rs.400-500 item)</span>
            <span>{has10thGift ? '[ COMPLETED ]' : '[ Pending ]'}</span>
          </div>
          <div className="text-neutral-600 text-[6px]">
            * Min purchase Rs. 1000 per stamp. Bring a friend for +1 stamp!
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPACT POS WIDGET VARIANT
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 border border-blue-200 rounded-xl p-3 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
              F
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>Check-in Stamp Card</span>
                {cyclesCompleted > 0 && (
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                    Cycle #{cyclesCompleted + 1}
                  </span>
                )}
              </h4>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-blue-700 font-mono">
              {currentStamps} / {totalStamps} Stamps
            </span>
          </div>
        </div>

        {/* 2 Rows of 5 Circles */}
        <div className="space-y-1.5 bg-white/80 p-2 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between gap-1">
            {[1, 2, 3, 4].map((num) => renderCircle(num, false, '', ''))}
            {renderCircle(5, true, 'Free Gift', config.milestone5GiftText)}
          </div>
          <div className="flex items-center justify-between gap-1">
            {[6, 7, 8, 9].map((num) => renderCircle(num, false, '', ''))}
            {renderCircle(10, true, 'Free Shirt / Top', config.milestone10GiftText)}
          </div>
        </div>

        {/* Milestone status alerts */}
        <div className="mt-2 text-[10.5px] space-y-1">
          {has10thGift ? (
            <div className="flex items-center justify-between p-1.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>🎉 10th Visit Complete: {config.milestone10GiftText}</span>
              </span>
            </div>
          ) : has5thGift ? (
            <div className="flex items-center justify-between p-1.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-bold">
              <span className="flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <span>🎁 5th Visit Reached: {config.milestone5GiftText}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-slate-500 px-1">
              <span>Next reward at 5th stamp ({5 - currentStamps} to go)</span>
              <span className="font-semibold text-blue-700">Min bill ₹{config.minPurchaseAmount}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. FULL HIGH-FIDELITY RECREATION (Matching Physical Card Photos)
  return (
    <div className={`relative max-w-md mx-auto transition-all ${className}`}>
      {/* Front / Back Toggle Buttons */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {showBackTerms ? 'Card Back (Terms & Details)' : 'Card Front (Stamps Grid)'}
          </span>
          {cyclesCompleted > 0 && (
            <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              Completed: {cyclesCompleted} Card{cyclesCompleted > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowBackTerms(!showBackTerms)}
          className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showBackTerms ? 'Show Front' : 'View Terms & Back'}</span>
        </button>
      </div>

      {/* CARD BODY */}
      <div
        className="w-full bg-white border-2 border-blue-600 rounded-2xl shadow-lg overflow-hidden transition-all text-blue-950 font-sans relative"
        style={{ minHeight: '260px' }}
      >
        {!showBackTerms ? (
          /* ================= FRONT OF CARD ================= */
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
            {/* Header: Since 1991 Fantasy Family Fashion Store + Earn Points */}
            <div className="flex items-start justify-between border-b border-blue-100 pb-2.5">
              <div>
                <div className="text-[9px] font-extrabold tracking-widest text-blue-800 uppercase">
                  SINCE 1991
                </div>
                <div
                  className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight leading-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  Fantasy
                </div>
                <div className="text-[9px] font-black tracking-widest text-blue-950 uppercase mt-0.5">
                  FAMILY FASHION STORE
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] sm:text-xs font-black text-blue-900 uppercase tracking-tight max-w-[130px] leading-tight">
                  EARN POINTS WITH EVERY VISIT
                </div>
                {customerName && (
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    Cardholder: <strong className="text-blue-800">{customerName}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* STAMPS GRID: 10 Circles (2 Rows of 5) */}
            <div className="space-y-3 py-1">
              {/* Row 1: Stamps 1 to 5 */}
              <div className="flex items-center justify-between gap-1 sm:gap-2">
                {[1, 2, 3, 4].map((num) => renderCircle(num, false, '', ''))}
                {renderCircle(5, true, 'Free Gift', config.milestone5GiftText)}
              </div>

              {/* Row 2: Stamps 6 to 10 */}
              <div className="flex items-center justify-between gap-1 sm:gap-2">
                {[6, 7, 8, 9].map((num) => renderCircle(num, false, '', ''))}
                {renderCircle(10, true, 'Free Shirt / Top', config.milestone10GiftText)}
              </div>
            </div>

            {/* Milestone Indicators Under Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-blue-50/70 p-2 rounded-xl border border-blue-100">
              <div className={`p-1.5 rounded-lg border ${has5thGift ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold' : 'bg-white border-blue-200 text-slate-600'}`}>
                <div className="flex items-center gap-1 font-bold text-blue-900">
                  <Gift className="w-3 h-3 text-amber-600" />
                  <span>5th Visit Reward:</span>
                </div>
                <div className="text-[9.5px] mt-0.5">{config.milestone5GiftText}</div>
                <div className="text-[8.5px] mt-0.5 font-bold">
                  {has5thGift ? '✓ UNLOCKED' : `${Math.max(0, 5 - currentStamps)} visits left`}
                </div>
              </div>

              <div className={`p-1.5 rounded-lg border ${has10thGift ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-blue-200 text-slate-600'}`}>
                <div className="flex items-center gap-1 font-bold text-blue-900">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>10th Visit Reward:</span>
                </div>
                <div className="text-[9.5px] mt-0.5">{config.milestone10GiftText}</div>
                <div className="text-[8.5px] mt-0.5 font-bold">
                  {has10thGift ? '🎉 READY TO CLAIM!' : `${Math.max(0, 10 - currentStamps)} visits left`}
                </div>
              </div>
            </div>

            {/* Footer Address & Phone Number (from physical card) */}
            <div className="text-center pt-2 border-t border-blue-100 text-[9px] font-bold text-blue-900 leading-tight">
              <div>Shop no. 23, Kunjpura Rd, near Dr. Monga Hospital, Karnal | +91-9416109928</div>
            </div>
          </div>
        ) : (
          /* ================= BACK OF CARD ================= */
          <div className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3 bg-gradient-to-b from-blue-50/40 to-white">
            <div>
              {/* Header script */}
              <div
                className="text-center text-sm sm:text-base font-bold text-blue-700 italic mb-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                ~ Thank You For Your Purchase ~
              </div>

              {/* Title */}
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wide mb-2">
                Loyalty Card Terms & Conditions-
              </h4>

              {/* Bullet Points directly matching physical card */}
              <ul className="space-y-1.5 text-[10.5px] text-slate-700 font-medium pl-1">
                {config.termsAndConditions.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Row: Signature + Social + Mini Landmark Map */}
            <div className="pt-3 border-t border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9.5px]">
              <div>
                <div className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                  AUTHORISED SIGNATURE
                </div>
                <div className="w-32 border-b border-slate-400 my-1"></div>
                <div className="flex items-center gap-1.5 text-blue-900 font-bold mt-1">
                  <span>f</span>
                  <span>📷</span>
                  <span className="font-mono text-[9px]">Fantasy.FamilyFashionStore</span>
                </div>
              </div>

              {/* Landmark Diagram (reproducing card diagram) */}
              <div className="bg-white p-2 rounded-lg border border-blue-200 text-[8px] text-slate-600 font-mono text-center">
                <div className="text-[7.5px] font-bold text-blue-800">Dyal Singh College</div>
                <div className="text-slate-400">| (Dyal Singh Rd)</div>
                <div className="font-bold text-slate-800 border-t border-b border-dashed border-slate-300 py-0.5 my-0.5">
                  -- Kunjpura Road --
                </div>
                <div className="flex items-center justify-between gap-2 text-[7.5px]">
                  <span className="text-blue-700 font-extrabold">📍 Fantasy</span>
                  <span className="text-rose-600 font-bold">➕ Monga Hospital</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
