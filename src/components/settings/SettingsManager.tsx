import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanySettings } from '../companies/CompanySettings';
import { UserAccount, UserRole, ALL_APP_TABS, QR_SIZE_PIXELS } from '../../types';
import {
  Settings,
  Users,
  Building2,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  Plus,
  Check,
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Sliders,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  UserCheck,
  CheckSquare,
  Square,
  RotateCcw,
  Clock,
  Award,
  Barcode,
  QrCode,
  Smartphone,
  IndianRupee,
  Database,
} from 'lucide-react';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { UpiPaymentQr } from '../common/UpiPaymentQr';
import { SupabaseDatabaseSettings } from './SupabaseDatabaseSettings';
import { FirstTimeSetupModal } from '../onboarding/FirstTimeSetupModal';

export const SettingsManager: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    updateUserPassword,
    updateUserRole,
    updateUserPermissions,
    autoLockMinutes,
    setAutoLockMinutes,
    globalLowStockThreshold,
    setGlobalLowStockThreshold,
    soundEnabled,
    setSoundEnabled,
    loyaltyConfig,
    updateLoyaltyConfig,
    switchUser,
    codePrintType,
    setCodePrintType,
    qrPrintSize,
    setQrPrintSize,
    storeUpiId,
    setStoreUpiId,
    storeUpiName,
    setStoreUpiName,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'staff' | 'entities' | 'preferences' | 'database'>('staff');
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  // UPI Settings State
  const [upiIdInput, setUpiIdInput] = useState(storeUpiId);
  const [upiNameInput, setUpiNameInput] = useState(storeUpiName);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editFormData, setEditFormData] = useState<{
    fullName: string;
    username: string;
    role: UserRole;
    designation: string;
  }>({
    fullName: '',
    username: '',
    role: 'sales_cashier',
    designation: '',
  });

  // Password Change Modal
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // Permissions Modal
  const [permissionTargetUser, setPermissionTargetUser] = useState<UserAccount | null>(null);
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);

  // Add User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<{
    fullName: string;
    username: string;
    password: string;
    role: UserRole;
    designation: string;
    allowedTabs: string[];
  }>({
    fullName: '',
    username: '',
    password: '',
    role: 'sales_cashier',
    designation: 'Sales Cashier',
    allowedTabs: ['pos', 'returns', 'alterations'],
  });

  // Feedback Toast
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Open Edit User
  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      designation: user.designation || '',
    });
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editFormData.fullName.trim() || !editFormData.username.trim()) {
      showToast('Name and username are required', 'error');
      return;
    }

    // Check username uniqueness
    const exists = users.find(
      (u) =>
        u.id !== editingUser.id &&
        u.username.toLowerCase() === editFormData.username.trim().toLowerCase()
    );
    if (exists) {
      showToast('This username is already taken by another staff member.', 'error');
      return;
    }

    updateUser({
      ...editingUser,
      fullName: editFormData.fullName.trim(),
      username: editFormData.username.trim().toLowerCase(),
      role: editFormData.role,
      designation: editFormData.designation.trim(),
    });

    setEditingUser(null);
    showToast(`Staff profile for ${editFormData.fullName} updated successfully!`);
  };

  // Open Password Modal
  const handleOpenPasswordModal = (user: UserAccount) => {
    setPasswordTargetUser(user);
    setNewPassword('');
    setShowPassword(false);
    setPasswordFeedback(null);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;
    if (!newPassword.trim() || newPassword.length < 4) {
      setPasswordFeedback('Password must be at least 4 characters.');
      return;
    }

    updateUserPassword(passwordTargetUser.id, newPassword.trim());
    setPasswordTargetUser(null);
    showToast(`Password for ${passwordTargetUser.fullName} updated successfully!`);
  };

  // Open Permissions Modal
  const handleOpenPermissions = (user: UserAccount) => {
    setPermissionTargetUser(user);
    if (user.allowedTabs && user.allowedTabs.length > 0) {
      setSelectedTabs([...user.allowedTabs]);
    } else {
      // Use role defaults
      const defaults = ALL_APP_TABS.filter((tab) => tab.defaultRoles.includes(user.role)).map(
        (t) => t.id
      );
      setSelectedTabs(defaults);
    }
  };

  const handleToggleTabPermission = (tabId: string) => {
    setSelectedTabs((prev) =>
      prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
    );
  };

  const handleSavePermissions = () => {
    if (!permissionTargetUser) return;
    updateUserPermissions(permissionTargetUser.id, selectedTabs);
    setPermissionTargetUser(null);
    showToast(`Permissions updated for ${permissionTargetUser.fullName}!`);
  };

  const handleResetToRoleDefaultPermissions = () => {
    if (!permissionTargetUser) return;
    const defaults = ALL_APP_TABS.filter((tab) =>
      tab.defaultRoles.includes(permissionTargetUser.role)
    ).map((t) => t.id);
    setSelectedTabs(defaults);
  };

  // Create New User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.fullName.trim() || !newUserData.username.trim() || !newUserData.password.trim()) {
      showToast('Full name, username, and password are required', 'error');
      return;
    }

    const exists = users.find(
      (u) => u.username.toLowerCase() === newUserData.username.trim().toLowerCase()
    );
    if (exists) {
      showToast('This username is already taken. Please choose another.', 'error');
      return;
    }

    addUser({
      fullName: newUserData.fullName.trim(),
      username: newUserData.username.trim().toLowerCase(),
      password: newUserData.password.trim(),
      role: newUserData.role,
      designation: newUserData.designation.trim() || 'Store Associate',
      avatar: newUserData.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      allowedTabs: newUserData.allowedTabs,
    });

    setIsAddUserOpen(false);
    setNewUserData({
      fullName: '',
      username: '',
      password: '',
      role: 'sales_cashier',
      designation: 'Sales Cashier',
      allowedTabs: ['pos', 'returns', 'alterations'],
    });
    showToast(`New staff member added successfully!`);
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      showToast('You cannot delete your own active logged-in user account.', 'error');
      return;
    }
    if (confirm(`Are you sure you want to delete staff account "${user.fullName}" (@${user.username})?`)) {
      const res = deleteUser(user.id);
      if (res.success) {
        showToast(`Staff account for ${user.fullName} removed.`);
      } else {
        showToast(res.message || 'Error deleting user', 'error');
      }
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'store_manager':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'sales_cashier':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Store Administration & Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-company billing entities, staff credentials, custom module permissions, and POS security rules.
          </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsSetupWizardOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Launch Setup Wizard</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Staff, Roles & Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'entities'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Billing Entities</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Security & Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cloud Database (Supabase)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: Staff, Roles & Permissions */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Staff Accounts & Role-Based Permissions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure user roles, update secure login passwords, and grant or restrict granular module access.
              </p>
            </div>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => {
              const isCurrent = user.id === currentUser.id;
              const allowedCount = user.allowedTabs
                ? user.allowedTabs.length
                : ALL_APP_TABS.filter((t) => t.defaultRoles.includes(user.role)).length;

              return (
                <div
                  key={user.id}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs ${
                    isCurrent
                      ? 'border-indigo-500/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">{user.fullName}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(
                          user.role
                        )}`}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Designation & Permissions Info */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400">Designation:</span>
                        <span className="font-medium text-slate-800">{user.designation || 'Staff'}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400">Module Access:</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono text-[11px]">
                          {allowedCount} of {ALL_APP_TABS.length} tabs
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400">Password:</span>
                        <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          •••••••
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        title="Edit profile & role"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenPasswordModal(user)}
                        title="Change security password"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenPermissions(user)}
                        title="Configure module permissions"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          title="Delete staff member"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {!isCurrent && (
                      <button
                        onClick={() => {
                          switchUser(user);
                          showToast(`Switched active session to ${user.fullName} (${user.role}).`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        Switch To
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Entities & Companies */}
      {activeTab === 'entities' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <CompanySettings />
        </div>
      )}

      {/* TAB 3: Security & Terminal Preferences */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Code Print Format: Barcode vs QR Code */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Thermal Print Code Format (Barcode vs QR Code)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select the scannable identifier format printed across sales bills, clothing price tags, tailoring slips, and credit notes.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 w-fit">
                Active Format: {codePrintType === 'qr' ? '2D QR Code' : '1D Barcode (Code 128)'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: 1D Barcode (Code 128) */}
              <div
                onClick={() => {
                  setCodePrintType('barcode');
                  showToast('Code print format set to 1D Barcode (Code 128).');
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  codePrintType === 'barcode'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Barcode className="w-5 h-5 text-indigo-600" />
                      <span className="font-extrabold text-sm text-slate-900">
                        1D Barcode (Code 128)
                      </span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        codePrintType === 'barcode'
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {codePrintType === 'barcode' && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Authentic Code 128 linear barcode format. Scannable with all handheld USB & Bluetooth laser barcode guns, counter optical readers, and traditional POS hardware.
                  </p>
                </div>

                {/* Sample Live Barcode Preview */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col items-center justify-center bg-white p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Live Sample Preview:
                  </span>
                  <BarcodeSvg
                    value="INV-2026"
                    type="barcode"
                    width={140}
                    height={30}
                    showText={true}
                  />
                </div>
              </div>

              {/* Option 2: 2D QR Code */}
              <div
                onClick={() => {
                  setCodePrintType('qr');
                  showToast('Code print format set to 2D QR Code.');
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  codePrintType === 'qr'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-indigo-600" />
                      <span className="font-extrabold text-sm text-slate-900">
                        2D QR Code (ISO Standard)
                      </span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        codePrintType === 'qr'
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {codePrintType === 'qr' && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Standard 2D Matrix QR Code. Scannable with smartphone cameras, mobile POS devices, 2D barcode imagers, and inventory camera scanners.
                  </p>
                </div>

                {/* Sample Live QR Code Preview */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col items-center justify-center bg-white p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Live Sample Preview ({QR_SIZE_PIXELS[qrPrintSize]}px):
                  </span>
                  <BarcodeSvg
                    value="INV-2026"
                    type="qr"
                    qrSize={QR_SIZE_PIXELS[qrPrintSize]}
                    showText={true}
                  />
                </div>
              </div>
            </div>

            {/* QR Print Dimensions Selector */}
            <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Thermal QR Code Print Size (58mm Roll)
                </label>
                <p className="text-[11px] text-slate-500">
                  Choose the dimensions for printed QR codes (UPI payment & invoice verification) to ensure fast scanning on thermal paper.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'compact', label: 'Compact', px: '80px', desc: 'Minimal paper' },
                  { key: 'medium', label: 'Medium', px: '105px', desc: 'Standard' },
                  { key: 'large', label: 'Large (Rec)', px: '130px', desc: 'Fast scanning' },
                  { key: 'xlarge', label: 'Extra Large', px: '155px', desc: 'Max 58mm width' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setQrPrintSize(item.key as any);
                      showToast(`QR Print Size set to ${item.label} (${item.px}).`);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                      qrPrintSize === item.key
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between gap-1">
                      <span>{item.label}</span>
                      <span className="font-mono text-[10px] text-indigo-600">{item.px}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Store UPI & Digital Payments (Dynamic QR Code) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    UPI & Digital Payments (Dynamic Amount QR Code)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customers scanning this QR code in GPay, PhonePe, Paytm, or BHIM will see your store name and the exact bill amount automatically pre-filled and locked.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                Current UPI: {storeUpiId || 'Not Set'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left 2 Cols: Form Inputs */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store UPI ID / Virtual Payment Address (VPA) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Enter your merchant or store UPI VPA linked to your settlement bank account.
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      value={upiIdInput}
                      onChange={(e) => setUpiIdInput(e.target.value)}
                      placeholder="e.g. garmentos@icici, 9876543210@paytm, store@okaxis"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Supported handles: @icici, @okaxis, @okhdfcbank, @oksbi, @paytm, @ybl, @axl, etc.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payee / Merchant Business Display Name
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    The business name shown to customers inside their UPI payment app when authorizing payment.
                  </p>
                  <input
                    type="text"
                    value={upiNameInput}
                    onChange={(e) => setUpiNameInput(e.target.value)}
                    placeholder="e.g. Garment OS Retail, Verve Threads Store"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!upiIdInput.trim()) {
                        showToast('Please enter a valid UPI ID (e.g. store@icici)', 'error');
                        return;
                      }
                      setStoreUpiId(upiIdInput.trim());
                      setStoreUpiName(upiNameInput.trim() || 'Garment OS Retail');
                      showToast('Store UPI Payment Settings updated successfully!');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Save UPI Payment Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUpiIdInput('garmentos@icici');
                      setUpiNameInput('Garment OS Retail');
                      setStoreUpiId('garmentos@icici');
                      setStoreUpiName('Garment OS Retail');
                      showToast('Reset to default Garment OS demo UPI ID.');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    Reset to Demo
                  </button>
                </div>
              </div>

              {/* Right 1 Col: Live Sample QR Preview */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Live Dynamic UPI QR Preview ({QR_SIZE_PIXELS[qrPrintSize]}px):
                </span>
                <UpiPaymentQr
                  upiId={upiIdInput.trim() || 'garmentos@icici'}
                  payeeName={upiNameInput.trim() || 'Garment OS Retail'}
                  amount={1499.0}
                  transactionNote="POS Retail Demo Bill"
                  size={Math.min(150, QR_SIZE_PIXELS[qrPrintSize])}
                  showDetails={true}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          {/* Security & Inactivity Lock */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Front UI Lock & Inactivity Guard</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Auto-Lock Inactivity Idle Timer
              </label>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Automatically lock the terminal screen after a period of staff idle time to protect billing and customer records.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { value: 5, label: '5 Mins' },
                  { value: 10, label: '10 Mins' },
                  { value: 15, label: '15 Mins' },
                  { value: 30, label: '30 Mins' },
                  { value: 0, label: 'Disabled' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setAutoLockMinutes(opt.value);
                      showToast(
                        opt.value === 0
                          ? 'Auto-lock disabled.'
                          : `Auto-lock set to ${opt.value} minutes.`
                      );
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      autoLockMinutes === opt.value
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Global Low-Stock Alert Threshold
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Triggers visual badges and notification alerts in the inventory manager when quantities reach this level.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={globalLowStockThreshold}
                  onChange={(e) => setGlobalLowStockThreshold(parseInt(e.target.value, 10) || 1)}
                  className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500">garment pieces</span>
              </div>
            </div>
          </div>

          {/* Sound & Loyalty Preferences */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Audio Feedback & Loyalty Rules</h3>
            </div>

            {/* Audio Feedback Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Barcode Scanner Audio Beep
                </span>
                <span className="text-[11px] text-slate-500">
                  Synthesize an audio confirmation beep upon successful camera or USB barcode scans.
                </span>
              </div>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  showToast(`Scanner sound ${!soundEnabled ? 'enabled' : 'muted'}.`);
                }}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Loyalty Configuration */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Loyalty Points Rule</span>
                  <span className="text-[11px] text-slate-500">
                    Points awarded per ₹100 spent at checkout
                  </span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={loyaltyConfig.pointsPerHundredSpent}
                  onChange={(e) =>
                    updateLoyaltyConfig({
                      ...loyaltyConfig,
                      pointsPerHundredSpent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-20 px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-right"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Redemption Value</span>
                  <span className="text-[11px] text-slate-500">Rupee discount per 1 point</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    max={10}
                    value={loyaltyConfig.pointRedemptionValue}
                    onChange={(e) =>
                      updateLoyaltyConfig({
                        ...loyaltyConfig,
                        pointRedemptionValue: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-20 px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Cloud Database (Supabase) */}
      {activeTab === 'database' && <SupabaseDatabaseSettings />}

      {/* MODAL 1: Edit User Profile & Role */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Edit Staff Profile & Role</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username (Login ID)</label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="admin">Admin (Full System Access)</option>
                  <option value="store_manager">Store Manager (Operations & Till)</option>
                  <option value="sales_cashier">Sales Cashier (POS & Alterations)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Role sets default permission boundaries across business reports, day register, and settings.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation / Title</label>
                <input
                  type="text"
                  value={editFormData.designation}
                  onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                  placeholder="e.g. Floor Stylist, Chief Cashier"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Password */}
      {passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Change Password</h3>
              </div>
              <button
                onClick={() => setPasswordTargetUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Updating password for:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {passwordTargetUser.fullName}{' '}
                  <span className="font-normal font-mono text-slate-500">
                    (@{passwordTargetUser.username})
                  </span>
                </span>
              </div>

              {passwordFeedback && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  {passwordFeedback}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">New Staff Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordTargetUser(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Granular Permissions Checklist */}
      {permissionTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    Module Permissions: {permissionTargetUser.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Role: {permissionTargetUser.role.replace('_', ' ')} • Select allowed tabs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermissionTargetUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Presets:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTabs(ALL_APP_TABS.map((t) => t.id))}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTabs(['pos'])}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-[11px] font-semibold cursor-pointer"
                  >
                    POS Only
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToRoleDefaultPermissions}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Role Default</span>
                  </button>
                </div>
              </div>

              {/* Checklist Grid */}
              <div className="space-y-2">
                {ALL_APP_TABS.map((tab) => {
                  const isChecked = selectedTabs.includes(tab.id);

                  return (
                    <label
                      key={tab.id}
                      onClick={() => handleToggleTabPermission(tab.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-indigo-50/60 border-indigo-200'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by container onClick
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{tab.label}</span>
                          <span className="text-[10px] font-mono text-slate-400">({tab.id})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{tab.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                {selectedTabs.length} of {ALL_APP_TABS.length} modules granted
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPermissionTargetUser(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Add New Staff Member */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  placeholder="e.g. Vikas Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username (Login ID)</label>
                <input
                  type="text"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  placeholder="e.g. vikas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Login Password</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Enter initial password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      const defaults = ALL_APP_TABS.filter((t) =>
                        t.defaultRoles.includes(newRole)
                      ).map((t) => t.id);
                      setNewUserData({
                        ...newUserData,
                        role: newRole,
                        allowedTabs: defaults,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="sales_cashier">Sales Cashier</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newUserData.designation}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, designation: e.target.value })
                    }
                    placeholder="e.g. Sales Associate"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* First-Time Setup Wizard Modal */}
      {isSetupWizardOpen && (
        <FirstTimeSetupModal
          isOpen={isSetupWizardOpen}
          onClose={() => setIsSetupWizardOpen(false)}
        />
      )}
    </div>
  );
};
