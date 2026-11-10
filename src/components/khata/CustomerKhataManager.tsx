import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Send,
  Printer,
  PlusCircle,
  FileText,
  UserCheck,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Filter,
  ArrowUpDown,
  Share2,
  AlertTriangle,
  Receipt,
  Users,
} from 'lucide-react';
import { Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import { SettleKhataModal } from './SettleKhataModal';
import { PaymentReminderModal } from './PaymentReminderModal';
import { CustomerLedgerModal } from './CustomerLedgerModal';

export const CustomerKhataManager: React.FC = () => {
  const {
    customers,
    sales,
    creditPayments,
    getKhataSummaryStats,
    getCustomerKhata,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'due_soon' | 'high_debt' | 'settled'>('all');
  const [selectedAgingBucket, setSelectedAgingBucket] = useState<'all' | '0-15' | '16-30' | '31-60' | '60+'>('all');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'days_desc' | 'name_asc'>('balance_desc');

  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

  // Compute live summary stats
  const summaryStats = useMemo(() => getKhataSummaryStats(), [getKhataSummaryStats, customers, sales, creditPayments]);

  // Build enriched customer khata records
  const customerKhataList = useMemo(() => {
    return customers.map((c) => {
      const khata = getCustomerKhata(c.id);
      const balance = c.outstandingCredit ?? khata.totalOutstanding ?? 0;
      const daysElapsed = khata.oldestCreditDays;
      const isOverdue = daysElapsed > 15;

      let dominantBucket: '0-15' | '16-30' | '31-60' | '60+' = '0-15';
      if (khata.agingBuckets['60+'] > 0) dominantBucket = '60+';
      else if (khata.agingBuckets['31-60'] > 0) dominantBucket = '31-60';
      else if (khata.agingBuckets['16-30'] > 0) dominantBucket = '16-30';

      return {
        customer: c,
        balance,
        daysElapsed,
        isOverdue,
        dominantBucket,
        agingBuckets: khata.agingBuckets,
        unpaidInvoicesCount: khata.creditSales.filter((s) => (s.creditRemainingBalance ?? s.creditAmount ?? s.grandTotal) > 0).length,
      };
    });
  }, [customers, getCustomerKhata]);

  // Apply filters
  const filteredCustomers = useMemo(() => {
    return customerKhataList
      .filter((item) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.customer.name.toLowerCase().includes(q);
          const matchPhone = item.customer.phone.includes(q);
          if (!matchName && !matchPhone) return false;
        }

        // Aging bucket card filter
        if (selectedAgingBucket !== 'all') {
          if (item.dominantBucket !== selectedAgingBucket) return false;
          if (item.balance <= 0) return false;
        }

        // Tab filter
        if (filterTab === 'overdue') {
          return item.balance > 0 && (item.daysElapsed > 15 || item.dominantBucket !== '0-15');
        }
        if (filterTab === 'due_soon') {
          return item.balance > 0 && item.dominantBucket === '16-30';
        }
        if (filterTab === 'high_debt') {
          return item.balance >= 5000;
        }
        if (filterTab === 'settled') {
          return item.balance === 0;
        }

        // 'all' tab shows customers who either have a debt or have taken credit previously
        return item.balance > 0 || item.customer.outstandingCredit !== undefined;
      })
      .sort((a, b) => {
        if (sortBy === 'balance_desc') return b.balance - a.balance;
        if (sortBy === 'days_desc') return b.daysElapsed - a.daysElapsed;
        if (sortBy === 'name_asc') return a.customer.name.localeCompare(b.customer.name);
        return 0;
      });
  }, [customerKhataList, searchQuery, selectedAgingBucket, filterTab, sortBy]);

  const handleOpenSettle = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsSettleModalOpen(true);
  };

  const handleOpenReminder = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsReminderModalOpen(true);
  };

  const handleOpenLedger = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsLedgerModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Customer Khata & Udhaar Recovery
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track customer debts, aging periods, 1-click WhatsApp payment reminders & smart FIFO settlement
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Outstanding */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Outstanding
            </span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-2">
            ₹{summaryStats.totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-indigo-700">
            <Users className="w-3.5 h-3.5" />
            <span>{summaryStats.customerCount} customers with active debt</span>
          </div>
        </div>

        {/* Overdue Debt */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Overdue Amount (&gt;15d)
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-950 mt-2">
            ₹{summaryStats.overdueAmount.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Needs recovery attention</span>
          </div>
        </div>

        {/* Recovered This Month */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Recovered This Month
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-950 mt-2">
            ₹{summaryStats.recoveredThisMonth.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Collected via Cash & UPI</span>
          </div>
        </div>

        {/* Active Accounts Count */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Khata Customer Accounts
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-950 mt-2">
            {summaryStats.customerCount}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500">
            <span>Across all retail shoppers</span>
          </div>
        </div>
      </div>

      {/* Interactive Aging Buckets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Aging Breakdown of Store Debt (Click to Filter):
          </span>
          {selectedAgingBucket !== 'all' && (
            <button
              onClick={() => setSelectedAgingBucket('all')}
              className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Clear Aging Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 0-15 Days */}
          <button
            type="button"
            onClick={() =>
              setSelectedAgingBucket((prev) => (prev === '0-15' ? 'all' : '0-15'))
            }
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedAgingBucket === '0-15'
                ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-500 shadow-sm'
                : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">0–15 Days</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full">
                Current
              </span>
            </div>
            <div className="text-lg font-black font-mono text-emerald-950 mt-1">
              ₹{summaryStats.agingBuckets['0-15'].amount.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              {summaryStats.agingBuckets['0-15'].count} invoices
            </span>
          </button>

          {/* 16-30 Days */}
          <button
            type="button"
            onClick={() =>
              setSelectedAgingBucket((prev) => (prev === '16-30' ? 'all' : '16-30'))
            }
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedAgingBucket === '16-30'
                ? 'bg-amber-100/70 border-amber-500 ring-2 ring-amber-500 shadow-sm'
                : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">16–30 Days</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded-full">
                Due Soon
              </span>
            </div>
            <div className="text-lg font-black font-mono text-amber-950 mt-1">
              ₹{summaryStats.agingBuckets['16-30'].amount.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              {summaryStats.agingBuckets['16-30'].count} invoices
            </span>
          </button>

          {/* 31-60 Days */}
          <button
            type="button"
            onClick={() =>
              setSelectedAgingBucket((prev) => (prev === '31-60' ? 'all' : '31-60'))
            }
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedAgingBucket === '31-60'
                ? 'bg-orange-100/70 border-orange-500 ring-2 ring-orange-500 shadow-sm'
                : 'bg-orange-50/60 border-orange-200 hover:bg-orange-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-900">31–60 Days</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-200/80 text-orange-900 rounded-full">
                Overdue
              </span>
            </div>
            <div className="text-lg font-black font-mono text-orange-950 mt-1">
              ₹{summaryStats.agingBuckets['31-60'].amount.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-orange-700 block mt-0.5">
              {summaryStats.agingBuckets['31-60'].count} invoices
            </span>
          </button>

          {/* 60+ Days */}
          <button
            type="button"
            onClick={() =>
              setSelectedAgingBucket((prev) => (prev === '60+' ? 'all' : '60+'))
            }
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedAgingBucket === '60+'
                ? 'bg-red-100/70 border-red-500 ring-2 ring-red-500 shadow-sm'
                : 'bg-red-50/60 border-red-200 hover:bg-red-100/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-900">60+ Days</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-200/80 text-red-900 rounded-full">
                Critical
              </span>
            </div>
            <div className="text-lg font-black font-mono text-red-950 mt-1">
              ₹{summaryStats.agingBuckets['60+'].amount.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-red-700 block mt-0.5">
              {summaryStats.agingBuckets['60+'].count} invoices
            </span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-sans"
            />
          </div>

          {/* Filter Tabs & Sort Dropdown */}
          <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('overdue')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'overdue'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overdue
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('due_soon')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'due_soon'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Due Soon
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('high_debt')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'high_debt'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                &gt; ₹5,000
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('settled')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterTab === 'settled'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Settled
              </button>
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="balance_desc">Highest Balance First</option>
              <option value="days_desc">Oldest Debt First</option>
              <option value="name_asc">Name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Customer Khata Directory Table */}
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Customer Khata Accounts Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No customers matched "${searchQuery}". Try a different name or number.`
                : 'No customer accounts meet the selected filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Outstanding Balance</th>
                  <th className="py-3 px-4">Credit Limit</th>
                  <th className="py-3 px-4">Days Elapsed</th>
                  <th className="py-3 px-4">Aging Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredCustomers.map((item) => {
                  const cust = item.customer;
                  const isBlocked = cust.creditStatus === 'blocked';
                  const limitPercent = cust.creditLimit && cust.creditLimit > 0
                    ? Math.min(100, Math.round((item.balance / cust.creditLimit) * 100))
                    : null;

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{cust.name}</span>
                              {cust.isVip && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                                  VIP
                                </span>
                              )}
                              {isBlocked && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-red-100 text-red-800 rounded">
                                  BLOCKED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {cust.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Outstanding Balance */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-sm text-slate-900">
                          ₹{item.balance.toLocaleString('en-IN')}
                        </div>
                        {item.unpaidInvoicesCount > 0 && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            Across {item.unpaidInvoicesCount} bill{item.unpaidInvoicesCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>

                      {/* Credit Limit & Progress */}
                      <td className="py-3 px-4">
                        {cust.creditLimit && cust.creditLimit > 0 ? (
                          <div className="space-y-1 max-w-[120px]">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
                              <span>₹{cust.creditLimit.toLocaleString('en-IN')}</span>
                              <span className="font-bold">{limitPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  limitPercent! > 90
                                    ? 'bg-red-500'
                                    : limitPercent! > 70
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${limitPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">No Limit</span>
                        )}
                      </td>

                      {/* Days Elapsed */}
                      <td className="py-3 px-4">
                        {item.balance > 0 ? (
                          <div className="flex items-center gap-1.5 font-mono">
                            <Clock className={`w-3.5 h-3.5 ${item.daysElapsed > 30 ? 'text-red-500' : 'text-slate-400'}`} />
                            <span className={`font-bold ${item.daysElapsed > 30 ? 'text-red-700' : 'text-slate-700'}`}>
                              {item.daysElapsed} days
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            All Cleared
                          </span>
                        )}
                      </td>

                      {/* Aging Status Badge */}
                      <td className="py-3 px-4">
                        {item.balance > 0 ? (
                          item.dominantBucket === '60+' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              60+ Days Overdue
                            </span>
                          ) : item.dominantBucket === '31-60' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                              31–60 Days Overdue
                            </span>
                          ) : item.dominantBucket === '16-30' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              16–30 Days Due Soon
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              0–15 Days Current
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">Zero Balance</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Settle Debt Button */}
                          {item.balance > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenSettle(cust)}
                              title="Collect Khata Payment"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Settle</span>
                            </button>
                          )}

                          {/* WhatsApp Reminder Button */}
                          {item.balance > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenReminder(cust)}
                              title="Send 1-Click WhatsApp Reminder"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* View Ledger Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenLedger(cust)}
                            title="View Full Chronological Ledger & Print Statement"
                            className="p-1.5 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCustomer && isSettleModalOpen && (
        <SettleKhataModal
          customer={selectedCustomer}
          isOpen={isSettleModalOpen}
          onClose={() => {
            setIsSettleModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {selectedCustomer && isReminderModalOpen && (
        <PaymentReminderModal
          customer={selectedCustomer}
          isOpen={isReminderModalOpen}
          onClose={() => {
            setIsReminderModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {selectedCustomer && isLedgerModalOpen && (
        <CustomerLedgerModal
          customer={selectedCustomer}
          isOpen={isLedgerModalOpen}
          onClose={() => {
            setIsLedgerModalOpen(false);
            setSelectedCustomer(null);
          }}
          onOpenSettleModal={() => {
            setIsLedgerModalOpen(false);
            setIsSettleModalOpen(true);
          }}
          onOpenReminderModal={() => {
            setIsLedgerModalOpen(false);
            setIsReminderModalOpen(true);
          }}
        />
      )}
    </div>
  );
};

