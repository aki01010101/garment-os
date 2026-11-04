import React from 'react';
import { useApp } from '../context/AppContext';
import { GarmentOsLogo } from './common/GarmentOsLogo';
import {
  ShoppingBag,
  Package,
  Tag,
  Truck,
  RotateCcw,
  Scissors,
  IndianRupee,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { hasPermission, currentUser, activeCompany, lockScreen } = useApp();

  const navItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingBag, short: 'POS' },
    { id: 'sales-register', label: 'Sales Register', icon: Receipt, short: 'Sales' },
    { id: 'inventory', label: 'Inventory', icon: Package, short: 'Stock' },
    { id: 'tags', label: 'Price Tags', icon: Tag, short: 'Tags' },
    { id: 'vendors', label: 'Vendors & Stock', icon: Truck, short: 'Vendors' },
    { id: 'returns', label: 'Returns & Credit', icon: RotateCcw, short: 'Returns' },
    { id: 'alterations', label: 'Alterations', icon: Scissors, short: 'Tailor' },
    { id: 'cash', label: 'Day Register (Z)', icon: IndianRupee, short: 'Cash (Z)' },
    { id: 'crm', label: 'CRM & Loyalty', icon: Users, short: 'CRM' },
    { id: 'reports', label: 'Reports & Taxes', icon: BarChart3, short: 'Reports' },
    { id: 'settings', label: 'Settings', icon: Settings, short: 'Config' },
    { id: 'landing', label: 'Landing Page', icon: Sparkles, short: 'Tour' },
  ];

  // Filter links based on user's active role permissions
  const visibleNavItems = navItems.filter((item) => hasPermission(item.id));

  return (
    <>
      {/* 1. DESKTOP VERTICAL SIDEBAR (Sticky underneath top nav) */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 sticky top-16 h-[calc(100vh-4rem)] z-30 transition-all duration-200 select-none shrink-0 no-print ${
          isCollapsed ? 'w-18' : 'w-56'
        }`}
      >
        {/* Navigation Buttons Container */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                {/* Active Indicator Bar when collapsed */}
                {isActive && isCollapsed && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-500 rounded-r" />
                )}

                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate tracking-tight">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Collapse Toggle & Active Entity Pill */}
        <div className="p-2 border-t border-slate-100 flex flex-col gap-1 bg-slate-50/50">
          {!isCollapsed && (
            <div className="px-2 py-1 text-[10px] text-slate-400 truncate">
              <span className="font-semibold text-slate-600 block truncate">{activeCompany.name}</span>
              <span className="font-mono text-slate-400">Garment OS 2.0</span>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors text-xs font-semibold cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px]">Collapse Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* 2. MOBILE RESPONSIVE SLIDE-OVER DRAWER (< lg screens) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Slide-out Sidebar Panel */}
          <div className="relative w-64 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <GarmentOsLogo size="sm" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                    Garment <span className="text-indigo-600">OS</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">Retail Navigation</p>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Staff Card */}
            <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.avatar}
                </span>
                <div>
                  <div className="font-bold text-slate-900">{currentUser.fullName}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{currentUser.role.replace('_', ' ')}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  lockScreen('Terminal locked by staff');
                  onCloseMobile();
                }}
                title="Lock Terminal"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
              Active Entity: <strong className="text-slate-800">{activeCompany.name}</strong>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

