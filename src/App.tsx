import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { POSBilling } from './components/pos/POSBilling';
import { SalesRegister } from './components/sales/SalesRegister';
import { InventoryManager } from './components/inventory/InventoryManager';
import { PriceTagGenerator } from './components/tags/PriceTagGenerator';
import { VendorPurchaseManager } from './components/vendors/VendorPurchaseManager';
import { ReturnsExchangeManager } from './components/returns/ReturnsExchangeManager';
import { AlterationsManager } from './components/alterations/AlterationsManager';
import { DayRegisterManager } from './components/cash/DayRegisterManager';
import { CustomerCRM } from './components/crm/CustomerCRM';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { ThermalReceipt } from './components/pos/ThermalReceipt';
import { PrinterGuideModal } from './components/printer/PrinterGuideModal';
import { LoginLockScreen } from './components/auth/LoginLockScreen';
import { SettingsManager } from './components/settings/SettingsManager';
import { FirstTimeSetupModal } from './components/onboarding/FirstTimeSetupModal';
import { LandingPage } from './components/landing/LandingPage';
import { ShieldAlert } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('pos');
  const [isPrinterGuideOpen, setIsPrinterGuideOpen] = useState(false);
  const [accessDeniedNotice, setAccessDeniedNotice] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('garment_os_onboarding_completed') !== 'true';
    } catch {
      return false;
    }
  });

  // Sidebar collapse & mobile drawer states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('garment_os_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('garment_os_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const {
    activeReceipt,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    isLocked,
    currentUser,
    hasPermission,
  } = useApp();

  // Route protection guard: if role loses access to active tab, redirect to POS
  useEffect(() => {
    if (hasPermission(currentTab)) {
      setAccessDeniedNotice(null);
      return;
    }
    setAccessDeniedNotice(
      `Tab restricted: Role "${currentUser.role.replace('_', ' ')}" is not authorized to view this section.`
    );
    setCurrentTab('pos');
    const timer = setTimeout(() => setAccessDeniedNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [currentTab, currentUser.role, hasPermission]);

  const handleTabChange = (tab: string) => {
    if (hasPermission(tab)) {
      setCurrentTab(tab);
    } else {
      setAccessDeniedNotice(`Access restricted for ${currentUser.fullName} (${currentUser.role}).`);
      setTimeout(() => setAccessDeniedNotice(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Front UI Lock Screen Overlay */}
      {isLocked && <LoginLockScreen />}

      {/* Top Bar with Brand, Entity Selector, Staff Switcher & Tools */}
      <Navbar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenPrinterGuide={() => setIsPrinterGuideOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={toggleSidebarCollapse}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Access Denied Feedback Banner */}
      {accessDeniedNotice && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 border-b border-amber-600/30 no-print animate-in fade-in">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{accessDeniedNotice}</span>
        </div>
      )}

      {/* App Shell: Left Vertical Navigation Sidebar + Main Workspace Viewport */}
      <div className="flex-1 flex min-h-0">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Workspace Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 no-print">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'pos' && <POSBilling />}
            {currentTab === 'sales-register' && hasPermission('sales-register') && <SalesRegister />}
            {currentTab === 'inventory' && hasPermission('inventory') && (
              <InventoryManager onNavigateToTags={() => setCurrentTab('tags')} />
            )}
            {currentTab === 'tags' && hasPermission('tags') && <PriceTagGenerator />}
            {currentTab === 'vendors' && hasPermission('vendors') && <VendorPurchaseManager />}
            {currentTab === 'returns' && hasPermission('returns') && <ReturnsExchangeManager />}
            {currentTab === 'alterations' && hasPermission('alterations') && <AlterationsManager />}
            {currentTab === 'cash' && hasPermission('cash') && <DayRegisterManager />}
            {currentTab === 'crm' && hasPermission('crm') && <CustomerCRM />}
            {currentTab === 'reports' && hasPermission('reports') && <ReportsDashboard />}
            {(currentTab === 'settings' || currentTab === 'companies') && hasPermission('settings') && (
              <SettingsManager />
            )}
            {currentTab === 'landing' && (
              <LandingPage
                onNavigateToPOS={() => setCurrentTab('pos')}
                onNavigateToTab={(t) => setCurrentTab(t)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Thermal Receipt Preview & Print Modal */}
      <ThermalReceipt
        receipt={activeReceipt}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onOpenPrinterGuide={() => setIsPrinterGuideOpen(true)}
      />

      {/* Thermal Printer Settings Guide Modal */}
      <PrinterGuideModal
        isOpen={isPrinterGuideOpen}
        onClose={() => setIsPrinterGuideOpen(false)}
      />

      {/* First-Time Setup Wizard Modal */}
      <FirstTimeSetupModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Dedicated print mount point for @media print */}
      <div id="print-mount-point" className="hidden print:block fixed inset-0 bg-white z-[99999]" />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
