import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssociateCommissionConfig, AssociateCommissionPayout } from '../../types';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  Award,
  TrendingUp,
  Target,
  DollarSign,
  Printer,
  Sliders,
  CheckCircle2,
  X,
  Calendar,
  Sparkles,
  Users,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const AssociateCommissionReport: React.FC = () => {
  const {
    sales,
    associateCommissions,
    updateAssociateCommission,
    calculateAssociateCommissions,
    activeCompany,
  } = useApp();

  const now = new Date();
  const currentMonthPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentMonthPeriod);

  // Commission Target Config Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AssociateCommissionConfig | null>(null);

  // Compute payouts
  const payouts: AssociateCommissionPayout[] = useMemo(() => {
    return calculateAssociateCommissions(selectedPeriod);
  }, [calculateAssociateCommissions, selectedPeriod, sales, associateCommissions]);

  // Sort by revenue descending for leaderboard
  const sortedPayouts = useMemo(() => {
    return [...payouts].sort((a, b) => b.totalSalesRevenue - a.totalSalesRevenue);
  }, [payouts]);

  // Aggregate stats
  const totalFloorRevenue = payouts.reduce((sum, p) => sum + p.totalSalesRevenue, 0);
  const totalCommissionPayable = payouts.reduce((sum, p) => sum + p.totalPayout, 0);
  const totalBillsBooked = payouts.reduce((sum, p) => sum + p.billsHandled, 0);

  const handleOpenEditConfig = (assocName: string) => {
    const config = associateCommissions.find((c) => c.associateName === assocName) || {
      associateName: assocName,
      monthlySalesTarget: 150000,
      baseCommissionPercent: 1.5,
      bonusCommissionPercent: 2.5,
    };
    setEditingConfig(config);
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;
    updateAssociateCommission(editingConfig);
    setIsConfigModalOpen(false);
  };

  // Print 58mm Thermal Commission Payout Voucher
  const handlePrintPayoutSlip = (payout: AssociateCommissionPayout) => {
    const formattedMonth = new Date(`${selectedPeriod}-01`).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });

    const receiptHtml = `
      <div style="font-family: monospace; font-size: 11px; line-height: 1.3; text-align: center; color: #000; width: 58mm; margin: 0 auto; padding: 2px;">
        <div style="font-weight: bold; font-size: 13px;">${activeCompany.name.toUpperCase()}</div>
        <div style="font-size: 9px; margin-top: 1px;">STAFF COMMISSION PAYOUT SLIP</div>
        <div style="font-size: 8px;">PERFORMANCE & INCENTIVE STATEMENT</div>
        <hr style="border: 0; border-top: 1px dashed #000; margin: 4px 0;" />
        
        <div style="text-align: left; font-size: 9px;">
          <div><b>Associate:</b> ${payout.associateName}</div>
          <div><b>Period:</b> ${formattedMonth}</div>
          <div><b>Date Issued:</b> ${new Date().toLocaleDateString('en-IN')}</div>
        </div>

        <hr style="border: 0; border-top: 1px dashed #000; margin: 4px 0;" />
        <table style="width: 100%; font-size: 9px; text-align: left; border-collapse: collapse;">
          <tr>
            <td style="padding: 2px 0;">Total Sales Booked:</td>
            <td style="text-align: right; font-weight: bold;">Rs. ${payout.totalSalesRevenue.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Bills Handled:</td>
            <td style="text-align: right;">${payout.billsHandled} txns</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Monthly Target:</td>
            <td style="text-align: right;">Rs. ${payout.targetAmount.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Target Achieved:</td>
            <td style="text-align: right; font-weight: bold;">${payout.targetAchievedPercent}%</td>
          </tr>
        </table>

        <hr style="border: 0; border-top: 1px dashed #000; margin: 4px 0;" />
        <table style="width: 100%; font-size: 9px; text-align: left; border-collapse: collapse;">
          <tr>
            <td style="padding: 2px 0;">Base Commission:</td>
            <td style="text-align: right;">Rs. ${payout.commissionAmount.toLocaleString('en-IN')}</td>
          </tr>
          ${
            payout.bonusAmount > 0
              ? `<tr>
                  <td style="padding: 2px 0; color: #000;">Over-Target Bonus:</td>
                  <td style="text-align: right; font-weight: bold;">+Rs. ${payout.bonusAmount.toLocaleString('en-IN')}</td>
                </tr>`
              : ''
          }
        </table>

        <hr style="border: 0; border-top: 1px dashed #000; margin: 4px 0;" />
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-top: 2px;">
          <span>NET PAYOUT:</span>
          <span>Rs. ${payout.totalPayout.toLocaleString('en-IN')}</span>
        </div>

        <div style="margin-top: 18px; display: flex; justify-content: space-between; font-size: 8px; text-align: center;">
          <div style="border-top: 1px solid #000; width: 45%; padding-top: 2px;">Manager Sign</div>
          <div style="border-top: 1px solid #000; width: 45%; padding-top: 2px;">Associate Sign</div>
        </div>
        <div style="font-size: 7px; margin-top: 8px; text-align: center;">Garment OS Commission & Payroll Module</div>
      </div>
    `;

    printThermalReceiptHtml(receiptHtml);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Period Selector & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Sales Associate Commission & Incentive Leaderboard</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated floor sales commission tracking, monthly revenue targets, and printable payout vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Period:</span>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold font-mono text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Floor Sales Booked
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{totalFloorRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{totalBillsBooked} transactions handled</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Total Commission Payable
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            ₹{totalCommissionPayable.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Base + performance bonuses</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Top Performing Associate
          </span>
          <div className="text-base font-bold text-indigo-700 mt-1 truncate">
            {sortedPayouts[0]?.associateName || 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ₹{sortedPayouts[0]?.totalSalesRevenue.toLocaleString('en-IN') || 0} (
            {sortedPayouts[0]?.targetAchievedPercent || 0}% Target)
          </div>
        </div>
      </div>

      {/* Leaderboard & Commission Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Staff Commission Breakdown ({sortedPayouts.length} associates)</span>
          </h4>
          <span className="text-[11px] text-slate-500">
            Click target settings to adjust quotas or commission %
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Rank & Associate</th>
                <th className="py-2.5 px-2 text-right">Sales Booked</th>
                <th className="py-2.5 px-2 text-right">Bills</th>
                <th className="py-2.5 px-3">Target & Attainment</th>
                <th className="py-2.5 px-2 text-right">Base Comm</th>
                <th className="py-2.5 px-2 text-right">Bonus</th>
                <th className="py-2.5 px-3 text-right">Total Payout</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPayouts.map((payout, idx) => {
                const isTargetAchieved = payout.targetAchievedPercent >= 100;

                return (
                  <tr key={payout.associateName} className="hover:bg-slate-50/70 transition-colors">
                    {/* Rank & Name */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{payout.associateName}</div>
                          {isTargetAchieved && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 inline-block mt-0.5">
                              Target Met 🏆
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Sales Booked */}
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                      ₹{payout.totalSalesRevenue.toLocaleString('en-IN')}
                    </td>

                    {/* Bills */}
                    <td className="py-3 px-2 text-right font-mono text-slate-600">
                      {payout.billsHandled}
                    </td>

                    {/* Target Progress Bar */}
                    <td className="py-3 px-3 min-w-[160px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500">₹{payout.targetAmount.toLocaleString('en-IN')}</span>
                          <span
                            className={`font-bold ${
                              isTargetAchieved ? 'text-emerald-700' : 'text-slate-700'
                            }`}
                          >
                            {payout.targetAchievedPercent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isTargetAchieved
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, payout.targetAchievedPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Base Commission */}
                    <td className="py-3 px-2 text-right font-mono text-slate-700">
                      ₹{payout.commissionAmount.toLocaleString('en-IN')}
                    </td>

                    {/* Over-target Bonus */}
                    <td className="py-3 px-2 text-right font-mono font-semibold text-emerald-700">
                      {payout.bonusAmount > 0 ? `+₹${payout.bonusAmount.toLocaleString('en-IN')}` : '₹0'}
                    </td>

                    {/* Total Payout */}
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-sm text-slate-900">
                      ₹{payout.totalPayout.toLocaleString('en-IN')}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrintPayoutSlip(payout)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Print 58mm Thermal Payout Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditConfig(payout.associateName)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Target & Commission Rates"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target & Commission Config Modal */}
      {isConfigModalOpen && editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Configure Commission: {editingConfig.associateName}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set monthly target and commission rates for this associate.
                </p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Monthly Sales Target (₹)</label>
                <input
                  type="number"
                  min={10000}
                  step={5000}
                  required
                  value={editingConfig.monthlySalesTarget}
                  onChange={(e) =>
                    setEditingConfig({
                      ...editingConfig,
                      monthlySalesTarget: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Commission (%)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={20}
                    step={0.1}
                    required
                    value={editingConfig.baseCommissionPercent}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        baseCommissionPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">On all sales booked</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Over-Target Bonus (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.1}
                    value={editingConfig.bonusCommissionPercent ?? 0}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        bonusCommissionPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">On sales above target</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Commission Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
