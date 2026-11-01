import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Company,
  Product,
  Vendor,
  Customer,
  SaleTransaction,
  PurchaseOrder,
  VendorPaymentRecord,
  CartItem,
  LoyaltyConfig,
  AlterationRecord,
  CreditNote,
  DayEndRegister,
  PettyExpense,
  CouponCode,
  AlterationDetails,
  BulkProductUpdate,
  BulkCsvImportRow,
  UserAccount,
  UserRole,
  SplitPaymentBreakdown,
  CodePrintType,
  QrPrintSize,
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_PRODUCTS,
  INITIAL_VENDORS,
  INITIAL_CUSTOMERS,
  INITIAL_PURCHASES,
  INITIAL_PAYMENTS,
  INITIAL_SALES,
  DEFAULT_LOYALTY_CONFIG,
  INITIAL_COUPONS,
  INITIAL_CREDIT_NOTES,
  INITIAL_ALTERATIONS,
  INITIAL_REGISTER,
  SALES_ASSOCIATES,
  DEFAULT_USERS,
} from '../data/seedData';

import { playBarcodeBeep } from '../utils/audio';
import {
  getSupabaseConfig,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
  pushAllToSupabase,
  pullAllFromSupabase,
  asyncSyncSale,
  asyncSyncProduct,
  asyncSyncCustomer,
  asyncSyncPurchase,
  asyncSyncVendorPayment,
  asyncSyncAlteration,
  asyncSyncCreditNote,
  asyncSyncDayRegister,
  asyncSyncSetting,
  SupabaseConfig,
  SUPABASE_STORAGE_KEYS,
} from '../services/supabase';

interface AppContextType {
  // Companies
  companies: Company[];
  activeCompanyId: string;
  activeCompany: Company;
  setActiveCompanyId: (id: string) => void;
  updateCompany: (company: Company) => void;
  addCompany: (company: Omit<Company, 'id'>) => void;

  // Products / Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  adjustStock: (productId: string, adjustment: number, reason?: string) => void;
  bulkUpdateProducts: (updates: BulkProductUpdate[]) => void;
  bulkImportProducts: (items: BulkCsvImportRow[]) => { updatedCount: number; notFoundCount: number; errors: string[] };

  // Vendors & Purchases (Dual Ledger: Cash vs Billed)
  vendors: Vendor[];
  purchases: PurchaseOrder[];
  vendorPayments: VendorPaymentRecord[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'billedPayableBalance' | 'cashPayableBalance' | 'totalBilledPurchased' | 'totalCashPurchased'>) => void;
  updateVendor: (vendor: Vendor) => void;
  recordPurchaseOrder: (order: Omit<PurchaseOrder, 'id'>) => PurchaseOrder;
  recordVendorPayment: (payment: Omit<VendorPaymentRecord, 'id'>) => void;

  // Customers & CRM
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpend' | 'totalVisits' | 'createdAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  adjustLoyaltyPoints: (customerId: string, pointsDelta: number, reason?: string) => void;

  // POS Cart & Checkout
  cart: CartItem[];
  selectedCustomerId: string | null;
  selectedCustomer: Customer | null;
  setSelectedCustomerId: (id: string | null) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQty: (productId: string, qty: number) => void;
  updateCartItemDiscount: (productId: string, discountPercent: number) => void;
  updateCartItemAlteration: (productId: string, alteration: AlterationDetails | undefined) => void;
  clearCart: () => void;
  redeemedPoints: number;
  setRedeemedPoints: (points: number) => void;
  appliedCoupon: CouponCode | null;
  applyCouponCode: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  appliedCreditNote: CreditNote | null;
  applyCreditNoteCode: (code: string) => { success: boolean; message: string };
  removeCreditNote: () => void;
  selectedAssociate: string;
  setSelectedAssociate: (name: string) => void;
  salesAssociates: string[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  checkoutSale: (
    paymentMode: 'Cash' | 'Card' | 'UPI' | 'Split',
    cashTendered?: number,
    notes?: string,
    splitBreakdown?: SplitPaymentBreakdown
  ) => SaleTransaction;

  // Sales History & Receipts
  sales: SaleTransaction[];
  activeReceipt: SaleTransaction | null;
  setActiveReceipt: (receipt: SaleTransaction | null) => void;
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (isOpen: boolean) => void;
  lastCompletedSale: SaleTransaction | null;
  setLastCompletedSale: (sale: SaleTransaction | null) => void;
  startNextSale: () => void;
  updateSale: (updatedSale: SaleTransaction) => void;

  // Alterations / Tailoring
  alterations: AlterationRecord[];
  addAlteration: (record: Omit<AlterationRecord, 'id' | 'createdDate'>) => void;
  updateAlterationStatus: (id: string, status: AlterationRecord['status']) => void;
  markAlterationNotified: (id: string, timestamp?: string) => void;

  // Credit Notes & Exchanges
  creditNotes: CreditNote[];
  issueCreditNote: (data: Omit<CreditNote, 'id' | 'code' | 'issuedDate' | 'remainingAmount' | 'status'>) => CreditNote;

  // Day-End Register
  dayRegister: DayEndRegister;
  updateOpeningCash: (amount: number) => void;
  addPettyExpense: (expense: Omit<PettyExpense, 'id' | 'time'>) => void;
  closeDayRegister: (countedCash: number, notes?: string) => void;

  // Loyalty Config
  // Loyalty Config
  loyaltyConfig: LoyaltyConfig;
  updateLoyaltyConfig: (config: LoyaltyConfig) => void;

  // Authentication & RBAC
  users: UserAccount[];
  currentUser: UserAccount;
  isLocked: boolean;
  lockReason?: string;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  lockScreen: (reason?: string) => void;
  unlockScreen: (password: string) => { success: boolean; error?: string };
  switchUser: (account: UserAccount) => void;
  hasPermission: (tabKey: string) => boolean;

  // User & Permission Management (Settings)
  addUser: (user: Omit<UserAccount, 'id'>) => UserAccount;
  updateUser: (user: UserAccount) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };
  updateUserPassword: (userId: string, newPassword: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserPermissions: (userId: string, allowedTabs: string[]) => void;

  // Security & Global Thresholds
  autoLockMinutes: number;
  setAutoLockMinutes: (minutes: number) => void;
  globalLowStockThreshold: number;
  setGlobalLowStockThreshold: (threshold: number) => void;

  // Printing & Code Format
  codePrintType: CodePrintType;
  setCodePrintType: (type: CodePrintType) => void;
  qrPrintSize: QrPrintSize;
  setQrPrintSize: (size: QrPrintSize) => void;

  // UPI & Digital Payments
  storeUpiId: string;
  setStoreUpiId: (id: string) => void;
  storeUpiName: string;
  setStoreUpiName: (name: string) => void;

  // Supabase Cloud Database & Sync
  supabaseConfig: SupabaseConfig;
  saveSupabaseCreds: (url: string, key: string) => void;
  clearSupabaseCreds: () => void;
  pushToSupabase: () => Promise<{ success: boolean; message: string; stats?: any }>;
  pullFromSupabase: () => Promise<{ success: boolean; message: string }>;
  testSupabase: (overrideUrl?: string, overrideKey?: string) => Promise<{ success: boolean; message: string }>;
  lastSupabaseSync: string | null;
  isSupabaseAutoSync: boolean;
  setIsSupabaseAutoSync: (val: boolean) => void;

  // System
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COMPANIES: 'verve_clothing_companies_v2',
  PRODUCTS: 'verve_clothing_products_v2',
  VENDORS: 'verve_clothing_vendors_v2',
  PURCHASES: 'verve_clothing_purchases_v2',
  PAYMENTS: 'verve_clothing_payments_v2',
  SALES: 'verve_clothing_sales_v2',
  CUSTOMERS: 'verve_clothing_customers_v2',
  ACTIVE_COMPANY: 'verve_clothing_active_company_v2',
  LOYALTY: 'verve_clothing_loyalty_v2',
  ALTERATIONS: 'verve_clothing_alterations_v2',
  CREDIT_NOTES: 'verve_clothing_credit_notes_v2',
  REGISTER: 'verve_clothing_register_v2',
  CODE_PRINT_TYPE: 'garment_os_code_print_type',
  QR_PRINT_SIZE: 'garment_os_qr_print_size',
  STORE_UPI_ID: 'garment_os_store_upi_id',
  STORE_UPI_NAME: 'garment_os_store_upi_name',
  SOUND: 'verve_clothing_sound_v2',
  CURRENT_USER: 'verve_clothing_user_v2',
  USERS: 'verve_clothing_staff_users_v2',
  IS_LOCKED: 'verve_clothing_locked_v2',
  LOW_STOCK_THRESHOLD: 'verve_clothing_low_stock_threshold_v2',
  AUTO_LOCK_MINUTES: 'verve_clothing_autolock_minutes_v2',
};



export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    if (saved) {
      try {
        const parsed: Company[] = JSON.parse(saved);
        return parsed.map((c) => ({
          ...c,
          name: c.name.replace(/Verve Threads/gi, 'Garment OS').replace(/Verve Street Counter/gi, 'Garment OS Counter'),
          legalName: c.legalName.replace(/Verve Threads/gi, 'Garment OS').replace(/Verve Retail/gi, 'Garment OS'),
          email: c.email.replace(/vervethreads\.in/gi, 'garmentos.in').replace(/vervestreet\.in/gi, 'garmentos.in'),
        }));
      } catch {
        return INITIAL_COMPANIES;
      }
    }
    return INITIAL_COMPANIES;
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY);
    return saved || 'comp_billed';
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VENDORS);
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  const [vendorPayments, setVendorPayments] = useState<VendorPaymentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [sales, setSales] = useState<SaleTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOYALTY);
    return saved ? JSON.parse(saved) : DEFAULT_LOYALTY_CONFIG;
  });

  const [alterations, setAlterations] = useState<AlterationRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALTERATIONS);
    return saved ? JSON.parse(saved) : INITIAL_ALTERATIONS;
  });

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CREDIT_NOTES);
    return saved ? JSON.parse(saved) : INITIAL_CREDIT_NOTES;
  });

  const [dayRegister, setDayRegister] = useState<DayEndRegister>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REGISTER);
    return saved ? JSON.parse(saved) : INITIAL_REGISTER;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Users & Staff Management State
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  // Authentication & RBAC State
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0];
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_LOCKED);
    // If not set yet, start unlocked with the default admin user for immediate demo friendliness
    return saved === 'true';
  });

  const [lockReason, setLockReason] = useState<string | undefined>(undefined);

  // Auto-Lock Inactivity Timeout (minutes)
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_LOCK_MINUTES);
    return saved !== null ? parseInt(saved, 10) : 5;
  });

  const setAutoLockMinutes = (minutes: number) => {
    setAutoLockMinutesState(minutes);
    localStorage.setItem(STORAGE_KEYS.AUTO_LOCK_MINUTES, minutes.toString());
  };

  // Global Low-Stock Threshold State
  const [globalLowStockThreshold, setGlobalLowStockThresholdState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOW_STOCK_THRESHOLD);
    return saved ? parseInt(saved, 10) : 5;
  });

  const setGlobalLowStockThreshold = (threshold: number) => {
    const val = Math.max(0, threshold);
    setGlobalLowStockThresholdState(val);
    localStorage.setItem(STORAGE_KEYS.LOW_STOCK_THRESHOLD, val.toString());
  };

  const [codePrintType, setCodePrintTypeState] = useState<CodePrintType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CODE_PRINT_TYPE);
    return saved === 'qr' ? 'qr' : 'barcode';
  });

  const setCodePrintType = (type: CodePrintType) => {
    setCodePrintTypeState(type);
    localStorage.setItem(STORAGE_KEYS.CODE_PRINT_TYPE, type);
  };

  const [qrPrintSize, setQrPrintSizeState] = useState<QrPrintSize>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QR_PRINT_SIZE);
    return saved === 'compact' || saved === 'medium' || saved === 'large' || saved === 'xlarge'
      ? saved
      : 'xlarge';
  });

  const setQrPrintSize = (size: QrPrintSize) => {
    setQrPrintSizeState(size);
    localStorage.setItem(STORAGE_KEYS.QR_PRINT_SIZE, size);
  };

  // Store UPI VPA / ID & Merchant Name for Dynamic Payment QR Codes
  const [storeUpiId, setStoreUpiIdState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STORE_UPI_ID);
    return saved !== null && saved !== '' ? saved : 'garmentos@icici';
  });

  const setStoreUpiId = (id: string) => {
    const trimmed = id.trim();
    setStoreUpiIdState(trimmed);
    localStorage.setItem(STORAGE_KEYS.STORE_UPI_ID, trimmed);
  };

  const [storeUpiName, setStoreUpiNameState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STORE_UPI_NAME);
    return saved !== null && saved !== '' ? saved : 'Garment OS Retail';
  });

  const setStoreUpiName = (name: string) => {
    const trimmed = name.trim();
    setStoreUpiNameState(trimmed);
    localStorage.setItem(STORAGE_KEYS.STORE_UPI_NAME, trimmed);
  };

  // Supabase Cloud Database & Sync State
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getSupabaseConfig);

  const [lastSupabaseSync, setLastSupabaseSync] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SUPABASE_STORAGE_KEYS.LAST_SYNC);
    } catch {
      return null;
    }
  });

  const [isSupabaseAutoSync, setIsSupabaseAutoSyncState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SUPABASE_STORAGE_KEYS.AUTO_SYNC) !== 'false';
    } catch {
      return true;
    }
  });

  const setIsSupabaseAutoSync = (val: boolean) => {
    setIsSupabaseAutoSyncState(val);
    try {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.AUTO_SYNC, String(val));
    } catch {}
  };

  const saveSupabaseCreds = (url: string, key: string) => {
    saveSupabaseCredentials(url, key);
    setSupabaseConfigState(getSupabaseConfig());
  };

  const clearSupabaseCreds = () => {
    clearSupabaseCredentials();
    setSupabaseConfigState(getSupabaseConfig());
    setLastSupabaseSync(null);
  };

  const testSupabase = async (overrideUrl?: string, overrideKey?: string) => {
    return await testSupabaseConnection(overrideUrl, overrideKey);
  };

  const pushToSupabase = async () => {
    const res = await pushAllToSupabase({
      companies,
      products,
      customers,
      sales,
      vendors,
      purchases,
      vendorPayments,
      alterations,
      creditNotes,
      dayRegister,
      users,
      coupons: INITIAL_COUPONS,
      loyaltyConfig,
      settings: {
        autoLockMinutes,
        globalLowStockThreshold,
        codePrintType,
        qrPrintSize,
        storeUpiId,
        storeUpiName,
      },
    });
    if (res.success) {
      setLastSupabaseSync(new Date().toISOString());
    }
    return res;
  };

  const pullFromSupabase = async () => {
    const res = await pullAllFromSupabase();
    if (res.success && res.data) {
      if (res.data.companies && res.data.companies.length > 0) setCompanies(res.data.companies);
      if (res.data.products && res.data.products.length > 0) setProducts(res.data.products);
      if (res.data.customers && res.data.customers.length > 0) setCustomers(res.data.customers);
      if (res.data.sales && res.data.sales.length > 0) setSales(res.data.sales);
      if (res.data.vendors && res.data.vendors.length > 0) setVendors(res.data.vendors);
      if (res.data.purchases && res.data.purchases.length > 0) setPurchases(res.data.purchases);
      if (res.data.vendorPayments && res.data.vendorPayments.length > 0) setVendorPayments(res.data.vendorPayments);
      if (res.data.alterations && res.data.alterations.length > 0) setAlterations(res.data.alterations);
      if (res.data.creditNotes && res.data.creditNotes.length > 0) setCreditNotes(res.data.creditNotes);
      if (res.data.dayRegister) setDayRegister(res.data.dayRegister);
      if (res.data.users && res.data.users.length > 0) setUsers(res.data.users);
      if (res.data.loyaltyConfig) setLoyaltyConfig(res.data.loyaltyConfig);
      if (res.data.settings) {
        if (res.data.settings.storeUpiId) setStoreUpiId(res.data.settings.storeUpiId);
        if (res.data.settings.storeUpiName) setStoreUpiName(res.data.settings.storeUpiName);
        if (res.data.settings.codePrintType) setCodePrintType(res.data.settings.codePrintType);
        if (res.data.settings.qrPrintSize) setQrPrintSize(res.data.settings.qrPrintSize);
      }
      setLastSupabaseSync(new Date().toISOString());
    }
    return { success: res.success, message: res.message };
  };

  // Inactivity Auto-Lock Watcher
  useEffect(() => {
    if (isLocked || autoLockMinutes <= 0) return;

    const timeoutMs = autoLockMinutes * 60 * 1000;
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLocked(true);
        setLockReason(`Auto-locked due to ${autoLockMinutes} minutes of inactivity`);
        localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
      }, timeoutMs);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isLocked, autoLockMinutes]);

  // Auth Operations
  const login = (username: string, password: string) => {
    const trimmed = username.trim().toLowerCase();
    const matched = users.find(
      (u) => u.username.toLowerCase() === trimmed && u.password === password
    );
    if (!matched) {
      return { success: false, error: 'Incorrect username or password. Check credentials.' };
    }
    setCurrentUser(matched);
    setIsLocked(false);
    setLockReason(undefined);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(matched));
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
    return { success: true };
  };

  const logout = () => {
    setIsLocked(true);
    setLockReason('Logged out by user');
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
  };

  const lockScreen = (reason: string = 'Screen locked by staff') => {
    setIsLocked(true);
    setLockReason(reason);
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'true');
  };

  const unlockScreen = (password: string) => {
    const freshUser = users.find((u) => u.id === currentUser.id) || currentUser;
    if (freshUser.password === password) {
      setIsLocked(false);
      setLockReason(undefined);
      localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
      return { success: true };
    }
    return { success: false, error: `Invalid password for ${freshUser.fullName}.` };
  };

  const switchUser = (account: UserAccount) => {
    setCurrentUser(account);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(account));
  };

  const hasPermission = (tabKey: string): boolean => {
    const active = users.find((u) => u.id === currentUser.id) || currentUser;
    // 1. Admin ALWAYS has unrestricted access to all tabs
    if (active.role === 'admin') return true;
    // 2. Explicit customized permissions for staff
    if (active.allowedTabs && active.allowedTabs.length > 0) {
      return active.allowedTabs.includes(tabKey);
    }
    // 3. Default Role Matrix
    if (active.role === 'store_manager') {
      // Store managers access all daily operations, but are restricted from P&L/Tax Reports and Settings
      return !['reports', 'companies', 'settings'].includes(tabKey);
    }
    if (active.role === 'sales_cashier') {
      // Sales cashiers can access POS billing, Returns/Exchanges, Alterations, and Sales Register
      return ['pos', 'returns', 'alterations', 'sales-register'].includes(tabKey);
    }
    return false;
  };

  // User Management Methods
  const addUser = (newUser: Omit<UserAccount, 'id'>): UserAccount => {
    const initials = newUser.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'ST';
    const created: UserAccount = {
      ...newUser,
      id: `user_${Date.now()}`,
      avatar: newUser.avatar || initials,
      allowedTabs: newUser.allowedTabs || undefined,
    };
    setUsers((prev) => [...prev, created]);
    return created;
  };

  const updateUser = (updated: UserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
    }
  };

  const deleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      return { success: false, message: 'Cannot delete the currently active logged-in user.' };
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    return { success: true };
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, password: newPassword }));
    }
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }
  };

  const updateUserPermissions = (userId: string, allowedTabs: string[]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, allowedTabs } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, allowedTabs }));
    }
  };


  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [appliedCreditNote, setAppliedCreditNote] = useState<CreditNote | null>(null);
  const [selectedAssociate, setSelectedAssociate] = useState<string>(SALES_ASSOCIATES[0]);
  const [activeReceipt, setActiveReceipt] = useState<SaleTransaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);

  const startNextSale = () => {
    clearCart();
    setLastCompletedSale(null);
  };

  const updateSale = (updatedSale: SaleTransaction) => {
    const oldSale = sales.find((s) => s.id === updatedSale.id);
    if (!oldSale) return;

    // 1. Stock reconciliation: adjust for qty differences
    setProducts((prev) => {
      const updatedProducts = [...prev];

      // Restore old quantities
      oldSale.items.forEach((oldItem) => {
        const idx = updatedProducts.findIndex((p) => p.id === oldItem.productId);
        if (idx !== -1) {
          updatedProducts[idx] = {
            ...updatedProducts[idx],
            stock: updatedProducts[idx].stock + oldItem.qty,
          };
        }
      });

      // Deduct new quantities
      updatedSale.items.forEach((newItem) => {
        const idx = updatedProducts.findIndex((p) => p.id === newItem.productId);
        if (idx !== -1) {
          updatedProducts[idx] = {
            ...updatedProducts[idx],
            stock: Math.max(0, updatedProducts[idx].stock - newItem.qty),
          };
        }
      });

      return updatedProducts;
    });

    // 2. Customer spend adjustment
    if (updatedSale.customerId) {
      const delta = updatedSale.grandTotal - oldSale.grandTotal;
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === updatedSale.customerId
            ? { ...c, totalSpend: Math.max(0, c.totalSpend + delta) }
            : c
        )
      );
    }

    // 3. Update sale in state
    setSales((prev) =>
      prev.map((s) => (s.id === updatedSale.id ? updatedSale : s))
    );

    // If activeReceipt is the same sale, update it too
    if (activeReceipt?.id === updatedSale.id) {
      setActiveReceipt(updatedSale);
    }
    if (lastCompletedSale?.id === updatedSale.id) {
      setLastCompletedSale(updatedSale);
    }

    // 4. Background Supabase sync
    if (isSupabaseAutoSync) {
      try {
        asyncSyncSale(updatedSale);
      } catch (err) {
        console.warn('Background Supabase updateSale error:', err);
      }
    }
  };


  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  }, [companies]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, activeCompanyId);
  }, [activeCompanyId]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  }, [vendors]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(vendorPayments));
  }, [vendorPayments]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOYALTY, JSON.stringify(loyaltyConfig));
  }, [loyaltyConfig]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALTERATIONS, JSON.stringify(alterations));
  }, [alterations]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREDIT_NOTES, JSON.stringify(creditNotes));
  }, [creditNotes]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REGISTER, JSON.stringify(dayRegister));
  }, [dayRegister]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const activeCompany =
    companies.find((c) => c.id === activeCompanyId) || companies[0] || INITIAL_COMPANIES[0];

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || null;

  // Companies
  const updateCompany = (updated: Company) => {
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const addCompany = (newComp: Omit<Company, 'id'>) => {
    const id = `comp_${Date.now()}`;
    const fullCompany: Company = { ...newComp, id };
    setCompanies((prev) => [...prev, fullCompany]);
  };

  // Products
  const addProduct = (p: Omit<Product, 'id'>): Product => {
    const id = `prod_${Date.now()}`;
    const newProduct: Product = { ...p, id };
    setProducts((prev) => [newProduct, ...prev]);
    if (isSupabaseAutoSync) asyncSyncProduct(newProduct);
    return newProduct;
  };

  const updateProduct = (p: Product) => {
    setProducts((prev) => prev.map((item) => (item.id === p.id ? p : item)));
    if (isSupabaseAutoSync) asyncSyncProduct(p);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const adjustStock = (productId: string, adjustment: number) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newStock = Math.max(0, item.stock + adjustment);
          const updated = { ...item, stock: newStock };
          if (isSupabaseAutoSync) asyncSyncProduct(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const bulkDeleteProducts = (ids: string[]) => {
    const idSet = new Set(ids);
    setProducts((prev) => prev.filter((item) => !idSet.has(item.id)));
  };

  const bulkUpdateProducts = (updates: BulkProductUpdate[]) => {
    const updateMap = new Map<string, BulkProductUpdate>();
    updates.forEach((u) => updateMap.set(u.id, u));

    setProducts((prev) =>
      prev.map((item) => {
        const u = updateMap.get(item.id);
        if (!u) return item;

        let stock = item.stock;
        if (typeof u.newStock === 'number') {
          stock = Math.max(0, u.newStock);
        } else if (typeof u.stockDelta === 'number') {
          stock = Math.max(0, stock + u.stockDelta);
        }

        let sellingPrice = item.sellingPrice;
        if (typeof u.newPrice === 'number') {
          sellingPrice = Math.max(0, u.newPrice);
        } else if (typeof u.priceDeltaPercent === 'number') {
          sellingPrice = Math.max(0, Math.round(sellingPrice * (1 + u.priceDeltaPercent / 100)));
        } else if (typeof u.priceDeltaFlat === 'number') {
          sellingPrice = Math.max(0, sellingPrice + u.priceDeltaFlat);
        }

        const costPrice =
          typeof u.newCostPrice === 'number' ? Math.max(0, u.newCostPrice) : item.costPrice;
        const season = u.season || item.season;

        return {
          ...item,
          stock,
          sellingPrice,
          costPrice,
          season,
        };
      })
    );
  };

  const bulkImportProducts = (
    items: BulkCsvImportRow[]
  ): { updatedCount: number; notFoundCount: number; errors: string[] } => {
    let updatedCount = 0;
    let notFoundCount = 0;
    const errors: string[] = [];

    setProducts((prev) => {
      const copy = [...prev];
      items.forEach((row, idx) => {
        const skuQ = (row.sku || '').trim().toLowerCase();
        const barcodeQ = (row.barcode || '').trim().toLowerCase();

        if (!skuQ && !barcodeQ) {
          errors.push(`Row ${idx + 1}: Missing SKU and Barcode`);
          return;
        }

        const foundIdx = copy.findIndex(
          (p) =>
            (skuQ && p.sku.toLowerCase() === skuQ) ||
            (barcodeQ && p.barcode.toLowerCase() === barcodeQ)
        );

        if (foundIdx === -1) {
          notFoundCount++;
          errors.push(`Row ${idx + 1}: SKU/Barcode "${row.sku || row.barcode}" not found in catalog`);
          return;
        }

        const current = copy[foundIdx];
        let stock = current.stock;
        if (typeof row.stock === 'number') {
          stock = Math.max(0, row.stock);
        } else if (typeof row.stockDelta === 'number') {
          stock = Math.max(0, stock + row.stockDelta);
        }

        const sellingPrice =
          typeof row.sellingPrice === 'number' ? Math.max(0, row.sellingPrice) : current.sellingPrice;
        const costPrice =
          typeof row.costPrice === 'number' ? Math.max(0, row.costPrice) : current.costPrice;

        copy[foundIdx] = {
          ...current,
          stock,
          sellingPrice,
          costPrice,
        };
        updatedCount++;
      });
      return copy;
    });

    return { updatedCount, notFoundCount, errors };
  };

  // Vendors & Purchases
  const addVendor = (v: Omit<Vendor, 'id' | 'billedPayableBalance' | 'cashPayableBalance' | 'totalBilledPurchased' | 'totalCashPurchased'>) => {
    const newVendor: Vendor = {
      ...v,
      id: `ven_${Date.now()}`,
      billedPayableBalance: 0,
      cashPayableBalance: 0,
      totalBilledPurchased: 0,
      totalCashPurchased: 0,
    };
    setVendors((prev) => [...prev, newVendor]);
  };

  const updateVendor = (v: Vendor) => {
    setVendors((prev) => prev.map((item) => (item.id === v.id ? v : item)));
  };

  const recordPurchaseOrder = (orderData: Omit<PurchaseOrder, 'id'>): PurchaseOrder => {
    const id = `po_${Date.now()}`;
    const newOrder: PurchaseOrder = { ...orderData, id };

    setPurchases((prev) => [newOrder, ...prev]);

    // Restock products
    setProducts((prevProducts) => {
      const updated = [...prevProducts];
      orderData.items.forEach((item) => {
        if (item.productId) {
          const index = updated.findIndex((p) => p.id === item.productId);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              stock: updated[index].stock + item.qty,
              costPrice: item.costPrice || updated[index].costPrice,
              purchaseSource:
                updated[index].purchaseSource === orderData.purchaseType
                  ? updated[index].purchaseSource
                  : 'mixed',
            };
          }
        }
      });
      return updated;
    });

    // Update Vendor Ledger balances
    const unpaidAmount = orderData.totalAmount - orderData.paidAmount;
    setVendors((prevVendors) =>
      prevVendors.map((vendor) => {
        if (vendor.id === orderData.vendorId) {
          if (orderData.purchaseType === 'billed') {
            return {
              ...vendor,
              totalBilledPurchased: vendor.totalBilledPurchased + orderData.totalAmount,
              billedPayableBalance: Math.max(0, vendor.billedPayableBalance + unpaidAmount),
            };
          } else {
            return {
              ...vendor,
              totalCashPurchased: vendor.totalCashPurchased + orderData.totalAmount,
              cashPayableBalance: Math.max(0, vendor.cashPayableBalance + unpaidAmount),
            };
          }
        }
        return vendor;
      })
    );

    if (orderData.paidAmount > 0) {
      const paymentRecord: VendorPaymentRecord = {
        id: `pay_${Date.now()}`,
        vendorId: orderData.vendorId,
        vendorName: orderData.vendorName,
        date: orderData.date,
        amount: orderData.paidAmount,
        ledgerType: orderData.purchaseType,
        paymentMode: orderData.paymentMode,
        referenceNo: orderData.billOrVoucherNumber,
        notes: `Initial payment at purchase entry (${orderData.purchaseType.toUpperCase()})`,
      };
      setVendorPayments((prev) => [paymentRecord, ...prev]);
      if (isSupabaseAutoSync) asyncSyncVendorPayment(paymentRecord);
    }

    if (isSupabaseAutoSync) asyncSyncPurchase(newOrder);

    return newOrder;
  };

  const recordVendorPayment = (paymentData: Omit<VendorPaymentRecord, 'id'>) => {
    const id = `pay_${Date.now()}`;
    const newPayment: VendorPaymentRecord = { ...paymentData, id };
    setVendorPayments((prev) => [newPayment, ...prev]);
    if (isSupabaseAutoSync) asyncSyncVendorPayment(newPayment);

    setVendors((prevVendors) =>
      prevVendors.map((v) => {
        if (v.id === paymentData.vendorId) {
          if (paymentData.ledgerType === 'billed') {
            return {
              ...v,
              billedPayableBalance: Math.max(0, v.billedPayableBalance - paymentData.amount),
            };
          } else {
            return {
              ...v,
              cashPayableBalance: Math.max(0, v.cashPayableBalance - paymentData.amount),
            };
          }
        }
        return v;
      })
    );
  };

  // Customers
  const addCustomer = (data: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpend' | 'totalVisits' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...data,
      id: `cust_${Date.now()}`,
      loyaltyPoints: 0,
      totalSpend: 0,
      totalVisits: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCust, ...prev]);
    if (isSupabaseAutoSync) asyncSyncCustomer(newCust);
    return newCust;
  };

  const updateCustomer = (cust: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? cust : c)));
    if (isSupabaseAutoSync) asyncSyncCustomer(cust);
  };

  const adjustLoyaltyPoints = (customerId: string, pointsDelta: number) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newPoints = Math.max(0, c.loyaltyPoints + pointsDelta);
          return { ...c, loyaltyPoints: newPoints };
        }
        return c;
      })
    );
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    if (soundEnabled) {
      playBarcodeBeep();
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity,
          unitPrice: product.sellingPrice,
          discountPercent: 0,
          taxRate: activeCompany.type === 'billed' ? product.taxRate : 0,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const updateCartItemDiscount = (productId: string, discountPercent: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, discountPercent: Math.min(100, Math.max(0, discountPercent)) }
          : item
      )
    );
  };

  const updateCartItemAlteration = (productId: string, alteration: AlterationDetails | undefined) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, alteration } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId(null);
    setRedeemedPoints(0);
    setAppliedCoupon(null);
    setAppliedCreditNote(null);
  };

  // Coupon application
  const applyCouponCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    const coupon = INITIAL_COUPONS.find((c) => c.code === clean);
    if (!coupon) {
      return { success: false, message: 'Invalid promo code' };
    }
    const currentSubtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    if (currentSubtotal < coupon.minBillAmount) {
      return {
        success: false,
        message: `Min bill value ₹${coupon.minBillAmount} required for ${clean}`,
      };
    }
    setAppliedCoupon(coupon);
    return { success: true, message: `Coupon ${clean} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Credit Note redemption
  const applyCreditNoteCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    const note = creditNotes.find((cn) => cn.code === clean && cn.status === 'active');
    if (!note) {
      return { success: false, message: 'Invalid or already redeemed Credit Note' };
    }
    if (note.remainingAmount <= 0) {
      return { success: false, message: 'Credit Note has zero balance' };
    }
    setAppliedCreditNote(note);
    return { success: true, message: `Credit Note ${clean} (₹${note.remainingAmount}) applied!` };
  };

  const removeCreditNote = () => {
    setAppliedCreditNote(null);
  };

  // Alterations
  const addAlteration = (record: Omit<AlterationRecord, 'id' | 'createdDate'>) => {
    const newRecord: AlterationRecord = {
      ...record,
      id: `alt_${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0],
    };
    setAlterations((prev) => [newRecord, ...prev]);
    if (isSupabaseAutoSync) asyncSyncAlteration(newRecord);
  };

  const updateAlterationStatus = (id: string, status: AlterationRecord['status']) => {
    setAlterations((prev) =>
      prev.map((alt) => {
        if (alt.id === id) {
          const updated = { ...alt, status };
          if (isSupabaseAutoSync) asyncSyncAlteration(updated);
          return updated;
        }
        return alt;
      })
    );
  };

  const markAlterationNotified = (id: string, timestamp?: string) => {
    const timeStr =
      timestamp ||
      new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    setAlterations((prev) =>
      prev.map((alt) => {
        if (alt.id === id) {
          const updated = { ...alt, customerNotifiedAt: timeStr };
          if (isSupabaseAutoSync) asyncSyncAlteration(updated);
          return updated;
        }
        return alt;
      })
    );
  };

  // Credit Notes / Exchanges
  const issueCreditNote = (
    data: Omit<CreditNote, 'id' | 'code' | 'issuedDate' | 'remainingAmount' | 'status'>
  ): CreditNote => {
    const code = `CN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newNote: CreditNote = {
      ...data,
      id: `cn_${Date.now()}`,
      code,
      issuedDate: new Date().toISOString().split('T')[0],
      remainingAmount: data.amount,
      status: 'active',
    };

    setCreditNotes((prev) => [newNote, ...prev]);
    if (isSupabaseAutoSync) asyncSyncCreditNote(newNote);

    // Handle returned items inventory (restock or quarantine defective)
    setProducts((prev) => {
      const copy = [...prev];
      data.itemsReturned.forEach((ret) => {
        const idx = copy.findIndex((p) => p.sku === ret.sku);
        if (idx !== -1) {
          if (ret.isDefective) {
            copy[idx] = {
              ...copy[idx],
              defectiveStock: (copy[idx].defectiveStock || 0) + ret.qty,
            };
          } else {
            copy[idx] = {
              ...copy[idx],
              stock: copy[idx].stock + ret.qty,
            };
          }
          if (isSupabaseAutoSync) asyncSyncProduct(copy[idx]);
        }
      });
      return copy;
    });

    return newNote;
  };

  // Day Register
  const updateOpeningCash = (amount: number) => {
    setDayRegister((prev) => {
      const updated = { ...prev, openingCash: Math.max(0, amount) };
      if (isSupabaseAutoSync) asyncSyncDayRegister(updated);
      return updated;
    });
  };

  const addPettyExpense = (expense: Omit<PettyExpense, 'id' | 'time'>) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newExp: PettyExpense = {
      ...expense,
      id: `exp_${Date.now()}`,
      time,
    };
    setDayRegister((prev) => {
      const updated = {
        ...prev,
        expenses: [...prev.expenses, newExp],
      };
      if (isSupabaseAutoSync) asyncSyncDayRegister(updated);
      return updated;
    });
  };

  const closeDayRegister = (countedCash: number, notes?: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setDayRegister((prev) => {
      const updated: DayEndRegister = {
        ...prev,
        closingCashCounted: countedCash,
        closingNotes: notes,
        closedAt: time,
        status: 'closed',
      };
      if (isSupabaseAutoSync) asyncSyncDayRegister(updated);
      return updated;
    });
  };

  // Sale Checkout
  const checkoutSale = (
    paymentMode: 'Cash' | 'Card' | 'UPI' | 'Split',
    cashTendered?: number,
    notes?: string,
    splitBreakdown?: SplitPaymentBreakdown
  ): SaleTransaction => {
    if (cart.length === 0) throw new Error('Cart is empty');

    const company = activeCompany;
    const invoiceNumber = `${company.invoicePrefix}${company.currentInvoiceNumber}`;

    let subtotal = 0;
    let itemDiscountsTotal = 0;
    let taxTotal = 0;

    const saleItems = cart.map((item) => {
      const itemGross = item.unitPrice * item.quantity;
      const discount = (itemGross * item.discountPercent) / 100;
      const itemNet = itemGross - discount;
      const taxRate = company.type === 'billed' ? item.product.taxRate : 0;
      const tax = (itemNet * taxRate) / 100;
      const lineTotal = itemNet + tax;

      subtotal += itemGross;
      itemDiscountsTotal += discount;
      taxTotal += tax;

      return {
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        barcode: item.product.barcode,
        category: item.product.category,
        size: item.product.size,
        color: item.product.color,
        qty: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        discountAmount: discount,
        taxRate,
        taxAmount: tax,
        total: lineTotal,
        alteration: item.alteration,
      };
    });

    // Loyalty redemption
    const loyaltyDiscountAmount = redeemedPoints * loyaltyConfig.pointRedemptionValue;

    // Coupon discount
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        couponDiscountAmount = ((subtotal - itemDiscountsTotal) * appliedCoupon.discountValue) / 100;
      } else {
        couponDiscountAmount = appliedCoupon.discountValue;
      }
    }

    // Credit Note discount
    let creditNoteDiscountAmount = 0;
    if (appliedCreditNote) {
      creditNoteDiscountAmount = Math.min(
        appliedCreditNote.remainingAmount,
        Math.max(0, subtotal - itemDiscountsTotal - loyaltyDiscountAmount - couponDiscountAmount)
      );
    }

    const finalGrandTotal = Math.max(
      0,
      Math.round(
        subtotal -
          itemDiscountsTotal +
          taxTotal -
          loyaltyDiscountAmount -
          couponDiscountAmount -
          creditNoteDiscountAmount
      )
    );

    const pointsEarned = Math.floor(finalGrandTotal / 100) * loyaltyConfig.pointsPerHundredSpent;

    const changeDue =
      paymentMode === 'Cash' && cashTendered !== undefined
        ? Math.max(0, cashTendered - finalGrandTotal)
        : undefined;

    const transaction: SaleTransaction = {
      id: `sale_${Date.now()}`,
      invoiceNumber,
      companyId: company.id,
      companyName: company.name,
      companyTaxId: company.taxId,
      companyAddress: company.address,
      companyPhone: company.phone,
      companyReturnPolicy: company.returnPolicy,
      date: new Date().toISOString(),
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Retail Shopper',
      customerPhone: selectedCustomer ? selectedCustomer.phone : 'N/A',
      items: saleItems,
      subtotal,
      itemDiscountsTotal,
      loyaltyPointsUsed: redeemedPoints,
      loyaltyDiscountAmount,
      couponCodeApplied: appliedCoupon?.code,
      couponDiscountAmount,
      creditNoteCodeApplied: appliedCreditNote?.code,
      creditNoteDiscountAmount,
      taxTotal,
      grandTotal: finalGrandTotal,
      paymentMode,
      cashTendered,
      changeDue,
      splitBreakdown,
      notes,
      cashierName: company.type === 'billed' ? 'Billing Clerk (Reg 1)' : 'Cashier (Counter 2)',
      salesAssociate: selectedAssociate,
    };

    // 1. Decrement inventory stock
    setProducts((prev) => {
      const updated = [...prev];
      cart.forEach((cartItem) => {
        const idx = updated.findIndex((p) => p.id === cartItem.product.id);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            stock: Math.max(0, updated[idx].stock - cartItem.quantity),
          };
        }
      });
      return updated;
    });

    // 2. Increment Company Invoice Counter
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === company.id
          ? { ...c, currentInvoiceNumber: c.currentInvoiceNumber + 1 }
          : c
      )
    );

    // 3. Update customer CRM
    if (selectedCustomer) {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === selectedCustomer.id) {
            const netPoints = Math.max(0, cust.loyaltyPoints - redeemedPoints + pointsEarned);
            return {
              ...cust,
              loyaltyPoints: netPoints,
              totalSpend: cust.totalSpend + finalGrandTotal,
              totalVisits: cust.totalVisits + 1,
              lastPurchaseDate: new Date().toISOString().split('T')[0],
            };
          }
          return cust;
        })
      );
    }

    // 4. Update Credit Note if used
    if (appliedCreditNote && creditNoteDiscountAmount > 0) {
      setCreditNotes((prev) =>
        prev.map((cn) => {
          if (cn.id === appliedCreditNote.id) {
            const nextRemaining = Math.max(0, cn.remainingAmount - creditNoteDiscountAmount);
            return {
              ...cn,
              remainingAmount: nextRemaining,
              status: nextRemaining === 0 ? 'used' : 'active',
            };
          }
          return cn;
        })
      );
    }

    // 5. Automatically create Alteration Records if specified on items
    cart.forEach((item) => {
      if (item.alteration?.needed) {
        addAlteration({
          saleId: transaction.id,
          invoiceNumber,
          customerName: transaction.customerName,
          customerPhone: transaction.customerPhone,
          garmentName: item.product.name,
          size: item.product.size,
          color: item.product.color,
          alterationNotes: item.alteration.notes,
          tailorName: item.alteration.tailorName || '',
          promisedDate:
            item.alteration.promisedDate ||
            new Date(Date.now() + 86400000).toISOString().split('T')[0],
          status: 'In Progress',
        });
      }
    });

    // 6. Save sale transaction
    setSales((prev) => [transaction, ...prev]);

    // Background Supabase Sync if enabled
    if (isSupabaseAutoSync) {
      try {
        asyncSyncSale(transaction);
        cart.forEach((cartItem) => {
          const prod = products.find((p) => p.id === cartItem.product.id);
          if (prod) {
            asyncSyncProduct({
              ...prod,
              stock: Math.max(0, prod.stock - cartItem.quantity),
            });
          }
        });
        if (selectedCustomer) {
          asyncSyncCustomer({
            ...selectedCustomer,
            loyaltyPoints: Math.max(0, selectedCustomer.loyaltyPoints - redeemedPoints + pointsEarned),
            totalSpend: selectedCustomer.totalSpend + finalGrandTotal,
            totalVisits: selectedCustomer.totalVisits + 1,
            lastPurchaseDate: new Date().toISOString().split('T')[0],
          });
        }
      } catch (err) {
        console.warn('Background Supabase sync error on sale:', err);
      }
    }

    // 7. Open receipt
    setActiveReceipt(transaction);
    setIsReceiptModalOpen(true);

    // 8. Retain completed sale data until cashier explicitly starts next sale
    setLastCompletedSale(transaction);

    return transaction;
  };

  const resetToSampleData = () => {
    setCompanies(INITIAL_COMPANIES);
    setActiveCompanyId('comp_billed');
    setProducts(INITIAL_PRODUCTS);
    setVendors(INITIAL_VENDORS);
    setPurchases(INITIAL_PURCHASES);
    setVendorPayments(INITIAL_PAYMENTS);
    setSales(INITIAL_SALES);
    setCustomers(INITIAL_CUSTOMERS);
    setLoyaltyConfig(DEFAULT_LOYALTY_CONFIG);
    setAlterations(INITIAL_ALTERATIONS);
    setCreditNotes(INITIAL_CREDIT_NOTES);
    setDayRegister(INITIAL_REGISTER);
    setSoundEnabled(true);
    setUsers(DEFAULT_USERS);
    setCurrentUser(DEFAULT_USERS[0]);
    setIsLocked(false);
    setLockReason(undefined);
    setGlobalLowStockThresholdState(5);
    setAutoLockMinutesState(5);
    clearCart();
    setActiveReceipt(null);
    setIsReceiptModalOpen(false);

    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  };

  return (
    <AppContext.Provider
      value={{
        companies,
        activeCompanyId,
        activeCompany,
        setActiveCompanyId,
        updateCompany,
        addCompany,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkDeleteProducts,
        adjustStock,
        bulkUpdateProducts,
        bulkImportProducts,
        vendors,
        purchases,
        vendorPayments,
        addVendor,
        updateVendor,
        recordPurchaseOrder,
        recordVendorPayment,
        customers,
        addCustomer,
        updateCustomer,
        adjustLoyaltyPoints,
        cart,
        selectedCustomerId,
        selectedCustomer,
        setSelectedCustomerId,
        addToCart,
        removeFromCart,
        updateCartItemQty,
        updateCartItemDiscount,
        updateCartItemAlteration,
        clearCart,
        redeemedPoints,
        setRedeemedPoints,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        appliedCreditNote,
        applyCreditNoteCode,
        removeCreditNote,
        selectedAssociate,
        setSelectedAssociate,
        salesAssociates: SALES_ASSOCIATES,
        soundEnabled,
        setSoundEnabled,
        checkoutSale,
        sales,
        activeReceipt,
        setActiveReceipt,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        lastCompletedSale,
        setLastCompletedSale,
        startNextSale,
        updateSale,
        alterations,
        addAlteration,
        updateAlterationStatus,
        markAlterationNotified,
        creditNotes,
        issueCreditNote,
        dayRegister,
        updateOpeningCash,
        addPettyExpense,
        closeDayRegister,
        loyaltyConfig,
        updateLoyaltyConfig: setLoyaltyConfig,
        // Authentication & RBAC
        users,
        currentUser,
        isLocked,
        lockReason,
        login,
        logout,
        lockScreen,
        unlockScreen,
        switchUser,
        hasPermission,
        // User & Permission Management (Settings)
        addUser,
        updateUser,
        deleteUser,
        updateUserPassword,
        updateUserRole,
        updateUserPermissions,
        // Security & Global Thresholds
        autoLockMinutes,
        setAutoLockMinutes,
        globalLowStockThreshold,
        setGlobalLowStockThreshold,
        codePrintType,
        setCodePrintType,
        qrPrintSize,
        setQrPrintSize,
        // UPI & Digital Payments
        storeUpiId,
        setStoreUpiId,
        storeUpiName,
        setStoreUpiName,
        // Supabase Cloud Database & Sync
        supabaseConfig,
        saveSupabaseCreds,
        clearSupabaseCreds,
        pushToSupabase,
        pullFromSupabase,
        testSupabase,
        lastSupabaseSync,
        isSupabaseAutoSync,
        setIsSupabaseAutoSync,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );


};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
