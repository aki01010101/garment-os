import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Company,
  Product,
  ClothingCategory,
  ClothingSize,
  Season,
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
  ParkedCart,
  CashDrop,
  MatrixBatchProductInput,
  StockAuditItem,
  StockAuditSession,
  PromotionRule,
  StockTransferOrder,
  StockTransferStatus,
  AssociateCommissionConfig,
  AssociateCommissionPayout,
  WhatsAppCampaignTemplate,
  CustomerCreditPayment,
  KhataLedgerEntry,
  KhataSummaryStats,
  PaymentMode,
  CustomerCreditPaymentAllocation,
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
  INITIAL_PROMOTIONS,
  INITIAL_CREDIT_NOTES,
  INITIAL_ALTERATIONS,
  INITIAL_REGISTER,
  SALES_ASSOCIATES,
  DEFAULT_USERS,
  DEFAULT_STORE_BRANCHES,
  INITIAL_CAMPAIGN_TEMPLATES,
  INITIAL_COMMISSION_CONFIGS,
  INITIAL_STOCK_TRANSFERS,
  INITIAL_CREDIT_PAYMENTS,
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
  bulkImportProducts: (items: BulkCsvImportRow[]) => {
    updatedCount: number;
    createdCount?: number;
    notFoundCount: number;
    errors: string[];
  };
  addMatrixProducts: (input: MatrixBatchProductInput) => Product[];

  // Physical Stock Take Audit
  stockAudits: StockAuditSession[];
  saveStockAudit: (audit: StockAuditSession) => void;
  applyStockAuditReconciliation: (auditId: string) => { adjustedCount: number; message: string };

  // Retail Promotions & Offers Engine
  promotions: PromotionRule[];
  addPromotion: (promo: Omit<PromotionRule, 'id'>) => PromotionRule;
  updatePromotion: (promo: PromotionRule) => void;
  deletePromotion: (id: string) => void;
  togglePromotion: (id: string) => void;
  calculatePromotionsDiscount: (cartItems: CartItem[]) => { discountAmount: number; appliedRule: PromotionRule | null; explanation: string };

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
    paymentMode: PaymentMode,
    cashTendered?: number,
    notes?: string,
    splitBreakdown?: SplitPaymentBreakdown,
    taxInclusive?: boolean,
    creditDueDate?: string,
    creditNotes?: string
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
  addCashDrop: (drop: Omit<CashDrop, 'id' | 'time'>) => void;
  closeDayRegister: (countedCash: number, notes?: string) => void;

  // Parked Carts & Multi-Ticket Counter (Hold & Recall)
  parkedCarts: ParkedCart[];
  parkCurrentCart: (label?: string) => ParkedCart;
  recallParkedCart: (id: string) => void;
  deleteParkedCart: (id: string) => void;
  clearAllParkedCarts: () => void;

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

  // Phase 4: Multi-Branch Stock Transfers (STO)
  storeBranches: string[];
  stockTransfers: StockTransferOrder[];
  createStockTransfer: (order: Omit<StockTransferOrder, 'id' | 'transferNumber' | 'date'>) => StockTransferOrder;
  updateStockTransferStatus: (id: string, status: StockTransferStatus, notes?: string) => void;
  receiveStockTransfer: (id: string, receivedItems: { productId: string; qtyReceived: number }[], receivedBy: string) => { success: boolean; message: string };

  // Phase 4: Sales Associate Commission Engine
  associateCommissions: AssociateCommissionConfig[];
  updateAssociateCommission: (config: AssociateCommissionConfig) => void;
  calculateAssociateCommissions: (monthPeriod: string) => AssociateCommissionPayout[];

  // Phase 4: RFM WhatsApp Campaigns
  campaignTemplates: WhatsAppCampaignTemplate[];
  saveCampaignTemplate: (template: WhatsAppCampaignTemplate) => void;

  // Phase 4: Digital E-Receipt & Google Reviews
  storeGoogleReviewUrl: string;
  setStoreGoogleReviewUrl: (url: string) => void;
  googleReviewPromptText: string;
  setGoogleReviewPromptText: (text: string) => void;
  enableReceiptReviewQr: boolean;
  setEnableReceiptReviewQr: (enable: boolean) => void;
  enableEReceiptQr: boolean;
  setEnableEReceiptQr: (enable: boolean) => void;

  // Customer Khata (Credit) & Recovery System
  creditPayments: CustomerCreditPayment[];
  recordCreditPayment: (payment: Omit<CustomerCreditPayment, 'id' | 'receiptNumber'>) => CustomerCreditPayment;
  getCustomerKhata: (customerId: string) => {
    creditSales: SaleTransaction[];
    payments: CustomerCreditPayment[];
    ledger: KhataLedgerEntry[];
    totalOutstanding: number;
    agingBuckets: {
      '0-15': number;
      '16-30': number;
      '31-60': number;
      '60+': number;
    };
    oldestCreditDays: number;
  };
  getKhataSummaryStats: () => KhataSummaryStats;

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
  PARKED_CARTS: 'garment_os_parked_carts_v1',
  PROMOTIONS: 'garment_os_promotions_v1',
  STOCK_AUDITS: 'garment_os_stock_audits_v1',
  STOCK_TRANSFERS: 'garment_os_stock_transfers_v1',
  COMMISSION_CONFIGS: 'garment_os_commission_configs_v1',
  CAMPAIGN_TEMPLATES: 'garment_os_campaign_templates_v1',
  GOOGLE_REVIEW_URL: 'garment_os_google_review_url_v1',
  GOOGLE_REVIEW_PROMPT: 'garment_os_google_review_prompt_v1',
  ENABLE_RECEIPT_REVIEW_QR: 'garment_os_enable_receipt_review_qr_v1',
  ENABLE_E_RECEIPT_QR: 'garment_os_enable_ereceipt_qr_v1',
  CREDIT_PAYMENTS: 'garment_os_customer_credit_payments_v1',
};



function safeLoad<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return fallback;
    return JSON.parse(saved);
  } catch (err) {
    console.warn(`Failed to parse localStorage key "${key}", falling back to default:`, err);
    return fallback;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      if (saved && saved !== 'undefined') {
        const parsed: Company[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => ({
            ...c,
            name: c.name?.replace(/Verve Threads/gi, 'Garment OS')?.replace(/Verve Street Counter/gi, 'Garment OS Counter') || c.name,
            legalName: c.legalName?.replace(/Verve Threads/gi, 'Garment OS')?.replace(/Verve Retail/gi, 'Garment OS') || c.legalName,
            email: c.email?.replace(/vervethreads\.in/gi, 'garmentos.in')?.replace(/vervestreet\.in/gi, 'garmentos.in') || c.email,
          }));
        }
      }
    } catch {
      return INITIAL_COMPANIES;
    }
    return INITIAL_COMPANIES;
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY);
    return saved || 'comp_billed';
  });

  const [products, setProducts] = useState<Product[]>(() => safeLoad(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
  const [vendors, setVendors] = useState<Vendor[]>(() => safeLoad(STORAGE_KEYS.VENDORS, INITIAL_VENDORS));
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => safeLoad(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES));
  const [vendorPayments, setVendorPayments] = useState<VendorPaymentRecord[]>(() => safeLoad(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS));
  const [sales, setSales] = useState<SaleTransaction[]>(() => safeLoad(STORAGE_KEYS.SALES, INITIAL_SALES));
  const [customers, setCustomers] = useState<Customer[]>(() => safeLoad(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS));
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(() => safeLoad(STORAGE_KEYS.LOYALTY, DEFAULT_LOYALTY_CONFIG));
  const [alterations, setAlterations] = useState<AlterationRecord[]>(() => safeLoad(STORAGE_KEYS.ALTERATIONS, INITIAL_ALTERATIONS));
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => safeLoad(STORAGE_KEYS.CREDIT_NOTES, INITIAL_CREDIT_NOTES));
  const [creditPayments, setCreditPayments] = useState<CustomerCreditPayment[]>(() =>
    safeLoad(STORAGE_KEYS.CREDIT_PAYMENTS, INITIAL_CREDIT_PAYMENTS)
  );
  const [dayRegister, setDayRegister] = useState<DayEndRegister>(() => safeLoad(STORAGE_KEYS.REGISTER, INITIAL_REGISTER));
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => safeLoad(STORAGE_KEYS.SOUND, true));

  // Users & Staff Management State
  const [users, setUsers] = useState<UserAccount[]>(() => safeLoad(STORAGE_KEYS.USERS, DEFAULT_USERS));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  // Authentication & RBAC State
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => safeLoad(STORAGE_KEYS.CURRENT_USER, DEFAULT_USERS[0]));

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
    if (tabKey === 'landing' || tabKey === 'overview') return true;
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
      // Sales cashiers can access POS billing, Returns/Exchanges, Alterations, Sales Register, and Khata
      return ['pos', 'returns', 'alterations', 'sales-register', 'khata'].includes(tabKey);
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

  // Parked Carts (Multi-Ticket Counter Hold & Recall)
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PARKED_CARTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PARKED_CARTS, JSON.stringify(parkedCarts));
    } catch (e) {
      console.warn('Failed to save parked carts to localStorage:', e);
    }
  }, [parkedCarts]);

  const parkCurrentCart = (label?: string): ParkedCart => {
    if (cart.length === 0) {
      throw new Error('Cannot hold an empty cart');
    }

    let subtotal = 0;
    let discounts = 0;
    cart.forEach((item) => {
      const gross = item.unitPrice * item.quantity;
      const disc = (gross * item.discountPercent) / 100;
      subtotal += gross;
      discounts += disc;
    });

    const highestTicket = parkedCarts.reduce((max, p) => Math.max(max, p.ticketNumber || 0), 0);
    const ticketNumber = highestTicket + 1;
    const customer = customers.find((c) => c.id === selectedCustomerId);

    const newParked: ParkedCart = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ticketNumber,
      label: label?.trim() || `Ticket #${ticketNumber}${customer ? ` (${customer.name})` : ''}`,
      parkedAt: new Date().toISOString(),
      cashierName: currentUser.fullName,
      customerId: selectedCustomerId,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      items: [...cart],
      selectedAssociate,
      appliedCoupon,
      appliedCreditNote,
      redeemedPoints,
      subtotal,
      grandTotal: Math.max(0, subtotal - discounts),
    };

    setParkedCarts((prev) => [newParked, ...prev]);
    clearCart();
    return newParked;
  };

  const recallParkedCart = (id: string) => {
    const target = parkedCarts.find((p) => p.id === id);
    if (!target) return;

    setCart(target.items);
    setSelectedCustomerId(target.customerId || null);
    setSelectedAssociate(target.selectedAssociate || SALES_ASSOCIATES[0]);
    setAppliedCoupon(target.appliedCoupon || null);
    setAppliedCreditNote(target.appliedCreditNote || null);
    setRedeemedPoints(target.redeemedPoints || 0);

    setParkedCarts((prev) => prev.filter((p) => p.id !== id));
  };

  const deleteParkedCart = (id: string) => {
    setParkedCarts((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAllParkedCarts = () => {
    setParkedCarts([]);
  };

  // Retail Promotions State & Rules Engine
  const [promotions, setPromotions] = useState<PromotionRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
      return saved ? JSON.parse(saved) : INITIAL_PROMOTIONS;
    } catch {
      return INITIAL_PROMOTIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(promotions));
    } catch (e) {
      console.warn('Failed to save promotions to localStorage:', e);
    }
  }, [promotions]);

  const addPromotion = (promo: Omit<PromotionRule, 'id'>): PromotionRule => {
    const newPromo: PromotionRule = {
      ...promo,
      id: `promo_${Date.now()}`,
    };
    setPromotions((prev) => [newPromo, ...prev]);
    return newPromo;
  };

  const updatePromotion = (promo: PromotionRule) => {
    setPromotions((prev) => prev.map((p) => (p.id === promo.id ? promo : p)));
  };

  const deletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePromotion = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const calculatePromotionsDiscount = (
    cartItems: CartItem[]
  ): { discountAmount: number; appliedRule: PromotionRule | null; explanation: string } => {
    if (cartItems.length === 0) {
      return { discountAmount: 0, appliedRule: null, explanation: '' };
    }

    const activeRules = promotions.filter((p) => p.isActive);
    if (activeRules.length === 0) {
      return { discountAmount: 0, appliedRule: null, explanation: '' };
    }

    const individualPieces: { item: CartItem; netPrice: number }[] = [];
    let grossCartTotal = 0;
    cartItems.forEach((ci) => {
      const unitNet = (ci.unitPrice * (100 - ci.discountPercent)) / 100;
      grossCartTotal += ci.unitPrice * ci.quantity;
      for (let i = 0; i < ci.quantity; i++) {
        individualPieces.push({ item: ci, netPrice: unitNet });
      }
    });

    for (const rule of activeRules) {
      // 1. BOGO (Buy X Get Y Free)
      if (rule.type === 'bogo' && rule.minQuantity && rule.freeQuantity) {
        const qualifyingPieces = rule.applicableCategory && rule.applicableCategory !== 'ALL'
          ? individualPieces.filter((p) => p.item.product.category === rule.applicableCategory)
          : individualPieces;

        if (qualifyingPieces.length >= rule.minQuantity) {
          const sorted = [...qualifyingPieces].sort((a, b) => a.netPrice - b.netPrice);
          const howManySets = Math.floor(qualifyingPieces.length / rule.minQuantity);
          const totalFreePieces = Math.min(howManySets * rule.freeQuantity, sorted.length);
          const freePieces = sorted.slice(0, totalFreePieces);
          const savings = freePieces.reduce((sum, p) => sum + p.netPrice, 0);

          if (savings > 0) {
            return {
              discountAmount: Math.round(savings),
              appliedRule: rule,
              explanation: `${rule.title}: ${totalFreePieces} free garment(s) (-₹${Math.round(savings)})`,
            };
          }
        }
      }

      // 2. Cart Slab (e.g. Spend ₹3,000 get ₹500 off)
      if (rule.type === 'cart_slab' && rule.minCartAmount) {
        if (grossCartTotal >= rule.minCartAmount) {
          let savings = 0;
          if (rule.slabDiscountAmount) {
            savings = rule.slabDiscountAmount;
          } else if (rule.slabDiscountPercent) {
            savings = (grossCartTotal * rule.slabDiscountPercent) / 100;
          }
          if (savings > 0) {
            return {
              discountAmount: Math.round(savings),
              appliedRule: rule,
              explanation: `${rule.title}: Instant ₹${Math.round(savings)} cart discount`,
            };
          }
        }
      }

      // 3. Bundle Price (e.g. Any 2 for ₹1,499)
      if (rule.type === 'bundle_price' && rule.minQuantity && rule.bundlePrice) {
        const qualifyingPieces = rule.applicableCategory && rule.applicableCategory !== 'ALL'
          ? individualPieces.filter((p) => p.item.product.category === rule.applicableCategory)
          : individualPieces;

        if (qualifyingPieces.length >= rule.minQuantity) {
          const sets = Math.floor(qualifyingPieces.length / rule.minQuantity);
          const sortedDesc = [...qualifyingPieces].sort((a, b) => b.netPrice - a.netPrice);
          const bundlePieces = sortedDesc.slice(0, sets * rule.minQuantity);
          const normalTotal = bundlePieces.reduce((sum, p) => sum + p.netPrice, 0);
          const bundleTotal = sets * rule.bundlePrice;
          const savings = normalTotal - bundleTotal;

          if (savings > 0) {
            return {
              discountAmount: Math.round(savings),
              appliedRule: rule,
              explanation: `${rule.title}: Combo bundle savings (-₹${Math.round(savings)})`,
            };
          }
        }
      }
    }

    return { discountAmount: 0, appliedRule: null, explanation: '' };
  };

  // Stock Take Audits State
  const [stockAudits, setStockAudits] = useState<StockAuditSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_AUDITS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STOCK_AUDITS, JSON.stringify(stockAudits));
    } catch (e) {
      console.warn('Failed to save stock audits to localStorage:', e);
    }
  }, [stockAudits]);

  const saveStockAudit = (audit: StockAuditSession) => {
    setStockAudits((prev) => [audit, ...prev.filter((a) => a.id !== audit.id)]);
  };

  const applyStockAuditReconciliation = (
    auditId: string
  ): { adjustedCount: number; message: string } => {
    const targetAudit = stockAudits.find((a) => a.id === auditId);
    if (!targetAudit) {
      return { adjustedCount: 0, message: 'Audit session not found' };
    }

    let adjustedCount = 0;
    setProducts((prev) => {
      const updated = [...prev];
      targetAudit.items.forEach((auditItem) => {
        const idx = updated.findIndex((p) => p.id === auditItem.productId);
        if (idx !== -1) {
          if (updated[idx].stock !== auditItem.scannedStock) {
            updated[idx] = { ...updated[idx], stock: auditItem.scannedStock };
            adjustedCount++;
            if (isSupabaseAutoSync) {
              try {
                asyncSyncProduct(updated[idx]);
              } catch {}
            }
          }
        }
      });
      return updated;
    });

    const completedAudit: StockAuditSession = {
      ...targetAudit,
      status: 'completed',
    };
    saveStockAudit(completedAudit);

    return {
      adjustedCount,
      message: `Stock reconciled for ${adjustedCount} garments from Audit #${targetAudit.auditNumber}.`,
    };
  };

  // Phase 4: Multi-Branch Stock Transfer (STO) State
  const [storeBranches] = useState<string[]>(DEFAULT_STORE_BRANCHES);
  const [stockTransfers, setStockTransfers] = useState<StockTransferOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_TRANSFERS);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_TRANSFERS;
    } catch {
      return INITIAL_STOCK_TRANSFERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STOCK_TRANSFERS, JSON.stringify(stockTransfers));
    } catch (e) {
      console.warn('Failed to save stock transfers to localStorage:', e);
    }
  }, [stockTransfers]);

  const createStockTransfer = (
    order: Omit<StockTransferOrder, 'id' | 'transferNumber' | 'date'>
  ): StockTransferOrder => {
    const highestNum = stockTransfers.reduce((max, t) => {
      const match = t.transferNumber.match(/\d+$/);
      return match ? Math.max(max, parseInt(match[0], 10)) : max;
    }, 0);
    const transferNumber = `STO-${new Date().getFullYear()}-${String(highestNum + 1).padStart(3, '0')}`;
    const newTransfer: StockTransferOrder = {
      ...order,
      id: `sto_${Date.now()}`,
      transferNumber,
      date: new Date().toISOString(),
    };

    setStockTransfers((prev) => [newTransfer, ...prev]);

    // Automatically deduct inventory stock for dispatched products if dispatched/in_transit
    if (order.status === 'dispatched' || order.status === 'in_transit') {
      setProducts((prev) =>
        prev.map((p) => {
          const item = order.items.find((i) => i.productId === p.id);
          if (item) {
            return { ...p, stock: Math.max(0, p.stock - item.qtyDispatched) };
          }
          return p;
        })
      );
    }

    return newTransfer;
  };

  const updateStockTransferStatus = (id: string, status: StockTransferStatus, notes?: string) => {
    setStockTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, ...(notes ? { notes } : {}) } : t))
    );
  };

  const receiveStockTransfer = (
    id: string,
    receivedItems: { productId: string; qtyReceived: number }[],
    receivedBy: string
  ): { success: boolean; message: string } => {
    const target = stockTransfers.find((t) => t.id === id);
    if (!target) return { success: false, message: 'Stock transfer order not found.' };

    let totalReceived = 0;
    let hasDiscrepancy = false;

    const updatedItems = target.items.map((item) => {
      const match = receivedItems.find((r) => r.productId === item.productId);
      const qtyReceived = match ? match.qtyReceived : item.qtyDispatched;
      const variance = qtyReceived - item.qtyDispatched;
      if (variance !== 0) hasDiscrepancy = true;
      totalReceived += qtyReceived;
      return {
        ...item,
        qtyReceived,
        variance,
      };
    });

    const newStatus: StockTransferStatus = hasDiscrepancy ? 'discrepancy' : 'received';

    setStockTransfers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              items: updatedItems,
              totalReceivedQty: totalReceived,
              receivedBy,
              receivedAt: new Date().toISOString(),
            }
          : t
      )
    );

    // Increment inventory stock for products received
    setProducts((prev) =>
      prev.map((p) => {
        const item = updatedItems.find((i) => i.productId === p.id);
        if (item && item.qtyReceived) {
          return { ...p, stock: p.stock + item.qtyReceived };
        }
        return p;
      })
    );

    return {
      success: true,
      message: `Stock Transfer ${target.transferNumber} received (${totalReceived} units). Status: ${newStatus.toUpperCase()}`,
    };
  };

  // Phase 4: Sales Associate Commission Engine
  const [associateCommissions, setAssociateCommissions] = useState<AssociateCommissionConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMMISSION_CONFIGS);
      return saved ? JSON.parse(saved) : INITIAL_COMMISSION_CONFIGS;
    } catch {
      return INITIAL_COMMISSION_CONFIGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMISSION_CONFIGS, JSON.stringify(associateCommissions));
    } catch (e) {
      console.warn('Failed to save commission configs to localStorage:', e);
    }
  }, [associateCommissions]);

  const updateAssociateCommission = (config: AssociateCommissionConfig) => {
    setAssociateCommissions((prev) => {
      const exists = prev.some((c) => c.associateName === config.associateName);
      if (exists) {
        return prev.map((c) => (c.associateName === config.associateName ? config : c));
      }
      return [...prev, config];
    });
  };

  const calculateAssociateCommissions = (monthPeriod: string): AssociateCommissionPayout[] => {
    return SALES_ASSOCIATES.map((assocName) => {
      const config = associateCommissions.find((c) => c.associateName === assocName) || {
        associateName: assocName,
        monthlySalesTarget: 150000,
        baseCommissionPercent: 1.5,
        bonusCommissionPercent: 2.5,
      };

      const monthSales = sales.filter(
        (s) => s.salesAssociate === assocName && s.date.startsWith(monthPeriod)
      );
      const totalSalesRevenue = monthSales.reduce((sum, s) => sum + s.grandTotal, 0);
      const billsHandled = monthSales.length;

      const targetAmount = config.monthlySalesTarget;
      const targetAchievedPercent = targetAmount > 0 ? Math.round((totalSalesRevenue / targetAmount) * 100) : 0;

      const baseCommission = (totalSalesRevenue * config.baseCommissionPercent) / 100;
      let bonusAmount = 0;
      if (targetAchievedPercent >= 100 && config.bonusCommissionPercent) {
        const surplus = totalSalesRevenue - targetAmount;
        bonusAmount = (surplus * config.bonusCommissionPercent) / 100;
      }

      const totalPayout = Math.round(baseCommission + bonusAmount);

      return {
        id: `payout_${assocName}_${monthPeriod}`,
        associateName: assocName,
        periodMonth: monthPeriod,
        totalSalesRevenue,
        billsHandled,
        targetAmount,
        targetAchievedPercent,
        commissionAmount: Math.round(baseCommission),
        bonusAmount: Math.round(bonusAmount),
        totalPayout,
        status: 'pending',
      };
    });
  };

  // Phase 4: WhatsApp Campaign Templates
  const [campaignTemplates, setCampaignTemplates] = useState<WhatsAppCampaignTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_TEMPLATES);
      return saved ? JSON.parse(saved) : INITIAL_CAMPAIGN_TEMPLATES;
    } catch {
      return INITIAL_CAMPAIGN_TEMPLATES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGN_TEMPLATES, JSON.stringify(campaignTemplates));
    } catch (e) {
      console.warn('Failed to save campaign templates to localStorage:', e);
    }
  }, [campaignTemplates]);

  const saveCampaignTemplate = (template: WhatsAppCampaignTemplate) => {
    setCampaignTemplates((prev) => {
      const exists = prev.some((t) => t.id === template.id);
      if (exists) {
        return prev.map((t) => (t.id === template.id ? template : t));
      }
      return [template, ...prev];
    });
  };

  // Phase 4: Digital E-Receipt & Google Reviews
  const [storeGoogleReviewUrl, setStoreGoogleReviewUrlState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_REVIEW_URL) || 'https://g.page/r/garment-os-reviews';
  });

  const setStoreGoogleReviewUrl = (url: string) => {
    setStoreGoogleReviewUrlState(url);
    try {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_REVIEW_URL, url);
    } catch (e) {
      console.warn(e);
    }
  };

  const [googleReviewPromptText, setGoogleReviewPromptTextState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_REVIEW_PROMPT) || 'Rate Us 5★ On Google';
  });

  const setGoogleReviewPromptText = (text: string) => {
    setGoogleReviewPromptTextState(text);
    try {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_REVIEW_PROMPT, text);
    } catch (e) {
      console.warn(e);
    }
  };

  const [enableReceiptReviewQr, setEnableReceiptReviewQrState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ENABLE_RECEIPT_REVIEW_QR) !== 'false';
  });

  const setEnableReceiptReviewQr = (enable: boolean) => {
    setEnableReceiptReviewQrState(enable);
    try {
      localStorage.setItem(STORAGE_KEYS.ENABLE_RECEIPT_REVIEW_QR, String(enable));
    } catch (e) {
      console.warn(e);
    }
  };

  const [enableEReceiptQr, setEnableEReceiptQrState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ENABLE_E_RECEIPT_QR) !== 'false';
  });

  const setEnableEReceiptQr = (enable: boolean) => {
    setEnableEReceiptQrState(enable);
    try {
      localStorage.setItem(STORAGE_KEYS.ENABLE_E_RECEIPT_QR, String(enable));
    } catch (e) {
      console.warn(e);
    }
  };

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
    localStorage.setItem(STORAGE_KEYS.CREDIT_PAYMENTS, JSON.stringify(creditPayments));
  }, [creditPayments]);
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
  ): { updatedCount: number; createdCount: number; notFoundCount: number; errors: string[] } => {
    let updatedCount = 0;
    let createdCount = 0;
    let notFoundCount = 0;
    const errors: string[] = [];

    const normalizeCategory = (val?: string): ClothingCategory => {
      if (!val) return 'Men';
      const v = val.toLowerCase().trim();
      if (/women|female|ladies|saree|kurti|lehenga|top|dress/i.test(v)) return 'Women';
      if (/kid|child|boy|girl|baby|toddler/i.test(v)) return 'Kids';
      if (/acc|bag|belt|wallet|jewel|scarf|socks|tie|perfume|cap/i.test(v)) return 'Accessories';
      if (/men|male|gent/i.test(v)) return 'Men';
      return 'Men';
    };

    const normalizeSeason = (val?: string): Season => {
      if (!val) return 'All-Season';
      const v = val.toLowerCase().trim();
      if (/summer|spring|ss/i.test(v)) return 'Summer';
      if (/winter|fall|fw/i.test(v)) return 'Winter';
      if (/fest|autumn|diwali|puja|wedding/i.test(v)) return 'Festive / Autumn';
      return 'All-Season';
    };

    setProducts((prev) => {
      const copy = [...prev];
      const newlyAdded: Product[] = [];

      items.forEach((row, idx) => {
        const skuQ = (row.sku || '').trim().toLowerCase();
        const barcodeQ = (row.barcode || '').trim().toLowerCase();
        const nameQ = (row.name || '').trim().toLowerCase();

        // Check if row is completely blank
        const hasAnyData =
          Boolean(skuQ || barcodeQ || nameQ) ||
          typeof row.stock === 'number' ||
          typeof row.stockDelta === 'number' ||
          typeof row.sellingPrice === 'number' ||
          typeof row.costPrice === 'number' ||
          Boolean(row.category || row.size || row.color);

        if (!hasAnyData) {
          return; // Ignore empty blank rows
        }

        // 1. Try to find match in catalog
        let foundIdx = -1;
        if (skuQ) {
          foundIdx = copy.findIndex((p) => p.sku.toLowerCase() === skuQ);
        }
        if (foundIdx === -1 && barcodeQ) {
          foundIdx = copy.findIndex((p) => p.barcode.toLowerCase() === barcodeQ);
        }
        if (foundIdx === -1 && nameQ) {
          // If name matches, match same size/color if provided
          foundIdx = copy.findIndex((p) => {
            if (p.name.toLowerCase() !== nameQ) return false;
            if (row.size && p.size.toLowerCase() !== row.size.toLowerCase().trim()) return false;
            if (row.color && p.color.toLowerCase() !== row.color.toLowerCase().trim()) return false;
            return true;
          });
          // Fallback to name-only match if still not found
          if (foundIdx === -1) {
            foundIdx = copy.findIndex((p) => p.name.toLowerCase() === nameQ);
          }
        }

        if (foundIdx !== -1) {
          // UPDATE EXISTING PRODUCT (only update fields that were provided)
          const current = copy[foundIdx];

          let stock = current.stock;
          if (typeof row.stock === 'number' && !isNaN(row.stock)) {
            stock = Math.max(0, row.stock);
          } else if (typeof row.stockDelta === 'number' && !isNaN(row.stockDelta)) {
            stock = Math.max(0, stock + row.stockDelta);
          }

          const sellingPrice =
            typeof row.sellingPrice === 'number' && !isNaN(row.sellingPrice)
              ? Math.max(0, row.sellingPrice)
              : current.sellingPrice;

          const costPrice =
            typeof row.costPrice === 'number' && !isNaN(row.costPrice)
              ? Math.max(0, row.costPrice)
              : current.costPrice;

          const taxRate =
            typeof row.taxRate === 'number' && !isNaN(row.taxRate)
              ? Math.max(0, row.taxRate)
              : current.taxRate;

          const minStockAlert =
            typeof row.minStockAlert === 'number' && !isNaN(row.minStockAlert)
              ? Math.max(0, row.minStockAlert)
              : current.minStockAlert;

          const updatedProduct: Product = {
            ...current,
            name: row.name?.trim() ? row.name.trim() : current.name,
            category: row.category ? normalizeCategory(String(row.category)) : current.category,
            subCategory: row.subCategory?.trim() ? row.subCategory.trim() : current.subCategory,
            size: row.size?.trim() ? (row.size.trim() as ClothingSize) : current.size,
            color: row.color?.trim() ? row.color.trim() : current.color,
            season: row.season ? normalizeSeason(String(row.season)) : current.season,
            brand: row.brand?.trim() ? row.brand.trim() : current.brand,
            rack: row.rack?.trim() ? row.rack.trim() : current.rack,
            description: row.description?.trim() ? row.description.trim() : current.description,
            stock,
            sellingPrice,
            costPrice,
            taxRate,
            minStockAlert,
          };

          copy[foundIdx] = updatedProduct;
          if (isSupabaseAutoSync) asyncSyncProduct(updatedProduct);
          updatedCount++;
        } else {
          // CREATE NEW PRODUCT IF NAME, SKU OR BARCODE IS PRESENT
          if (nameQ || skuQ || barcodeQ) {
            const timestamp = Date.now() + idx;
            const category = normalizeCategory(row.category ? String(row.category) : undefined);
            const season = normalizeSeason(row.season ? String(row.season) : undefined);

            const catPrefix = category === 'Women' ? 'W' : category === 'Kids' ? 'K' : category === 'Accessories' ? 'ACC' : 'M';
            const autoSku = (row.sku || '').trim() || `VT-${catPrefix}-${String(timestamp).slice(-6)}`;
            const autoBarcode = (row.barcode || '').trim() || `890${Math.floor(100000000 + Math.random() * 900000000)}`;

            const stock =
              typeof row.stock === 'number' && !isNaN(row.stock)
                ? Math.max(0, row.stock)
                : typeof row.stockDelta === 'number' && !isNaN(row.stockDelta)
                ? Math.max(0, row.stockDelta)
                : 0;

            const sellingPrice =
              typeof row.sellingPrice === 'number' && !isNaN(row.sellingPrice)
                ? Math.max(0, row.sellingPrice)
                : 0;

            const costPrice =
              typeof row.costPrice === 'number' && !isNaN(row.costPrice)
                ? Math.max(0, row.costPrice)
                : 0;

            const taxRate =
              typeof row.taxRate === 'number' && !isNaN(row.taxRate)
                ? Math.max(0, row.taxRate)
                : 5;

            const minStockAlert =
              typeof row.minStockAlert === 'number' && !isNaN(row.minStockAlert)
                ? Math.max(0, row.minStockAlert)
                : 5;

            const newProduct: Product = {
              id: `prod_${timestamp}`,
              sku: autoSku,
              barcode: autoBarcode,
              name: (row.name || '').trim() || `Garment ${autoSku}`,
              category,
              subCategory: (row.subCategory || '').trim() || 'General',
              size: ((row.size || '').trim() || 'Free Size') as ClothingSize,
              color: (row.color || '').trim() || 'Standard',
              season,
              stock,
              sellingPrice,
              costPrice,
              taxRate,
              minStockAlert,
              brand: row.brand?.trim(),
              rack: row.rack?.trim(),
              description: row.description?.trim(),
            };

            copy.unshift(newProduct);
            newlyAdded.push(newProduct);
            if (isSupabaseAutoSync) asyncSyncProduct(newProduct);
            createdCount++;
          } else {
            notFoundCount++;
            errors.push(`Row ${idx + 1}: Skipped (missing garment name, SKU, or barcode)`);
          }
        }
      });

      return copy;
    });

    return { updatedCount, createdCount, notFoundCount, errors };
  };

  const addMatrixProducts = (input: MatrixBatchProductInput): Product[] => {
    const newProducts: Product[] = [];
    const timestamp = Date.now();
    let counter = 1;

    for (const color of input.colors) {
      for (const size of input.sizes) {
        const key = `${color}__${size}`;
        const qty = input.grid[key] ?? 0;

        const colorCode = color.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
        const sizeCode = size.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const sku = `${input.skuPrefix.trim().toUpperCase()}-${colorCode}-${sizeCode}`;
        const barcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;

        const newProd: Product = {
          id: `prod_mtx_${timestamp}_${counter++}`,
          name: `${input.styleName} - ${color} (${size})`,
          sku,
          barcode,
          category: input.category,
          subCategory: input.subCategory,
          size,
          color,
          season: input.season,
          costPrice: input.costPrice,
          sellingPrice: input.sellingPrice,
          stock: qty,
          minStockAlert: input.minStockAlert || 4,
          taxRate: input.taxRate || 5,
          taxInclusive: input.taxInclusive,
          purchaseSource: input.purchaseSource || 'billed',
          description: input.description || `${input.styleName} in ${color}, size ${size}`,
        };

        newProducts.push(newProd);
      }
    }

    if (newProducts.length > 0) {
      setProducts((prev) => [...newProducts, ...prev]);
      if (isSupabaseAutoSync) {
        newProducts.forEach((p) => {
          try {
            asyncSyncProduct(p);
          } catch {}
        });
      }
    }

    return newProducts;
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

  const addCashDrop = (drop: Omit<CashDrop, 'id' | 'time'>) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newDrop: CashDrop = {
      ...drop,
      id: `drop_${Date.now()}`,
      time,
    };
    setDayRegister((prev) => {
      const existingDrops = prev.cashDrops || [];
      const updated = {
        ...prev,
        cashDrops: [...existingDrops, newDrop],
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
    paymentMode: PaymentMode,
    cashTendered?: number,
    notes?: string,
    splitBreakdown?: SplitPaymentBreakdown,
    taxInclusive?: boolean,
    creditDueDate?: string,
    creditNotes?: string
  ): SaleTransaction => {
    if (cart.length === 0) throw new Error('Cart is empty');

    const company = activeCompany;
    const invoiceNumber = `${company.invoicePrefix}${company.currentInvoiceNumber}`;
    const defaultInclusive = taxInclusive !== undefined ? taxInclusive : (company.taxInclusive !== false);

    let subtotal = 0;
    let itemDiscountsTotal = 0;
    let taxTotal = 0;
    let totalExclusiveTax = 0;

    const saleItems = cart.map((item) => {
      const itemGross = item.unitPrice * item.quantity;
      const discount = (itemGross * item.discountPercent) / 100;
      const itemNet = itemGross - discount;
      const itemIsInclusive = item.product.taxInclusive !== undefined ? item.product.taxInclusive : defaultInclusive;

      // Dynamic Indian Garment GST Slabs: 5% if net unit price <= 1000, 12% if > 1000
      let taxRate = company.type === 'billed' ? item.product.taxRate : 0;
      if (company.type === 'billed' && company.enableDynamicGarmentGst !== false) {
        const netPerUnit = itemNet / (item.quantity || 1);
        taxRate = netPerUnit <= 1000 ? 5 : 12;
      }

      let tax = 0;
      let lineTotal = itemNet;

      if (company.type === 'billed') {
        if (itemIsInclusive) {
          tax = itemNet - itemNet / (1 + taxRate / 100);
          lineTotal = itemNet;
        } else {
          tax = (itemNet * taxRate) / 100;
          lineTotal = itemNet + tax;
          totalExclusiveTax += tax;
        }
      }

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

    // Promotional Discount (BOGO, Cart Slabs, Bundle Combo Deals)
    const promoResult = calculatePromotionsDiscount(cart);
    const promoDiscountAmount = promoResult.discountAmount;
    const promoTitleApplied = promoResult.appliedRule?.title;

    const finalGrandTotal = Math.max(
      0,
      Math.round(
        subtotal -
          itemDiscountsTotal -
          promoDiscountAmount +
          totalExclusiveTax -
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

    // Calculate Credit parameters
    let creditAmount: number | undefined = undefined;
    let creditRemainingBalance: number | undefined = undefined;
    let creditStatus: 'unpaid' | 'partially_paid' | 'paid' | undefined = undefined;
    let resolvedDueDate: string | undefined = undefined;

    if (paymentMode === 'Credit') {
      creditAmount = finalGrandTotal;
      creditRemainingBalance = finalGrandTotal;
      creditStatus = 'unpaid';
      resolvedDueDate = creditDueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    } else if (paymentMode === 'Split' && splitBreakdown?.credit && splitBreakdown.credit > 0) {
      creditAmount = Math.min(finalGrandTotal, splitBreakdown.credit);
      creditRemainingBalance = creditAmount;
      creditStatus = 'unpaid';
      resolvedDueDate = creditDueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    }

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
      promoDiscountAmount: promoDiscountAmount > 0 ? promoDiscountAmount : undefined,
      promoTitleApplied: promoDiscountAmount > 0 ? promoTitleApplied : undefined,
      creditNoteCodeApplied: appliedCreditNote?.code,
      creditNoteDiscountAmount,
      taxTotal,
      grandTotal: finalGrandTotal,
      paymentMode,
      cashTendered,
      changeDue,
      splitBreakdown,
      creditAmount,
      creditRemainingBalance,
      creditDueDate: resolvedDueDate,
      creditStatus,
      creditNotes,
      notes,
      taxInclusive: defaultInclusive,
      isCompositionScheme: company.isCompositionScheme ?? false,
      googleReviewUrl: company.googleReviewUrl || storeGoogleReviewUrl,
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
            const creditAmt = creditAmount || 0;
            const newOutstanding = (cust.outstandingCredit || 0) + creditAmt;
            const oldestDate = cust.oldestCreditDate || (creditAmt > 0 ? transaction.date : undefined);
            return {
              ...cust,
              loyaltyPoints: netPoints,
              totalSpend: cust.totalSpend + finalGrandTotal,
              totalVisits: cust.totalVisits + 1,
              lastPurchaseDate: new Date().toISOString().split('T')[0],
              outstandingCredit: newOutstanding,
              oldestCreditDate: oldestDate,
              creditStatus: newOutstanding > 0 ? (cust.creditStatus || 'good') : 'good',
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
          const creditAmt = creditAmount || 0;
          const newOutstanding = (selectedCustomer.outstandingCredit || 0) + creditAmt;
          asyncSyncCustomer({
            ...selectedCustomer,
            loyaltyPoints: Math.max(0, selectedCustomer.loyaltyPoints - redeemedPoints + pointsEarned),
            totalSpend: selectedCustomer.totalSpend + finalGrandTotal,
            totalVisits: selectedCustomer.totalVisits + 1,
            lastPurchaseDate: new Date().toISOString().split('T')[0],
            outstandingCredit: newOutstanding,
            oldestCreditDate: selectedCustomer.oldestCreditDate || (creditAmt > 0 ? transaction.date : undefined),
            creditStatus: newOutstanding > 0 ? (selectedCustomer.creditStatus || 'good') : 'good',
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

  // Customer Khata Management
  const recordCreditPayment = (
    paymentData: Omit<CustomerCreditPayment, 'id' | 'receiptNumber'>
  ): CustomerCreditPayment => {
    const id = `cp_${Date.now()}`;
    const receiptNumber = `REC-KHATA-${Date.now().toString().slice(-6)}`;
    let remainingToAllocate = paymentData.amount;
    const allocations: CustomerCreditPaymentAllocation[] = [];

    // Find customer's unpaid / partially paid credit sales sorted oldest first (FIFO)
    const customerCreditSales = sales
      .filter(
        (s) =>
          s.customerId === paymentData.customerId &&
          ((s.creditAmount || 0) > 0 || s.paymentMode === 'Credit' || (s.splitBreakdown?.credit || 0) > 0) &&
          (s.creditRemainingBalance === undefined || s.creditRemainingBalance > 0)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Allocations map
    const updatedSaleMap = new Map<string, { balance: number; status: 'unpaid' | 'partially_paid' | 'paid' }>();

    for (const sale of customerCreditSales) {
      if (remainingToAllocate <= 0) break;
      const currentBalance = sale.creditRemainingBalance !== undefined ? sale.creditRemainingBalance : (sale.creditAmount || sale.grandTotal);
      if (currentBalance <= 0) continue;

      const allocated = Math.min(remainingToAllocate, currentBalance);
      const newBalance = Math.max(0, currentBalance - allocated);
      const newStatus: 'unpaid' | 'partially_paid' | 'paid' = newBalance === 0 ? 'paid' : 'partially_paid';

      allocations.push({
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        amountAllocated: allocated,
        remainingOnInvoice: newBalance,
      });

      updatedSaleMap.set(sale.id, { balance: newBalance, status: newStatus });
      remainingToAllocate -= allocated;
    }

    // Update sales state
    if (updatedSaleMap.size > 0) {
      setSales((prev) =>
        prev.map((s) => {
          const update = updatedSaleMap.get(s.id);
          if (update) {
            const updatedSale: SaleTransaction = {
              ...s,
              creditRemainingBalance: update.balance,
              creditStatus: update.status,
              creditSettledDate: update.status === 'paid' ? (paymentData.date || new Date().toISOString()) : s.creditSettledDate,
            };
            if (isSupabaseAutoSync) {
              try { asyncSyncSale(updatedSale); } catch {}
            }
            return updatedSale;
          }
          return s;
        })
      );
    }

    const currentCustomer = customers.find((c) => c.id === paymentData.customerId);
    const prevBalance = currentCustomer?.outstandingCredit || 0;
    const newBalance = Math.max(0, prevBalance - paymentData.amount);

    // Update customer balance & oldest credit date
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === paymentData.customerId) {
          // Find remaining oldest unpaid sale
          const remainingUnpaidSales = sales
            .filter(
              (s) =>
                s.customerId === cust.id &&
                s.id !== undefined &&
                ((updatedSaleMap.has(s.id) ? updatedSaleMap.get(s.id)!.balance : (s.creditRemainingBalance ?? s.creditAmount ?? 0)) > 0)
            )
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          const newOldestDate = remainingUnpaidSales.length > 0 ? remainingUnpaidSales[0].date : undefined;
          let newStatus: 'good' | 'overdue' | 'blocked' = 'good';
          if (newBalance > 0 && newOldestDate) {
            const daysOld = Math.floor((Date.now() - new Date(newOldestDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysOld > 30) newStatus = 'overdue';
          }

          const updatedCust: Customer = {
            ...cust,
            outstandingCredit: newBalance,
            oldestCreditDate: newOldestDate,
            creditStatus: newStatus,
          };
          if (isSupabaseAutoSync) {
            try { asyncSyncCustomer(updatedCust); } catch {}
          }
          return updatedCust;
        }
        return cust;
      })
    );

    const newPayment: CustomerCreditPayment = {
      ...paymentData,
      id,
      receiptNumber,
      allocations: paymentData.allocations && paymentData.allocations.length > 0 ? paymentData.allocations : allocations,
      customerPreviousBalance: paymentData.customerPreviousBalance !== undefined ? paymentData.customerPreviousBalance : prevBalance,
      customerNewBalance: paymentData.customerNewBalance !== undefined ? paymentData.customerNewBalance : newBalance,
      date: paymentData.date || new Date().toISOString(),
    };

    setCreditPayments((prev) => [newPayment, ...prev]);
    return newPayment;
  };

  const getCustomerKhata = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    const creditSales = sales.filter(
      (s) =>
        s.customerId === customerId &&
        ((s.creditAmount || 0) > 0 || s.paymentMode === 'Credit' || (s.splitBreakdown?.credit || 0) > 0)
    );

    const payments = creditPayments.filter((cp) => cp.customerId === customerId);

    // Build unified chronological ledger
    const rawEntries: {
      id: string;
      date: string;
      type: 'DEBIT' | 'CREDIT';
      description: string;
      referenceNumber: string;
      amount: number;
      saleId?: string;
      paymentId?: string;
      dueDate?: string;
      paymentMode?: string;
      rawTransaction?: SaleTransaction | CustomerCreditPayment;
    }[] = [];

    creditSales.forEach((s) => {
      rawEntries.push({
        id: `led_sale_${s.id}`,
        date: s.date,
        type: 'DEBIT',
        description: `Credit Purchase (Bill #${s.invoiceNumber})`,
        amount: s.creditAmount !== undefined ? s.creditAmount : s.grandTotal,
        referenceNumber: s.invoiceNumber,
        saleId: s.id,
        dueDate: s.creditDueDate,
        paymentMode: s.paymentMode,
        rawTransaction: s,
      });
    });

    payments.forEach((cp) => {
      rawEntries.push({
        id: `led_pay_${cp.id}`,
        date: cp.date,
        type: 'CREDIT',
        description: `Payment Received (${cp.paymentMode}${cp.notes ? ' - ' + cp.notes : ''})`,
        amount: cp.amount,
        referenceNumber: cp.receiptNumber,
        paymentId: cp.id,
        paymentMode: cp.paymentMode,
        rawTransaction: cp,
      });
    });

    // Sort ascending by date to calculate running balance
    rawEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentBal = 0;
    const now = Date.now();
    const ledger: KhataLedgerEntry[] = rawEntries.map((e) => {
      if (e.type === 'DEBIT') {
        currentBal += e.amount;
      } else {
        currentBal = Math.max(0, currentBal - e.amount);
      }
      const daysElapsed = Math.max(0, Math.floor((now - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)));
      const isOverdue = e.type === 'DEBIT' && e.dueDate ? new Date(e.dueDate).getTime() < now : (e.type === 'DEBIT' && daysElapsed > 15);
      return {
        id: e.id,
        type: e.type,
        date: e.date,
        referenceNumber: e.referenceNumber,
        description: e.description,
        amount: e.amount,
        runningBalance: currentBal,
        daysElapsed,
        dueDate: e.dueDate,
        isOverdue,
        paymentMode: e.paymentMode,
        rawTransaction: e.rawTransaction,
      };
    });

    // Aging buckets
    const agingBuckets = {
      '0-15': 0,
      '16-30': 0,
      '31-60': 0,
      '60+': 0,
    };

    let maxDays = 0;

    creditSales.forEach((s) => {
      const bal = s.creditRemainingBalance !== undefined ? s.creditRemainingBalance : (s.creditAmount || s.grandTotal);
      if (bal > 0) {
        const days = Math.max(0, Math.floor((now - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24)));
        if (days > maxDays) maxDays = days;

        if (days <= 15) agingBuckets['0-15'] += bal;
        else if (days <= 30) agingBuckets['16-30'] += bal;
        else if (days <= 60) agingBuckets['31-60'] += bal;
        else agingBuckets['60+'] += bal;
      }
    });

    const totalOutstanding = cust?.outstandingCredit ?? Math.max(0, currentBal);

    return {
      creditSales,
      payments,
      ledger,
      totalOutstanding,
      agingBuckets,
      oldestCreditDays: maxDays,
    };
  };

  const getKhataSummaryStats = (): KhataSummaryStats => {
    let totalOutstanding = 0;
    let overdueAmount = 0;
    let customerCount = 0;
    const now = Date.now();
    const currentMonthStr = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    customers.forEach((c) => {
      const bal = c.outstandingCredit || 0;
      if (bal > 0) {
        totalOutstanding += bal;
        customerCount += 1;
      }
    });

    const agingBuckets: KhataSummaryStats['agingBuckets'] = {
      '0-15': { amount: 0, count: 0 },
      '16-30': { amount: 0, count: 0 },
      '31-60': { amount: 0, count: 0 },
      '60+': { amount: 0, count: 0 },
    };

    // Inspect each unpaid credit sale
    sales.forEach((s) => {
      const bal = s.creditRemainingBalance !== undefined ? s.creditRemainingBalance : (s.creditAmount || (s.paymentMode === 'Credit' ? s.grandTotal : 0));
      if (bal > 0) {
        const days = Math.max(0, Math.floor((now - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24)));
        if (days > 15 || (s.creditDueDate && new Date(s.creditDueDate).getTime() < now)) {
          overdueAmount += bal;
        }

        if (days <= 15) {
          agingBuckets['0-15'].amount += bal;
          agingBuckets['0-15'].count += 1;
        } else if (days <= 30) {
          agingBuckets['16-30'].amount += bal;
          agingBuckets['16-30'].count += 1;
        } else if (days <= 60) {
          agingBuckets['31-60'].amount += bal;
          agingBuckets['31-60'].count += 1;
        } else {
          agingBuckets['60+'].amount += bal;
          agingBuckets['60+'].count += 1;
        }
      }
    });

    const recoveredThisMonth = creditPayments
      .filter((cp) => (cp.date || '').startsWith(currentMonthStr))
      .reduce((sum, cp) => sum + cp.amount, 0);

    return {
      totalOutstanding,
      overdueAmount,
      customerCount,
      recoveredThisMonth,
      agingBuckets,
    };
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
    setCreditPayments(INITIAL_CREDIT_PAYMENTS);
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
        addMatrixProducts,
        stockAudits,
        saveStockAudit,
        applyStockAuditReconciliation,
        promotions,
        addPromotion,
        updatePromotion,
        deletePromotion,
        togglePromotion,
        calculatePromotionsDiscount,
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
        addCashDrop,
        closeDayRegister,
        // Parked Carts (Multi-Ticket Hold & Recall)
        parkedCarts,
        parkCurrentCart,
        recallParkedCart,
        deleteParkedCart,
        clearAllParkedCarts,
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
        // Phase 4: Multi-Branch Stock Transfers (STO)
        storeBranches,
        stockTransfers,
        createStockTransfer,
        updateStockTransferStatus,
        receiveStockTransfer,
        // Phase 4: Sales Associate Commission Engine
        associateCommissions,
        updateAssociateCommission,
        calculateAssociateCommissions,
        // Phase 4: RFM WhatsApp Campaigns
        campaignTemplates,
        saveCampaignTemplate,
        // Phase 4: Digital E-Receipt & Google Reviews
        storeGoogleReviewUrl,
        setStoreGoogleReviewUrl,
        googleReviewPromptText,
        setGoogleReviewPromptText,
        enableReceiptReviewQr,
        setEnableReceiptReviewQr,
        enableEReceiptQr,
        setEnableEReceiptQr,
        // Customer Khata (Credit) & Recovery System
        creditPayments,
        recordCreditPayment,
        getCustomerKhata,
        getKhataSummaryStats,
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
