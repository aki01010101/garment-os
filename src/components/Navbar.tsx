import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GarmentOsLogo } from './common/GarmentOsLogo';
import {
  RotateCcw,
  HelpCircle,
  Menu,
  ChevronDown,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenPrinterGuide: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onOpenMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onTabChange,
  onOpenPrinterGuide,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  onOpenMobileSidebar,
}) => {
  const {
    companies,
    activeCompanyId,
    activeCompany,
    setActiveCompanyId,
    resetToSampleData,
    currentUser,
    users,
    switchUser,
    lockScreen,
  } = useApp();

  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleReset = () => {
    if (
      confirm(
        'Reset application state to sample clothing shop data? (Restores 2 companies, sample inventory, dual-ledger vendors, and CRM customers)'
      )
    ) {
      resetToSampleData();
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin',
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
          dot: 'bg-purple-600',
        };
      case 'store_manager':
        return {
          label: 'Manager',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600',
        };
      case 'sales_cashier':
      default:
        return {
          label: 'Cashier',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-600',
        };
    }
  };

  const roleInfo = getRoleStyle(currentUser.role);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between gap-4 h-16">
        {/* Zone 1: Sidebar Toggle & Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Menu Trigger (< lg) */}
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              title="Open Navigation Menu"
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Desktop Sidebar Collapse / Expand Toggle (>= lg) */}
          {onToggleSidebarCollapse && (
            <button
              type="button"
              onClick={onToggleSidebarCollapse}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 hidden lg:flex items-center justify-center cursor-pointer transition-colors"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-indigo-600" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Brand Logo & Wordmark */}
          <button
            onClick={() => onTabChange('pos')}
            className="text-left group flex items-center gap-2.5 cursor-pointer"
          >
            <GarmentOsLogo size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                Garment <span className="text-indigo-600">OS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-normal -mt-0.5">
                POS & Retail CRM
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Active Company Profile Selector, Staff Badge & Tools (Other Top Items) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Active Company Pill Dropdown (Only for Admin & Store Manager) */}
          {currentUser.role !== 'sales_cashier' && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeCompany.type === 'billed' ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}
                />
                <span className="max-w-[110px] md:max-w-[150px] truncate">
                  {activeCompany.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isCompanyDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 text-xs">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Billing Entity
                  </div>
                  {companies.map((c) => {
                    const isCur = c.id === activeCompanyId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveCompanyId(c.id);
                          setIsCompanyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          isCur
                            ? 'bg-indigo-50 font-bold text-indigo-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="truncate">{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {c.type === 'billed' ? 'Official GST Invoices' : 'Cash Counter Memo'}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                          {c.invoicePrefix}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Staff Profile Badge with Fast Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              title="Click to switch staff role or view account"
            >
              <div className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                {currentUser.avatar}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-bold text-slate-800 leading-tight text-[11px] truncate max-w-[100px]">
                  {currentUser.fullName.split(' ')[0]}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded border ${roleInfo.badge} w-fit`}
                >
                  {roleInfo.label}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs animate-in fade-in">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Staff Account
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{currentUser.fullName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">@{currentUser.username} ({currentUser.role})</div>
                </div>

                <div className="py-1 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Fast Switch Staff Account
                  </div>
                  {users.map((u) => {
                    const isCur = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isCur
                            ? 'bg-indigo-50 font-bold text-indigo-950 border border-indigo-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {u.avatar}
                          </span>
                          <div>
                            <div className="text-[11px] font-semibold">{u.fullName}</div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              {u.role === 'admin'
                                ? 'Admin (Full Access)'
                                : u.role === 'store_manager'
                                ? 'Store Manager'
                                : 'Sales Cashier'}
                            </div>
                          </div>
                        </div>
                        {isCur && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-600 text-white rounded">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Lock Terminal Button */}
          <button
            onClick={() => lockScreen('Terminal locked by staff')}
            title="Lock Front UI (Staff Handover / Away)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Lock</span>
          </button>

          {/* Thermal Printer Settings Guide */}
          <button
            onClick={onOpenPrinterGuide}
            title="58mm Thermal Printer Setup Guide"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Reset Seed Data (Admin Only) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={handleReset}
              title="Reset to Sample Seed Data"
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors hidden sm:block cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
