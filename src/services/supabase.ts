import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Company,
  Product,
  Customer,
  SaleTransaction,
  Vendor,
  PurchaseOrder,
  VendorPaymentRecord,
  AlterationRecord,
  CreditNote,
  DayEndRegister,
  UserAccount,
  CouponCode,
  LoyaltyConfig,
  GiftVoucher,
  GarmentMeasurementProfile,
  PromotionRule,
} from '../types';

export const SUPABASE_STORAGE_KEYS = {
  URL: 'garment_os_supabase_url',
  ANON_KEY: 'garment_os_supabase_anon_key',
  LAST_SYNC: 'garment_os_supabase_last_sync',
  AUTO_SYNC: 'garment_os_supabase_auto_sync',
};

let cachedClient: SupabaseClient | null = null;
let lastKnownUrl = '';
let lastKnownKey = '';

export const DEFAULT_SUPABASE_URL = 'https://gkmfgstlsphnflqedjlb.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbWZnc3Rsc3BobmZscWVkamxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MTUyMzMsImV4cCI6MjEwOTA5MTIzM30.gt7c6QnKzyanE6wpQXh7-ez6v1Osu1WuJI8ML-UVewU';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'default' | 'none';
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    '';
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  if (envUrl && envKey) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env',
    };
  }

  try {
    const storedUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || '';
    const storedKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.ANON_KEY) || '';

    if (storedUrl && storedKey) {
      return {
        url: storedUrl.trim(),
        anonKey: storedKey.trim(),
        isConfigured: true,
        source: 'storage',
      };
    }
  } catch {
    // Ignore localStorage errors
  }

  // Pre-configured production fallback so fresh devices connect automatically
  if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) {
    return {
      url: DEFAULT_SUPABASE_URL,
      anonKey: DEFAULT_SUPABASE_ANON_KEY,
      isConfigured: true,
      source: 'default',
    };
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  try {
    localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, url.trim());
    localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, anonKey.trim());
  } catch (err) {
    console.warn('Failed to save Supabase credentials to localStorage:', err);
  }
  cachedClient = null;
  lastKnownUrl = '';
  lastKnownKey = '';
}

export function clearSupabaseCredentials(): void {
  try {
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.ANON_KEY);
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.LAST_SYNC);
  } catch {}
  cachedClient = null;
  lastKnownUrl = '';
  lastKnownKey = '';
}

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient && lastKnownUrl === config.url && lastKnownKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    lastKnownUrl = config.url;
    lastKnownKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// SUPABASE AUTHENTICATION API (GOOGLE OAUTH & EMAIL)
// -----------------------------------------------------------------------------

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase client not initialized') };

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { error };
}

export function normalizeAuthIdentifier(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const cleanUsername = trimmed.replace(/[^a-z0-9._-]/g, '');
  return `${cleanUsername || 'store'}@garmentos.store`;
}

export function displayAuthIdentifier(emailOrIdentifier?: string): string {
  if (!emailOrIdentifier) return '';
  if (emailOrIdentifier.endsWith('@garmentos.store')) {
    return emailOrIdentifier.replace('@garmentos.store', '');
  }
  return emailOrIdentifier;
}

export async function signInWithEmail(identifier: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase client not initialized'), user: null, session: null };

  const email = normalizeAuthIdentifier(identifier);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error, user: data?.user || null, session: data?.session || null };
}

export async function signUpWithEmail(identifier: string, password: string, fullName?: string) {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase client not initialized'), user: null, session: null };

  const email = normalizeAuthIdentifier(identifier);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || displayAuthIdentifier(identifier),
        username: displayAuthIdentifier(identifier),
      },
    },
  });
  return { error, user: data?.user || null, session: data?.session || null };
}

export async function signOutCloud() {
  const supabase = getSupabase();
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCloudSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCloudUser() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function testSupabaseConnection(
  overrideUrl?: string,
  overrideKey?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const config = getSupabaseConfig();
    const url = overrideUrl || config.url;
    const key = overrideKey || config.anonKey;

    if (!url || !key) {
      return { success: false, message: 'Please provide both Supabase Project URL and Anon Public Key.' };
    }

    if (!url.startsWith('https://')) {
      return { success: false, message: 'Supabase URL must start with https://' };
    }

    const testClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await testClient.from('products').select('id').limit(1);

    if (error) {
      if (
        error.code === '42P01' ||
        error.message.toLowerCase().includes('relation') ||
        error.message.toLowerCase().includes('does not exist')
      ) {
        return {
          success: false,
          message: `Connected to Supabase, but database tables are missing. Please run supabase_schema.sql in the Supabase SQL Editor.`,
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to Supabase PostgreSQL database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error connecting to Supabase.' };
  }
}

// -----------------------------------------------------------------------------
// DATA MAPPINGS: React camelCase <-> PostgreSQL snake_case FOR ALL PAGES
// -----------------------------------------------------------------------------

// 1. COMPANIES (Store Profiles)
export function mapCompanyToDb(c: Company, userId?: string) {
  return {
    id: c.id,
    name: c.name,
    legal_name: c.legalName,
    type: c.type,
    tax_id: c.taxId,
    address: c.address,
    city: c.city,
    phone: c.phone,
    email: c.email,
    invoice_prefix: c.invoicePrefix,
    current_invoice_number: c.currentInvoiceNumber,
    return_policy: c.returnPolicy,
    accent_color: c.accentColor,
    tagline: c.tagline,
    is_default: c.isDefault || false,
    enable_dynamic_garment_gst: c.enableDynamicGarmentGst ?? true,
    tax_inclusive: c.taxInclusive ?? true,
    is_composition_scheme: c.isCompositionScheme ?? false,
    google_review_url: c.googleReviewUrl || null,
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapCompanyFromDb(row: any): Company {
  const cleanId =
    row.id && typeof row.id === 'string' && row.user_id && row.id.startsWith(row.user_id + '_')
      ? row.id.slice(row.user_id.length + 1)
      : row.id;

  return {
    id: cleanId,
    name: row.name,
    legalName: row.legal_name || row.name,
    type: row.type || 'billed',
    taxId: row.tax_id || '',
    address: row.address || '',
    city: row.city || '',
    phone: row.phone || '',
    email: row.email || '',
    invoicePrefix: row.invoice_prefix || 'INV',
    currentInvoiceNumber: row.current_invoice_number || 1000,
    returnPolicy: row.return_policy || '',
    accentColor: row.accent_color || '#4f46e5',
    tagline: row.tagline || '',
    isDefault: row.is_default || false,
    enableDynamicGarmentGst: row.enable_dynamic_garment_gst ?? true,
    taxInclusive: row.tax_inclusive ?? true,
    isCompositionScheme: row.is_composition_scheme ?? false,
    googleReviewUrl: row.google_review_url || '',
  };
}

// 2. PRODUCTS (Inventory, POS, Price Tags)
export function mapProductToDb(p: Product, userId?: string) {
  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    category: p.category,
    sub_category: p.subCategory,
    size: p.size,
    color: p.color,
    season: p.season,
    cost_price: p.costPrice,
    selling_price: p.sellingPrice,
    stock: p.stock,
    defective_stock: p.defectiveStock || 0,
    min_stock_alert: p.minStockAlert,
    tax_rate: p.taxRate,
    purchase_source: p.purchaseSource || null,
    description: p.description || null,
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapProductFromDb(row: any): Product {
  const cleanId =
    row.id && typeof row.id === 'string' && row.user_id && row.id.startsWith(row.user_id + '_')
      ? row.id.slice(row.user_id.length + 1)
      : row.id;

  return {
    id: cleanId,
    sku: row.sku,
    barcode: row.barcode,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category || '',
    size: row.size || '',
    color: row.color || '',
    season: row.season || 'All-Season',
    costPrice: Number(row.cost_price) || 0,
    sellingPrice: Number(row.selling_price) || 0,
    stock: Number(row.stock) || 0,
    defectiveStock: Number(row.defective_stock) || 0,
    minStockAlert: Number(row.min_stock_alert) || 5,
    taxRate: Number(row.tax_rate) || 5,
    purchaseSource: row.purchase_source || undefined,
    description: row.description || undefined,
  };
}

// 3. CUSTOMERS (CRM, Loyalty)
export function mapCustomerToDb(c: Customer, userId?: string) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || null,
    loyalty_points: c.loyaltyPoints || 0,
    total_spend: c.totalSpend || 0,
    total_visits: c.totalVisits || 0,
    created_at: c.createdAt,
    last_purchase_date: c.lastPurchaseDate || null,
    notes: c.notes || null,
    is_vip: c.isVip || false,
    profile: c.profile || {},
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapCustomerFromDb(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    loyaltyPoints: Number(row.loyalty_points) || 0,
    totalSpend: Number(row.total_spend) || 0,
    totalVisits: Number(row.total_visits) || 0,
    createdAt: row.created_at || new Date().toISOString(),
    lastPurchaseDate: row.last_purchase_date || undefined,
    notes: row.notes || undefined,
    isVip: row.is_vip || false,
    profile: row.profile || undefined,
  };
}

// 4. SALES (POS Invoices, Reports)
export function mapSaleToDb(s: SaleTransaction, userId?: string) {
  return {
    id: s.id,
    invoice_number: s.invoiceNumber,
    company_id: s.companyId,
    company_name: s.companyName,
    company_tax_id: s.companyTaxId,
    company_address: s.companyAddress,
    company_phone: s.companyPhone,
    company_return_policy: s.companyReturnPolicy,
    date: s.date,
    customer_id: s.customerId || null,
    customer_name: s.customerName,
    customer_phone: s.customerPhone,
    items: s.items || [],
    subtotal: s.subtotal,
    item_discounts_total: s.itemDiscountsTotal || 0,
    loyalty_points_used: s.loyaltyPointsUsed || 0,
    loyalty_discount_amount: s.loyaltyDiscountAmount || 0,
    coupon_code_applied: s.couponCodeApplied || null,
    coupon_discount_amount: s.couponDiscountAmount || 0,
    credit_note_code_applied: s.creditNoteCodeApplied || null,
    credit_note_discount_amount: s.creditNoteDiscountAmount || 0,
    tax_total: s.taxTotal || 0,
    grand_total: s.grandTotal || 0,
    payment_mode: s.paymentMode,
    cash_tendered: s.cashTendered || null,
    change_due: s.changeDue || null,
    split_breakdown: s.splitBreakdown || null,
    notes: s.notes || null,
    cashier_name: s.cashierName,
    sales_associate: s.salesAssociate || null,
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapSaleFromDb(row: any): SaleTransaction {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    companyId: row.company_id,
    companyName: row.company_name,
    companyTaxId: row.company_tax_id || '',
    companyAddress: row.company_address || '',
    companyPhone: row.company_phone || '',
    companyReturnPolicy: row.company_return_policy || '',
    date: row.date,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    items: row.items || [],
    subtotal: Number(row.subtotal) || 0,
    itemDiscountsTotal: Number(row.item_discounts_total) || 0,
    loyaltyPointsUsed: Number(row.loyalty_points_used) || 0,
    loyaltyDiscountAmount: Number(row.loyalty_discount_amount) || 0,
    couponCodeApplied: row.coupon_code_applied || undefined,
    couponDiscountAmount: Number(row.coupon_discount_amount) || 0,
    creditNoteCodeApplied: row.credit_note_code_applied || undefined,
    creditNoteDiscountAmount: Number(row.credit_note_discount_amount) || 0,
    taxTotal: Number(row.tax_total) || 0,
    grandTotal: Number(row.grand_total) || 0,
    paymentMode: row.payment_mode || 'Cash',
    cashTendered: row.cash_tendered ? Number(row.cash_tendered) : undefined,
    changeDue: row.change_due ? Number(row.change_due) : undefined,
    splitBreakdown: row.split_breakdown || undefined,
    notes: row.notes || undefined,
    cashierName: row.cashier_name || 'Cashier',
    salesAssociate: row.sales_associate || undefined,
  };
}

// 5. VENDORS (Supplier Ledgers)
export function mapVendorToDb(v: Vendor, userId?: string) {
  return {
    id: v.id,
    name: v.name,
    contact_person: v.contactPerson,
    phone: v.phone,
    email: v.email,
    city: v.city,
    gstin: v.gstin || null,
    billed_payable_balance: v.billedPayableBalance || 0,
    cash_payable_balance: v.cashPayableBalance || 0,
    total_billed_purchased: v.totalBilledPurchased || 0,
    total_cash_purchased: v.totalCashPurchased || 0,
    notes: v.notes || null,
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapVendorFromDb(row: any): Vendor {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person || '',
    phone: row.phone || '',
    email: row.email || '',
    city: row.city || '',
    gstin: row.gstin || undefined,
    billedPayableBalance: Number(row.billed_payable_balance) || 0,
    cashPayableBalance: Number(row.cash_payable_balance) || 0,
    totalBilledPurchased: Number(row.total_billed_purchased) || 0,
    totalCashPurchased: Number(row.total_cash_purchased) || 0,
    notes: row.notes || undefined,
  };
}

// 6. PURCHASES (Stock Received / Vendor Invoices)
export function mapPurchaseToDb(p: PurchaseOrder, userId?: string) {
  return {
    id: p.id,
    purchase_number: p.billOrVoucherNumber || `PO-${p.id}`,
    vendor_id: p.vendorId,
    vendor_name: p.vendorName,
    company_id: p.companyId,
    date: p.date,
    invoice_type: p.purchaseType,
    items: p.items || [],
    subtotal: p.subtotal || 0,
    tax_amount: p.taxAmount || 0,
    total_amount: p.totalAmount || 0,
    paid_amount: p.paidAmount || 0,
    payment_status: p.paymentStatus,
    payment_mode: p.paymentMode,
    notes: p.notes || null,
    created_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapPurchaseFromDb(row: any): PurchaseOrder {
  return {
    id: row.id,
    vendorId: row.vendor_id || '',
    vendorName: row.vendor_name || '',
    companyId: row.company_id || 'comp_billed',
    companyName: row.company_id === 'comp_cash' ? 'Garment OS Counter' : 'Garment OS Apparel Pvt Ltd',
    purchaseType: row.invoice_type || 'billed',
    billOrVoucherNumber: row.purchase_number || '',
    date: row.date || new Date().toISOString().split('T')[0],
    items: row.items || [],
    subtotal: Number(row.subtotal) || 0,
    taxRate: 5,
    taxAmount: Number(row.tax_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    paymentStatus: row.payment_status || 'paid',
    paymentMode: row.payment_mode || 'Cash',
    notes: row.notes || undefined,
  };
}

// 7. VENDOR PAYMENTS (Payment Settlements)
export function mapVendorPaymentToDb(v: VendorPaymentRecord, userId?: string) {
  return {
    id: v.id,
    purchase_id: null,
    vendor_id: v.vendorId,
    date: v.date,
    amount: v.amount,
    payment_mode: v.paymentMode,
    ledger_type: v.ledgerType,
    reference_no: v.referenceNo || null,
    notes: v.notes || null,
    created_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapVendorPaymentFromDb(row: any): VendorPaymentRecord {
  return {
    id: row.id,
    vendorId: row.vendor_id || '',
    vendorName: '',
    date: row.date || new Date().toISOString().split('T')[0],
    amount: Number(row.amount) || 0,
    ledgerType: row.ledger_type || 'billed',
    paymentMode: row.payment_mode || 'Cash',
    referenceNo: row.reference_no || undefined,
    notes: row.notes || undefined,
  };
}

// 8. ALTERATIONS (Tailor Job Tracker)
export function mapAlterationToDb(a: AlterationRecord, userId?: string) {
  return {
    id: a.id,
    sale_id: a.saleId || null,
    invoice_number: a.invoiceNumber || '',
    customer_name: a.customerName || '',
    customer_phone: a.customerPhone || '',
    garment_name: a.garmentName || '',
    size: a.size || '',
    color: a.color || '',
    alteration_notes: a.alterationNotes || '',
    tailor_name: a.tailorName || '',
    promised_date: a.promisedDate || '',
    status: a.status || 'Pending',
    created_date: a.createdDate || new Date().toISOString().split('T')[0],
    customer_notified_at: a.customerNotifiedAt || null,
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapAlterationFromDb(row: any): AlterationRecord {
  return {
    id: row.id,
    saleId: row.sale_id || '',
    invoiceNumber: row.invoice_number || '',
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    garmentName: row.garment_name || '',
    size: row.size || '',
    color: row.color || '',
    alterationNotes: row.alteration_notes || '',
    tailorName: row.tailor_name || '',
    promisedDate: row.promised_date || '',
    status: row.status || 'Pending',
    createdDate: row.created_date || '',
    customerNotifiedAt: row.customer_notified_at || undefined,
  };
}

// 9. CREDIT NOTES (Returns & Exchanges)
export function mapCreditNoteToDb(cn: CreditNote, userId?: string) {
  return {
    id: cn.id,
    code: cn.code,
    original_invoice_number: cn.originalInvoiceNumber || '',
    company_id: cn.companyId || '',
    company_name: cn.companyName || '',
    customer_name: cn.customerName || '',
    customer_phone: cn.customerPhone || '',
    amount: cn.amount || 0,
    remaining_amount: cn.remainingAmount || 0,
    status: cn.status || 'active',
    issued_date: cn.issuedDate || '',
    expiry_date: cn.expiryDate || '',
    items_returned: cn.itemsReturned || [],
    notes: cn.notes || null,
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapCreditNoteFromDb(row: any): CreditNote {
  return {
    id: row.id,
    code: row.code,
    originalInvoiceNumber: row.original_invoice_number || '',
    companyId: row.company_id || '',
    companyName: row.company_name || '',
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    amount: Number(row.amount) || 0,
    remainingAmount: Number(row.remaining_amount) || 0,
    status: row.status || 'active',
    issuedDate: row.issued_date || '',
    expiryDate: row.expiry_date || '',
    itemsReturned: row.items_returned || [],
    notes: row.notes || undefined,
  };
}

// 10. DAY REGISTERS (Till Float, Petty Expenses, Cashier Closing)
export function mapDayRegisterToDb(r: DayEndRegister, userId?: string) {
  return {
    id: r.id,
    date: r.date,
    company_id: r.companyId,
    opening_cash: r.openingCash || 0,
    expenses: r.expenses || [],
    cash_drops: r.cashDrops || [],
    closing_cash_counted: r.closingCashCounted !== undefined ? r.closingCashCounted : null,
    closing_notes: r.closingNotes || null,
    closed_at: r.closedAt || null,
    status: r.status || 'open',
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapDayRegisterFromDb(row: any): DayEndRegister {
  return {
    id: row.id,
    date: row.date,
    companyId: row.company_id,
    openingCash: Number(row.opening_cash) || 0,
    expenses: row.expenses || [],
    cashDrops: row.cash_drops || [],
    closingCashCounted: row.closing_cash_counted !== null ? Number(row.closing_cash_counted) : undefined,
    closingNotes: row.closing_notes || undefined,
    closedAt: row.closed_at || undefined,
    status: row.status || 'open',
  };
}

// 11. STAFF USERS (Settings & RBAC)
export function mapStaffUserToDb(u: UserAccount, userId?: string) {
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    full_name: u.fullName,
    role: u.role,
    avatar: u.avatar || '',
    designation: u.designation || '',
    allowed_tabs: u.allowedTabs || [],
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapStaffUserFromDb(row: any): UserAccount {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    fullName: row.full_name || row.username,
    role: row.role || 'sales_cashier',
    avatar: row.avatar || '',
    designation: row.designation || '',
    allowedTabs: row.allowed_tabs || undefined,
  };
}

// 12. DIGITAL GIFT CARDS & VOUCHERS
export function mapGiftVoucherToDb(v: GiftVoucher, userId?: string) {
  return {
    id: v.id,
    code: v.code,
    barcode: v.barcode,
    initial_amount: v.initialAmount,
    current_balance: v.currentBalance,
    issued_to_name: v.issuedToName,
    issued_to_phone: v.issuedToPhone,
    sender_name: v.senderName || null,
    message: v.message || null,
    expiry_date: v.expiryDate,
    status: v.isActive ? 'active' : 'inactive',
    issued_at: v.createdAt,
    redemptions: v.redemptionHistory || [],
    created_at: v.createdAt || new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapGiftVoucherFromDb(row: any): GiftVoucher {
  return {
    id: row.id,
    code: row.code,
    barcode: row.barcode,
    initialAmount: Number(row.initial_amount) || 0,
    currentBalance: Number(row.current_balance) || 0,
    issuedToName: row.issued_to_name || '',
    issuedToPhone: row.issued_to_phone || '',
    senderName: row.sender_name || undefined,
    message: row.message || undefined,
    expiryDate: row.expiry_date || '',
    isActive: row.status === 'active' || (Number(row.current_balance) > 0),
    createdAt: row.issued_at || row.created_at || new Date().toISOString().split('T')[0],
    redemptionHistory: row.redemptions || [],
  };
}

// 13. CUSTOMER MEASUREMENT PROFILES
export function mapCustomerMeasurementToDb(m: GarmentMeasurementProfile, userId?: string) {
  return {
    id: m.id,
    customer_id: m.customerId,
    profile_name: m.profileName,
    garment_type: m.garmentType,
    updated_at: m.updatedAt || new Date().toISOString(),
    notes: m.notes || null,
    values: m.values || {},
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapCustomerMeasurementFromDb(row: any): GarmentMeasurementProfile {
  return {
    id: row.id,
    customerId: row.customer_id,
    profileName: row.profile_name || 'Bespoke Fit',
    garmentType: row.garment_type || 'Custom Dress',
    updatedAt: row.updated_at || '',
    notes: row.notes || undefined,
    values: row.values || {},
  };
}

// 14. PROMOTIONS & DEALS
export function mapPromotionToDb(pr: PromotionRule, userId?: string) {
  return {
    id: pr.id,
    title: pr.title,
    code: pr.code || null,
    type: pr.type,
    is_active: pr.isActive,
    applicable_category: pr.applicableCategory || null,
    min_quantity: pr.minQuantity || null,
    free_quantity: pr.freeQuantity || null,
    bundle_price: pr.bundlePrice || null,
    min_cart_amount: pr.minCartAmount || null,
    slab_discount_amount: pr.slabDiscountAmount || null,
    slab_discount_percent: pr.slabDiscountPercent || null,
    description: pr.description || null,
    updated_at: new Date().toISOString(),
    ...(userId ? { user_id: userId } : {}),
  };
}

export function mapPromotionFromDb(row: any): PromotionRule {
  return {
    id: row.id,
    title: row.title,
    code: row.code || undefined,
    type: row.type,
    isActive: row.is_active ?? true,
    applicableCategory: row.applicable_category || undefined,
    minQuantity: row.min_quantity ? Number(row.min_quantity) : undefined,
    freeQuantity: row.free_quantity ? Number(row.free_quantity) : undefined,
    bundlePrice: row.bundle_price ? Number(row.bundle_price) : undefined,
    minCartAmount: row.min_cart_amount ? Number(row.min_cart_amount) : undefined,
    slabDiscountAmount: row.slab_discount_amount ? Number(row.slab_discount_amount) : undefined,
    slabDiscountPercent: row.slab_discount_percent ? Number(row.slab_discount_percent) : undefined,
    description: row.description || '',
  };
}

// -----------------------------------------------------------------------------
// RESILIENT POSTGREST UPSERT WITH SCHEMA AUTO-HEAL & RLS COLLISION RESOLUTION
// -----------------------------------------------------------------------------

export async function safeUpsert(
  table: string,
  records: any | any[],
  userId?: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };
  if (!records || (Array.isArray(records) && records.length === 0)) {
    return { success: true, count: 0 };
  }

  let currentRecords = Array.isArray(records) ? [...records] : [{ ...records }];

  // Max 6 attempts to strip missing columns or handle RLS re-scoping
  for (let attempt = 0; attempt < 6; attempt++) {
    const { error } = await supabase.from(table).upsert(currentRecords);
    if (!error) {
      return { success: true, count: currentRecords.length };
    }

    // 1. Column missing in PostgREST schema cache (e.g. table created before new columns)
    const match =
      error.message.match(/Could not find the '([^']+)' column/i) ||
      error.message.match(/column [^.]*\.?([^\s]+) does not exist/i);

    if (match && match[1]) {
      const missingCol = match[1];
      console.warn(`[Auto-Heal] Table '${table}' lacks column '${missingCol}'. Stripping and retrying push...`);
      currentRecords = currentRecords.map((r) => {
        const copy = { ...r };
        delete copy[missingCol];
        return copy;
      });
      continue;
    }

    // 2. RLS policy violation on existing row (e.g. seed ID collision: comp_billed, prod_1)
    if (error.message.includes('violates row-level security policy') || error.code === '42501') {
      if (userId) {
        console.warn(`[Auto-Heal] Table '${table}' RLS conflict on existing seed row. Re-scoping IDs with user prefix and retrying...`);
        currentRecords = currentRecords.map((r) => {
          const copy = { ...r };
          if (copy.id && !String(copy.id).startsWith(userId)) {
            copy.id = `${userId}_${copy.id}`;
          }
          if (copy.key && !String(copy.key).startsWith(`user_${userId}_`)) {
            copy.key = `user_${userId}_${copy.key}`;
          }
          if (copy.code && !String(copy.code).startsWith(userId)) {
            copy.code = `${userId}_${copy.code}`;
          }
          copy.user_id = userId;
          return copy;
        });
        continue;
      }
    }

    // Any other error cannot be auto-healed
    console.error(`[Supabase safeUpsert] Table '${table}' push failed:`, error.message);
    return { success: false, error: error.message };
  }

  return { success: false, error: `Exceeded retry attempts for table '${table}'` };
}

// -----------------------------------------------------------------------------
// COMPREHENSIVE PUSH ALL TO SUPABASE (COVERS EVERY SINGLE PAGE)
// -----------------------------------------------------------------------------

export async function pushAllToSupabase(payload: {
  companies: Company[];
  products: Product[];
  customers: Customer[];
  sales: SaleTransaction[];
  vendors: Vendor[];
  purchases: PurchaseOrder[];
  vendorPayments: VendorPaymentRecord[];
  alterations: AlterationRecord[];
  creditNotes: CreditNote[];
  dayRegister: DayEndRegister;
  users?: UserAccount[];
  coupons?: CouponCode[];
  loyaltyConfig?: LoyaltyConfig;
  settings?: Record<string, any>;
  giftVouchers?: GiftVoucher[];
  promotions?: PromotionRule[];
}, explicitUserId?: string): Promise<{ success: boolean; message: string; stats?: any }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase is not configured.' };
  }

  try {
    const user = await getCloudUser();
    const userId = explicitUserId || user?.id;
    const errors: string[] = [];

    // 1. Companies (POS & Settings)
    if (payload.companies.length > 0) {
      const res = await safeUpsert('companies', payload.companies.map((c) => mapCompanyToDb(c, userId)), userId);
      if (!res.success) errors.push(`Companies (${res.error})`);
    }

    // 2. Products (Inventory, POS, Tags)
    if (payload.products.length > 0) {
      const res = await safeUpsert('products', payload.products.map((p) => mapProductToDb(p, userId)), userId);
      if (!res.success) errors.push(`Products (${res.error})`);
    }

    // 3. Customers (CRM & Loyalty)
    if (payload.customers.length > 0) {
      const res = await safeUpsert('customers', payload.customers.map((c) => mapCustomerToDb(c, userId)), userId);
      if (!res.success) errors.push(`Customers (${res.error})`);
    }

    // 4. Vendors (Suppliers)
    if (payload.vendors.length > 0) {
      const res = await safeUpsert('vendors', payload.vendors.map((v) => mapVendorToDb(v, userId)), userId);
      if (!res.success) errors.push(`Vendors (${res.error})`);
    }

    // 5. Purchases (Goods Inwards)
    if (payload.purchases && payload.purchases.length > 0) {
      const res = await safeUpsert('purchases', payload.purchases.map((p) => mapPurchaseToDb(p, userId)), userId);
      if (!res.success) errors.push(`Purchases (${res.error})`);
    }

    // 6. Vendor Payments
    if (payload.vendorPayments && payload.vendorPayments.length > 0) {
      const res = await safeUpsert('vendor_payments', payload.vendorPayments.map((vp) => mapVendorPaymentToDb(vp, userId)), userId);
      if (!res.success) errors.push(`Vendor Payments (${res.error})`);
    }

    // 7. Sales (POS Invoices & Reports)
    if (payload.sales.length > 0) {
      const res = await safeUpsert('sales', payload.sales.map((s) => mapSaleToDb(s, userId)), userId);
      if (!res.success) errors.push(`Sales (${res.error})`);
    }

    // 8. Alterations (Tailor Tracker)
    if (payload.alterations && payload.alterations.length > 0) {
      const res = await safeUpsert('alterations', payload.alterations.map((a) => mapAlterationToDb(a, userId)), userId);
      if (!res.success) errors.push(`Alterations (${res.error})`);
    }

    // 9. Credit Notes (Returns & Exchanges)
    if (payload.creditNotes && payload.creditNotes.length > 0) {
      const res = await safeUpsert('credit_notes', payload.creditNotes.map((cn) => mapCreditNoteToDb(cn, userId)), userId);
      if (!res.success) errors.push(`Credit Notes (${res.error})`);
    }

    // 10. Day Register (Z-Report & Reconciliation)
    if (payload.dayRegister) {
      const res = await safeUpsert('day_registers', mapDayRegisterToDb(payload.dayRegister, userId), userId);
      if (!res.success) errors.push(`Day Registers (${res.error})`);
    }

    // 11. Staff Users (Try staff_users table + fallback to app_settings)
    if (payload.users && payload.users.length > 0) {
      try {
        await safeUpsert('staff_users', payload.users.map((u) => mapStaffUserToDb(u, userId)), userId);
      } catch {}
      const settingKey = userId ? `user_${userId}_staff_users` : 'staff_users';
      await safeUpsert('app_settings', {
        key: settingKey,
        value: payload.users,
        updated_at: new Date().toISOString(),
        ...(userId ? { user_id: userId } : {}),
      }, userId);
    }

    // 12. Coupons (Try coupons table + fallback to app_settings)
    if (payload.coupons && payload.coupons.length > 0) {
      try {
        await safeUpsert(
          'coupons',
          payload.coupons.map((c) => ({
            code: c.code,
            discount_type: c.discountType,
            discount_value: c.discountValue,
            min_bill_amount: c.minBillAmount || 0,
            description: c.description || null,
            created_at: new Date().toISOString(),
            ...(userId ? { user_id: userId } : {}),
          })),
          userId
        );
      } catch {}
      const settingKey = userId ? `user_${userId}_coupons` : 'coupons';
      await safeUpsert('app_settings', {
        key: settingKey,
        value: payload.coupons,
        updated_at: new Date().toISOString(),
        ...(userId ? { user_id: userId } : {}),
      }, userId);
    }

    // 13. App Settings (Loyalty rules, UPI QR, Terminal settings)
    if (payload.loyaltyConfig) {
      const settingKey = userId ? `user_${userId}_loyalty_config` : 'loyalty_config';
      await safeUpsert('app_settings', {
        key: settingKey,
        value: payload.loyaltyConfig,
        updated_at: new Date().toISOString(),
        ...(userId ? { user_id: userId } : {}),
      }, userId);
    }
    if (payload.settings) {
      const settingKey = userId ? `user_${userId}_terminal_settings` : 'terminal_settings';
      await safeUpsert('app_settings', {
        key: settingKey,
        value: payload.settings,
        updated_at: new Date().toISOString(),
        ...(userId ? { user_id: userId } : {}),
      }, userId);
    }

    // 14. Digital Gift Vouchers
    if (payload.giftVouchers && payload.giftVouchers.length > 0) {
      const res = await safeUpsert('gift_vouchers', payload.giftVouchers.map((v) => mapGiftVoucherToDb(v, userId)), userId);
      if (!res.success) errors.push(`Gift Vouchers (${res.error})`);
    }

    // 15. Promotions & Offers Engine
    if (payload.promotions && payload.promotions.length > 0) {
      const res = await safeUpsert('promotions', payload.promotions.map((p) => mapPromotionToDb(p, userId)), userId);
      if (!res.success) errors.push(`Promotions (${res.error})`);
    }

    if (errors.length > 0) {
      console.warn('pushAllToSupabase encountered errors on some tables:', errors);
      return {
        success: false,
        message: `Some tables failed to sync: ${errors.join(', ')}`,
      };
    }

    const now = new Date().toISOString();
    try {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.LAST_SYNC, now);
    } catch {}

    return {
      success: true,
      message: `Successfully synchronized all pages & records to Supabase!`,
      stats: {
        products: payload.products.length,
        sales: payload.sales.length,
        customers: payload.customers.length,
        vendors: payload.vendors.length,
        purchases: payload.purchases ? payload.purchases.length : 0,
        alterations: payload.alterations ? payload.alterations.length : 0,
        creditNotes: payload.creditNotes ? payload.creditNotes.length : 0,
        timestamp: now,
      },
    };
  } catch (err: any) {
    console.error('pushAllToSupabase fatal error:', err);
    return { success: false, message: err?.message || 'Error pushing data to Supabase.' };
  }
}

// -----------------------------------------------------------------------------
// COMPREHENSIVE PULL ALL FROM SUPABASE (COVERS EVERY SINGLE PAGE)
// -----------------------------------------------------------------------------

export async function pullAllFromSupabase(): Promise<{
  success: boolean;
  message: string;
  data?: {
    companies?: Company[];
    companiesUserScoped?: boolean;
    products?: Product[];
    customers?: Customer[];
    sales?: SaleTransaction[];
    vendors?: Vendor[];
    purchases?: PurchaseOrder[];
    vendorPayments?: VendorPaymentRecord[];
    alterations?: AlterationRecord[];
    creditNotes?: CreditNote[];
    dayRegister?: DayEndRegister;
    users?: UserAccount[];
    coupons?: CouponCode[];
    loyaltyConfig?: LoyaltyConfig;
    settings?: Record<string, any>;
    giftVouchers?: GiftVoucher[];
    promotions?: PromotionRule[];
  };
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase is not configured.' };
  }

  try {
    const user = await getCloudUser();
    const userId = user?.id;

    const [
      companiesRes,
      productsRes,
      customersRes,
      salesRes,
      vendorsRes,
      purchasesRes,
      paymentsRes,
      alterationsRes,
      creditNotesRes,
      dayRegRes,
      settingsRes,
      giftVouchersRes,
      promotionsRes,
    ] = await Promise.all([
      supabase.from('companies').select('*'),
      supabase.from('products').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('vendors').select('*'),
      supabase.from('purchases').select('*'),
      supabase.from('vendor_payments').select('*'),
      supabase.from('alterations').select('*'),
      supabase.from('credit_notes').select('*'),
      supabase.from('day_registers').select('*').order('date', { ascending: false }).limit(1),
      supabase.from('app_settings').select('*'),
      supabase.from('gift_vouchers').select('*'),
      supabase.from('promotions').select('*'),
    ]);

    // Helper: When logged in, strictly prioritize rows that belong to this user (user_id === userId)
    const filterByUser = (rows: any[] | null) => {
      if (!rows || rows.length === 0) return [];
      if (userId) {
        // Authenticated user: ONLY take records that belong to this user or are scoped to this user
        return rows.filter(
          (r) => r.user_id === userId || (r.id && typeof r.id === 'string' && r.id.startsWith(userId + '_'))
        );
      }
      return rows.filter((r) => !r.user_id);
    };

    const hasUserScopedCompanies = Boolean(
      userId &&
        companiesRes.data &&
        companiesRes.data.some((r: any) => r.user_id === userId || (r.id && typeof r.id === 'string' && r.id.startsWith(userId + '_')))
    );

    // Parse App Settings prioritizing authenticated user's records
    let usersFromDb: UserAccount[] | undefined;
    let couponsFromDb: CouponCode[] | undefined;
    let loyaltyFromDb: LoyaltyConfig | undefined;
    let terminalSettings: Record<string, any> | undefined;

    if (settingsRes.data && settingsRes.data.length > 0) {
      const userSettings = userId
        ? settingsRes.data.filter(
            (r: any) => r.user_id === userId || (r.key && typeof r.key === 'string' && r.key.startsWith(`user_${userId}_`))
          )
        : [];
      const unclaimedSettings = settingsRes.data.filter(
        (r: any) => !r.user_id && !(r.key && typeof r.key === 'string' && r.key.startsWith('user_'))
      );
      // Merge unclaimed first, then user's specific settings overwrite
      const mergedList = [...unclaimedSettings, ...userSettings];

      mergedList.forEach((row: any) => {
        const cleanKey =
          userId && typeof row.key === 'string' && row.key.startsWith(`user_${userId}_`)
            ? row.key.replace(`user_${userId}_`, '')
            : row.key;

        if (cleanKey === 'staff_users') usersFromDb = row.value;
        if (cleanKey === 'coupons') couponsFromDb = row.value;
        if (cleanKey === 'loyalty_config') loyaltyFromDb = row.value;
        if (cleanKey === 'terminal_settings') {
          terminalSettings = { ...(terminalSettings || {}), ...(row.value || {}) };
        } else if (
          [
            'storeUpiId',
            'storeUpiName',
            'codePrintType',
            'qrPrintSize',
            'autoLockMinutes',
            'globalLowStockThreshold',
            'soundEnabled',
            'activeCompanyId',
            'storeGoogleReviewUrl',
            'googleReviewPromptText',
            'enableReceiptReviewQr',
            'enableEReceiptQr',
          ].includes(cleanKey)
        ) {
          if (!terminalSettings) terminalSettings = {};
          terminalSettings[cleanKey] = row.value;
        }
      });
    }

    const filteredCompanies = filterByUser(companiesRes.data);
    const filteredProducts = filterByUser(productsRes.data);
    const filteredCustomers = filterByUser(customersRes.data);
    const filteredSales = filterByUser(salesRes.data);
    const filteredVendors = filterByUser(vendorsRes.data);
    const filteredPurchases = filterByUser(purchasesRes.data);
    const filteredPayments = filterByUser(paymentsRes.data);
    const filteredAlterations = filterByUser(alterationsRes.data);
    const filteredCreditNotes = filterByUser(creditNotesRes.data);
    const filteredGiftVouchers = filterByUser(giftVouchersRes.data);
    const filteredPromotions = filterByUser(promotionsRes.data);

    const result = {
      companies: filteredCompanies.length > 0 ? filteredCompanies.map(mapCompanyFromDb) : undefined,
      companiesUserScoped: hasUserScopedCompanies,
      products: filteredProducts.length > 0 ? filteredProducts.map(mapProductFromDb) : undefined,
      customers: filteredCustomers.length > 0 ? filteredCustomers.map(mapCustomerFromDb) : undefined,
      sales: filteredSales.length > 0 ? filteredSales.map(mapSaleFromDb) : undefined,
      vendors: filteredVendors.length > 0 ? filteredVendors.map(mapVendorFromDb) : undefined,
      purchases: filteredPurchases.length > 0 ? filteredPurchases.map(mapPurchaseFromDb) : undefined,
      vendorPayments: filteredPayments.length > 0 ? filteredPayments.map(mapVendorPaymentFromDb) : undefined,
      alterations: filteredAlterations.length > 0 ? filteredAlterations.map(mapAlterationFromDb) : undefined,
      creditNotes: filteredCreditNotes.length > 0 ? filteredCreditNotes.map(mapCreditNoteFromDb) : undefined,
      dayRegister: dayRegRes.data && dayRegRes.data.length > 0 ? mapDayRegisterFromDb(filterByUser(dayRegRes.data)[0] || dayRegRes.data[0]) : undefined,
      users: usersFromDb,
      coupons: couponsFromDb,
      loyaltyConfig: loyaltyFromDb,
      settings: terminalSettings,
      giftVouchers: filteredGiftVouchers.length > 0 ? filteredGiftVouchers.map(mapGiftVoucherFromDb) : undefined,
      promotions: filteredPromotions.length > 0 ? filteredPromotions.map(mapPromotionFromDb) : undefined,
    };

    const now = new Date().toISOString();
    try {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.LAST_SYNC, now);
    } catch {}

    return {
      success: true,
      message: 'Successfully pulled latest records for every page from Supabase!',
      data: result,
    };
  } catch (err: any) {
    console.error('pullAllFromSupabase error:', err);
    return { success: false, message: err?.message || 'Error pulling data from Supabase.' };
  }
}

// -----------------------------------------------------------------------------
// REAL-TIME BACKGROUND SYNC HELPERS (FOR IMMEDIATE PAGE ACTIONS)
// -----------------------------------------------------------------------------

export async function asyncSyncCompany(company: Company) {
  try {
    const user = await getCloudUser();
    await safeUpsert('companies', mapCompanyToDb(company, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase company sync error:', err);
  }
}

export async function asyncSyncSale(sale: SaleTransaction) {
  try {
    const user = await getCloudUser();
    await safeUpsert('sales', mapSaleToDb(sale, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase sale sync error:', err);
  }
}

export async function asyncSyncProduct(product: Product) {
  try {
    const user = await getCloudUser();
    await safeUpsert('products', mapProductToDb(product, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase product sync error:', err);
  }
}

export async function asyncSyncCustomer(customer: Customer) {
  try {
    const user = await getCloudUser();
    await safeUpsert('customers', mapCustomerToDb(customer, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase customer sync error:', err);
  }
}

export async function asyncSyncPurchase(purchase: PurchaseOrder) {
  try {
    const user = await getCloudUser();
    await safeUpsert('purchases', mapPurchaseToDb(purchase, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase purchase sync error:', err);
  }
}

export async function asyncSyncVendorPayment(payment: VendorPaymentRecord) {
  try {
    const user = await getCloudUser();
    await safeUpsert('vendor_payments', mapVendorPaymentToDb(payment, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase vendor payment sync error:', err);
  }
}

export async function asyncSyncAlteration(alteration: AlterationRecord) {
  try {
    const user = await getCloudUser();
    await safeUpsert('alterations', mapAlterationToDb(alteration, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase alteration sync error:', err);
  }
}

export async function asyncSyncCreditNote(creditNote: CreditNote) {
  try {
    const user = await getCloudUser();
    await safeUpsert('credit_notes', mapCreditNoteToDb(creditNote, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase credit note sync error:', err);
  }
}

export async function asyncSyncDayRegister(dayRegister: DayEndRegister) {
  try {
    const user = await getCloudUser();
    await safeUpsert('day_registers', mapDayRegisterToDb(dayRegister, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase day register sync error:', err);
  }
}

export async function asyncSyncSetting(key: string, value: any) {
  try {
    const user = await getCloudUser();
    const settingKey = user?.id ? `user_${user.id}_${key}` : key;
    await safeUpsert(
      'app_settings',
      {
        key: settingKey,
        value,
        updated_at: new Date().toISOString(),
        ...(user?.id ? { user_id: user.id } : {}),
      },
      user?.id
    );
  } catch (err) {
    console.warn(`Background Supabase setting sync (${key}) error:`, err);
  }
}

export async function asyncSyncGiftVoucher(voucher: GiftVoucher) {
  try {
    const user = await getCloudUser();
    await safeUpsert('gift_vouchers', mapGiftVoucherToDb(voucher, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase gift voucher sync error:', err);
  }
}

export async function asyncSyncCustomerMeasurement(measurement: GarmentMeasurementProfile) {
  try {
    const user = await getCloudUser();
    await safeUpsert('customer_measurements', mapCustomerMeasurementToDb(measurement, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase measurement sync error:', err);
  }
}

export async function asyncSyncPromotion(promo: PromotionRule) {
  try {
    const user = await getCloudUser();
    await safeUpsert('promotions', mapPromotionToDb(promo, user?.id), user?.id);
  } catch (err) {
    console.warn('Background Supabase promotion sync error:', err);
  }
}

export async function asyncSyncDeletePromotion(promoId: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) return;
    const user = await getCloudUser();
    let query = supabase.from('promotions').delete().eq('id', promoId);
    if (user?.id) query = query.eq('user_id', user.id);
    await query;
  } catch (err) {
    console.warn('Background Supabase promotion delete error:', err);
  }
}
