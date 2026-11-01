import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Company, UserRole, UserAccount } from '../../types';
import { GarmentOsLogo } from '../common/GarmentOsLogo';
import {
  Building2,
  Users,
  ShieldCheck,
  Receipt,
  QrCode,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Lock,
  Printer,
  Sparkles,
  Phone,
  MapPin,
  FileText,
  UserCheck,
} from 'lucide-react';

interface FirstTimeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstTimeSetupModal: React.FC<FirstTimeSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    companies,
    updateCompany,
    users,
    updateUser,
    addUser,
    storeUpiId,
    setStoreUpiId,
    storeUpiName,
    setStoreUpiName,
    qrPrintSize,
    setQrPrintSize,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // --- Step 1: Billing Entities State ---
  const billedCompany = companies.find((c) => c.type === 'billed') || companies[0];
  const cashCompany = companies.find((c) => c.type === 'cash') || companies[1] || companies[0];

  const [billedName, setBilledName] = useState(billedCompany?.name || 'Garment OS Apparel Pvt Ltd');
  const [billedGstin, setBilledGstin] = useState(billedCompany?.taxId || '07AABCG1234F1Z5');
  const [billedAddress, setBilledAddress] = useState(billedCompany?.address || 'Shop 104, Fashion Galleria, Central Market');
  const [billedPhone, setBilledPhone] = useState(billedCompany?.phone || '+91 98112 34567');
  const [billedPrefix, setBilledPrefix] = useState(billedCompany?.invoicePrefix || 'INV-');

  const [cashName, setCashName] = useState(cashCompany?.name || 'Garment OS Cash Retail');
  const [cashAddress, setCashAddress] = useState(cashCompany?.address || 'Counter 2, Main Street Retail Market');
  const [cashPhone, setCashPhone] = useState(cashCompany?.phone || '+91 98765 43210');
  const [cashPrefix, setCashPrefix] = useState(cashCompany?.invoicePrefix || 'CSH-');

  // --- Step 2: Staff & RBAC State ---
  const [staffList, setStaffList] = useState<UserAccount[]>(() => {
    return users.map((u) => ({ ...u }));
  });

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('sales_cashier');
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);

  // --- Step 3: UPI & Hardware State ---
  const [upiIdInput, setUpiIdInput] = useState(storeUpiId || 'garmentos@icici');
  const [upiNameInput, setUpiNameInput] = useState(storeUpiName || 'Garment OS Store');

  if (!isOpen) return null;

  const handleUpdateStaffPassword = (userId: string, newPass: string) => {
    setStaffList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
  };

  const handleAddNewStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffUsername.trim() || !newStaffPassword.trim()) {
      alert('Please fill out staff name, username and password.');
      return;
    }

    const created: UserAccount = {
      id: `user_${Date.now()}`,
      fullName: newStaffName.trim(),
      username: newStaffUsername.trim().toLowerCase(),
      password: newStaffPassword.trim(),
      role: newStaffRole,
      avatar: newStaffName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'ST',
    };

    setStaffList((prev) => [...prev, created]);
    setNewStaffName('');
    setNewStaffUsername('');
    setNewStaffPassword('');
    setShowAddStaffForm(false);
  };

  const handleCompleteSetup = () => {
    // 1. Save Companies
    if (billedCompany) {
      updateCompany({
        ...billedCompany,
        name: billedName.trim() || billedCompany.name,
        taxId: billedGstin.trim() || billedCompany.taxId,
        address: billedAddress.trim() || billedCompany.address,
        phone: billedPhone.trim() || billedCompany.phone,
        invoicePrefix: billedPrefix.trim() || billedCompany.invoicePrefix,
      });
    }

    if (cashCompany && cashCompany.id !== billedCompany?.id) {
      updateCompany({
        ...cashCompany,
        name: cashName.trim() || cashCompany.name,
        address: cashAddress.trim() || cashCompany.address,
        phone: cashPhone.trim() || cashCompany.phone,
        invoicePrefix: cashPrefix.trim() || cashCompany.invoicePrefix,
      });
    }

    // 2. Save Staff Accounts
    staffList.forEach((st) => {
      const existing = users.find((u) => u.id === st.id);
      if (existing) {
        updateUser(st);
      } else {
        addUser({
          fullName: st.fullName,
          username: st.username,
          password: st.password,
          role: st.role,
          avatar: st.avatar,
        });
      }
    });

    // 3. Save Payment & Defaults
    setStoreUpiId(upiIdInput.trim() || 'garmentos@icici');
    setStoreUpiName(upiNameInput.trim() || 'Garment OS Store');

    // Mark onboarding complete
    try {
      localStorage.setItem('garment_os_onboarding_completed', 'true');
    } catch {}

    onClose();
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('garment_os_onboarding_completed', 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none no-print overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Garment OS Branding & Steps Progress */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <GarmentOsLogo size="md" theme="dark" variant="full" />
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-white font-medium hover:underline cursor-pointer"
            >
              Skip for now
            </button>
          </div>

          <div className="mt-5">
            <h2 className="text-lg font-black tracking-tight text-white">
              {step === 1 && 'Step 1: Setup Your Billing Entities'}
              {step === 2 && 'Step 2: Staff, Roles & Permissions'}
              {step === 3 && 'Step 3: UPI Payments & Thermal Receipts'}
              {step === 4 && 'Step 4: All Set! Launch Your Terminal'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 1 && 'Configure your dual-entity setup: Billed (GST) and Cash Memo retail profiles.'}
              {step === 2 && 'Set PINs and permissions for Cashiers, Store Managers, and Admins.'}
              {step === 3 && 'Set your store UPI QR code details and default receipt preferences.'}
              {step === 4 && 'Your Garment OS store profile is ready to begin daily retail operations.'}
            </p>
          </div>

          {/* Stepper Indicators */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  step === s
                    ? 'bg-indigo-500'
                    : step > s
                    ? 'bg-emerald-500'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* STEP 1: BILLING ENTITIES */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-950 text-xs leading-relaxed flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Dual Company Architecture:</span> Garment OS keeps legal GST billed sales and vendor ledgers separate from cash counter memos. Configure details for both below.
                </div>
              </div>

              {/* Billed Entity Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="font-extrabold text-sm text-slate-900">1. Billed Entity (GST Registered)</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Tax Invoices
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Legal Company / Firm Name *</label>
                    <input
                      type="text"
                      value={billedName}
                      onChange={(e) => setBilledName(e.target.value)}
                      placeholder="e.g. Garment OS Apparel Pvt Ltd"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GSTIN Number *</label>
                    <input
                      type="text"
                      value={billedGstin}
                      onChange={(e) => setBilledGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 07AABCG1234F1Z5"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Store Address</label>
                    <input
                      type="text"
                      value={billedAddress}
                      onChange={(e) => setBilledAddress(e.target.value)}
                      placeholder="Shop 104, Fashion Galleria"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={billedPhone}
                        onChange={(e) => setBilledPhone(e.target.value)}
                        placeholder="+91 98112 34567"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Invoice Prefix</label>
                      <input
                        type="text"
                        value={billedPrefix}
                        onChange={(e) => setBilledPrefix(e.target.value.toUpperCase())}
                        placeholder="INV-"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash Entity Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="font-extrabold text-sm text-slate-900">2. Cash Entity (Counter Cash Memo)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Cash Memos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Shop / Outlet Name *</label>
                    <input
                      type="text"
                      value={cashName}
                      onChange={(e) => setCashName(e.target.value)}
                      placeholder="e.g. Garment OS Cash Retail"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Outlet Address</label>
                    <input
                      type="text"
                      value={cashAddress}
                      onChange={(e) => setCashAddress(e.target.value)}
                      placeholder="Counter 2, Main Market"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Store Phone</label>
                    <input
                      type="text"
                      value={cashPhone}
                      onChange={(e) => setCashPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cash Memo Prefix</label>
                    <input
                      type="text"
                      value={cashPrefix}
                      onChange={(e) => setCashPrefix(e.target.value.toUpperCase())}
                      placeholder="CSH-"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STAFF, ROLES & PERMISSIONS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl space-y-1.5 text-xs">
                <div className="font-extrabold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Role-Based Access Control (RBAC)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Configure passwords / PINs for your staff. Cashiers have access to POS, Sales Register, and Returns. Store Managers have access to stock and registers. Admins have access to everything.
                </p>
              </div>

              {/* Staff Accounts List */}
              <div className="space-y-2.5">
                {staffList.map((st) => (
                  <div
                    key={st.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                        {st.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">{st.fullName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : st.role === 'store_manager'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {st.role === 'admin' ? 'Admin' : st.role === 'store_manager' ? 'Store Manager' : 'Cashier'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Username: <code className="text-slate-800 font-bold">{st.username}</code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white px-2 py-1 border border-slate-300 rounded-lg">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500 font-medium">PIN:</span>
                        <input
                          type="text"
                          value={st.password}
                          onChange={(e) => handleUpdateStaffPassword(st.id, e.target.value)}
                          className="w-16 font-mono font-bold text-xs text-indigo-700 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Staff Button / Form */}
              {!showAddStaffForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddStaffForm(true)}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl font-bold text-indigo-700 hover:text-indigo-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Staff Member</span>
                </button>
              ) : (
                <form
                  onSubmit={handleAddNewStaff}
                  className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in"
                >
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>New Staff Member Details</span>
                    <button
                      type="button"
                      onClick={() => setShowAddStaffForm(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Username</label>
                      <input
                        type="text"
                        value={newStaffUsername}
                        onChange={(e) => setNewStaffUsername(e.target.value)}
                        placeholder="rahul"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">PIN / Password</label>
                      <input
                        type="text"
                        value={newStaffPassword}
                        onChange={(e) => setNewStaffPassword(e.target.value)}
                        placeholder="1234"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role</label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="sales_cashier">Sales Cashier</option>
                        <option value="store_manager">Store Manager</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStaffForm(false)}
                      className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Save Staff
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 3: UPI & RECEIPT DEFAULTS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <span className="font-extrabold text-sm text-slate-900">
                    Store UPI ID for Instant Payment QR
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Every bill will automatically generate and print an <strong>XL-sized UPI QR code</strong> formatted with your payee name and exact bill total so customers can scan and pay with GPay, PhonePe, Paytm, etc.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">UPI VPA / ID *</label>
                    <input
                      type="text"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value.trim())}
                      placeholder="e.g. shopname@icici, mobile@okhdfcbank"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payee Business Name *</label>
                    <input
                      type="text"
                      value={upiNameInput}
                      onChange={(e) => setUpiNameInput(e.target.value)}
                      placeholder="e.g. Garment OS Retail"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Receipt Printer Preferences */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Printer className="w-5 h-5 text-slate-700" />
                  <span className="font-extrabold text-sm text-slate-900">
                    Receipt Print Formatting
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Always Print in Bold: ON (Deep black thermal ink mode enabled by default)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Payment QR Code: ON by default in XL size</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Clean Garment Line Items: Item SKU excluded from receipt</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: READY TO LAUNCH RECAP */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">Your Store Profile is Ready!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  You can now start creating invoices, printing bold receipts with XL QR codes, managing vendor ledgers, and recording day registers.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Billed Company:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{billedName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Cash Outlet:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{cashName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Staff Accounts:</span>
                  <span className="font-bold text-indigo-700">{staffList.length} Users Configured</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">UPI QR Payee:</span>
                  <span className="font-mono font-bold text-slate-900">{upiIdInput}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Skip Setup
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev + 1) as any)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteSetup}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Garment OS Terminal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
