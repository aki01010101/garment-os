import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, FamilyMember, SaleTransaction } from '../../types';
import {
  computeCustomerSpendMetrics,
  buildCustomerWhatsAppSummary,
  getReciprocalRelation,
  isUpcomingMilestone,
} from '../../utils/crmUtils';
import { CustomerPurchasesModal } from './CustomerPurchasesModal';
import { CustomerProfileModal } from './CustomerProfileModal';
import { CustomerMeasurementModal } from './CustomerMeasurementModal';
import { SettleKhataModal } from '../khata/SettleKhataModal';
import { PaymentReminderModal } from '../khata/PaymentReminderModal';
import { CustomerLedgerModal } from '../khata/CustomerLedgerModal';
import {
  Users,
  Search,
  Plus,
  Sparkles,
  ShoppingBag,
  Phone,
  Calendar,
  Building2,
  Sliders,
  X,
  CreditCard,
  FileText,
  Crown,
  History,
  TrendingUp,
  CheckCircle2,
  Share2,
  Tag,
  AlertCircle,
  Clock,
  Ruler,
  Heart,
  MapPin,
  Palette,
  Edit3,
  Edit2,
  Trash2,
  Link2,
  UserPlus,
  Unlink,
  MessageSquare,
  ChevronLeft,
  BookOpen,
  PlusCircle,
  Cake,
} from 'lucide-react';
import { RFMCampaignsManager } from './RFMCampaignsManager';
import { CelebrationsManager } from './CelebrationsManager';

export const CustomerCRM: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    adjustLoyaltyPoints,
    sales,
    companies,
    loyaltyConfig,
    updateLoyaltyConfig,
    setActiveReceipt,
    setIsReceiptModalOpen,
  } = useApp();

  const [crmView, setCrmView] = useState<'directory' | 'rfm_campaigns' | 'celebrations'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'vip' | 'regular'>('all');

  // Past Purchases History Modal state
  const [purchasesModalCustomer, setPurchasesModalCustomer] = useState<Customer | null>(null);
  const [isPurchasesModalOpen, setIsPurchasesModalOpen] = useState(false);

  // Customer Profile Builder Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<
    'sizes' | 'measurements' | 'occasions' | 'address' | 'style' | 'family'
  >('family');
  const [profileModalMemberToEdit, setProfileModalMemberToEdit] = useState<FamilyMember | null>(null);

  // Customer Measurement Modal
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);

  // New Customer Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Khata Management Modals
  const [isKhataSettleOpen, setIsKhataSettleOpen] = useState(false);
  const [isKhataReminderOpen, setIsKhataReminderOpen] = useState(false);
  const [isKhataLedgerOpen, setIsKhataLedgerOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', notes: '' });

  // Points Adjustment Modal
  const [isAdjustPointsOpen, setIsAdjustPointsOpen] = useState(false);
  const [pointsDelta, setPointsDelta] = useState<number>(50);
  const [pointsReason, setPointsReason] = useState<string>('Festival Promotional Perk');

  // Loyalty Config Modal
  const [isLoyaltyConfigOpen, setIsLoyaltyConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState(loyaltyConfig);

  const vipThreshold = loyaltyConfig.vipMonthlyThreshold || 5000;

  // Precompute metrics and VIP tier eligibility for all customers
  const customerMetricsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeCustomerSpendMetrics>>();
    customers.forEach((c) => {
      map.set(c.id, computeCustomerSpendMetrics(c, sales, vipThreshold));
    });
    return map;
  }, [customers, sales, vipThreshold]);

  // Selected customer (fallback to first or currently selected)
  const selectedCustomer = useMemo(() => {
    if (selectedCustomerId) {
      return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
    }
    return customers[0] || null;
  }, [customers, selectedCustomerId]);

  const selectedMetrics = selectedCustomer ? customerMetricsMap.get(selectedCustomer.id) : null;

  // Tier counts
  const vipCount = useMemo(() => {
    return customers.filter((c) => customerMetricsMap.get(c.id)?.isVip).length;
  }, [customers, customerMetricsMap]);

  const regularCount = customers.length - vipCount;

  // Filter customers by search query and VIP tier filter (including linked family members)
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.profile?.familyMembers &&
          c.profile.familyMembers.some(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              (m.phone && m.phone.includes(q)) ||
              (m.relation && m.relation.toLowerCase().includes(q))
          ));

      if (!matchesSearch) return false;

      const isVip = customerMetricsMap.get(c.id)?.isVip ?? false;
      if (tierFilter === 'vip') return isVip;
      if (tierFilter === 'regular') return !isVip;
      return true;
    });
  }, [customers, searchQuery, tierFilter, customerMetricsMap]);

  const getRelationBadgeClass = (relation: string): string => {
    switch (relation) {
      case 'Spouse':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'Son':
      case 'Daughter':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Father':
      case 'Mother':
        return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      case 'Brother':
      case 'Sister':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'Grandfather':
      case 'Grandmother':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleRemoveFamilyMemberDirect = (cust: Customer, memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this family member from this profile?')) return;
    const currentMembers = cust.profile?.familyMembers || [];
    const updatedMembers = currentMembers.filter((m) => m.id !== memberId);
    const updatedCust: Customer = {
      ...cust,
      profile: {
        ...cust.profile,
        familyMembers: updatedMembers.length > 0 ? updatedMembers : undefined,
      },
    };
    updateCustomer(updatedCust);
  };

  const handleUnlinkFamilyMemberDirect = (cust: Customer, memberId: string) => {
    const currentMembers = cust.profile?.familyMembers || [];
    const updatedMembers = currentMembers.map((m) =>
      m.id === memberId ? { ...m, linkedCustomerId: undefined } : m
    );
    const updatedCust: Customer = {
      ...cust,
      profile: {
        ...cust.profile,
        familyMembers: updatedMembers,
      },
    };
    updateCustomer(updatedCust);
  };

  const handleConvertFamilyMemberToCustomerDirect = (cust: Customer, member: FamilyMember) => {
    if (member.linkedCustomerId) return;
    const newCust = addCustomer({
      name: member.name,
      phone: member.phone || `${cust.phone.slice(0, 6)}${Math.floor(1000 + Math.random() * 9000)}`,
      email: undefined,
      notes: member.notes ? `Family member of ${cust.name}. ${member.notes}` : `Family member of ${cust.name}`,
      profile: {
        birthday: member.birthday,
        anniversary: member.anniversary,
        preferredShirtSize: member.preferredShirtSize,
        preferredTrouserWaist: member.preferredTrouserWaist,
        familyMembers: [
          {
            id: `fam_${Date.now()}_recip`,
            name: cust.name,
            relation: getReciprocalRelation(member.relation),
            phone: cust.phone,
            linkedCustomerId: cust.id,
            preferredShirtSize: cust.profile?.preferredShirtSize,
            preferredTrouserWaist: cust.profile?.preferredTrouserWaist,
          },
        ],
      },
    });

    const currentMembers = cust.profile?.familyMembers || [];
    const updatedMembers = currentMembers.map((m) =>
      m.id === member.id ? { ...m, linkedCustomerId: newCust.id } : m
    );
    const updatedCust: Customer = {
      ...cust,
      profile: {
        ...cust.profile,
        familyMembers: updatedMembers,
      },
    };
    updateCustomer(updatedCust);
  };

  // Customer purchase history filterable by company
  const customerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales
      .filter((s) => {
        const isMatch = s.customerId === selectedCustomer.id || s.customerPhone === selectedCustomer.phone;
        const isCompanyMatch = companyFilter === 'all' || s.companyId === companyFilter;
        return isMatch && isCompanyMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCustomer, sales, companyFilter]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name.trim() || !newCust.phone.trim()) return;

    const created = addCustomer(newCust);
    setSelectedCustomerId(created.id);
    setIsAddCustomerOpen(false);
    setNewCust({ name: '', phone: '', email: '', notes: '' });
  };

  const handleConfirmPointsAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    adjustLoyaltyPoints(selectedCustomer.id, pointsDelta, pointsReason);
    setIsAdjustPointsOpen(false);
  };

  const handleSaveLoyaltyConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateLoyaltyConfig(configForm);
    setIsLoyaltyConfigOpen(false);
  };

  const openPurchasesModal = (customerToView: Customer) => {
    setPurchasesModalCustomer(customerToView);
    setIsPurchasesModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Customer Relationship Management (CRM) & VIP Loyalty</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
              <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>VIP Auto-Tier (≥ ₹{vipThreshold.toLocaleString('en-IN')}/mo)</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track customer spend, monthly VIP status, multi-company purchases, and reward points.
            Click any customer's name to view their complete itemized purchase history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setConfigForm(loyaltyConfig);
              setIsLoyaltyConfigOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Loyalty & VIP Settings</span>
          </button>
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* CRM Navigation Tabs: Directory vs RFM Campaigns */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setCrmView('directory')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            crmView === 'directory'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Customer Directory & Profiles</span>
        </button>

        <button
          onClick={() => setCrmView('rfm_campaigns')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            crmView === 'rfm_campaigns'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>RFM Smart WhatsApp Campaigns</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
            NEW
          </span>
        </button>
        <button
          onClick={() => setCrmView('celebrations')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            crmView === 'celebrations'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cake className="w-3.5 h-3.5 text-pink-500" />
          <span>Birthdays & Anniversaries</span>
          <span className="px-1.5 py-0.2 bg-pink-100 text-pink-800 rounded-full text-[10px] font-bold">
            GREETINGS
          </span>
        </button>
      </div>

      {crmView === 'celebrations' ? (
        <CelebrationsManager />
      ) : crmView === 'rfm_campaigns' ? (
        <RFMCampaignsManager />
      ) : (
        /* Main Grid: Customer Directory & Detail Drawer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Directory */}
        <div className="lg:col-span-5 space-y-3">
          {/* Mobile Jump to Selected Profile Bar */}
          {selectedCustomer && (
            <div className="lg:hidden flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 shadow-2xs">
              <span className="truncate">
                Selected: <strong className="font-bold">{selectedCustomer.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('customer-profile-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer ml-2 hover:bg-indigo-700 transition-colors"
              >
                View Profile ↓
              </button>
            </div>
          )}

          {/* Search Box & Tier Filter Tabs */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers by name, phone, or email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* VIP Tier Quick Filter Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setTierFilter('all')}
                className={`py-1 px-2 rounded-md font-semibold text-center transition-all ${
                  tierFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({customers.length})
              </button>
              <button
                onClick={() => setTierFilter('vip')}
                className={`py-1 px-2 rounded-md font-semibold text-center transition-all flex items-center justify-center gap-1 ${
                  tierFilter === 'vip'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>VIP ({vipCount})</span>
              </button>
              <button
                onClick={() => setTierFilter('regular')}
                className={`py-1 px-2 rounded-md font-semibold text-center transition-all ${
                  tierFilter === 'regular'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Regular ({regularCount})
              </button>
            </div>
          </div>

          {/* Customer Cards List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No customers match the current filter criteria.
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                const metrics = customerMetricsMap.get(cust.id);
                const isVip = metrics?.isVip ?? false;

                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Clickable Customer Name: opens past purchases modal */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomerId(cust.id);
                              openPurchasesModal(cust);
                            }}
                            className="font-bold text-xs text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1 text-left"
                            title="Click to view complete past purchases history"
                          >
                            <span>{cust.name}</span>
                            <History className="w-3 h-3 text-slate-400 hover:text-indigo-600" />
                          </button>

                          {isVip && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 ring-1 ring-amber-300">
                              <Crown className="w-2.5 h-2.5 fill-current" />
                              <span>VIP</span>
                            </span>
                          )}

                          {cust.profile?.familyMembers && cust.profile.familyMembers.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                              <Users className="w-2.5 h-2.5 text-pink-500" />
                              <span>{cust.profile.familyMembers.length} Family</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono">
                          {cust.phone}
                        </div>

                        {searchQuery.trim() &&
                          cust.profile?.familyMembers?.some(
                            (m) =>
                              m.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                              (m.phone && m.phone.includes(searchQuery.toLowerCase().trim())) ||
                              (m.relation && m.relation.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                          ) && (
                            <div className="text-[10px] text-pink-700 font-medium flex items-center gap-1 mt-1 bg-pink-50/60 px-1.5 py-0.5 rounded border border-pink-100">
                              <Link2 className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">
                                Family match:{' '}
                                {
                                  cust.profile.familyMembers.find(
                                    (m) =>
                                      m.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                                      (m.phone && m.phone.includes(searchQuery.toLowerCase().trim())) ||
                                      (m.relation && m.relation.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                                  )?.name
                                }{' '}
                                (
                                {
                                  cust.profile.familyMembers.find(
                                    (m) =>
                                      m.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                                      (m.phone && m.phone.includes(searchQuery.toLowerCase().trim())) ||
                                      (m.relation && m.relation.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                                  )?.relation
                                }
                                )
                              </span>
                            </div>
                          )}
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-slate-900">
                          ₹{cust.totalSpend.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-indigo-700 font-semibold font-mono flex items-center justify-end gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{cust.loyaltyPoints} pts</span>
                        </div>
                        {Boolean(cust.outstandingCredit && cust.outstandingCredit > 0) && (
                          <div className="text-[10px] text-red-700 font-bold font-mono bg-red-50 px-1.5 py-0.5 rounded border border-red-200 mt-1 inline-flex items-center gap-1">
                            <span>Khata: ₹{cust.outstandingCredit!.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom strip: Monthly spend indicator & quick action */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-medium ${isVip ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
                          Monthly: ₹{metrics ? metrics.monthlySpend.toLocaleString('en-IN') : 0}
                        </span>
                        <span>·</span>
                        <span>{cust.totalVisits} visits</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(cust.id);
                          openPurchasesModal(cust);
                        }}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline"
                      >
                        <span>Past Purchases</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Customer Profile & Segregated Invoices */}
        <div id="customer-profile-section" className="lg:col-span-7">
          {selectedCustomer && selectedMetrics ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-5">
              {/* Mobile Back to List Button */}
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="lg:hidden px-3 py-1.5 min-h-[36px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 w-fit cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>← Back to Customer Directory</span>
              </button>

              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Clickable Customer Name: triggers past purchases modal */}
                    <button
                      type="button"
                      onClick={() => openPurchasesModal(selectedCustomer)}
                      className="text-lg font-bold text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1.5 transition-colors text-left"
                      title="Click customer name to open full purchase history"
                    >
                      <span>{selectedCustomer.name}</span>
                      <History className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                    </button>

                    {selectedMetrics.isVip ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs ring-1 ring-amber-300">
                        <Crown className="w-3.5 h-3.5 fill-current" />
                        <span>👑 VIP Client (₹5k+ Monthly)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Regular Member
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1 font-sans">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      +91 {selectedCustomer.phone}
                    </span>
                    {selectedCustomer.email && (
                      <>
                        <span>·</span>
                        <span className="font-sans">{selectedCustomer.email}</span>
                      </>
                    )}
                    <span>·</span>
                    <span className="font-sans text-slate-400">
                      Member since {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {selectedCustomer.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/60 border border-amber-100 px-2.5 py-1 rounded-md mt-1.5 max-w-md">
                      📝 {selectedCustomer.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => {
                      setProfileModalInitialTab('family');
                      setProfileModalMemberToEdit(null);
                      setIsProfileModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-pink-700 hover:text-pink-900 bg-pink-50 hover:bg-pink-100 rounded-lg flex items-center gap-1.5 border border-pink-200 transition-colors shadow-2xs cursor-pointer"
                    title="Add or link family members and household sizing"
                  >
                    <Users className="w-3.5 h-3.5 text-pink-600" />
                    <span>+ Family ({selectedCustomer.profile?.familyMembers?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileModalInitialTab('sizes');
                      setProfileModalMemberToEdit(null);
                      setIsProfileModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    title="Build or update optional sizing, measurements & style profile"
                  >
                    <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Build Profile</span>
                  </button>

                  <button
                    onClick={() => setIsMeasurementModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-1.5 border border-purple-200 transition-colors shadow-2xs cursor-pointer"
                    title="Manage bespoke tailor measurements & print tailor slips"
                  >
                    <Ruler className="w-3.5 h-3.5 text-purple-600" />
                    <span>Fit Cards ({selectedCustomer.profile?.measurementProfiles?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => openPurchasesModal(selectedCustomer)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                    title="View itemized past bills and receipts"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View Past Purchases</span>
                  </button>

                  <button
                    onClick={() => setIsAdjustPointsOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Points</span>
                  </button>
                </div>
              </div>

              {/* VIP Monthly Purchase Status Banner */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  selectedMetrics.isVip
                    ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedMetrics.isVip
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Crown className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Monthly Spend Target ({selectedMetrics.monthLabel})</span>
                        {selectedMetrics.isVip ? (
                          <span className="text-[10px] text-amber-800 font-extrabold bg-amber-200/80 px-2 py-0.2 rounded-full">
                            VIP UNLOCKED
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Spend above ₹{vipThreshold.toLocaleString('en-IN')} in a month to achieve automatic VIP status
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono self-start sm:self-auto">
                    <span className="text-base font-bold text-slate-900">
                      ₹{selectedMetrics.monthlySpend.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400"> / ₹{vipThreshold.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden my-2">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      selectedMetrics.isVip
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${selectedMetrics.progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  {selectedMetrics.isVip ? (
                    <span className="font-bold text-amber-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Eligible for VIP Privileges: 5% extra points & express tailoring</span>
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">
                      ₹{selectedMetrics.remainingForVip.toLocaleString('en-IN')} more needed to achieve VIP status
                    </span>
                  )}
                  <span className="font-mono font-bold text-slate-700">
                    {selectedMetrics.progressPercent}% achieved
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Lifetime Spend
                  </span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                    ₹{selectedCustomer.totalSpend.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Avg ₹{selectedMetrics.averageOrderValue.toLocaleString('en-IN')} / visit
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Reward Points
                  </span>
                  <div className="text-lg font-bold font-mono text-indigo-600 mt-1">
                    {selectedCustomer.loyaltyPoints} pts
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ₹{selectedCustomer.loyaltyPoints * loyaltyConfig.pointRedemptionValue} bill discount value
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Store Visits
                  </span>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                    {selectedCustomer.totalVisits} orders
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {selectedMetrics.totalGarments} garments purchased
                  </div>
                </div>
              </div>

              {/* Customer Khata Balance Card (if active balance) */}
              {Boolean(selectedCustomer.outstandingCredit && selectedCustomer.outstandingCredit > 0) && (
                <div className="p-3.5 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-red-950 uppercase tracking-wider">
                          Khata Outstanding Debt
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-200 text-red-900 rounded-full">
                          Active Due
                        </span>
                      </div>
                      <div className="text-lg font-black font-mono text-red-900">
                        ₹{selectedCustomer.outstandingCredit!.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsKhataSettleOpen(true)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Settle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsKhataReminderOpen(true)}
                      className="p-1.5 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                      title="Send WhatsApp Reminder"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsKhataLedgerOpen(true)}
                      className="p-1.5 bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                      title="View Khata Ledger"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Customer Profile & Sizing Preferences Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Customer Profile & Fit Preferences
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">(Optional Fields)</span>
                  </div>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>
                      {selectedCustomer.profile && Object.keys(selectedCustomer.profile).length > 0
                        ? 'Edit Profile'
                        : '+ Build Profile'}
                    </span>
                  </button>
                </div>

                {selectedCustomer.profile && Object.keys(selectedCustomer.profile).length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {/* Sizing Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedCustomer.profile.preferredShirtSize && (
                        <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs">
                          <span className="text-slate-400 font-normal">Shirt/Kurti:</span>
                          <strong className="text-indigo-900">{selectedCustomer.profile.preferredShirtSize}</strong>
                        </span>
                      )}
                      {selectedCustomer.profile.preferredTrouserWaist && (
                        <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs">
                          <span className="text-slate-400 font-normal">Waist:</span>
                          <strong className="text-indigo-900">{selectedCustomer.profile.preferredTrouserWaist}"</strong>
                        </span>
                      )}
                      {selectedCustomer.profile.preferredFit && (
                        <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs">
                          <span className="text-slate-400 font-normal">Fit:</span>
                          <span className="text-slate-800">{selectedCustomer.profile.preferredFit}</span>
                        </span>
                      )}
                      {selectedCustomer.profile.birthday && (
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 flex items-center gap-1 shadow-2xs">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          <span>Birthday: {selectedCustomer.profile.birthday}</span>
                        </span>
                      )}
                      {selectedCustomer.profile.anniversary && (
                        <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold text-purple-800 flex items-center gap-1 shadow-2xs">
                          <Calendar className="w-3 h-3 text-purple-500" />
                          <span>Anniversary: {selectedCustomer.profile.anniversary}</span>
                        </span>
                      )}
                      {selectedCustomer.profile.city && (
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-1 shadow-2xs">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{selectedCustomer.profile.city}</span>
                        </span>
                      )}
                      {selectedCustomer.profile.alternatePhone && (
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-2xs">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>Alt: {selectedCustomer.profile.alternatePhone}</span>
                        </span>
                      )}
                    </div>

                    {/* Measurements Grid */}
                    {selectedCustomer.profile.measurements &&
                      Object.values(selectedCustomer.profile.measurements).some(Boolean) && (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Body Measurements (Inches)
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                            {selectedCustomer.profile.measurements.chest && (
                              <div className="p-1.5 bg-slate-50 rounded">
                                <span className="text-[10px] text-slate-400 block">Chest</span>
                                <strong className="font-mono text-slate-900">{selectedCustomer.profile.measurements.chest}"</strong>
                              </div>
                            )}
                            {selectedCustomer.profile.measurements.waist && (
                              <div className="p-1.5 bg-slate-50 rounded">
                                <span className="text-[10px] text-slate-400 block">Waist</span>
                                <strong className="font-mono text-slate-900">{selectedCustomer.profile.measurements.waist}"</strong>
                              </div>
                            )}
                            {selectedCustomer.profile.measurements.shoulder && (
                              <div className="p-1.5 bg-slate-50 rounded">
                                <span className="text-[10px] text-slate-400 block">Shoulder</span>
                                <strong className="font-mono text-slate-900">{selectedCustomer.profile.measurements.shoulder}"</strong>
                              </div>
                            )}
                            {selectedCustomer.profile.measurements.inseam && (
                              <div className="p-1.5 bg-slate-50 rounded">
                                <span className="text-[10px] text-slate-400 block">Inseam</span>
                                <strong className="font-mono text-slate-900">{selectedCustomer.profile.measurements.inseam}"</strong>
                              </div>
                            )}
                            {selectedCustomer.profile.measurements.length && (
                              <div className="p-1.5 bg-slate-50 rounded">
                                <span className="text-[10px] text-slate-400 block">Length</span>
                                <strong className="font-mono text-slate-900">{selectedCustomer.profile.measurements.length}"</strong>
                              </div>
                            )}
                            {selectedCustomer.profile.measurements.collar && (
                              <div className="p-1.5 bg-slate-50 rounded">
                                <span className="text-[10px] text-slate-400 block">Collar</span>
                                <strong className="font-mono text-slate-900">{selectedCustomer.profile.measurements.collar}"</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {selectedCustomer.profile.specialInstructions && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                        <strong className="text-slate-800">Special Instructions: </strong>
                        {selectedCustomer.profile.specialInstructions}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3 bg-white rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                    <p>No sizing, measurement, or birthday profile recorded yet.</p>
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(true)}
                      className="px-3 py-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      + Add Optional Sizing & Fit Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Family Members & Household Card */}
              <div className="p-4 rounded-xl border border-pink-200/80 bg-pink-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center text-pink-700 shadow-2xs">
                      <Users className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Family Members & Household Sizing
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-200">
                          {selectedCustomer.profile?.familyMembers?.length || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Household garment sizes, birthdays, and linked CRM accounts for family shopping.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalInitialTab('family');
                      setProfileModalMemberToEdit(null);
                      setIsProfileModalOpen(true);
                    }}
                    className="text-xs font-semibold text-pink-700 hover:text-pink-900 flex items-center gap-1.5 bg-white hover:bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add / Link Family</span>
                  </button>
                </div>

                {/* Family Members List or Empty State */}
                {selectedCustomer.profile?.familyMembers && selectedCustomer.profile.familyMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {selectedCustomer.profile.familyMembers.map((member) => {
                      const linkedCrmCust = member.linkedCustomerId
                        ? customers.find((c) => c.id === member.linkedCustomerId)
                        : null;
                      const hasUpcomingBday = member.birthday && isUpcomingMilestone(member.birthday, 30);
                      const hasUpcomingAnniv = member.anniversary && isUpcomingMilestone(member.anniversary, 30);

                      return (
                        <div
                          key={member.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-pink-300 transition-colors flex flex-col justify-between space-y-2.5"
                        >
                          <div>
                            {/* Member Top Row */}
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900">{member.name}</span>
                                  <span
                                    className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getRelationBadgeClass(
                                      member.relation
                                    )}`}
                                  >
                                    {member.relation}
                                  </span>
                                </div>
                                {member.phone && (
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{member.phone}</span>
                                    <a
                                      href={`https://wa.me/91${member.phone}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-emerald-600 hover:text-emerald-800 font-sans hover:underline flex items-center gap-0.5"
                                      title="Chat on WhatsApp"
                                    >
                                      WhatsApp
                                    </a>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfileModalInitialTab('family');
                                    setProfileModalMemberToEdit(member);
                                    setIsProfileModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Edit family member details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFamilyMemberDirect(selectedCustomer, member.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove family member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Sizing & Milestones */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {member.preferredShirtSize && (
                                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-800 flex items-center gap-1">
                                  <span className="text-slate-400 text-[10px]">Shirt:</span>
                                  <strong className="text-indigo-900">{member.preferredShirtSize}</strong>
                                </span>
                              )}
                              {member.preferredTrouserWaist && (
                                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-800 flex items-center gap-1">
                                  <span className="text-slate-400 text-[10px]">Waist:</span>
                                  <strong className="text-indigo-900">{member.preferredTrouserWaist}"</strong>
                                </span>
                              )}
                              {member.birthday && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 border ${
                                    hasUpcomingBday
                                      ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}
                                >
                                  <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                                  <span>Bday: {member.birthday}</span>
                                  {hasUpcomingBday && (
                                    <span className="text-[9px] uppercase tracking-wide bg-rose-600 text-white px-1 rounded">
                                      Soon!
                                    </span>
                                  )}
                                </span>
                              )}
                              {member.anniversary && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 border ${
                                    hasUpcomingAnniv
                                      ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
                                      : 'bg-purple-50 text-purple-800 border-purple-200'
                                  }`}
                                >
                                  <Calendar className="w-2.5 h-2.5 text-purple-500" />
                                  <span>Anniv: {member.anniversary}</span>
                                  {hasUpcomingAnniv && (
                                    <span className="text-[9px] uppercase tracking-wide bg-purple-600 text-white px-1 rounded">
                                      Soon!
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Style / Clothing Notes */}
                            {member.notes && (
                              <div className="text-[11px] text-slate-600 italic bg-slate-50/80 p-2 rounded-lg border border-slate-100 mt-2">
                                "{member.notes}"
                              </div>
                            )}
                          </div>

                          {/* CRM Link Footer */}
                          <div className="pt-2 border-t border-slate-100">
                            {linkedCrmCust ? (
                              <div className="flex items-center justify-between gap-1 text-[11px] bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 font-bold text-indigo-950">
                                    <Link2 className="w-3 h-3 text-indigo-600" />
                                    <span>CRM Account: {linkedCrmCust.name}</span>
                                  </div>
                                  <div className="text-[10px] text-indigo-700 font-mono">
                                    ₹{linkedCrmCust.totalSpend.toLocaleString('en-IN')} spend · {linkedCrmCust.loyaltyPoints} pts · {linkedCrmCust.totalVisits} bills
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCustomerId(linkedCrmCust.id)}
                                    className="px-2 py-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100 border border-indigo-200 rounded transition-colors cursor-pointer shadow-2xs flex items-center gap-0.5"
                                    title="Jump to this customer's profile"
                                  >
                                    <span>View Profile</span>
                                    <span>→</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUnlinkFamilyMemberDirect(selectedCustomer, member.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                    title="Unlink from CRM profile"
                                  >
                                    <Unlink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-1 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Household contact (Not linked)
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleConvertFamilyMemberToCustomerDirect(selectedCustomer, member)}
                                    className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                                    title="Create full CRM Customer account for this family member"
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    <span>Convert to CRM</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProfileModalInitialTab('family');
                                      setProfileModalMemberToEdit(member);
                                      setIsProfileModalOpen(true);
                                    }}
                                    className="px-2 py-0.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 rounded hover:bg-indigo-50 transition-colors cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Link2 className="w-3 h-3" />
                                    <span>Link</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white rounded-xl border border-dashed border-pink-200 text-xs text-slate-500 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 mx-auto">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">No family members added or linked yet.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                        Add spouse, children, or parents with their clothing sizes, or link existing customer accounts for shared family loyalty.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileModalInitialTab('family');
                        setProfileModalMemberToEdit(null);
                        setIsProfileModalOpen(true);
                      }}
                      className="px-3 py-1.5 font-bold text-xs text-pink-700 hover:text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add or Link Family Member</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Invoices List with Company Filter */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-slate-500" />
                      <span>Past Purchases ({customerSales.length} bills)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => openPurchasesModal(selectedCustomer)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      (Open Full Breakdown)
                    </button>
                  </div>

                  {/* Multi-Company Entity Filter */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                    <span className="text-[10px] text-slate-400 font-medium px-1.5">Entity:</span>
                    <button
                      onClick={() => setCompanyFilter('all')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        companyFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      All Entities
                    </button>
                    {companies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCompanyFilter(c.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          companyFilter === c.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        {c.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {customerSales.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No invoices recorded for this customer under the selected company.
                    </div>
                  ) : (
                    customerSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              {sale.invoiceNumber}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {sale.companyName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {new Date(sale.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            · {sale.items.length} garments ({sale.items.map((i) => i.name).slice(0, 2).join(', ')}
                            {sale.items.length > 2 ? '...' : ''})
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="font-mono font-bold text-slate-900 text-sm">
                              ₹{sale.grandTotal.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {sale.paymentMode}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setActiveReceipt(sale);
                                setIsReceiptModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200 transition-colors"
                              title="View / Print 58mm Receipt"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openPurchasesModal(selectedCustomer)}
                              className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                              title="View itemized breakdown"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center text-xs text-slate-400">
              Select a customer from the left directory to view full profile, VIP status, purchase history, and reward points.
            </div>
          )}
        </div>
      </div>
      )}

      {/* Customer Past Purchases Modal */}
      <CustomerPurchasesModal
        customer={purchasesModalCustomer}
        isOpen={isPurchasesModalOpen}
        onClose={() => {
          setIsPurchasesModalOpen(false);
          setPurchasesModalCustomer(null);
        }}
      />

      {/* Customer Profile Builder Modal (Optional Fields & Family Linking) */}
      <CustomerProfileModal
        customer={selectedCustomer}
        isOpen={isProfileModalOpen}
        initialTab={profileModalInitialTab}
        initialMemberToEdit={profileModalMemberToEdit}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileModalMemberToEdit(null);
        }}
        onSave={(updated, secondaryUpdates) => {
          updateCustomer(updated);
          if (secondaryUpdates && secondaryUpdates.length > 0) {
            secondaryUpdates.forEach((sec) => updateCustomer(sec));
          }
        }}
      />

      {/* Customer Measurement & Bespoke Fit Cards Modal */}
      <CustomerMeasurementModal
        customer={selectedCustomer}
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        onSave={(updated) => {
          updateCustomer(updated);
          setIsMeasurementModalOpen(false);
        }}
      />

      {/* Points Adjustment Modal */}
      {isAdjustPointsOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Adjust Points: {selectedCustomer.name}</span>
            </h3>

            <form onSubmit={handleConfirmPointsAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Points Adjustment (+ to grant / - to deduct)
                </label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                />
                <span className="text-[10px] text-slate-400">
                  Current: {selectedCustomer.loyaltyPoints} → Resulting:{' '}
                  {Math.max(0, selectedCustomer.loyaltyPoints + pointsDelta)} pts
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="e.g. Birthday reward, goodwill credit"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustPointsOpen(false)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Update Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loyalty & VIP Configuration Modal */}
      {isLoyaltyConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Loyalty & VIP Program Rules</h3>
            </div>

            <form onSubmit={handleSaveLoyaltyConfig} className="space-y-3 text-xs">
              {/* VIP Monthly Threshold */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
                <label className="block font-bold text-amber-900 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>VIP Monthly Spend Threshold (₹)</span>
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  required
                  value={configForm.vipMonthlyThreshold ?? 5000}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      vipMonthlyThreshold: parseInt(e.target.value) || 5000,
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-amber-800">
                  Customers who purchase above this amount in a calendar month are automatically awarded VIP Client status.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Points Earned per ₹100 Spent
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={configForm.pointsPerHundredSpent}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, pointsPerHundredSpent: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400">Default: 1 point per ₹100 bill</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Redemption Value (₹ per 1 point)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={configForm.pointRedemptionValue}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, pointRedemptionValue: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400">Default: 1 point = ₹1 bill discount</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Points Required to Redeem
                </label>
                <input
                  type="number"
                  min="1"
                  value={configForm.minimumPointsToRedeem}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, minimumPointsToRedeem: parseInt(e.target.value) || 50 })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLoyaltyConfigOpen(false)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Customer to CRM</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Shalini Singhal"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  placeholder="e.g. 9812345678"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={newCust.email}
                  onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                  placeholder="e.g. shalini@gmail.com"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Style / Size Notes</label>
                <input
                  type="text"
                  value={newCust.notes}
                  onChange={(e) => setNewCust({ ...newCust, notes: e.target.value })}
                  placeholder="e.g. Prefers Size L in Kurtis and Cotton Shirts"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Khata Modals */}
      {selectedCustomer && isKhataSettleOpen && (
        <SettleKhataModal
          customer={selectedCustomer}
          isOpen={isKhataSettleOpen}
          onClose={() => setIsKhataSettleOpen(false)}
        />
      )}

      {selectedCustomer && isKhataReminderOpen && (
        <PaymentReminderModal
          customer={selectedCustomer}
          isOpen={isKhataReminderOpen}
          onClose={() => setIsKhataReminderOpen(false)}
        />
      )}

      {selectedCustomer && isKhataLedgerOpen && (
        <CustomerLedgerModal
          customer={selectedCustomer}
          isOpen={isKhataLedgerOpen}
          onClose={() => setIsKhataLedgerOpen(false)}
          onOpenSettleModal={() => {
            setIsKhataLedgerOpen(false);
            setIsKhataSettleOpen(true);
          }}
          onOpenReminderModal={() => {
            setIsKhataLedgerOpen(false);
            setIsKhataReminderOpen(true);
          }}
        />
      )}
    </div>
  );
};
