import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Calendar,
  Download,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  DollarSign,
  ShieldCheck,
  Check,
  Layers,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { AssociateCommissionReport } from './AssociateCommissionReport';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const ReportsDashboard: React.FC = () => {
  const { sales, purchases, vendors, companies, products } = useApp();

  const [reportTab, setReportTab] = useState<'analytics' | 'commissions'>('analytics');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'breakdown' | 'volume'>('revenue');

  // Filter sales by selected company
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (selectedCompanyId !== 'all' && s.companyId !== selectedCompanyId) return false;
      return true;
    });
  }, [sales, selectedCompanyId]);

  // 7-day Sales Volume Data for Recharts Line Chart
  const { sevenDaysData, sevenDaysStats } = useMemo(() => {
    // Determine anchor date: latest date in sales or current simulated date
    const latestTimestamp = sales.reduce((max, s) => {
      const t = new Date(s.date).getTime();
      return t > max ? t : max;
    }, new Date('2026-10-27T23:59:59').getTime());

    const anchorDate = new Date(latestTimestamp);
    anchorDate.setHours(23, 59, 59, 999);

    const days: Array<{
      dateStr: string;
      label: string;
      dayOfWeek: string;
      totalRevenue: number;
      billedRevenue: number;
      cashRevenue: number;
      garmentsSold: number;
      transactionCount: number;
    }> = [];

    let total7DayRevenue = 0;
    let totalGarments = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      // Find matching sales
      const matchingSales = filteredSales.filter((s) => s.date.startsWith(dateStr));
      let dayRev = 0;
      let dayBilled = 0;
      let dayCash = 0;
      let dayPieces = 0;

      matchingSales.forEach((s) => {
        dayRev += s.grandTotal;
        if (s.companyId === 'comp_billed') {
          dayBilled += s.grandTotal;
        } else {
          dayCash += s.grandTotal;
        }
        s.items.forEach((item) => {
          dayPieces += item.qty;
        });
      });

      total7DayRevenue += dayRev;
      totalGarments += dayPieces;

      days.push({
        dateStr,
        label,
        dayOfWeek,
        totalRevenue: Math.round(dayRev),
        billedRevenue: Math.round(dayBilled),
        cashRevenue: Math.round(dayCash),
        garmentsSold: dayPieces,
        transactionCount: matchingSales.length,
      });
    }

    const peakDay = days.reduce(
      (max, d) => (d.totalRevenue > (max?.totalRevenue || 0) ? d : max),
      days[0]
    );

    return {
      sevenDaysData: days,
      sevenDaysStats: {
        total7DayRevenue,
        dailyAvg: Math.round(total7DayRevenue / 7),
        totalGarments,
        peakDay,
      },
    };
  }, [sales, filteredSales]);

  // Aggregate Sales KPIs
  const salesMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalDiscounts = 0;
    let totalTaxes = 0;
    let totalItemsSold = 0;
    let paymentModeCounts: Record<string, number> = { Cash: 0, UPI: 0, Card: 0, Split: 0 };
    let categorySales: Record<string, number> = { Men: 0, Women: 0, Kids: 0, Accessories: 0 };

    filteredSales.forEach((s) => {
      totalRevenue += s.grandTotal;
      totalDiscounts += s.itemDiscountsTotal + s.loyaltyDiscountAmount;
      totalTaxes += s.taxTotal;

      if (paymentModeCounts[s.paymentMode] !== undefined) {
        paymentModeCounts[s.paymentMode] += s.grandTotal;
      } else {
        paymentModeCounts[s.paymentMode] = s.grandTotal;
      }

      s.items.forEach((item) => {
        totalItemsSold += item.qty;
        if (categorySales[item.category] !== undefined) {
          categorySales[item.category] += item.total;
        } else {
          categorySales[item.category] = item.total;
        }
      });
    });

    const avgTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    return {
      totalRevenue,
      totalDiscounts,
      totalTaxes,
      totalItemsSold,
      avgTicket,
      paymentModeCounts,
      categorySales,
    };
  }, [filteredSales]);

  // Aggregate Purchases & Segregated Ledgers (Cash vs Billed)
  const purchaseMetrics = useMemo(() => {
    let totalBilled = 0;
    let totalCash = 0;
    let totalBilledTaxCredit = 0;

    purchases.forEach((p) => {
      if (p.purchaseType === 'billed') {
        totalBilled += p.totalAmount;
        totalBilledTaxCredit += p.taxAmount;
      } else {
        totalCash += p.totalAmount;
      }
    });

    const totalBilledPayable = vendors.reduce((s, v) => s + v.billedPayableBalance, 0);
    const totalCashPayable = vendors.reduce((s, v) => s + v.cashPayableBalance, 0);

    return {
      totalBilled,
      totalCash,
      totalCombined: totalBilled + totalCash,
      totalBilledTaxCredit,
      totalBilledPayable,
      totalCashPayable,
    };
  }, [purchases, vendors]);

  // Tax Accounting (GST Liability per Company)
  const taxReport = useMemo(() => {
    // Break down by companies
    return companies.map((c) => {
      const companySales = sales.filter((s) => s.companyId === c.id);
      const grossTurnover = companySales.reduce((acc, s) => acc + s.grandTotal, 0);
      const outputTaxCollected = companySales.reduce((acc, s) => acc + s.taxTotal, 0);
      const taxableTurnover = grossTurnover - outputTaxCollected;

      // Input tax credit for this company from billed vendor purchases
      const companyPurchases = purchases.filter(
        (p) => p.companyId === c.id && p.purchaseType === 'billed'
      );
      const inputTaxCredit = companyPurchases.reduce((acc, p) => acc + p.taxAmount, 0);
      const netTaxPayable = Math.max(0, outputTaxCollected - inputTaxCredit);

      return {
        companyId: c.id,
        companyName: c.name,
        companyType: c.type,
        taxId: c.taxId,
        invoiceCount: companySales.length,
        grossTurnover,
        taxableTurnover,
        outputCGST: outputTaxCollected / 2,
        outputSGST: outputTaxCollected / 2,
        outputTaxTotal: outputTaxCollected,
        inputTaxCredit,
        netTaxPayable,
      };
    });
  }, [companies, sales, purchases]);

  // Stock Valuation
  const stockValuation = useMemo(() => {
    const totalCost = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
    const totalRetail = products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);
    const grossMargin = totalRetail > 0 ? ((totalRetail - totalCost) / totalRetail) * 100 : 0;
    return {
      totalCost,
      totalRetail,
      grossMargin: grossMargin.toFixed(1),
    };
  }, [products]);

  // CSV Exporter
  const handleExportSalesCSV = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Company',
      'Customer',
      'Phone',
      'Payment Mode',
      'Subtotal',
      'Discount',
      'GST Tax',
      'Grand Total',
    ];
    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      s.date,
      `"${s.companyName}"`,
      `"${s.customerName}"`,
      s.customerPhone,
      s.paymentMode,
      s.subtotal,
      s.itemDiscountsTotal + s.loyaltyDiscountAmount,
      s.taxTotal,
      s.grandTotal,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GarmentOS_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Company Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Financial Reports & Tax Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated multi-company sales, cash vs. billed vendor analysis, and GST liability ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Company Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setSelectedCompanyId('all')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                selectedCompanyId === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Companies Combined
            </button>
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCompanyId(c.id)}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                  selectedCompanyId === c.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.name.split(' ')[0]} ({c.type.toUpperCase()})
              </button>
            ))}
          </div>

          <button
            onClick={handleExportSalesCSV}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Reports View Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold w-fit">
        <button
          onClick={() => setReportTab('analytics')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            reportTab === 'analytics'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Financial Reports & Tax Intelligence</span>
        </button>

        <button
          onClick={() => setReportTab('commissions')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
            reportTab === 'commissions'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>Staff Commissions & Targets</span>
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
            NEW
          </span>
        </button>
      </div>

      {reportTab === 'commissions' ? (
        <AssociateCommissionReport />
      ) : (
        <>
          {/* Top Sales & Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Net Sales Revenue
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            ₹{salesMetrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Across {filteredSales.length} POS transactions
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Output GST Collected
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            ₹{salesMetrics.totalTaxes.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            From official billed invoices
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Average Ticket Size
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            ₹{salesMetrics.avgTicket.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {salesMetrics.totalItemsSold} garments billed
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Inventory Valuation (Cost vs Retail)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {stockValuation.grossMargin}% Margin
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            ₹{stockValuation.totalCost.toLocaleString('en-IN')} cost / ₹{stockValuation.totalRetail.toLocaleString('en-IN')} retail
          </div>
        </div>
      </div>

      {/* SECTION: 7-DAY SALES VOLUME LINE CHART (RECHARTS) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Last 7 Days Sales Volume & Performance Trend</span>
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Recharts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily sales velocity, entity revenue split, and garment volume across retail entities.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setChartMetric('revenue')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                chartMetric === 'revenue'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total Sales (₹)
            </button>
            <button
              onClick={() => setChartMetric('breakdown')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                chartMetric === 'breakdown'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Billed vs Cash (₹)
            </button>
            <button
              onClick={() => setChartMetric('volume')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                chartMetric === 'volume'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Garments Sold (Pcs)
            </button>
          </div>
        </div>

        {/* 7-Day Performance Quick Glance Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 text-[11px]">7-Day Cumulative Revenue</span>
            <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">
              ₹{sevenDaysStats.total7DayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Daily Average Run-Rate</span>
            <div className="font-bold font-mono text-indigo-600 text-sm mt-0.5">
              ₹{sevenDaysStats.dailyAvg.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day
            </div>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Total Garments Sold</span>
            <div className="font-bold font-mono text-emerald-600 text-sm mt-0.5">
              {sevenDaysStats.totalGarments} pieces
            </div>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Peak Trading Day</span>
            <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">
              {sevenDaysStats.peakDay
                ? `${sevenDaysStats.peakDay.dayOfWeek} (₹${sevenDaysStats.peakDay.totalRevenue.toLocaleString('en-IN')})`
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Recharts Responsive Line Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sevenDaysData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dayOfWeek"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) =>
                  chartMetric === 'volume'
                    ? `${val} pcs`
                    : `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[200px]">
                        <div className="flex items-center justify-between font-bold border-b border-slate-700/80 pb-1 text-slate-200">
                          <span>{data.label} ({data.dayOfWeek})</span>
                          <span className="text-[10px] text-slate-400 font-mono">{data.dateStr}</span>
                        </div>
                        <div className="space-y-1 pt-1 font-mono">
                          <div className="flex justify-between items-center text-indigo-300">
                            <span className="font-sans text-[11px] text-slate-300">Total Sales:</span>
                            <strong className="text-white">₹{data.totalRevenue.toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="flex justify-between items-center text-emerald-300">
                            <span className="font-sans text-[11px] text-slate-300">Garments Sold:</span>
                            <strong>{data.garmentsSold} pcs</strong>
                          </div>
                          <div className="flex justify-between items-center text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                            <span>Official Billed:</span>
                            <span>₹{data.billedRevenue.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400 text-[10px]">
                            <span>Cash / Street:</span>
                            <span>₹{data.cashRevenue.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 pt-0.5">
                            {data.transactionCount} transactions
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />

              {chartMetric === 'revenue' && (
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  name="Total Daily Sales (₹)"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#4f46e5', fill: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#4338ca', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {chartMetric === 'breakdown' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="billedRevenue"
                    name="Official Billed Sales (₹)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 3, stroke: '#6366f1', fill: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#4f46e5' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cashRevenue"
                    name="Cash / Street Sales (₹)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, stroke: '#10b981', fill: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#059669' }}
                  />
                </>
              )}

              {chartMetric === 'volume' && (
                <Line
                  type="monotone"
                  dataKey="garmentsSold"
                  name="Garments Sold (Pcs)"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#0ea5e9', fill: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#0284c7' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 2: VENDOR PURCHASES SEGREGATION (CASH VS BILLED) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Vendor Purchases & Dual Ledger Balance Analysis</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison between Official Tax-Billed procurement and Direct Cash wholesale outlays.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Billed Purchases Card */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Official Billed Purchases (GST)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono">
                Tax Invoiced
              </span>
            </div>

            <div className="text-2xl font-bold font-mono text-indigo-700">
              ₹{purchaseMetrics.totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-t border-indigo-200/60 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Input Tax Credit (ITC Claimable):</span>
                <span className="font-bold text-slate-800">
                  ₹{purchaseMetrics.totalBilledTaxCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Billed Payable Outstanding:</span>
                <span className="font-bold text-rose-600">
                  ₹{purchaseMetrics.totalBilledPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Cash Purchases Card */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Cash / Off-Record Purchases
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono">
                Direct Cash Outlays
              </span>
            </div>

            <div className="text-2xl font-bold font-mono text-emerald-700">
              ₹{purchaseMetrics.totalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-t border-emerald-200/60 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Tax Credit:</span>
                <span className="font-bold text-slate-400">₹0.00 (Unbilled)</span>
              </div>
              <div className="flex justify-between">
                <span>Current Cash Payable Outstanding:</span>
                <span className="font-bold text-rose-600">
                  ₹{purchaseMetrics.totalCashPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: GST & TAX LIABILITY REPORT (BY COMPANY ENTITY) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>GST & Tax Liability Statement per Company Entity</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Output tax collected vs Input Tax Credit (ITC) for statutory accounting and filing.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Entity Legal Name</th>
                <th className="py-3 px-3">Tax / GST ID</th>
                <th className="py-3 px-3 text-right">Invoices</th>
                <th className="py-3 px-3 text-right">Taxable Turnover</th>
                <th className="py-3 px-3 text-right">Output CGST</th>
                <th className="py-3 px-3 text-right">Output SGST</th>
                <th className="py-3 px-3 text-right">Total Output Tax</th>
                <th className="py-3 px-3 text-right">Input Tax Credit</th>
                <th className="py-3 px-4 text-right">Net Tax Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxReport.map((row) => (
                <tr key={row.companyId} className="hover:bg-slate-50/70 transition-colors font-mono">
                  <td className="py-3 px-4 font-sans font-bold text-slate-900">
                    <div>{row.companyName}</div>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded font-sans ${
                        row.companyType === 'billed'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {row.companyType}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-sans text-xs">
                    {row.taxId}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 font-sans">
                    {row.invoiceCount}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-800">
                    ₹{row.taxableTurnover.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    ₹{row.outputCGST.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    ₹{row.outputSGST.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    ₹{row.outputTaxTotal.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 font-semibold">
                    -₹{row.inputTaxCredit.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-600 text-sm">
                    ₹{row.netTaxPayable.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: PAYMENT MODES & APPAREL CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Modes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Payment Mode Distribution
          </h3>

          <div className="space-y-2.5 pt-1">
            {Object.entries(salesMetrics.paymentModeCounts).map(([mode, amount]) => {
              const pct =
                salesMetrics.totalRevenue > 0
                  ? ((amount / salesMetrics.totalRevenue) * 100).toFixed(0)
                  : '0';

              return (
                <div key={mode} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{mode}</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-900 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clothing Category Sales Share */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Sales by Garment Category
          </h3>

          <div className="space-y-2.5 pt-1">
            {Object.entries(salesMetrics.categorySales).map(([cat, amount]) => {
              const pct =
                salesMetrics.totalRevenue > 0
                  ? ((amount / salesMetrics.totalRevenue) * 100).toFixed(0)
                  : '0';

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{cat}</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
