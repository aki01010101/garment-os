import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, RFMSegment, WhatsAppCampaignTemplate, CustomerRFMProfile } from '../../types';
import { computeCustomerRFMProfiles, formatWhatsAppCampaignMessage, normalizePhone } from '../../utils/crmUtils';
import {
  Users,
  MessageSquare,
  Sparkles,
  Send,
  Crown,
  Heart,
  AlertTriangle,
  Moon,
  Sprout,
  Tag,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';

export const RFMCampaignsManager: React.FC = () => {
  const { customers, sales, companies, activeCompany, campaignTemplates, saveCampaignTemplate } = useApp();

  const [selectedSegment, setSelectedSegment] = useState<RFMSegment | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    campaignTemplates[0]?.id || 'camp_champions'
  );
  const [selectedCustomerForPreview, setSelectedCustomerForPreview] = useState<CustomerRFMProfile | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Compute RFM Profiles for all customers
  const rfmProfiles = useMemo(() => {
    return computeCustomerRFMProfiles(customers, sales);
  }, [customers, sales]);

  // Segment statistics
  const segmentCounts = useMemo(() => {
    const counts = {
      all: rfmProfiles.length,
      champions: 0,
      loyal: 0,
      at_risk: 0,
      hibernating: 0,
      new_walkins: 0,
    };
    rfmProfiles.forEach((p) => {
      counts[p.segment]++;
    });
    return counts;
  }, [rfmProfiles]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return rfmProfiles.filter((p) => {
      const matchSegment = selectedSegment === 'all' || p.segment === selectedSegment;
      const matchSearch =
        p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery);
      return matchSegment && matchSearch;
    });
  }, [rfmProfiles, selectedSegment, searchQuery]);

  // Currently active campaign template
  const activeTemplate = useMemo(() => {
    return (
      campaignTemplates.find((t) => t.id === selectedTemplateId) ||
      campaignTemplates[0] || {
        id: 'default',
        name: 'Custom Marketing Message',
        targetSegment: 'all',
        messageTemplate: 'Hi {CustomerName}, check out new arrivals at {StoreName}!',
      }
    );
  }, [campaignTemplates, selectedTemplateId]);

  // Target preview customer (either explicitly clicked or first in filtered list)
  const targetPreviewCustomer = selectedCustomerForPreview || filteredCustomers[0] || rfmProfiles[0];

  const renderedPreviewText = useMemo(() => {
    if (!targetPreviewCustomer) return '';
    return formatWhatsAppCampaignMessage(
      activeTemplate.messageTemplate,
      targetPreviewCustomer,
      activeCompany.name,
      activeCompany.address || activeCompany.city,
      activeTemplate.couponCode
    );
  }, [activeTemplate, targetPreviewCustomer, activeCompany]);

  const handleLaunchWhatsApp = (profile: CustomerRFMProfile) => {
    const cleanPhone = normalizePhone(profile.phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      alert(`Invalid phone number for ${profile.customerName}`);
      return;
    }
    const text = formatWhatsAppCampaignMessage(
      activeTemplate.messageTemplate,
      profile,
      activeCompany.name,
      activeCompany.address || activeCompany.city,
      activeTemplate.couponCode
    );
    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyText = () => {
    if (!renderedPreviewText) return;
    navigator.clipboard.writeText(renderedPreviewText).then(() => {
      setCopiedStatus('Copied to clipboard!');
      setTimeout(() => setCopiedStatus(null), 2500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Segment Selector KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedSegment('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedSegment === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 flex items-center justify-between">
            <span>All Directory</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono mt-1">{segmentCounts.all}</div>
          <div className="text-[10px] opacity-70 mt-0.5">Total shoppers</div>
        </button>

        <button
          onClick={() => setSelectedSegment('champions')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedSegment === 'champions'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-600/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-90 flex items-center justify-between">
            <span>👑 Champions</span>
            <Crown className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div className="text-xl font-bold font-mono mt-1">{segmentCounts.champions}</div>
          <div className="text-[10px] opacity-70 mt-0.5">Top spenders</div>
        </button>

        <button
          onClick={() => setSelectedSegment('loyal')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedSegment === 'loyal'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-90 flex items-center justify-between">
            <span>💎 Loyal Shoppers</span>
            <Heart className="w-3.5 h-3.5 text-rose-300" />
          </div>
          <div className="text-xl font-bold font-mono mt-1">{segmentCounts.loyal}</div>
          <div className="text-[10px] opacity-70 mt-0.5">Regular repeat</div>
        </button>

        <button
          onClick={() => setSelectedSegment('at_risk')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedSegment === 'at_risk'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-90 flex items-center justify-between">
            <span>⚠️ At Risk</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
          </div>
          <div className="text-xl font-bold font-mono mt-1">{segmentCounts.at_risk}</div>
          <div className="text-[10px] opacity-70 mt-0.5">90-180 days absent</div>
        </button>

        <button
          onClick={() => setSelectedSegment('hibernating')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedSegment === 'hibernating'
              ? 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-700/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-90 flex items-center justify-between">
            <span>💤 Hibernating</span>
            <Moon className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="text-xl font-bold font-mono mt-1">{segmentCounts.hibernating}</div>
          <div className="text-[10px] opacity-70 mt-0.5">&gt; 180 days quiet</div>
        </button>

        <button
          onClick={() => setSelectedSegment('new_walkins')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedSegment === 'new_walkins'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-600/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-300'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-90 flex items-center justify-between">
            <span>🌱 New Walk-ins</span>
            <Sprout className="w-3.5 h-3.5 text-emerald-200" />
          </div>
          <div className="text-xl font-bold font-mono mt-1">{segmentCounts.new_walkins}</div>
          <div className="text-[10px] opacity-70 mt-0.5">Recent 1st order</div>
        </button>
      </div>

      {/* Main 2-Column Split: Left Customer Table (7 Cols), Right WhatsApp Message Studio (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Customer Segment List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Targeted Audience</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
                  {filteredCustomers.length} customers
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Segmented by Recency (days ago), Order Frequency, and Lifetime Spend.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or phone..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No customers found matching this segment or query.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-2">Segment</th>
                    <th className="py-2.5 px-2 text-right">Recency</th>
                    <th className="py-2.5 px-2 text-right">Orders</th>
                    <th className="py-2.5 px-2 text-right">Spend</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((profile) => {
                    const isSelected = targetPreviewCustomer?.customerId === profile.customerId;

                    return (
                      <tr
                        key={profile.customerId}
                        onClick={() => setSelectedCustomerForPreview(profile)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/60 font-semibold'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{profile.customerName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{profile.phone}</div>
                        </td>

                        <td className="py-2.5 px-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              profile.segment === 'champions'
                                ? 'bg-purple-100 text-purple-800'
                                : profile.segment === 'loyal'
                                ? 'bg-emerald-100 text-emerald-800'
                                : profile.segment === 'at_risk'
                                ? 'bg-amber-100 text-amber-800'
                                : profile.segment === 'hibernating'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {profile.segmentLabel}
                          </span>
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                          {profile.recencyDays === 999 ? 'Never' : `${profile.recencyDays}d ago`}
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                          {profile.frequencyOrders}
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                          ₹{profile.monetaryLifetimeSpend.toLocaleString('en-IN')}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLaunchWhatsApp(profile);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-md text-[11px] font-bold flex items-center gap-1 mx-auto transition-colors cursor-pointer shadow-xs"
                            title="Launch WhatsApp Chat"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: WhatsApp Studio & Campaign Template Launcher (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">WhatsApp Campaign Studio</h4>
                  <p className="text-[10px] text-slate-500">1-click personalized customer broadcast</p>
                </div>
              </div>

              {activeTemplate.couponCode && (
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                  {activeTemplate.couponCode}
                </span>
              )}
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Select Curated Campaign Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {campaignTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Target Banner */}
            {targetPreviewCustomer && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                    Recipient Preview:
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {targetPreviewCustomer.customerName} ({targetPreviewCustomer.phone})
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Points: {targetPreviewCustomer.loyaltyPoints} pts • {targetPreviewCustomer.segmentLabel}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  WA
                </div>
              </div>
            )}

            {/* Live Rendered WhatsApp Bubble */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span>Personalized Message Preview:</span>
                {copiedStatus && <span className="text-emerald-600 font-bold">{copiedStatus}</span>}
              </div>

              <div className="p-3.5 bg-emerald-950 text-emerald-50 rounded-xl text-xs font-sans leading-relaxed whitespace-pre-wrap shadow-inner border border-emerald-900/50 max-h-60 overflow-y-auto">
                {renderedPreviewText}
              </div>
            </div>

            {/* Tags Supported Hint */}
            <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-wrap gap-1.5 font-mono">
              <span className="font-sans font-bold text-slate-500">Tags:</span>
              <span className="text-indigo-600">{'{CustomerName}'}</span>
              <span className="text-indigo-600">{'{PointsBalance}'}</span>
              <span className="text-indigo-600">{'{StoreName}'}</span>
              <span className="text-indigo-600">{'{DiscountCoupon}'}</span>
            </div>
          </div>

          {/* Action Launcher Footer */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => targetPreviewCustomer && handleLaunchWhatsApp(targetPreviewCustomer)}
              disabled={!targetPreviewCustomer}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Launch WhatsApp Web Chat for {targetPreviewCustomer?.customerName || 'Selected Customer'}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy Message to Clipboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

